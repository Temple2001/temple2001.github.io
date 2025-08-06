---
title: AWS ECS로 이중화와 오토 스케일링 적용
description: 이중화와 오토 스케일링을 적용하기 위해 AWS ECS로 배포를 수행해보자
pubDate: 2025-04-24
tags: [인프라, AWS ECS, 이중화, 오토 스케일링]
---

# 목차

# 갑작스러운 요청

프로젝트 진행 중 원청으로부터 백엔드 서버의 배포 환경에 **이중화**와 **오토 스케일링**을 적용해달라는 요청을 받았다.

이전까지 전혀 관련된 이야기가 없어서 이중화에 대해서는 신경쓰지 않았는데, 완전 마른하늘에 날벼락이었다.

요청을 듣고 매우 당황스러웠지만 컨테이너 오케스트레이션 및 오토 스케일링 작업을 꼭 해보고 싶은 마음이 있었기 때문에 오히려 진행하고 싶은 마음이 더 컸다.

원청과 의견을 나누면서 기존 배포 환경에서 손쉽게 이중화와 오토 스케일링을 적용할 수 있는 AWS ECS를 사용하기로 결정했다.

# AWS ECS에 대해 알아보자

AWS ECS(Elastic Container Service)는 컨테이너를 손쉽게 실행, 중지, 관리할 수 있는 컨테이너 관리 서비스라고 한다. 쉽게 말해서, AWS판 쿠버네티스라고 할 수 있다.

물론 쿠버네티스는 처음부터 끝까지 세세한 부분을 설정 가능하고 ECS는 AWS 내에서 컨테이너 관리에 핵심적인 부분만 설정할 수 있으므로 자유도가 그렇게 높진 않지만, AWS에 최적화된 형태이므로 AWS 환경에 익숙하거나 이미 AWS 환경을 사용중일 때 쉽게 적용할 수 있다는 장점이 있다.

ECS는 클러스터 > 서비스 > 테스크 > 컨테이너 순으로 좁아지는 구성요소를 갖고 있다.

- **Cluster** : 기본 단위, Task 또는 Service의 논리적인 그룹
- **Service** : Task를 지속적으로 관리하는 단위, Task를 상황에 맞게 추가하고 제거하는 Auto Scaling 역할도 담당한다.
- **Task** : ECS의 최소 실행 단위로 하나 이상의 컨테이너 묶음을 의미, **Task Definition**을 정의하여 그 내용대로 Task를 생성할 수 있다. **(Task Definition : 설명서, Task : 인스턴스)**
- **Container** : 실제로 실행되는 EC2 인스턴스, 만약 Fargate(서버리스) 기반으로 ECS를 사용하는 경우 사용되지 않을 수 있다.

ECS는 EC2 인스턴스로 구성되거나 Fargate 서버리스로 구성될 수 있는데, Fargate로 구성하게 되면 인스턴스 각각을 신경 쓸 필요 없이 AWS가 직접 관리하여 준다.
사용자 입장에서는 서버리스처럼 보이는 것이다.

# AWS ECS 적용을 위해 고려해야 할 점

## Redis

현재 DB와 별개로 Redis를 사용하고 있다. 백엔드 서버에서 BullMQ 메세지 큐를 사용하기 위해 Redis가 필수적인데, 이 Redis를 ECS 환경에서는 어떻게 배포해야 할지 고민이 됐다.

Redis를 NestJS와 함께 Task 단위로 묶어서 Task 통째로 이중화하는 방법과 AWS ElasitCache를 사용하고 그곳에서 이중화를 설정하는 방법이 있다. 후자의 경우에는 비용이 꽤 많이 든다는 부담이 있어 가급적 전자를 사용하고 싶지만 서비스 환경에 문제가 되지 않을지 걱정되었다.

하지만 현재 기능 명세에 따르면 요청이 들어올 때만 메세지 큐를 사용하고 사용자는 해당 요청을 한 번만 전송하기 때문에, 여러 컨테이너가 있더라도 실제로는 한 컨테이너에서만 메세지 큐에 메세지가 추가되고 소비된다. 그렇기에 여러 컨테이너가 존재해도 각 컨테이너가 Redis 사용에 서로 간섭을 주지 않는다.

따라서 **Redis 컨테이너와 NestJS 컨테이너를 하나의 Task로 묶고** 그 Task 단위로 오토 스케일링 및 이중화를 수행하는 방법을 선택하는 게 좋아보인다.

## NestJS 내의 스케쥴러

백엔드 서버에는 일정 시간마다 특정 작업을 수행하는 스케쥴러를 등록하였는데, 이는 ECS 환경에서 100% 문제가 생긴다.

스케쥴러는 한 곳에서만 실행되는 환경을 전제로 구현했는데, 여러 컨테이너에 모두 스케쥴러가 들어가 있고, 각자가 스케쥴에 맞추어 로직을 실행한다면 불필요한 작업이 생길 뿐더러 엄청난 부하가 찾아올 것이다.

따라서 스케쥴러를 분리하거나 다른 방식으로 스케쥴러가 동작할 수 있도록 해야 하는데, 나는 스케쥴러를 API화 시켜서 외부에서 호출할 수 있도록 하는 방식을 생각해냈다. 즉, 로직을 실행하는 역할만 백엔드 서버에 맡기고 **일정한 주기로 실행하는 역할을 외부에 맡기는 것**이다.

