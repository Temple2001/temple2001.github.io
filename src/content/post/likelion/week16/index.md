---
title: 멋사 -  16주차 Spring Boot CRUD 세션
description: Spring Boot로 CRUD를 구현해보기
pubDate: 2024-10-02
tags: ['멋쟁이사자처럼']
---

# 목차

# 배운 내용 정리

## CRUD란?

대부분의 컴퓨터 소프트웨어가 가지는 기본적인 데이터 처리 기능인 Create(생성), Read(읽기), Update(갱신), Delete(삭제)를 묶어서 일컫는 말

예시

- Create : 게시글 작성하기
- Read : 특정 회원의 게시글 가져오기
- Update : 글 수정하기
- Delete : 글 삭제하기

## CRUD in SpringBoot

전체적인 흐름

1. 클라이언트가 HTTP 요청을 보내면 **Controller**가 이를 처리
2. Controller는 필요한 **Service** 메서드를 호출하여 비즈니스 로직을 실행
3. Service는 **Repository**를 통해 데이터베이스와 상호작용
4. Repository는 **Entity**를 기반으로 데이터베이스의 CRUD 작업을 수행
5. 결과는 다시 Controller로 전달
6. 최종적으로 클라이언트에게 응답이 반환

일반적인 개발 순서 : Entity 정의 → Repository 생성 → Service 구현 → Controller 작성

### SpringBoot와 Django의 구조 차이

- Entity (모델)

  **스프링 부트**: `@Entity` 어노테이션을 사용하여 데이터베이스 테이블과 매핑되는 클래스로 데이터베이스의 구조를 정의
  **장고**: 장고의 모델 클래스와 비슷함!

- Repository (레포지토리)

  **스프링 부트**: `JpaRepository` 인터페이스를 상속받는 인터페이스를 통해 CRUD 메서드를 자동으로 생성하며 데이터베이스와의 상호작용을 담당
  **장고**:  쿼리셋과 ORM 기능을 사용하여 데이터베이스와 상호작용

- Service (서비스)

  **스프링 부트**: 비즈니스 로직을 처리하는 클래스로 Repository와 Controller 사이에서 중개 역할을 담당
  **장고**: 주로 뷰(view)에서 비즈니스 로직을 처리하지만, 필요에 따라 서비스 클래스 생성 가능.

- Controller (컨트롤러)

  **스프링 부트**: `@RestController` 어노테이션을 사용하여 HTTP 요청을 처리하고, 응답을 반환하는 클래스로 클라이언트의 요청을 받아 적절한 서비스 메서드를 호출하는 역할
  스프링 부트의 Controller는 장고의 `urls.py`와 비슷한 역할을 하지만, URL 매핑과 요청 처리가 통합되어 있는 점에서 차이점이 존재함. (장고의 경우 URL과 view 간의 매핑이 명확하게 분리)

- DTO (Data Transfer Object)

  **스프링 부트**: DTO는 데이터 전송을 위해 설계된 객체로 일반적으로 데이터베이스 엔티티와는 별개로, 클라이언트와 서버 간에 필요한 데이터만을 포함하여 전송.
  DTO는 불필요한 데이터 노출을 방지하고, 데이터 전송을 간소화하는 데 도움을 줌
  **장고**: 시리얼라이저는 모델 데이터를 JSON으로 변환하고, 요청 데이터를 유효성 검사하는 데 사용된다.

# 과제 회고

## API 스펙

|  | CRUD | URL | 파라미터 | body | 설명 |
| --- | --- | --- | --- | --- | --- |
| createArticle | Create | `/api/v1/articles` | X | X | 글을 생성합니다. |
| getArticlesByMemberId | Read | `/api/v1/articles/member/{memberId}` | member의 Id (number) | X | 특정 member의 글들을 조회합니다. |
| updateArticle | Update | `/api/v1/articles/{articleId}` | article의 Id (number) | ArticleUpdateRequestDto | 특정 글을 수정합니다. |
| deleteArticle | Delete | `/api/v1/articles/{articleId}` | article의 Id (number) | X | 특정 글을 삭제합니다. |

# 후기

이번 세션에서는 SpringBoot에서의 CRUD 구현 방법을 다루었다.

CRUD는 어떤 서비스를 만들던 반드시 포함될 수밖에 없는 기능이므로 구현 난이도는 쉽지만 기본적인 CRUD에 문제가 생긴다면 전체 서비스에 큰 타격을 줄 수 있으므로 꼼꼼히 배워야 할 것 같다.

다만 현재는 엔티티 규모가 작아 필드가 몇개 되지 않지만 필드가 많아지면 CRUD를 위해 만들어야 하는 DTO의 크기도 증가할텐데, 이럴 때는 엔티티를 DTO로 변환하거나 그 반대의 과정을 직접 코드를 일일이 작성해서 구현해야 하는지 문득 궁금해졌다.

구글링해보니 엔티티와 DTO의 매핑을 도와주는 ModelMapper나 MapStruct 같은 라이브러리가 존재함을 알 수 있었다.

```java
@Mapper
public interface CarMapper {

    @Mapping(target = "manufacturer", source = "make")
    @Mapping(target = "seatCount", source = "numberOfSeats")
    CarDto carToCarDto(Car car);

    @Mapping(target = "fullName", source = "name")
    PersonDto personToPersonDto(Person person);
}
```

그 중에서 MapStruct는 이런 식으로 매핑을 전담할 인터페이스를 만들고 안쪽에 매핑을 원하는 엔티티와 DTO를 적어놓은 다음 적절한 어노테이션을 붙여주면 라이브러리가 자동으로 `CarMapperImpl` 클래스를 생성하여 엔티티와 DTO를 자유롭게 변환할 수 있는 메서드를 제공해준다. 

필드 이름이 달라도 위 코드처럼 어노테이션을 이용해 자유롭게 매핑해줄 수 있고 `expression` 파라미터로 어떻게 매핑될지 그 방법도 커스텀할 수 있는 모양이다.

MapStruct는 ModelMapper나 다른 매퍼들에 비해 좋은 성능을 가지고 있다는 이야기가 있는데, 다음에 한번 써보아야겠다.