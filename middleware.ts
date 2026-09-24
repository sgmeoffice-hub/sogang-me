import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isLocale } from './lib/i18n';

const ADMIN_PATH = process.env.ADMIN_PATH || 'adm';

/** 옛 홈페이지(그누보드) URL → 새 사이트 경로 리다이렉트.
 *  구글 검색결과·외부 사이트(공과대학 등)에 남아 있는 옛 링크가 404가 되지 않게 한다. */
async function legacyRedirect(req: NextRequest): Promise<NextResponse | null> {
  const { pathname, searchParams } = req.nextUrl;
  const to = (path: string, permanent = true) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    return NextResponse.redirect(url, permanent ? 308 : 307);
  };

  // 옛 영문 홈 (/english, /english/…) → 새 영문 홈
  if (pathname === '/english' || pathname.startsWith('/english/')) return to('/en');
  if (pathname === '/index.php') return to('/');

  // 옛 게시판: /bbs/board.php, /v2/bbs/board.php
  if (pathname === '/bbs/board.php' || pathname === '/v2/bbs/board.php') {
    const tb = searchParams.get('bo_table') || '';
    const wr = searchParams.get('wr_id') || '';
    if (tb.startsWith('sub6_7')) return to('/ko/reservation'); // 시설 예약 달력
    if (tb && wr) {
      // 이관 때 저장한 legacy_id(g5:테이블:번호 / g4:…)로 새 게시글을 찾는다
      try {
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id,board&published=eq.true&or=(legacy_id.eq.g5:${tb}:${wr},legacy_id.eq.g4:${tb}:${wr})&limit=1`,
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } },
        );
        const d = await r.json();
        if (Array.isArray(d) && d[0]) return to(`/ko/board/${d[0].board}/${d[0].id}`);
      } catch { /* DB 불통이면 아래 게시판 매핑으로 */ }
      // DB에서 못 찾은 개별 글은 307(임시) — 일시적 DB 장애로 틀린 목적지가 브라우저에 영구 캐시되지 않게
      const tbMapMiss: Record<string, string> = { sub6_1: 'notice', sub6_2: 'scholarship', sub6_3: 'events', sub6_4: 'gallery', sub6_5: 'archive' };
      return to(tbMapMiss[tb] ? `/ko/board/${tbMapMiss[tb]}` : '/', false);
    }
    const tbMap: Record<string, string> = { sub6_1: 'notice', sub6_2: 'scholarship', sub6_3: 'events', sub6_4: 'gallery', sub6_5: 'archive' };
    if (tbMap[tb]) return to(`/ko/board/${tbMap[tb]}`);
    return to('/');
  }

  // 옛 메뉴 그룹 페이지: /bbs/group.php?gr_id=sub2, /bbs/group_eng.php?gr_id=eng_sub2 등
  if (pathname.startsWith('/bbs/') || pathname.startsWith('/v2/bbs/')) {
    const gr = searchParams.get('gr_id') || '';
    const eng = pathname.includes('group_eng') || gr.startsWith('eng');
    const n = (gr.match(/sub(\d)/) || [])[1];
    const secMap: Record<string, string> = { '1': '/about/intro', '2': '/faculty', '3': '/undergraduate/admission', '4': '/graduate/admission', '5': '/graduate/areas', '6': '/board/notice' };
    if (n && secMap[n]) return to(`/${eng ? 'en' : 'ko'}${secMap[n]}`);
    return to(eng ? '/en' : '/');
  }

  // 그 밖의 옛 경로(/v2/…, /kor/…)는 홈으로
  if (pathname === '/v2' || pathname.startsWith('/v2/') || pathname === '/kor' || pathname.startsWith('/kor/')) return to('/');
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const legacy = await legacyRedirect(req);
  if (legacy) return legacy;

  // 1) Secret admin URL -> internal /admin (direct /admin is blocked)
  if (pathname === `/${ADMIN_PATH}` || pathname.startsWith(`/${ADMIN_PATH}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(`/${ADMIN_PATH}`, '/admin');
    const res = NextResponse.rewrite(url);
    // keep Supabase session fresh for admin pages
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: any }[]) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    await supabase.auth.getUser();
    return res;
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // 2) Locale routing: /ko/... or /en/... ; otherwise detect
  const first = pathname.split('/')[1];
  if (isLocale(first)) {
    // 언어 선택은 헤더의 전환 버튼(?setlang=1)을 눌렀을 때만 기억한다.
    // 링크를 타고 들어온 것만으로 기억하면 옛 영문 링크로 유입된 한국어 사용자가 영어에 갇힌다.
    if (req.nextUrl.searchParams.has('setlang')) {
      const url = req.nextUrl.clone();
      url.searchParams.delete('setlang');
      const res = NextResponse.redirect(url, 307);
      res.cookies.set('sg_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
    return NextResponse.next();
  }
  const cookie = req.cookies.get('sg_lang')?.value;
  const country = req.headers.get('x-vercel-ip-country') || req.geo?.country || '';
  const accept = req.headers.get('accept-language') || '';
  // 판별 순서(2026-09-24 책임자: "영어로 접속되는 일이 잦다"): ① 전환 버튼으로 저장한 쿠키 ② 브라우저 언어에 한국어가 있으면 한국어
  // ③ 한국 IP면 한국어(폰 언어를 영어로 쓰는 한국 사용자 포함) ④ 그 밖(해외 IP + 한국어 없는 브라우저)만 영어.
  // 예전에는 IP 국가를 브라우저 언어보다 먼저 봐서 VPN·해외 출장·해외로 잡히는 통신망에서는 한국어 브라우저도 영어로 갔다.
  let locale = 'ko';
  if (cookie && isLocale(cookie)) locale = cookie;
  else if (/(^|[,;\s])ko\b/i.test(accept)) locale = 'ko';
  else if (country) locale = country === 'KR' ? 'ko' : 'en';
  else if (accept) locale = 'en';
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    // 옛 사이트 리다이렉트 대상 (점(.)이 들어간 경로는 위 일반 매처에서 제외되므로 명시)
    '/bbs/:path*', '/v2/:path*', '/kor/:path*', '/index.php', '/english/:path*',
  ],
};
