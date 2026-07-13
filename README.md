# soponion

음악을 등록하고 반 별점과 리뷰, 댓글, 좋아요를 남기는 React + Supabase 커뮤니티입니다.

## 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에는 실제 Supabase 주소와 `VITE_SUPABASE_PUBLISHABLE_KEY`를 넣습니다. 실제 키는 커밋하지 않습니다.

## 데이터베이스 준비

Supabase SQL Editor에서 `supabase/00_fixes.sql`을 **먼저** 실행하고, 이어서 `supabase/schema.sql`을 실행하세요. 첫 파일은 기존 `review_likes`를 재생성하므로, 좋아요 데이터가 있는 경우 실행 전 백업이 필요합니다. 두 SQL은 Supabase 콘솔 권한이 있어야 실제 프로젝트에 적용됩니다.

## 수동 점검 목록

- 회원가입, 로그인, 새로고침 뒤 세션 유지, 로그아웃
- 내 프로필 수정과 5MB 이하 이미지 업로드
- 음악·리뷰·댓글·답글·좋아요 생성과 본인 콘텐츠 수정/삭제
- 제목 검색과 장르·아티스트 필터 조합
- 두 번째 계정으로 다른 사용자의 콘텐츠를 직접 API로 수정/삭제하려 할 때 RLS가 차단하는지

## 배포

Vercel에서 이 폴더를 프로젝트 루트로 선택하고 `npm run build`를 Build Command로 지정합니다. 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 Vercel에도 등록합니다. SPA 경로 새로고침을 위해 `vercel.json`의 rewrite를 사용합니다.
