# 게시물 작성 규칙

## 파일 배치

게시물 하나와 그 게시물의 이미지는 같은 디렉터리에 둡니다.

```text
src/content/post/my-new-post/
├── index.md
├── diagram.png
└── screenshot.webp
```

게시물 ID는 디렉터리 경로에서 만들어집니다. 게시물 이미지나 Markdown 원본을 `public/post/`에 추가하지 않습니다.

## Frontmatter 예시

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

`title`, `description`, `pubDate`, `tags`는 필수입니다. `tags`의 첫 번째 값은 색상이 적용되는 대분류이며 `구현`, `리서치`, `인프라`, `트러블 슈팅`, `개선` 중 하나만 사용합니다. 두 번째 값부터는 글의 구체적인 기술과 주제를 작성합니다.

`cover`를 생략하면 본문에 작성한 첫 번째 Markdown 이미지가 글 목록 카드의 대표 이미지로 자동 사용됩니다. 이때 `coverAlt`도 생략하면 첫 이미지의 alt가 사용되고, alt가 비어 있으면 게시물 제목이 사용됩니다. 본문 첫 이미지와 다른 이미지를 대표 이미지로 사용하거나 순서를 명확히 고정하려면 `cover: './image.png'`와 `coverAlt`를 명시합니다. 기존 외부 대표 이미지를 유지해야 할 때만 `cover: 'https://...'` 형식을 사용합니다.

## 본문 작성

- 모든 게시물은 frontmatter 바로 다음에 본문 첫 제목으로 `# 목차`를 작성합니다. `remark-toc`가 이를 감지해 목차를 자동 생성하므로 목차 항목은 직접 작성하지 않습니다.
- `.md` Markdown 문법만 사용합니다.
- JSX, Astro component import, MDX 문법을 추가하지 않습니다.
- 본문 이미지도 가능하면 게시물 디렉터리에 두고 `![설명](./diagram.png)`처럼 상대 경로로 참조합니다.
- 코드 블록은 언어 식별자를 지정합니다. 예: ` ```ts `.
- 이미지의 출처와 라이선스가 필요한 경우 본문에 기록합니다. 외부 이미지를 자동으로 내려받아 저장하는 동작은 추가하지 않습니다.

## 공개 여부

검토 중인 글은 frontmatter에 `blind: true`를 지정할 수 있습니다. 개발 환경에서는 확인할 수 있지만, 프로덕션 정적 페이지·목록·RSS·OG 생성에서는 제외됩니다. 공개할 때는 `blind`를 삭제하거나 false로 바꿉니다.

## 작성 후 확인

```bash
npm run check
npm run build
npm run build-smoke
```

빌드가 끝난 뒤 게시물 카드의 cover와 상세 페이지의 본문 이미지가 올바른지 확인합니다. frontmatter schema 오류가 나면 먼저 날짜 형식, tags 배열, local cover 상대 경로를 확인합니다.
