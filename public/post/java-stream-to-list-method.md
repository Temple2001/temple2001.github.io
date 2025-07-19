---
title: .collect(Collectors.toList()) vs .toList() 차이
description: Java에서 Stream을 List로 변환하는 두 방법을 이해해보자
pubDate: 2025-04-10
tags: [개발, 리서치, Java, toList(), Stream, List]
---

Java에서 Stream을 List로 바꾸는 것은 위 두 방법으로 모두 가능한데, 무슨 차이가 있을까?

먼저, Stream의 toList()는 Java 16 이상부터 지원하기 때문에, Java 8같은 환경에서는 어쩔 수 없이 전자를 사용할 수밖에 없다.

두 방법의 가장 큰 차이점은 결과로 나온 List의 변경 가능성(mutabillity)이다.

Collectors.toList()는 ArrayList를 반환한다. 따라서 수정이 가능하다.
그러나 Stream의 toList()는 Collectors.UnmodifiableList를 반환한다고 한다.

UnmodifiableList를 수정하거나 데이터를 추가 또는 삭제하려고 한다면 다음과 같은 예외가 발생하게 된다.

> java.lang.UnsupportedOperationException
at java.base/java.util.ImmutableCollections.uoe(ImmutableCollections.java:142)
at java.base/java.util.ImmutableCollections$AbstractImmutableCollection.add(ImmutableCollections.java:147)

---

그리고 Stream.toList()와 똑같이 UnmodifiableList를 반환하는 Collectors.toUnmodifiableList()도 존재하는데, 결과물은 똑같지만 Stream.toList()와는 또다른 차이가 존재한다.

Collectors.toUnmodifiableList()는 List 안에 Null을 허용하지 않지만, Stream.toList()는 Null을 허용한다.

자꾸 Intellij에서 Collectors.toList() 대신 Stream.toList()를 사용하라고 권고하는데, 그 이유가 무엇인지 궁금했다.
불변 List를 반환함으로써 얻을 수 있는 안정성 때문인 것으로 보인다.

# 참조

[Stream을 List로 변환하는 다양한 방법과 차이(Collectors.toList() vs Stream.toList())](https://velog.io/@cieroyou/Stream%EC%9D%84-List%EB%A1%9C-%EB%B3%80%ED%99%98%ED%95%98%EB%8A%94-%EB%8B%A4%EC%96%91%ED%95%9C-%EB%B0%A9%EB%B2%95%EA%B3%BC-%EC%B0%A8%EC%9D%B4Collectors.toList-vs-Stream.toList)