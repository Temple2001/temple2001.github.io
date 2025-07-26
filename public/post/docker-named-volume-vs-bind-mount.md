---
title: Docker의 Named Volume vs Bind Mount
description: Docker Volume을 구성하는 서로 다른 두가지 방법을 알아보자
pubDate: 2025-06-16
tags: [개발, 리서치, Docker, Named Volume, Bind Mount]
---

# Named Volume

```yaml
services:
  db:
    image: mongo:latest
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 1234
    volumes:
      - mongodb-data:/data/db

volumes:
	mongodb-data:
```

볼륨에 저장되는 데이터들은 Docker 엔진이 관리하는 별도의 공간에 저장된다.

Docker Compose 파일이 위치한 프로젝트 폴더가 사라지거나 이동해도 볼륨을 그대로 유지할 수 있다.

Docker CLI 명령어를 통해 쉽게 볼륨 및 그 데이터를 관리할 수 있다.

그러나 데이터의 경로를 직접 확인하거나 지정할 수 없기 때문에 사용자 입장에서 모호할 수 있다.

# Bind Mount

```yaml
services:
  db:
    image: mongo:latest
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 1234
    volumes:
      - ./data/mongodb:/data/db
```

볼륨에 저장되는 데이터들은 설정에 명시한 호스트 서버의 특정 경로에 저장되고 동기화된다.

사용자가 데이터에 쉽게 접근할 수 있어 Named Volume 방식보다 직접 수정이 간편하다.

그러나 데이터가 호스트 서버의 특정 경로에 의존하기 때문에 그 경로가 변경되거나 삭제되면 데이터가 손실될 수 있는 가능성이 있다.

# 참조

[[Docker] 데이터 관리(1) Volume 과 Bind mounts](https://velog.io/@haeny01/Docker-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EA%B4%80%EB%A6%AC1-Volume-%EA%B3%BC-Bind-mounts)