// 백업 파일(db/daily/YYYY-MM-DD.json.gz — 관리자 › 백업·휴지통에서 내려받기)로 DB를 되돌린다. 개발자·Claude 세션 전용.
//   기본은 미리보기(무엇이 바뀌는지 개수만). 실제 반영은 --apply.
//   node scripts/restore-backup.mjs 2026-09-25.json.gz                      # 전체 표 미리보기
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --table posts --id 123 --apply   # 글 한 건만 되살리기
//   node scripts/restore-backup.mjs 2026-09-25.json.gz --table reservations --apply     # 표 하나를 그 날짜 내용으로 덮어쓰기(upsert)
// 환경변수: SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
// 주의: upsert라 백업 이후 새로 생긴 행은 지우지 않는다(필요하면 따로 판단). 되돌리기 전에 지금 상태도 한 번 백업해 둘 것('지금 백업').
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const [file, ...args] = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const apply = args.includes('--apply');
const U = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!file || !U || !K) { console.error('사용법: node scripts/restore-backup.mjs <백업.json.gz> [--table 표] [--id 번호] [--apply]  (SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY 필요)'); process.exit(1); }
const PK = { pages: 'slug', site_settings: 'key', admins: 'email' };
const dump = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
console.log('백업 시각', dump.createdAt, '·', Object.entries(dump.tables).map(([t, r]) => `${t} ${r.length}`).join(', '));
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
if (apply) console.log('완료 — 사이트 캐시를 새로 고치려면 관리자 세션으로 POST /api/admin/revalidate');
