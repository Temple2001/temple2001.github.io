---
title: N+1 문제를 해결해보자
description: 유저 초대 기능 개발 중 맞닥뜨린 N+1 문제를 해결해보자
pubDate: 2025-04-14
tags: [개선, N+1 문제, Fetch Join, JPQL, '@EntityGraph']
---

# 목차

# Fetch Join으로 N+1 문제 해결

유저 초대 기록을 저장하는 테이블인 ReferralHistory에서 초대를 보낸 사람으로 조회를 하여 특정 유저의 초대 기록 리스트를 제공하는 API를 구현했었다.

이때 ReferralHistory에 초대 보낸 사람(referrer)과 초대 받은 사람(referred)을 표현하는 필드가 모두 Account 객체로 ManyToOne으로 연관관계가 맺어졌기 때문에, response dto를 작성하는 과정에서 해당 Account 객체의 데이터를 가져오게 되었다.

즉, N+1 문제가 발생하게 되는 것이다.

특정 유저가 초대를 보낸 ReferralHistory 기록이 n개 조회되면, referrer와 referred의 Account 객체를 불러오기 위해 쿼리를 각각 n번씩 더 날리게 된다.

정확히 말하자면, referrer는 앞 과정에서 이미 조회되어 영속성 컨텍스트에 로드되었기 때문에 2n번은 아니고 referred에 해당하는 n번의 쿼리가 추가로 날라간다.

그러나 2n번이든 n번이든 n+1 문제가 발생헀다는 사실은 명확하기 때문에, ReferralHistory의 크기가 크면 클수록 성능 하락폭이 심해질 것이다.

쿼리가 복사되는 것을 막기 위해 Fetch Join을 이용해 N+1 문제를 해결해보자.

```java
// 기존 Repository 메서드
public interface ReferralHistoryRepository extends JpaRepository<ReferralHistory, String> {
    List<ReferralHistory> findByReferrer(Account referrer);
} 

// Fetch Join을 이용하는 Query문을 직접 작성한 메서드
@Query("SELECT distinct rh FROM ReferralHistory rh " +
	    "JOIN FETCH rh.referred " +
	    "WHERE rh.referrer = :referrer")
List<ReferralHistory> findByReferrerWithFetchJoin(@Param("referrer") Account referrer);

// @EntityGraph를 이용한 메서드
@EntityGraph(attributePaths = {"referred"})
List<ReferralHistory> findByReferrer(Account referrer);
```

방법은 크게 두가지가 있다.

하나는 `@Query` 어노테이션으로 Fetch Join이 포함된 JPQL을 작성하여 사용하는 것이고, 다른 하나는 JPA의 쿼리 메서드 기능을 그대로 이용하면서 `@EntityGraph` 어노테이션으로 Fetch Join(기본 type이 Fetch임)을 적용하는 것이다.

위의 각 메서드의 Hibernate 로그는 다음과 같다.

```bash
// 대상 유저의 ReferralHistory 데이터가 3개 있을 때

<fetch join 적용 전>
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=?
Hibernate: select rh1_0.id,rh1_0.created_at,rh1_0.referred_id,rh1_0.referrer_id,rh1_0.updated_at from referral_history rh1_0 where rh1_0.referrer_id=?
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=? // n+1 문제 발생
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=? // n+1 문제 발생
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=? // n+1 문제 발생

<직접 fetch join 쿼리 적용>
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=?
Hibernate: select distinct rh1_0.id,rh1_0.created_at,r1_0.id,r1_0.birthday,r1_0.created_at,r1_0.gender,r1_0.nickname,r1_0.updated_at,r1_0.wallet_address,rh1_0.referrer_id,rh1_0.updated_at from referral_history rh1_0 join account r1_0 on r1_0.id=rh1_0.referred_id where rh1_0.referrer_id=?

<EntityGraph 적용>
Hibernate: select a1_0.id,a1_0.birthday,a1_0.created_at,a1_0.gender,a1_0.nickname,a1_0.updated_at,a1_0.wallet_address from account a1_0 where a1_0.id=?
Hibernate: select rh1_0.id,rh1_0.created_at,r1_0.id,r1_0.birthday,r1_0.created_at,r1_0.gender,r1_0.nickname,r1_0.updated_at,r1_0.wallet_address,rh1_0.referrer_id,rh1_0.updated_at from referral_history rh1_0 left join account r1_0 on r1_0.id=rh1_0.referred_id where rh1_0.referrer_id=?
```