**AWS lambda**를 이용하면 특정 업무를 주기적으로 실행할 수 있는데, lambda가 일정 주기로 백엔드 서버에 API화된 스케쥴러 로직을 실행하게 만들면 한번에 한 NestJS 컨테이너만 해당 로직을 수행하여 문제를 해결할 수 있게 된다.

스케쥴러 코드를 완전히 분리시켜 별도의 서버 또는 컨테이너에서 동작하도록 만드는 방법도 있는데, lambda를 이용하는 방법이 훨씬 구현하기 쉬우므로 먼저 이 방법대로 구현한 뒤 상황을 지켜볼 예정이다.

## DB

현재로서는 동시성 문제를 야기할 기능이 백엔드에 있진 않다.
따라서 여러 컨테이너가 하나의 RDS에 접속하여 DB를 사용하는 방식은 문제가 없을 것으로 보인다.

## 결론

- **NestJS와 Redis 컨테이너를 묶어 하나의 Task로 구성**하여 오토 스케일링되도록 만든다.

- 각 NestJS 컨테이너는 RDS(postgreSQL)와 연결된다.

- **스케쥴러는 API로 만들어 외부에서 호출**하도록 하고 **AWS lambda**로 해당 API를 주기적으로 호출한다.

# Task Definition 구성

나는 위의 고려사항들을 토대로 다음과 같이 **Task Definition**을 구성하였다.

- 인프라 요구 사항
  - 시작 유형 : Fargate
  - 운영체제 : x86
  - 태스크 크기 : 1vCPU, 2GB 또는 3GB
- 컨테이너 설정 **(nestjs)**
  - 이미지 : ECR에 등록된 이미지 URI 설정
  - 포트 매핑
    - 컨테이너 포트 : 바깥(호스트)으로 열 포트 번호 → 3000 (nestjs 기본값)
    - 프로토콜 : TCP
    - 포트 이름 : nestjs-port
    - 앱 프로토콜 : HTTP
  - 환경 변수
    - S3에 올린 env 파일을 가져와 설정
  - 로그 설정
    - AWS CloudWatch
  - 상태 확인
    - 명령 : `CMD-SHELL, curl -f http://localhost:3000/health || exit 1`
    - 나머지 옵션 기본값
  - 시작 종속성 설정
    - redis 컨테이너 실행 이후(Healthy 조건) 시작되도록
- 컨테이너 설정 **(redis)**
  - 이미지 : Docker Redis 공식 이미지 URI 설정
  - 포트 매핑 : X
  - 로그 설정 : X
  - 상태 확인
    - 명령 : `CMD-SHELL, redis-cli ping || exit 1`
    - 나머지 옵션 기본값

# GitHub Actions를 이용한 ECS 변경사항 업데이트 배포

GitHub 레포지토리의 특정 브랜치(ex. deploy)에 **GitHub Actions**를 적용하여 배포 과정을 구성하였다.

1. 해당 브랜치에 push가 발생하면 프로젝트 내에 위치한 Dockerfile과 프로젝트 빌드 파일을 토대로 Docker Image를 빌드하여 AWS ECR에 업로드
 - `configure-aws-credentials`, `amazon-ecr-login` 액션을 사용
2. 업로드된 새로운 Docker Image의 ID를 ECS Task definition에 반영
 - `amazon-ecs-render-task-definiton` 액션을 사용
3. 변경된 ECS Task definition을 deploy
 - `amazon-ecs-deploy-task-definition` 액션을 사용

## GitHub Actions workflow 구성

```yml
name: Production Deploy

on:
  push:
    branches: [prod]

# <필요 Secrets>
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY

env:
  # ENV 모음
  AWS_REGION: AWS_REGION
  ECR_REPOSITORY_NAME: ECR_REPOSITORY_NAME
  ECS_CLUSTER_NAME: ECS_CLUSTER_NAME
  ECS_SERVICE_NAME: ECS_SERVICE_NAME
  ECS_TASK_DEFINITION_NAME: ECS_TASK_DEFINITION_NAME
  ECS_NESTJS_CONTAINER_NAME: ECS_NESTJS_CONTAINER_NAME

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      # AWS 인증 정보 등록
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      # ECR 로그인
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      # ECR에 nestjs 이미지 빌드 및 업로드
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}  # 각 커밋마다 태그가 구분되도록 설정
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_NAME:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_NAME:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY_NAME:$IMAGE_TAG" >> $GITHUB_OUTPUT

      # ECS에 이미 등록된 Task Definition을 재사용
      - name: Download Task Definition Template
        run: |
          aws ecs describe-task-definition \
            --task-definition $ECS_TASK_DEFINITION_NAME \
            --query taskDefinition \
            > task-definition.json

      # Task Definition에 새로운 이미지 ID 기입
      - name: Fill in the new image ID in the Amazon ECS task definition
        id: setting-task-definition
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.ECS_NESTJS_CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      # 변경된 Task Definition으로 재배포
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.setting-task-definition.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE_NAME }}
          cluster: ${{ env.ECS_CLUSTER_NAME }}
          wait-for-service-stability: true
```

위와 같이 GitHub Actions workflow를 작성하면 main 브랜치에 push가 이루어질 때마다 AWS ECR에 새로운 NestJS 이미지를 빌드 및 업로드하고, 기존 Task Definition을 가져와 새롭게 업로드된 NestJS 이미지를 사용하도록 수정한 뒤 재배포하게 된다.

# 참조

[ECS, ECR, Github Actions를 사용하여 Nest.js CICD하기](https://velog.io/@linho1150/ECS-ECR-Github-Actions%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-Nest.js-CICD%ED%95%98%EA%B8%B0)