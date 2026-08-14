# Temple's Hideout

## 개요

Temple's Hideout는 Astro와 Tailwind CSS로 만든 정적 개발 블로그입니다. 게시물은 Markdown Content Collection으로 관리하고 GitHub Pages에 정적 파일을 배포합니다.

- 게시물 형식: Markdown (`.md`)
- 배포 방식: `main` 브랜치 push → GitHub Actions → GitHub Pages
- OG 이미지: Header의 검정·흰색과 사선 분할을 반영한 1200×630 PNG를 빌드 시 생성

## 환경 구성 및 사용법

### 요구사항

- Node.js 20 이상
- npm 10 이상 권장

### 설치와 개발 서버

```bash
npm ci
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다. 개발 환경에서는 `blind: true` 게시물도 확인할 수 있습니다.

### 검증 명령

```bash
npm run check        # Astro/TypeScript 타입 검사
npm test             # 핵심 게시물 정책 테스트
npm run build        # 정적 사이트와 OG 이미지 생성
npm run build-smoke  # dist 산출물 누출·메타데이터 확인
npm run verify       # 위 검증을 순서대로 실행
```

`npm run build-smoke`는 `dist/`가 생성된 상태에서 실행해야 합니다. 배포 전에는 `npm run verify`로 전체 검증을 수행합니다.

## 게시물 작성

### 파일 배치

새 게시물과 게시물 전용 이미지는 같은 디렉터리에 둡니다. 게시물 ID는 디렉터리 경로에서 만들어집니다.

```text
src/content/post/my-new-post/
├── index.md
├── diagram.png
└── screenshot.webp
```

게시물 이미지나 Markdown 원본을 `public/post/`에 추가하지 않습니다.

### Frontmatter

```yaml
---
title: '새 게시물 제목'
description: '목록과 검색 미리보기에 사용할 짧은 설명입니다.'
pubDate: '2026-08-03'
tags: ['개선', 'Astro', '개발']
cover: './diagram.png'
coverAlt: '게시물 흐름을 설명하는 다이어그램'
---
```

`title`, `description`, `pubDate`, `tags`는 필수입니다. `src/content.config.ts`의 schema가 frontmatter를 검증합니다.

- `tags`의 첫 번째 값은 색상이 적용되는 대분류입니다. `구현`, `리서치`, `인프라`, `트러블 슈팅`, `개선` 중 하나만 사용합니다.
- 두 번째 태그부터 글의 구체적인 기술과 주제를 작성합니다.
- 검토 중인 글은 `blind: true`로 숨길 수 있습니다. 개발 환경에서는 보이지만 프로덕션 목록·상세 페이지·RSS·OG 생성에서는 제외됩니다.
- 공개할 때는 `blind`를 삭제하거나 `false`로 바꿉니다.

### 본문과 이미지

- frontmatter 바로 다음에 본문 첫 제목으로 `# 목차`를 작성합니다. `remark-toc`가 최대 2단계 제목의 목차를 자동 생성하므로 항목은 직접 작성하지 않습니다.
- `.md` Markdown 문법만 사용합니다. MDX, JSX와 Astro component import를 게시물에 추가하지 않습니다.
- 본문 이미지는 게시물 디렉터리에 두고 `![설명](./diagram.png)`처럼 상대 경로로 참조합니다.
- 코드 블록에는 언어 식별자를 작성합니다.
- 이미지의 출처와 라이선스 표기가 필요하면 본문에 기록합니다.

`cover`를 생략하면 본문의 첫 번째 Markdown 이미지가 목록 카드의 대표 이미지가 됩니다. `coverAlt`도 생략하면 첫 이미지의 alt를 사용하고, alt가 없으면 게시물 제목을 사용합니다. 본문 첫 이미지와 다른 이미지를 대표 이미지로 사용하려면 `cover`와 `coverAlt`를 명시합니다. 기존 외부 이미지를 유지해야 할 때만 HTTPS URL을 사용합니다.

## 구조와 렌더링 흐름

```text
src/content/post/**/*.md
        │ Astro Content Collection
        ▼
getCollection('post') → getVisiblePosts()
        ├── index.astro / list/[page].astro → PostBox.astro
        ├── post/[...id].astro → Markdown 본문
        ├── rss.xml.js → RSS
        └── og/[...slug].png.ts → Satori + Resvg PNG
```

`src/lib/post-utils.mjs`의 `getVisiblePosts(posts, includeBlind)`가 공개 게시물 필터와 발행일 내림차순 정렬의 단일 진입점입니다. 홈, 목록, 상세 페이지, RSS와 OG 경로를 추가할 때 별도의 필터·정렬을 만들지 않고 이 함수를 사용합니다.

주요 정적 경로는 다음과 같습니다.

- `/`: 최근 공개 게시물 5개
- `/list/:page/`: 공개 게시물 10개 단위 목록
- `/post/:id/`: Markdown 게시물 상세 페이지
- `/rss.xml`: 공개 게시물 RSS
- `/og/home.png`, `/og/list/:page.png`, `/og/post/:id.png`: 빌드 시 생성되는 OG 이미지

SEO 메타데이터와 canonical URL은 `src/layouts/BlogLayout.astro`에서 관리합니다. OG 디자인을 변경하면 캐시 기반 크롤러가 새 이미지를 요청하도록 `ogImageVersion`도 함께 올립니다.

## 프로젝트 구조와 기술 스택

```text
src/content/post/  게시물 Markdown과 co-located 이미지
src/components/    Header, Footer, PostBox 등 공통 Astro 컴포넌트
src/layouts/       SEO 메타데이터를 포함한 BlogLayout
src/lib/           공개 게시물 조회와 OG 이미지 생성
src/pages/         홈·목록·상세·RSS·OG 이미지 라우트
scripts/           정적 빌드 산출물 smoke test
tests/             핵심 게시물 정책 테스트
```

- Astro 5: 정적 사이트 생성과 Content Collections
- Tailwind CSS 4: UI 스타일링
- Pretendard / Orbitron: 본문과 Header 로고 폰트
- Satori + Resvg: 빌드 시 OG 이미지 생성
- Node.js built-in test runner: 핵심 정책 테스트
- GitHub Actions / GitHub Pages: 품질 게이트와 배포

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 Node.js 20 환경에서 의존성 설치, Astro 검사, 핵심 테스트, 정적 빌드와 build smoke test를 실행합니다. 모든 검증에 성공한 `dist/`만 GitHub Pages artifact로 배포합니다.

GitHub 저장소의 Pages 설정은 Actions 방식을 사용해야 합니다.
