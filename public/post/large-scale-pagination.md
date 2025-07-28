---
title: 대용량 데이터에서의 pagination
description: 대용량 데이터를 pagination 하는 방식의 성능을 평가하고 더 나은 방법을 찾아보자
pubDate: 2025-05-08
tags: [리서치, 페이지네이션, mongoose]
---

현재 프로젝트에서 mongoose를 사용하고 있는데, 페이지네이션을 구현해야 했다.

조사해보니 mongoose도 내가 저번에 사용했던 typeORM과 비슷하게 **skip과 limit**(typeORM에서는 take) 두개의 파라미터를 이용해 조회 쿼리를 수행하는 방식으로 페이지네이션을 구현한다고 한다.

---

[[MongoDB]  대용량 데이터를 고려한 페이징 방법](https://frankle97.tistory.com/45)
[What is the best way for pagination on mongodb using java](https://stackoverflow.com/questions/50260384/what-is-the-best-way-for-pagination-on-mongodb-using-java)

그런데 이 방식의 성능 문제에 대한 이야기도 많았다.

skip과 limit을 이용한 페이지네이션 원리는 전체 데이터를 읽은 뒤 처음부터 지정된 오프셋까지 하나하나 찾아간다는 것이다.

예를 들어, 전체 데이터가 1천만이면 5백만개까지 하나하나 탐색해서 찾아간다는 것이다. 데이터가 많아질 수록 성능 하락의 폭은 점점 커질 것이다.

---

대부분의 사람들이 제시하는 해결책은 **mongoDB 내부의 `_id`값**을 이용하는 것이다.

클라이언트에서 “마지막으로 조회된 데이터”의 `_id`를 넘겨주며 페이지네이션 조회를 요청하면 백엔드에서는 해당 `_id`값에 gt(greater than) 옵션을 걸어 조회한다.

```tsx
// skip, limit 사용
collection.find().skip(pageSize*(pageNum-1)).limit(pageSize);

// _id 사용
// first row
collection.find().limit(pageSize);

// next row
users = collection.find({'_id': {$gt: last_id}}).limit(pageSize);
```

언뜻보면 비슷한 로직처럼 보이지만, 중요한 것은 `_id`값에 내부적으로 인덱스가 적용되어 있다는 것이다.

인덱스의 시간복잡도는 O(logN)이므로 기존 방식의 O(N)보다 훨씬 빠르다. 그러므로 성능 향상을 이끌어낼 수 있다.

대신 skip과 limit의 파라미터를 전달하는 보편적인 방식 대신 마지막 데이터의 `_id`값을 넘겨주는 방식으로 변경해야 하므로 클라이언트에도 변화를 줄 필요가 있다.

그리고 정렬이 필요한 페이지네이션(날짜로 정렬 등)에서는 `_id`와 해당 날짜 필드의 복합 인덱스를 만들어줘야 확실한 성능 향상을 이끌어낼 수 있다.