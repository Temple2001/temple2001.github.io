# Temple's Hideout 프로젝트 안내

이 파일은 전역 `AGENTS.md`의 공통 지침을 반복하지 않고, 이 저장소를 작업할 때 필요한 프로젝트 전용 정보를 제공합니다. 작업을 시작하기 전에 전역 지침과 이 파일을 함께 읽고, 작업 주제에 따라 `agent-docs/`의 문서를 추가로 확인해 주세요.

## 프로젝트 개요

Temple's Hideout는 Astro로 빌드하는 정적 개발 블로그입니다. GitHub Pages에 `main` 브랜치를 배포하며, 게시물은 Astro Content Collections의 Markdown 파일로 관리합니다.

- 운영 사이트: `https://blog.templ.es`
- 런타임 요구사항: Node.js 20 이상, npm lockfile 사용
- 콘텐츠 형식: Markdown (`.md`)만 사용
- 렌더링 방식: Astro 정적 출력
- 배포 대상: GitHub Pages

## 작업 시작점

1. 전역 지침을 확인합니다.
2. `git status --short`로 기존 변경사항을 확인하고, 관계없는 변경을 덮어쓰지 않습니다.
3. 작업 주제에 맞는 문서를 읽습니다.
   - 전체 흐름과 라우트: `agent-docs/architecture.md`
   - 게시물 작성과 이미지: `agent-docs/content-authoring.md`
   - AI 에이전트 작업 절차: `agent-docs/ai-workflow.md`
4. 변경 후 `npm run check`, `npm test`, `npm run build`, `npm run build-smoke`를 실행합니다. 로컬 Node.js가 없으면 Node 20 이상 Docker 컨테이너에서 실행합니다.

## 저장소 구조

```text
src/
├── components/       공통 Astro 컴포넌트
├── content/post/     게시물 Markdown과 게시물별 이미지
├── layouts/          페이지 공통 레이아웃과 SEO 메타데이터
├── lib/              게시물 조회와 OG 이미지 생성 로직
├── pages/            홈, 목록, 게시물, RSS, OG 이미지 라우트
└── styles/           Tailwind 및 전역 스타일
agent-docs/           에이전트용 구조·콘텐츠·작업 문서
public/               favicon 등 게시물 외 정적 파일
scripts/              빌드 산출물 smoke test
tests/                핵심 단위 테스트
```

게시물 원본과 게시물 이미지는 `public/post/`에 두지 않습니다. 새 게시물은 `src/content/post/<post-id>/index.md`에 작성하고, 함께 쓰는 이미지는 같은 폴더에 둡니다.

## 핵심 구현 규칙

- `src/content.config.ts`의 `post` schema가 frontmatter를 검증합니다.
- `getVisiblePosts()`는 기본적으로 `blind: true` 게시물을 제외하고 발행일 내림차순으로 정렬합니다. 개발 환경에서는 기존 동작을 유지하기 위해 blind 게시물을 볼 수 있고, 프로덕션 빌드와 RSS에서는 제외됩니다.
- 카드 대표 이미지는 `cover`와 `coverAlt` frontmatter로 지정합니다. `cover`를 생략하면 본문 첫 번째 Markdown 이미지가 목록 카드의 대표 이미지로 사용됩니다. 이때 `coverAlt`를 생략하면 본문 이미지의 alt, 또는 게시물 제목이 대체 텍스트가 됩니다. 로컬 이미지는 `cover: './image.png'`, 이미 존재하는 외부 이미지는 HTTPS URL을 사용합니다.
- 게시물 본문은 Markdown 문법만 사용합니다. MDX integration, `.mdx` 파일, JSX 컴포넌트 삽입을 추가하지 않습니다.
- `PostBox.astro`는 게시물 데이터를 수정하지 않고, 명시된 cover를 우선한 뒤 본문 첫 이미지 fallback을 계산해 표시합니다. co-located 로컬 이미지는 Vite asset URL로 변환합니다.
- OG 이미지는 빌드 시 `src/pages/og/[...slug].png.ts`에서 생성하며, Header의 Orbitron 로고·검정 배경·사선 분할 디자인을 재사용합니다.
- SEO 메타데이터와 canonical URL은 `src/layouts/BlogLayout.astro`에서 관리합니다. 페이지별 OG 경로만 각 페이지에서 전달합니다.

## 품질 기준

- 단위 테스트는 `src/lib/post-utils.mjs`의 공개 게시물 필터·정렬처럼 핵심 정책만 검증합니다.
- `scripts/build-smoke.mjs`는 배포 산출물에 Markdown 원본이 포함되지 않는지, 모든 HTML이 존재하는 OG 이미지를 참조하는지, RSS에서 blind 게시물이 빠지는지를 확인합니다.
- GitHub Actions는 Node 20에서 `check → test → build → build-smoke`를 통과해야 Pages artifact를 업로드합니다.
- 기능 변경으로 동작 흐름이나 작성법이 달라지면 `README.md`, 이 파일, 관련 `agent-docs/`의 갱신 필요성을 함께 검토합니다.

## 개발 명령

```bash
npm ci
npm run dev
npm run check
npm test
npm run build
npm run build-smoke
npm run verify
```

`npm run build-smoke`는 `dist/`가 이미 생성된 상태에서 실행해야 합니다. `npm run verify`는 타입 검사, 핵심 테스트, 빌드, smoke test를 순서대로 실행합니다.
