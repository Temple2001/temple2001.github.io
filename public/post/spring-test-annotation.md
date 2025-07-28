---
title: 'Spring Boot 테스트 코드 작성 중 사용되는 어노테이션 정리'
description: '@SpringBootTest, @ExtendWith(MockitoExtension.class), @Mock, @MockBean 의 사용처를 알아보자'
pubDate: '2025-04-03'
tags: [리서치, '@SpringBootTest', '@ExtendWith(MockitoExtension.class)', '@Mock', '@MockBean']
---

# 목차

# @SpringBootTest vs @ExtendWith(MockitoExtension.class)

`@SpringBootTest` 는 애플리케이션 전체를 통합적으로 테스트하는 데에 사용된다.

실제 실행처럼 모든 빈과 컴포넌트를 초기화/주입 한다.

따라서 단위 테스트보다는 controller, service, respository 간의 상호작용을 검증하는 통합 테스트에 어울린다.

`@ExtendWith(MockitoExtension.class)` 는 스프링 컨텍스트를 로드하지 않고 가상의(Mock) 객체를 사용하여 테스트를 진행한다.

이 때문에 `@SpringBootTest` 를 사용하는 테스트보다 속도가 빠르고 가벼우며 의존성 문제를 생각할 필요가 없다.

따라서 단일 클래스나 메서드를 테스트하는 단위 테스트에 적합하다.

단위 테스트를 작성할 때는 `@ExtendWith(MockitoExtension.class)` 를 사용하는 것이 좋을 것이다.

# @Mock vs @MockBean

mocking 할 객체를 지정하는 어노테이션 중에 `@Mock`과 `@MockBean`이 있다.

`@Mock`은 스프링 컨테이너를 사용하지 않는 일반적인 환경 또는 객체에 사용되며, 단위 테스트에 사용된다.

`@MockBean`은 스프링 컨테이너 내의 Bean을 모킹하기 위해서 사용되며, 통합 테스트에 사용된다.

여기서 난 `@MockBean`도 mocking이 가능하니 굳이 통합 테스트에서만 쓰이지 않고 단위 테스트에서도 사용될 수 있지 않을까 생각했다.

`@MockBean`을 사용할 때는 보통 특정 Bean, 특히 외부 API나 함부로 테스트하기 힘든 Bean들만 mocking하는 용도로 쓰인다고 한다.

애초에 스프링 컨텍스트를 사용하게 되니 `@Mock` 보다 테스트가 더 무겁고 느려지므로 굳이 단위 테스트에 사용할 필요가 없는 것이다.

그리고 `@Mock`을 사용하면 `@InjectMocks`으로 테스트 목적 클래스에 의존성을 주입하고, `@MockBean`을 사용하면 `@Autowired`로 의존성을 주입한다고 한다.