---
title: JpaRepository에서 findBy<Entity> vs findBy<Entity>Id
description: JpaRepository의 쿼리 메서드의 작동방식을 정확히 이해해보자
pubDate: 2025-04-11
tags: [리서치, JpaRepository, findBy]
---

어떤 엔티티의 외래키에 해당하는 엔티티의 Id로 조회하려고 할 때, `findBy<Entity>` 와 `findBy<Entity>Id` 를 사용할 수 있다.

둘 다 외래키에 해당하는 엔티티의 정보로 조회를 실행하게 해주는 메서드인데, 넘겨주는 파라미터가 id값인지 엔티티 그 자체인지에 따라 달라진다.

나는 처음에 파라미터로 엔티티 전체를 넘겨주는 것보다는 id값만 넘겨주는 것이 더 효율적이라고 생각하여 `findBy<Entity>Id` 를 자주 사용하였는데, 알고보니 이 메서드에는 큰 문제가 있었다.

> `findBy<Entity>` 의 Hibernate Log
> 
> ```sql
> select rh1_0.id, ...
> from referral_history rh1_0 
> where rh1_0.referrer_id=?
> ```

> `findBy<Entity>Id` 의 Hibernate Log
> 
> ```sql
> select rh1_0.id, ... 
> from referral_history rh1_0 
> left join account r1_0 on r1_0.id=rh1_0.referrer_id 
> where r1_0.id=?
> ```

`findBy<Entity>` 를 사용하면 Hibernate가 자동으로 넘겨준 엔티티의 id값을 가져와 곧바로 외래키 필드(referrer_id) 자체를 조회해 결과를 가져오는 방식을 사용한다.

그러나 `findBy<Entity>Id` 를 사용하면 외래키 필드를 바로 조회하지 않고 JOIN을 수행한 다음 엔티티의 id값으로 조회하는 방식을 사용한다.

---

왜 쿼리 메서드 뒤에 Id를 붙이면 쓸데없는 JOIN 연산이 추가되는지 의문이다.

그 의문은 꽤 간단하게 해결될 수 있었는데, spring data jpa의 쿼리 메서드 기능이 “nested properties”, 즉 필드의 필드도 조회할 수 있도록 지원하기 때문이었다.

`findBy<Entity>Id` 는 언뜻보면 외래키 조회를 id만으로 수행하라는 메서드인 것 같지만, nested properties가 적용되어 “<Entity>의 필드인 Id를 가지고 조회해라” 라는 뜻을 가진 메서드였다.

따라서 <Entity>의 필드인 id를 중심으로 조회를 해야하므로 JOIN이 수행될 수밖에 없는 것이다.

만약 JOIN 연산 없이 외래키의 id값만으로 엔티티를 조회하고 싶다면 아래와 같이 Query를 직접 명시하는 방법을 사용해야 한다.

```java
@Query("select m from Member m where m.team.id = :teamId")
List<Member> findByTeamId(final Long teamId);
```

# 참조

[외래키에 해당하는 컬럼으로 조회하고 싶을때는 어떻게 하면 될까요?... - 인프런 | 커뮤니티 질문&답변](https://www.inflearn.com/community/questions/24691/%EC%99%B8%EB%9E%98%ED%82%A4%EC%97%90-%ED%95%B4%EB%8B%B9%ED%95%98%EB%8A%94-%EC%BB%AC%EB%9F%BC%EC%9C%BC%EB%A1%9C-%EC%A1%B0%ED%9A%8C%ED%95%98%EA%B3%A0-%EC%8B%B6%EC%9D%84%EB%95%8C%EB%8A%94-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%98%EB%A9%B4-%EB%90%A0%EA%B9%8C%EC%9A%94?srsltid=AfmBOoq5vaUe4Ge8fwzJywRmUo6UtuZ10zNjGjBiWzaC8kDqF9SRveGI)

[[Spring Data JPA] findByXXXId 는 불필요한 join을 유발한다](https://velog.io/@ohzzi/Data-Jpa-findByXXXId-%EB%8A%94-%EB%B6%88%ED%95%84%EC%9A%94%ED%95%9C-join%EC%9D%84-%EC%9C%A0%EB%B0%9C%ED%95%9C%EB%8B%A4)