import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-server';
import { notifyAdmin } from '@/lib/notify';
import { facilities } from '@/lib/nav';
import { escapeHtml as esc } from '@/lib/html';
import { allow, clientIp } from '@/lib/ratelimit';
import { isHalfHour } from '@/lib/reservation';

const today = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 기준 오늘

/** 겹치는 예약 조회 (승인 완료 + 승인 대기 모두 확인). 시작 < 상대 종료 && 종료 > 상대 시작 이면 충돌. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const facility = u.searchParams.get('facility') || '';
  const date = u.searchParams.get('date') || '';
  const start = u.searchParams.get('start') || '';
  const end = u.searchParams.get('end') || '';
  if (!facility || !date || !start || !end) return NextResponse.json({ conflicts: [] });
  const sb = createPublicClient();
  const { data } = await sb.from('reservations').select('id,user_name,start_time,end_time,status')
    .eq('facility', facility).eq('date', date).neq('status', 'rejected').lt('start_time', end).gt('end_time', start);
  return NextResponse.json({ conflicts: data || [] });
}

export async function POST(req: Request) {
  if (!allow(`resv:${clientIp(req)}`, 5, 10 * 60 * 1000))
    return NextResponse.json({ error: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  const b = await req.json();
  const row = {
    facility: String(b.facility || ''), date: String(b.date || ''), start_time: String(b.start_time || ''), end_time: String(b.end_time || ''),
    user_name: String(b.user_name || '').slice(0, 80), contact: String(b.contact || '').slice(0, 120),
    purpose: String(b.purpose || '').slice(0, 300), affiliation: String(b.affiliation || '').slice(0, 120), status: 'pending',
  };
  if (!row.facility || !row.date || !row.start_time || !row.end_time || !row.user_name || !row.contact)
    return NextResponse.json({ error: '필수 항목이 비어 있습니다.' }, { status: 400 });
  if (!isHalfHour(row.start_time) || !isHalfHour(row.end_time)) return NextResponse.json({ error: '시간은 30분 단위로만 예약할 수 있습니다.' }, { status: 400 });
  if (row.start_time >= row.end_time) return NextResponse.json({ error: '종료 시간이 시작 시간보다 늦어야 합니다.' }, { status: 400 });
  if (row.date < today()) return NextResponse.json({ error: '지난 날짜는 예약할 수 없습니다.' }, { status: 400 });

  const sb = createPublicClient();
  const { data: clash } = await sb.from('reservations').select('user_name,start_time,end_time,status')
    .eq('facility', row.facility).eq('date', row.date).neq('status', 'rejected')
    .lt('start_time', row.end_time).gt('end_time', row.start_time);
  if (clash && clash.length) {
    const list = clash.map((c: any) => `${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}${c.status === 'pending' ? ' (승인 대기)' : ''}`).join(', ');
    return NextResponse.json({ error: `이미 예약된 시간과 겹칩니다 — ${list}. 다른 시간을 선택해 주세요.`, conflicts: clash }, { status: 409 });
  }

  const { data: inserted, error } = await sb.from('reservations').insert(row).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // check-then-insert 사이에 다른 신청이 끼어든 경우(동시 제출): 먼저 들어간 쪽만 남긴다.
  if (inserted?.id) {
    const { data: race } = await sb.from('reservations').select('id')
      .eq('facility', row.facility).eq('date', row.date).neq('status', 'rejected').neq('id', inserted.id)
      .lt('start_time', row.end_time).gt('end_time', row.start_time).lt('id', inserted.id).limit(1);
    if (race && race.length) {
      // anon은 delete 정책이 없으므로 security definer RPC로 자기 행만 회수한다 (schema_v8).
      // RPC가 아직 없으면 pending 2건이 남아 관리자 화면에서 정리된다.
      await sb.rpc('withdraw_conflicted_reservation', { p_id: inserted.id });
      return NextResponse.json({ error: '방금 같은 시간에 다른 신청이 접수되었습니다. 다른 시간을 선택해 주세요.' }, { status: 409 });
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
