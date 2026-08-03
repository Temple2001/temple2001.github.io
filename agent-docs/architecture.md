# 아키텍처와 렌더링 흐름

## 전체 흐름

```text
src/content/post/**/*.md
        │ Astro Content Collection
        ▼
getCollection('post') → getVisiblePosts()
        ├── index.astro / list/[page].astro → PostBox.astro
        ├── post/[...id].astro → Markdown Content 렌더링
        ├── rss.xml.js → 공개 게시물 RSS
        └── og/[...slug].png.ts → Satori + Resvg PNG
```

## 콘텐츠 컬렉션

`src/content.config.ts`는 `src/content/post`를 glob loader로 읽고, `**/*.md`만 collection에 포함합니다. schema는 다음 frontmatter를 요구하거나 허용합니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `title` | 예 | 게시물 제목 |
| `description` | 예 | 목록·SEO·OG 설명 |
| `pubDate` | 예 | `Date`로 변환되는 발행일 |
| `tags` | 예 | 태그 문자열 배열 |
| `blind` | 아니오 | true이면 프로덕션 공개 목록에서 제외 |
| `cover` | 아니오 | co-located 이미지 또는 HTTPS 이미지 URL |
| `coverAlt` | 아니오 | cover 대체 텍스트 |

게시물의 co-located 이미지가 schema의 `image()`를 통과하면 Astro가 image metadata를 생성합니다. `PostBox.astro`는 local metadata와 외부 URL을 모두 카드 이미지로 처리합니다.

## 공개 게시물 정책

`src/lib/post-utils.mjs`의 `getVisiblePosts(posts, includeBlind)`가 목록 정책의 단일 진입점입니다.

- 기본값 `includeBlind = false`: 프로덕션 목록, 상세 페이지, RSS, OG에서 공개 게시물만 사용합니다.
- 개발 페이지는 `import.meta.env.DEV`를 전달해 blind 게시물을 확인할 수 있습니다.
- 정렬 기준은 `data.pubDate` 내림차순입니다.
- 새로운 목록·피드·생성 라우트를 추가할 때 임의의 filter/sort를 만들지 말고 이 함수를 사용합니다.

## 주요 라우트

- `/`: 최근 공개 게시물 5개
- `/list/:page/`: 공개 게시물 10개 단위 목록
- `/post/:id/`: Markdown 게시물 상세 페이지
- `/rss.xml`: 공개 게시물 RSS
- `/og/home.png`: 홈 OG 이미지
- `/og/list/:page.png`: 목록 페이지 OG 이미지
- `/og/post/:id.png`: 게시물 OG 이미지

모든 HTML 페이지의 SEO 메타데이터는 `BlogLayout.astro`가 렌더링합니다. 게시물 상세 페이지는 `og:type=article`과 `article:published_time`을 추가합니다.

## OG 이미지 생성

`src/lib/og-image.ts`가 1200×630 PNG를 생성합니다.

- 왼쪽은 Header의 검정 영역과 사선 분할을 SVG polygon으로 표현합니다.
- 로고는 Orbitron, 본문은 Pretendard의 OTF 폰트를 사용합니다.
- 제목·설명은 길이를 제한해 소셜 카드에서 과도하게 넘치지 않도록 합니다.
- 텍스트는 일반 공유 화면에서도 읽히도록 로고·제목·설명·메타데이터의 크기를 크게 유지하고, Header보다 더 강한 사선 분할을 사용합니다.
- 이미지 파일은 요청 시 생성되는 것이 아니라 정적 빌드 중 `dist/og/`에 생성됩니다.
- `BlogLayout.astro`는 `og:site_name`, `og:image:type`, `og:image:secure_url`과 이미지 버전 query를 함께 제공합니다. OG 디자인을 바꿀 때 `ogImageVersion`을 올려 Telegram 같은 캐시 기반 크롤러가 새 이미지를 다시 요청하게 합니다.
- 새 OG 종류를 추가하면 `getStaticPaths`의 경로와 페이지의 `ogImage`를 함께 추가합니다.

## 배포

`.github/workflows/deploy.yml`은 `main` push 또는 수동 실행 시 동작합니다. quality job이 Node 20에서 npm lockfile 기반 설치, Astro check, 핵심 테스트, 정적 빌드, build smoke test를 수행하고, 성공한 `dist/`만 GitHub Pages deploy job으로 전달합니다.
