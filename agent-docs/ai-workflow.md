# AI 에이전트 작업 절차

이 문서는 이 저장소를 처음 다루는 AI 에이전트가 기존 구조를 존중하며 작업하기 위한 프로젝트별 절차입니다. 전역 `AGENTS.md`의 안전·검증·문서·Git 지침을 우선 적용합니다.

## 읽기 순서

1. 전역 지침
2. 프로젝트 루트 `AGENTS.md`
3. 작업 주제에 맞는 `agent-docs/architecture.md` 또는 `agent-docs/content-authoring.md`
4. 변경 대상 파일과 인접 호출부

## 변경 전 확인

- `git status --short`로 사용자가 남긴 변경사항을 확인합니다.
- 게시물 조회 경로를 수정할 때 홈, 목록, 상세, RSS, OG 생성 경로가 모두 `getVisiblePosts()` 정책을 공유하는지 확인합니다.
- 이미지 처리를 수정할 때 `cover`가 local image metadata와 외부 URL의 union이라는 점을 확인합니다.
- MDX integration이나 `.mdx` 파일을 도입하지 않습니다. 상호작용이 필요해도 먼저 Markdown 안에서 해결 가능한지 검토합니다.

## 구현 원칙

- 요청한 흐름에 필요한 최소한의 파일만 수정합니다.
- `public/`에는 게시물 원본을 복사하지 않습니다.
- 공통 정책은 기존 `src/lib/` 진입점을 재사용하고, 페이지마다 같은 filter/sort를 복제하지 않습니다.
- OG 디자인을 변경할 때 `src/components/Header.astro`의 로고, 검정·흰색 대비, 사선 분할을 기준으로 합니다.
- 테스트는 정책 단위와 배포 누출 방지처럼 실패 비용이 큰 핵심 경로만 추가합니다. 컴포넌트·문구마다 개별 테스트를 만들지 않습니다.

## 검증과 문서 갱신

코드 변경 후 최소 다음 순서로 검증합니다.

```bash
npm run check
npm test
npm run build
npm run build-smoke
```

검증 환경에 Node.js가 없으면 Node 20 이상 Docker 컨테이너를 사용합니다. 구조, 콘텐츠 작성법, 명령, 배포 흐름이 바뀐 경우 `AGENTS.md`, `README.md`, 관련 `agent-docs/`를 함께 검토합니다.

## 작업 결과 기록

완료 보고에는 변경한 핵심 파일, 검증 명령과 결과, 남은 외부 확인 사항을 기록합니다. 작업 단위가 여러 개면 각 단위를 독립적으로 되돌릴 수 있도록 전역 Git 지침에 따라 커밋을 분리합니다.
