# Temple's Hideout

## 개요

Temple's Hideout는 Astro와 Tailwind CSS로 만든 정적 개발 블로그입니다. 게시물은 Markdown Content Collection으로 관리하고, GitHub Pages에 정적 파일을 배포합니다.

- 운영 주소: <https://blog.templ.es>
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

### 게시물 작성

새 게시물은 `src/content/post/<post-id>/index.md`에 작성합니다. 게시물 전용 이미지는 같은 디렉터리에 두고, 본문 첫 이미지를 카드 대표 이미지로 사용할 때는 `cover`를 생략할 수 있습니다. 다른 이미지를 지정하려면 frontmatter에 `cover: './image.png'`를 작성합니다. 상세한 작성법은 [`agent-docs/content-authoring.md`](agent-docs/content-authoring.md)를 참고합니다.

### 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 타입 검사, 핵심 테스트, 빌드, build smoke test를 통과한 뒤 GitHub Pages에 배포합니다. GitHub 저장소의 Pages 설정은 Actions 방식으로 맞춰야 합니다.

## 프로젝트 구조 및 개발 스택

### 주요 구조

```text
src/content/post/  게시물 Markdown과 co-located 이미지
src/components/    Header, Footer, PostBox 등 공통 Astro 컴포넌트
src/layouts/       SEO 메타데이터를 포함한 BlogLayout
src/lib/           공개 게시물 조회와 OG 이미지 생성
src/pages/         홈·목록·상세·RSS·OG 이미지 라우트
scripts/           정적 빌드 산출물 smoke test
tests/             핵심 게시물 정책 테스트
agent-docs/        AI 에이전트용 구조·작성·작업 문서
```

### 기술 스택

- Astro 5: 정적 사이트 생성과 Content Collections
- Tailwind CSS 4: UI 스타일링
- Pretendard / Orbitron: 본문과 Header 로고 폰트
- Satori + Resvg: 빌드 시 OG 이미지 생성
- Node.js built-in test runner: 최소 핵심 테스트
- GitHub Actions / GitHub Pages: 품질 게이트와 배포

게시물 목록, RSS, 상세 라우트, OG 이미지 생성은 `getVisiblePosts()`를 통해 blind 게시물을 일관되게 제외합니다. MDX integration이나 `.mdx` 게시물은 사용하지 않습니다. 전체 구조와 변경 시 주의점은 [`AGENTS.md`](AGENTS.md)와 [`agent-docs/architecture.md`](agent-docs/architecture.md)에 정리되어 있습니다.
