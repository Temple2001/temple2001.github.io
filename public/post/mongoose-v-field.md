---
title: Mongoose의 __v key
description: Mongoose의 __v key가 어떤 역할을 하는지 알아보자
pubDate: 2025-05-23
tags: [개발, 리서치, mongoose, __v]
---

Mongoose를 사용하여 새로운 데이터를 document에 생성하면 `__v` key가 자동으로 생성된다.

이 `__v` key는 데이터에 적용되는 **버전 정보**로, 동시에 같은 데이터가 수정될 때 발생할 수 있는 충돌을 감지하는 데에 사용될 수 있다.

흔히 데이터베이스에서 말하는 **낙관적 락** 방식과 거의 유사하게 사용된다는 것이다.

```jsx
// 2 copies of the same document
const doc1 = await Model.findOne({ _id });
const doc2 = await Model.findOne({ _id });

// Delete first 3 comments from `doc1`
doc1.comments.splice(0, 3);
await doc1.save();

// The below `save()` will throw a VersionError, because you're trying to
// modify the comment at index 1, and the above `splice()` removed that
// comment.
doc2.set('comments.1.body', 'new comment');
await doc2.save();
```

위 코드에서 한 사용자(doc1 이용)가 comments의 일부를 삭제하고 다른 사용자(doc2 이용)가 comments에 새로운 요소를 넣으려고 한다면 내부적으로 `__v` key를 확인하여 충돌을 감지한다(VersionError 발생).

참고로 이 버전 체크는 `save()`를 호출했을 때만 발생한다.

`update()`나 `findOneAndUpdate()` 같은 것들을 호출하면 `__v`를 다루지 않아 버전 체크가 수행되지 않는다.

---

[What's New in Mongoose 5.10: Optimistic Concurrency](https://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html)

그리고 `__v`를 사용한 기존 버전 체크는 array를 수정할 때만 적용된다고 하는데, 다른 타입에도 적용되도록 그 범위를 넓히려면 Schema 설정에 optimisticConcurrency 옵션을 켜면 된다고 한다.

# 참조

[Mongoose v8.15.0: Schemas](https://mongoosejs.com/docs/guide.html#versionKey)