#!/bin/sh
# Vercel 'Ignored Build Step'(vercel.json ignoreCommand) — 종료 코드 0이면 빌드 생략, 1이면 빌드.
# docs/·*.md·scripts/·supabase/·.env.example만 바뀐 커밋은 배포하지 않는다: 배포마다 ISR 캐시가 비워져 크롤러가 글 4,800쪽을 다시 만들며
# CPU ~10분·ISR 쓰기 수천 건을 쓰기 때문(Vercel 무료 한도, 2026-10-13). 비교 기준은 이전 배포 커밋(VERCEL_GIT_PREVIOUS_SHA);
# 얕은 클론에 없으면 HEAD^. 어느 쪽도 없거나 git이 실패하면 안전하게 빌드한다. (vercel.json의 ignoreCommand는 256자 제한이라 스크립트로 분리)
p="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git cat-file -e "$p^{commit}" 2>/dev/null || p=HEAD^
git cat-file -e "$p^{commit}" 2>/dev/null || exit 1
git diff --quiet "$p" HEAD -- . ':(exclude)docs' ':(exclude)*.md' ':(exclude)scripts' ':(exclude)supabase' ':(exclude).env.example' && exit 0
exit 1
