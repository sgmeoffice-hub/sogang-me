// 백업 파일(db/daily/YYYY-MM-DD.json.gz — 관리자 › 백업·휴지통에서 내려받기)로 DB를 되돌린다. 개발자·Claude 세션 전용.
//   기본은 미리보기(무엇이 바뀌는지 개수만). 실제 반영은 --apply.
//   node scripts/restore-backup.mjs 2026-09-25.json.gz                      # 전체 표 미리보기
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --table posts --id 123 --apply   # 글 한 건만 되살리기
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --table reservations --apply     # 표 하나를 그 날짜 내용으로 덮어쓰기(upsert)
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --all --apply                    # 전체 표(admins 제외) — 새 프로젝트 재구축용
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --table admins --apply           # admins는 --all에도 빠지므로 따로
// 환경변수: SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
// 주의: upsert라 백업 이후 새로 생긴 행은 지우지 않는다(필요하면 따로 판단). 되돌리기 전에 지금 상태도 한 번 백업해 둘 것('지금 백업').
//       전체 반영은 그 사이 들어온 예약·URECA 지원·조회수를 백업 시점으로 되돌리므로 --all을 명시해야만 한다(2026-10-13).
//       새 프로젝트 재구축 순서는 docs/OPERATIONS.md '새 Supabase 프로젝트 재구축' 참조.
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const [file, ...args] = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const apply = args.includes('--apply');
const U = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!file || !U || !K) { console.error('사용법: node scripts/restore-backup.mjs <백업.json.gz> [--table 표] [--id 번호] [--all] [--apply]  (SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY 필요)'); process.exit(1); }
// --apply인데 표 지정도 --all도 없으면 멈춘다 — 예전엔 맨 --apply가 전 표를 덮어써 그날 이후 예약·지원서가 조용히 사라질 수 있었다
if (apply && !opt('--table') && !args.includes('--all')) { console.error('--apply로 전체 표를 반영하려면 --all을 함께 주세요(표 하나만이면 --table 표). 미리보기는 플래그 없이.'); process.exit(1); }
const PK = { pages: 'slug', site_settings: 'key', admins: 'email' };
const dump = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
console.log('백업 시각', dump.createdAt, '·', Object.entries(dump.tables).map(([t, r]) => `${t} ${r.length}`).join(', '));
if (apply) console.log('반영 대상 프로젝트', new URL(U).host);   // 어느 프로젝트에 쓰는지 로그에 남긴다(새 프로젝트 재구축 때 URL 실수 방지)
const tables = opt('--table') ? [opt('--table')] : Object.keys(dump.tables).filter((t) => t !== 'admins');
for (const t of tables) {
  let rows = dump.tables[t] || [];
  if (opt('--id')) rows = rows.filter((r) => String(r[PK[t] || 'id']) === opt('--id'));
  if (t === 'site_settings') rows = rows.filter((r) => r.key !== 'backup');
  console.log(`${apply ? '반영' : '미리보기'} ${t}: ${rows.length}행`);
  if (!apply || !rows.length) continue;
  for (let i = 0; i < rows.length; i += 200) {
    const res = await fetch(`${U}/rest/v1/${t}?on_conflict=${PK[t] || 'id'}`, { method: 'POST', headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 200)) });
    if (!res.ok) { console.error(t, res.status, await res.text()); process.exit(1); }
  }
}
if (apply) {
  // 원래 id로 upsert해도 bigserial 시퀀스는 안 움직여, 새 프로젝트에 복원한 뒤 첫 글 저장·예약 신청이 duplicate key(23505)로 실패한다.
  // schema_v9의 reset_sequences()(service role 전용)로 max(id)+1에 맞춘다. 같은 프로젝트에 되돌릴 때도 해롭지 않다.
  const rpc = await fetch(`${U}/rest/v1/rpc/reset_sequences`, { method: 'POST', headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' }, body: '{}' });
  if (rpc.ok) console.log('시퀀스 재설정 완료');
  else if (rpc.status === 404) console.warn('경고: reset_sequences()가 없음(supabase/schema_v9.sql 미적용). SQL Editor에서 v9를 적용한 뒤 `select reset_sequences();`를 실행할 것 — 안 하면 새 글·예약 저장이 duplicate key로 실패할 수 있다.');
  else console.warn('경고: 시퀀스 재설정 실패', rpc.status, (await rpc.text()).slice(0, 200));
  console.log('완료 — 사이트 캐시를 새로 고치려면 관리자 세션으로 POST /api/admin/revalidate');
}
