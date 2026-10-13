import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';

export const adminBase = () => `/${process.env.ADMIN_PATH || 'adm'}`;

/** 로그인 사용자·관리자 여부를 한 요청 안에서 한 번만 조회한다 — React cache로 레이아웃과 페이지가 같은 결과를 공유하므로
 *  페이지마다 검사해도 Supabase 왕복(getUser + is_admin)은 늘지 않는다(무료 한도·함수 CPU 절약). */
export const adminSession = cache(async () => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, ok: false as boolean };
  const { data: ok } = await sb.rpc('is_admin');
  return { sb, user, ok: !!ok };
});

/** 관리자 page.tsx 첫 줄에서 `const auth = await requireAdmin(); if (!auth) return null;` 로 쓴다.
 *  2026-10-13: 인증 검사가 layout.tsx에만 있으면 App Router 부분 렌더(라우터 상태 트리가 레이아웃과 일치하는 요청)로 페이지만 단독 렌더될 수 있어
 *  service-role 클라이언트를 쓰는 페이지(백업·수정 이력 등)가 노출될 여지가 있다. 실패 시 notFound()/redirect()를 던지지 않고 null을 돌려주는 이유:
 *  정상 전체 렌더에서는 레이아웃이 LoginForm/403을 그리는데 페이지가 throw하면 not-found가 트리 전체를 덮어 로그인 폼이 사라진다. */
export const requireAdmin = cache(async () => {
  const s = await adminSession();
  return s.ok && s.user ? { sb: s.sb, user: s.user } : null;
});
