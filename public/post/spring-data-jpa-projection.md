---
title: Spring Data JPA에서 필요한 속성만 조회하는 방법
description: Spring Data JPA에서 Projection을 사용해 필요한 속성만을 뽑아오자
pubDate: 2025-04-24
tags: [리서치, Spring Data JPA, Projection]
---

DB의 필요한 속성만을 조회하는 것을 Projection이라고 한다.

Spring Data JPA에서도 Projection을 지원하는데, 그 방법이 약간 특이했다.

```java
@Query("SELECT s.id as id FROM Stadium s JOIN s.company c WHERE c.id=:companyId")
List<Long> findAllIdsByCompanyId(@Param("companyId") Long companyId);
```

이런 식으로 컬럼 하나를 받아올 때 해당 컬럼의 타입에 맞게 반환 타입을 적어주면 왠지 잘 작동할 것 같지만 작동하지 않는다.

```java
@Query("SELECT s.id as id FROM Stadium s JOIN s.company c WHERE c.id=:companyId")
List<StadiumId> findAllIdsByCompanyId(@Param("companyId") Long companyId);

interface StadiumId{
    Long getId();
}
```

JPA는 위와 같이 인터페이스를 기반으로 하여 조회되는 컬럼의 타입을 지정할 수 있다.

신기하게 단순히 getter를 인터페이스에 적어두는 것으로 Projection이 동작하게 되는데, 이는 내부적으로 JPA가 동적 프록시를 이용해 해당 인터페이스의 내용을 바탕으로 구현체를 생성하여 전달하기 때문이다.

# 참조

[Spring Data JPA에서의 Projection 방법](https://velog.io/@pjh612/Spring-Data-JPA%EC%97%90%EC%84%9C%EC%9D%98-Projection-%EB%B0%A9%EB%B2%95)

[[JPA] Data JPA에서 Projection 활용기](https://learngoeson.tistory.com/51)