---
title: 블로그 개발 일지 (New)
description: Temple's Hideout 블로그의 새 버전 개발 일지입니다.
pubDate: 2023-09-01
tags: ['구현', 'Next.js', 'contentlayer', 'SSG', 'Github Pages', 'Github Actions']
---

# 목차

# 블로그를 교체하는 이유

gatsby를 이용해서 github pages 블로그를 만든 후, 나만의 블로그를 만든다는 목표는 달성했지만 아쉬운 점이 많았다.

- 먼저, 다른 사람이 만들어 놓은 블로그 탬플릿(Gatsby template)을 그대로 가져다 썼기 때문에 개발 실력의 향상에는 아무런 도움이 되지 않았었고,
- 그 블로그 탬플릿에 이것저것 잡다한 필요없는 기능들이 들어가 있어 블로그 디자인이 굉장히 산만하게 보였으며,
- 타인이 작성한 코드이기 때문에 블로그 관리 측면에서도 기존 기능을 개선하거나 새 기능을 넣는 데에 어려움이 많았다.

따라서 이런 아쉬운 점들을 해결하기 위해서는 결국 **블로그를 내 힘만으로 처음부터 개발하는 것**이 유일한 방법이라고 생각했고 다시 블로그 개발 프로젝트를 새롭게 시작하게 되었다.

# 어떤 것을 사용해 볼까

## Next.js

기존 블로그에서 사용하던 Gatsby는 gatsby-plugin 같은 유용한 기능들을 가지고 있으며 현재 github-pages로 배포되는 대부분의 블로그들이 사용하고 있는 프레임워크다.
이전 블로그도 그런 장점들을 활용해서 빠르고 간단하게 만들 수 있었지만 단점들도 존재했다. 대표적으로 Gatsby의 버전이 올라갈 때마다 생기는 각종 모듈간의 충돌 문제들 때문에 블로그를 빌드하면서 수많은 시행착오를 겪었다.
지금 생각해보면 블로그에 붙어있는 gatsby-plugin이 한두가지가 아니다보니 관리가 힘들어진 점이 원인이었을 것이다.

새로 만들 블로그는 Next.js를 사용하기로 결정했다. Next.js는 리액트를 위해 만든 오픈소스 자바스크립트 웹 프레임워크로, 리액트를 기반으로 하지만 리액트에는 없는 다양한 기능들을 추가로 제공한다.

---

내가 많은 프레임워크 중에 Next.js를 선택한 이유는

1. 서버 사이드 렌더링 기반이라 SEO(Search Engine Optimization)에 적합하다.
2. SSG(Static Site Generation)를 지원하기 때문에 github-pages에 배포하는 과정에 어려움이 없다.
3. 커뮤니티가 매우 거대해 개발에 이런저런 도움을 받을 수 있다.

이 정도가 있다.

## Contentlayer

블로그를 만들기 전 가장 골치 아프다고 생각한 부분은 바로 글, 사진 같은 데이터를 블로그에 보여지도록 불러오는 작업을 구현하는 것이다.
`fs` 모듈 등을 이용해서 로컬에 있는 마크다운 파일같은 데이터를 찾고, 읽고, 화면에 뿌리는 과정을 구현해야 하는데 이는 생각만 해도 피곤해진다. 나는 굳이 직접 구현하지 않아도 로컬 데이터를 다룰 수 있는 라이브러리를 찾고 있었고, 가뭄에 단비처럼 찾아낸 것이 바로 [Contentlayer](https://contentlayer.dev/)이다.

### Contentlayer는 어떻게 작동하는가

Contentlayer는 먼저 `contentlayer.config.ts` 설정파일을 읽고 어떤 **파일**이 어떤 **규칙**에 따라 구분되고 어떤 **필드**를 가지고 있는지 확인한다.

- 현재 블로그에 적용된 contentlayer.config.ts
```ts
export const Post = defineDocumentType(() => ({
	name: "Post",
	contentType: "mdx",
	filePathPattern: "**/_post.mdx",
	fields: {
		title: {
			type: "string",
			required: true,
		},
		description: {
			type: "string",
			required: true,
		},
		createdAt: {
			type: "date",
			required: true,
		},
		blind: {
			type: "boolean",
			required: false,
			default: false,
		},
	},
}));

export const Category = defineDocumentType(() => ({
	name: "Category",
	contentType: "data",
	filePathPattern: "**/_meta.json",
	fields: {
		title: {
			type: "string",
			required: true,
		},
		description: {
			type: "string",
		},
	},
}));
```

그 다음 설정파일의 정보를 토대로 로컬 데이터를 Contentlayer가 다룰 수 있는 데이터 형식(`.json`)으로 가공한다. 이 과정은 `Next.js dev server`가 시작되거나 빌드될 때 일어나며 `Contentlayer CLI`를 이용해 수동으로 발생시킬 수도 있다. 심지어 이렇게 만들어진 가공된 데이터는 ts의 타입 검사를 이미 통과하였기 때문에 **타입 체크의 장점**을 누릴 수도 있다!

가공된 데이터는 아래와 같이 import하여 사용할 수 있다.

- 생성된 데이터로 글의 정보를 불러오는 예시
```ts
import { allPosts } from 'contentlayer/generated'
 
export default function Home() {
  return (
    <div>
      <h1>All posts</h1>
      <ul>
        {allPosts.map((post) => (
          <li key={post.url}>
            <a href={post.url}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

# 배포

내가 이용할 배포 서비스인 Github Pages는 Static HTML을 제공하기 때문에 SSG(Static Site Generation)으로 페이지를 제공해야 한다. 내 블로그는 빌드될 때 Contentlayer에 의해 모든 데이터가 준비되기 때문에 `fetch` 함수를 통해 데이터를 가져올 필요가 없으므로 `generateStaticParams()`로 경로 설정만 해준다면 build할 때 SSG로 생성이 된다.

그리고 자동 배포를 위해 Github Actions를 사용해 커밋만 날려도 Github 서버에서 알아서 빌드를 하고 자동으로 도메인에 배포를 하게 만들었다.

- .github/workflows/gh-pages-deploy.yml
```yml
name: Github Pages Deploy

on: [push]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies    # node_modules 설치
        run: npm install

      - name: Build     # build 수행
        run: npm run build

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: "out/"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to Github pages    # 도메인 배포
        id: deployment
        uses: actions/deploy-pages@v2
```