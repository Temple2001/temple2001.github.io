---
title: 'CI/CD 환경에서 npm install 대신 npm ci를 사용하는 이유'
description: 'npm install과 npm ci의 차이를 알아보자'
pubDate: '2025-03-18'
tags: [개발, 리서치, npm]
---

npm ci에서 ci는 Clean Install을 말하는 것으로, 다음과 같은 특징을 가진다.

- npm install이 `package.json` 과 `package-lock.json` 의 내용을 기반으로 패키지를 설치하는 반면 npm ci는 `package-lock.json` 에 적힌 정확한 버전의 패키지를 설치한다. 따라서 어떤 실행 환경이든 동일한 의존성을 보장한다.
- 위 동작에 따라, npm ci는 `package-lock.json` 을 수정하지 않는다. 이외에도 어떤 쓰기 동작을 수행하지 않는다.
- npm ci를 사용하면 `node_modules` 폴더를 삭제하고 처음부터 설치한다.

위와 같은 특징으로 인해 npm ci는 오류가 발생해서는 안되는 배포 환경에서 일관된 설치 및 실행이 가능하도록 만들어 준다.

---

조사하면서 `package.json` 과 `package-lock.json` 의 차이를 알아볼 수 있었는데,

둘 다 의존성 목록을 작성한 파일이지만 `package.json` 에서는 반드시 패키지 버전을 명확하게 하나만 지정하지 않고 npm의 semantic versioning 기반 범위 지정 방식을 바탕으로 근사한 버전이나 호환되는 버전을 모호하게 지정할 수 있다.

반면에 `package-lock.json` 에는 해당 파일이 작성되는 시점(보통 npm install 실행 시점)에서의 의존성 트리가 동일하게 생성될 수 있도록 만드는 의존성 목록이 작성되어 있다.

따라서 `package.json` 으로만 패키지를 설치하면 빌드 또는 실행이 불가능할 가능성이 생기게 되고, `package-lock.json` 을 참고하여 패키지를 설치하면 명시된 정확한 버전으로 패키지를 설치하여 의존성 문제를 최소화시킬 수 있다.

`package-lock.json` 의 내용이 알맞다는 전제하에, 의존성 추가 작업이 필요없다면 npm ci를 사용하는 것이 더 효율적일 수 있겠다.

# 참조

[npm ci](https://velog.io/@yu00hun/npm-ci)

[[npm] package-lock.json이 필요한 이유](https://jihyundev.tistory.com/21)