밑의 두 방법을 이용하면 n+1 문제가 발생하지 않음을 확인할 수 있다.

위 결과로 알아낸 사실이 있는데, Fetch Join Query 작성과 EntityGraph 사용 결과는 매우 비슷해보이지만, Fetch Join Query를 작성하면 그냥 Join(=Inner Join)을 사용하고 EntityGraph를 사용하면 Left Join을 사용한다.

EntityGraph는 지정한 필드의 Fetch 전략을 **(런타임 도중에)** LAZY에서 EAGER로 변경하는 역할을 한다.

# 왜 N+1 문제는 대부분 Fetch Join으로 해결될까?

Fetch Join으로 N+1 문제를 해결할 수 있지만, 다른 방법은 없을까?
referrer와 referred의 Account 정보를 한번의 쿼리로 한번에 가져올 수 있는 방법은 없을까?

## EAGER 전략 사용

```java
List<Owner> owners = ownerRepository.findAll(); // JPQL: select o from Owner o
```

JPQL은 기본적으로 엔티티 필드에 명시된 글로벌 Fetch 전략을 무시하고 JPQL만 참고하여 SQL을 생성한다.

위 메서드는 다음과 같은 로직으로 실행된다.

1. JPQL에서 만든 SQL을 통해 Owner 엔티티만 조회 (1번 쿼리)
2. 이후 JPA에서 EAGER 전략에 따라 각 Owner의 연관 엔티티를 추가 조회 (N번 쿼리)

따라서 N+1 문제가 발생한다.

## 쿼리에 일반 JOIN 사용

Fetch Join을 사용하면 위에 보이는 Hibernate 로그처럼 select 절에 연관된 엔티티도 포함시켜 조회한다.

이 때문에 연관된 엔티티의 실제 데이터가 조회되어 로드되고 영속성 컨텍스트에 포함되어 이후 연관 엔티티의 데이터를 얻는 부분에서 쿼리가 추가로 발생되지 않는다.

```java
// JPQL: select u from User u join u.folders
List<User> users = userRepository.findAllWithJoin();
```

JPQL의 일반 JOIN은 SQL JOIN을 사용하는 것은 맞지만 select 절에는 지정한 엔티티만 포함된다.

연관 엔티티는 JOIN에 참여하긴 하지만 실제로 조회되어 메모리에 로드되지는 않는다.

따라서 이후 연관 엔티티의 데이터를 얻는 부분에서 쿼리가 추가로 발생되어 N+1 문제가 발생한다.

## 그럼 Fetch Join은?

Fetch Join을 사용하면 위에 보이는 Hibernate 로그처럼 select 절에 연관된 엔티티도 포함시켜 조회한다.

이 때문에 연관된 엔티티의 실제 데이터가 조회되어 로드되고 영속성 컨텍스트에 포함되어 이후 연관 엔티티의 데이터를 얻는 부분에서 쿼리가 추가로 발생되지 않는다.

# 참조

[JPA 모든 N+1 발생 케이스과 해결책](https://velog.io/@jinyoungchoi95/JPA-%EB%AA%A8%EB%93%A0-N1-%EB%B0%9C%EC%83%9D-%EC%BC%80%EC%9D%B4%EC%8A%A4%EA%B3%BC-%ED%95%B4%EA%B2%B0%EC%B1%85)