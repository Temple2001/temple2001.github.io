---
title: 'repository.save() 로 반환된 객체를 기존 객체 대신 이용해야 하는 이유'
description: '전달된 파라미터에 따라 다르게 동작하는 save 메서드를 이해해보자'
pubDate: '2025-04-03'
tags: [리서치, Spring Boot, Spring Data JPA]
---

Spring JPA에서 `repository.save(entity)` 를 사용할 때 파라미터로 전달된 entity에도 Id 정보가 기입되기 때문에(@GeneratedValue에 외해) 기존 객체를 이어서 사용해도 될 줄 알았지만 아니었다.

다음은 save 메서드가 SimpleJpaRepository에서 구현된 코드이다.

```java
@Transactional
public <S extends T> S save(S entity) {
    Assert.notNull(entity, "Entity must not be null");
    if (this.entityInformation.isNew(entity)) {
        this.entityManager.persist(entity);
        return entity;
    } else {
        return (S)this.entityManager.merge(entity);
    }
}
```

해당 코드에 따르면 파라미터로 전달된 entity가 이전에 등록되지 않았던 비영속 엔티티라면 persist를, 이전에 등록된 적 있던 준영속 엔티티라면 merge를 호출하는 것을 알 수 있다.

이때 persist는 파라미터의 entity와 반환된 entity 모두 동일하게 영속성 컨텍스트에서 관리하지만, merge는 반환된 entity만 영속성 컨텍스트에서 관리하기 때문에 차이가 발생한다.

즉, 준영속 엔티티로 save를 수행하면 기존 객체를 아무리 수정해도 데이터베이스에 반영될 수 없다는 것이다.

따라서 혼동을 줄이기 위해 파라미터로 전달된 엔티티가 비영속이든 준영속이든 기존 객체 대신 `save()`로 반환된 객체를 사용하는 것이 좋다.