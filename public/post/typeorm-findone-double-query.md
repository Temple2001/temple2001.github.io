---
title: TypeORM에서 findOne에 relations 옵션을 넣으면 쿼리가 두번 실행된다?
description: TypeORM의 이중 쿼리 문제를 경험해보았다
pubDate: 2025-04-25
tags: [리서치, TypeORM, findOne]
---

```java
const txHistory = await this.historyRepository.findOne({
  where: { txHash: txHash },
  relations: ['userWallet'],
});
```

```sql
// SELECT DISTINCT 쿼리 이후 SELECT 쿼리가 한번 더 실행됨
query: SELECT DISTINCT id FROM (SELECT * FROM ... LEFT JOIN ... WHERE ...) ORDER BY ... ASC LIMIT 1
query: SELECT * FROM ... LEFT JOIN ... WHERE ...
```

TypeORM에서 findOne 메서드를 사용할 때 relations 옵션으로 연관 데이터를 같이 가져오면 쿼리가 하나가 아닌 두개가 실행이 된다.

분명 하나의 쿼리만으로 실행이 될 수 있는 조건인데 왜 굳이 해당되는 데이터의 id를 찾고 그 id로 다시 조회를 하는지 모르겠다.

---

https://github.com/typeorm/typeorm/issues/5694

https://github.com/typeorm/typeorm/issues/8147

github issue를 찾아보니 역시 나와 같은 문제를 겪는 사람들을 볼 수 있었고, 보기엔 아직까지도 TypeORM에서 이 문제를 해결할 조치를 수행하지 않은 것 같다.

```tsx
const [txHistory] = await this.historyRepository.find({
  where: { txHash: txHash },
  relations: ['userWallet'],
});
```

위 Issue에서 나온 이야기대로 findOne 대신 find 메서드를 사용한 다음 destructure 하여 첫번째 요소만 받아오는 방법을 사용한다면 문제가 해결되지만 그다지 좋은 코드로 보이진 않는다…

이 밖에도 QueryBuilder로 직접 쿼리를 구성하는 방법도 있지만 이 역시 ORM의 장점을 누리지 못한다는 점에서 아쉬운 방법이다.