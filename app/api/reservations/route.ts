import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-server';
import { serviceClient } from '@/lib/vault';
import { notifyAdmin } from '@/lib/notify';
import { facilities } from '@/lib/nav';
import { escapeHtml as esc } from '@/lib/html';
import { allow, clientIp } from '@/lib/ratelimit';
import { isDateStr, START_SLOTS, END_SLOTS } from '@/lib/reservation';

const today = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 기준 오늘

/** 오류 응답: error(국문, curl 등 비UI 호출자용) + code(폼이 보는 언어로 바꿔 보여준다 — components/ReservationForm). 2026-10-13 */
const fail = (code: string, error: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ error, code, ...extra }, { status });

/** 시설·날짜·시간이 공개 폼이 고를 수 있는 값인지 — 폼(START/END_SLOTS, lib/nav facilities)과 같은 목록이라 정상 제출은 달라지지 않는다.
 *  예전엔 아무 문자열이나 DB·관리자 목록·알림메일 제목까지 흘러들었고, 06:00~24:00 밖(25:00 등)도 통과했다(2026-10-13). */
const validSlot = (facility: string, date: string, start: string, end: string) =>
  facilities.some((f) => f.id === facility) && isDateStr(date) && START_SLOTS.includes(start) && END_SLOTS.includes(end);

/** 겹치는 예약 조회 (승인 완료 + 승인 대기 모두 확인). 시작 < 상대 종료 && 종료 > 상대 시작 이면 충돌. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const facility = u.searchParams.get('facility') || '';
  const date = u.searchParams.get('date') || '';
  const start = u.searchParams.get('start') || '';
  const end = u.searchParams.get('end') || '';
  if (!facility || !date || !start || !end) return NextResponse.json({ conflicts: [] });
  // 폼이 보낼 수 없는 값은 DB를 거치지 않고 빈 결과 — 엉뚱한 문자열이 PostgREST 필터로 가고 함수 호출·DB 왕복만 쓰던 것을 막는다(2026-10-13)
  if (!validSlot(facility, date, start, end) || start >= end) return NextResponse.json({ conflicts: [] });
  // 인스턴스별 메모리 제한이라 완전하진 않지만, 한 IP가 날짜별 예약자를 긁어 가거나 호출을 퍼붓는 것을 늦춘다(Vercel 무료 한도). 폼은 조합당 1회만 묻는다
  if (!allow(`resvq:${clientIp(req)}`, 60, 60 * 1000)) return NextResponse.json({ conflicts: [], code: 'rate_limited' }, { status: 429 });
  const sb = createPublicClient();
  const { data } = await sb.from('reservations').select('id,user_name,start_time,end_time,status')
    .eq('facility', facility).eq('date', date).neq('status', 'rejected').lt('start_time', end).gt('end_time', start);
  return NextResponse.json({ conflicts: data || [] });
}

export async function POST(req: Request) {
  if (!allow(`resv:${clientIp(req)}`, 5, 10 * 60 * 1000))
    return fail('rate_limited', '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', 429);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object') return fail('invalid', '입력값이 올바르지 않습니다.', 400);
  const row = {
    facility: String(b.facility || '').slice(0, 40), date: String(b.date || '').slice(0, 10), start_time: String(b.start_time || '').slice(0, 8), end_time: String(b.end_time || '').slice(0, 8),
    user_name: String(b.user_name || '').slice(0, 80), contact: String(b.contact || '').slice(0, 120),
    purpose: String(b.purpose || '').slice(0, 300), affiliation: String(b.affiliation || '').slice(0, 120), status: 'pending',
  };
  if (!row.facility || !row.date || !row.start_time || !row.end_time || !row.user_name || !row.contact)
    return fail('missing', '필수 항목이 비어 있습니다.', 400);
  if (!facilities.some((f) => f.id === row.facility) || !isDateStr(row.date)) return fail('invalid', '입력값이 올바르지 않습니다.', 400);
  // 슬롯 목록 소속 확인이 30분 단위 검사(isHalfHour)를 포함하고 운영시간(06:00~24:00)까지 강제한다
  if (!START_SLOTS.includes(row.start_time) || !END_SLOTS.includes(row.end_time)) return fail('not_half_hour', '시간은 30분 단위로만 예약할 수 있습니다.', 400);
  if (row.start_time >= row.end_time) return fail('end_before_start', '종료 시간이 시작 시간보다 늦어야 합니다.', 400);
  if (row.date < today()) return fail('past_date', '지난 날짜는 예약할 수 없습니다.', 400);

  const sb = createPublicClient();
  const { data: clash } = await sb.from('reservations').select('user_name,start_time,end_time,status')
    .eq('facility', row.facility).eq('date', row.date).neq('status', 'rejected')
    .lt('start_time', row.end_time).gt('end_time', row.start_time);
  if (clash && clash.length) {
    const list = clash.map((c: any) => `${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}${c.status === 'pending' ? ' (승인 대기)' : ''}`).join(', ');
    return fail('overlap', `이미 예약된 시간과 겹칩니다 — ${list}. 다른 시간을 선택해 주세요.`, 409, { conflicts: clash });
  }

  const { data: inserted, error } = await sb.from('reservations').insert(row).select('id').single();
  // DB 오류 문구(PostgREST 메시지)는 서버 로그에만 — 클라이언트에는 일반 문구(2026-10-13)
  if (error) { console.error('[reservations] insert', error.message); return fail('db', '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500); }
  // check-then-insert 사이에 다른 신청이 끼어든 경우(동시 제출): 먼저 들어간 쪽만 남긴다.
  if (inserted?.id) {
    const { data: race } = await sb.from('reservations').select('id')
      .eq('facility', row.facility).eq('date', row.date).neq('status', 'rejected').neq('id', inserted.id)
      .lt('start_time', row.end_time).gt('end_time', row.start_time).lt('id', inserted.id).limit(1);
    if (race && race.length) {
      // anon은 delete 정책이 없으므로 security definer RPC로 자기 행만 회수한다 (schema_v8).
      // RPC가 아직 없으면 pending 2건이 남아 관리자 화면에서 정리된다.
      // service role로 호출(2026-10-19): schema_v12가 anon·authenticated EXECUTE를 회수해 REST로 남의 pending 예약을 물리는 경로를 닫는다.
      await serviceClient().rpc('withdraw_conflicted_reservation', { p_id: inserted.id });
      return fail('race', '방금 같은 시간에 다른 신청이 접수되었습니다. 다른 시간을 선택해 주세요.', 409);
    }
  }
  // 달력에 '승인 대기'가 바로 보이도록 예약 현황 페이지만 갱신(페이지는 1시간 캐시)
  revalidateTag('reservations'); revalidatePath('/ko/reservation'); revalidatePath('/en/reservation');
  const fac = facilities.find((f) => f.id === row.facility)?.ko || row.facility;
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  await notifyAdmin(`[기계공학과] 시설 예약 신청: ${fac} ${row.date} ${row.start_time}~${row.end_time}`,
    `<p>새 시설 예약 신청이 접수되었습니다.</p><table><tr><td>시설</td><td>${esc(fac)}</td></tr><tr><td>일시</td><td>${esc(`${row.date} ${row.start_time}~${row.end_time}`)}</td></tr><tr><td>신청자</td><td>${esc(row.user_name)}</td></tr><tr><td>연락처</td><td>${esc(row.contact)}</td></tr><tr><td>목적</td><td>${esc(row.purpose)}</td></tr></table><p><a href="${site}/${process.env.ADMIN_PATH || 'adm'}/reservations">관리자 페이지에서 승인하기</a></p>`);
  return NextResponse.json({ ok: true });
}
