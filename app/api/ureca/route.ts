import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase-server';
import { notifyAdmin } from '@/lib/notify';
import { escapeHtml as esc } from '@/lib/html';
import { allow, clientIp } from '@/lib/ratelimit';

/** 오류 응답: error(국문, 비UI 호출자용) + code(폼이 보는 언어로 바꿔 보여준다 — components/UrecaForm). 2026-10-13 */
const fail = (code: string, error: string, status: number) => NextResponse.json({ error, code }, { status });

export async function POST(req: Request) {
  if (!allow(`ureca:${clientIp(req)}`, 5, 10 * 60 * 1000))
    return fail('rate_limited', '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', 429);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object') return fail('invalid', '입력값이 올바르지 않습니다.', 400);
  const choices = (Array.isArray(b.choices) ? b.choices : [])
    .map((c: any) => ({ rank: Number(c?.rank), lab: String(c?.lab || '').slice(0, 200), prof: String(c?.prof || '').slice(0, 100) }))
    .filter((c: any) => [1, 2, 3].includes(c.rank) && c.lab)
    .slice(0, 3);
  const row = { year: Number(b.year), term: String(b.term || '').slice(0, 20), name: String(b.name || '').slice(0, 60), student_id: String(b.student_id || '').slice(0, 30), semester: String(b.semester || '').slice(0, 30), phone: String(b.phone || '').slice(0, 40), email: String(b.email || '').slice(0, 120), choices, message: String(b.message || '').slice(0, 1000), status: 'pending' };
  if (!row.year || !row.term || !row.name || !row.student_id || !row.email || !choices.length) return fail('missing', '필수 항목이 비어 있습니다.', 400);
  if (!Number.isInteger(row.year) || row.year < 2000 || row.year > 2100) return fail('invalid', '입력값이 올바르지 않습니다.', 400);
  const sb = createPublicClient();
  const { error } = await sb.from('ureca_applications').insert(row);
  // DB 오류 문구는 서버 로그에만 — 클라이언트에는 일반 문구(2026-10-13)
  if (error) { console.error('[ureca] insert', error.message); return fail('db', '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500); }
  /* 같은 학생이 같은 연도·학기에 다시 제출하면 이전 지원서를 대체합니다 (마지막 제출본만 유지).
   * anon에는 select/delete 정책이 없으므로 security definer RPC(schema_v8)가 방금 넣은
   * 최신 행만 남기고 이전 pending 지원서를 지운다. RPC 미설치면 중복이 남고 관리자 화면에서 정리한다. */
  let replaced = false;
  try {
    const { data: n, error: rpcErr } = await sb.rpc('replace_ureca_application', { p_year: row.year, p_term: row.term, p_student_id: row.student_id });
    if (!rpcErr && typeof n === 'number') replaced = n > 0;
  } catch { /* RPC 미설치 — 대체 생략 */ }
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  const termKo: Record<string, string> = { spring: '봄학기', summer: '여름방학', fall: '가을학기', winter: '겨울방학' };
  await notifyAdmin(`[기계공학과] URECA 인턴 지원${replaced ? ' (수정 제출)' : ''}: ${row.name} (${row.year} ${termKo[row.term] || row.term})`,
    `<p>${replaced ? '기존 지원서를 대체하는 <strong>수정 제출</strong>이 접수되었습니다.' : '새 URECA 인턴 지원서가 접수되었습니다.'}</p><table><tr><td>지원기간</td><td>${row.year} ${esc(termKo[row.term] || row.term)}</td></tr><tr><td>이름/학번</td><td>${esc(row.name)} / ${esc(row.student_id)}</td></tr><tr><td>현재학기</td><td>${esc(row.semester)}</td></tr><tr><td>연락처</td><td>${esc(row.phone)} / ${esc(row.email)}</td></tr><tr><td>지원 연구실</td><td>${choices.map((c: any) => `${c.rank}지망 ${esc(c.lab)} (${esc(c.prof)})`).join('<br>')}</td></tr></table><p><a href="${site}/${process.env.ADMIN_PATH || 'adm'}/ureca">관리자 페이지에서 확인</a></p>`);
  return NextResponse.json({ ok: true, replaced });
}
