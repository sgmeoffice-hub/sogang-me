import { NextResponse, type NextRequest } from 'next/server';

/** 언어 자동 판별 진단 — 브라우저가 보낸 정보와 미들웨어가 내릴 결정을 그대로 보여준다 (개인정보 없음).
 *  "왜 영어로 열리나" 문의가 오면 /api/lang 을 열어 보게 한다. 미들웨어와 같은 순서를 유지할 것. */
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const cookie = req.cookies.get('sg_lang')?.value || null;
  const country = req.headers.get('x-vercel-ip-country') || '';
  const accept = req.headers.get('accept-language') || '';
  let locale = 'ko'; let reason = '기본값(정보 없음) → 한국어';
  if (cookie === 'ko' || cookie === 'en') { locale = cookie; reason = `전환 버튼으로 저장된 선택(sg_lang 쿠키)=${cookie}`; }
  else if (/(^|[,;\s])ko\b/i.test(accept)) { locale = 'ko'; reason = '브라우저 언어에 한국어 포함'; }
  else if (country) { locale = country === 'KR' ? 'ko' : 'en'; reason = `브라우저 언어에 한국어 없음 → 접속 국가 ${country}`; }
  else if (accept) { locale = 'en'; reason = '브라우저 언어에 한국어 없음, 국가 정보 없음'; }
  return NextResponse.json(
    { decision: `/${locale}`, reason, sg_lang_cookie: cookie, accept_language: accept, ip_country: country,
      tip: cookie === 'en' ? '헤더의 "한국어" 버튼을 한 번 누르면 이 브라우저는 이후 한국어로 열립니다.' : '이 결과가 /ko 인데도 주소창에 직접 입력한 me.sogang.ac.kr 이 /en 으로 가면, 브라우저가 기억한 리다이렉트이거나 /en 북마크입니다.' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
