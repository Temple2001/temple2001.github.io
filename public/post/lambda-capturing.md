---
title: 람다 캡쳐링(Capturing Lambda)이란?
description: 람다식에서 왜 변경된 변수를 사용할 수 없는지에 대해 알아보자
pubDate: 2025-05-27
tags: [리서치, Capturing Lambda, effectively final variable]
---

```java
...

Account account = new Account();
account = accountRepository.save(account);
String accountId = account.getId();

...

for (int i = 0; i < 10; i++) {
    executorService.submit(() -> {
        try {
            DecreasePointRequest request = new DecreasePointRequest();
            request.setAccountId(accountId);
            request.setPoint(deductAmount);
            request.setDescription(description);

            Integer resultBalance = horoPointService.decreasePoint(account, deductAmount, description);
            synchronized (resultBalances) {
                resultBalances.add(resultBalance); // 결과 저장
            }
        } catch (Exception e) {
            System.out.println("예외 발생: " + e);
        }
    });
}

...
```

동시성 테스트 코드를 리팩토링 하던 도중 람다식에 사용되는 변수은 final이 아니라면

> **Variable used in lambda expression should be final or effectively final**

이라는 에러를 발생시키는 것을 확인할 수 있었다.

정확히는 해당 변수가 처음에 초기화된 값이 아니라 중간에 값이 다시 할당된 변수라면 에러를 발생시키는 것 같다.

---

그 이유를 찾아보니 **람다 캡처링** 이라는 과정 때문이었다.

람다는 실행될 때 기존 메서드의 스택 변수들에 대해 참조가 가능하도록 하기 위해 기존 스택의 변수들을 **그대로 들고 와(=캡처)** 자신의 스택에 가져온다.

캡쳐라는 단어의 의미에 맞게 해당 변수들의 그 당시 상태를 그대로 가져오는 것 뿐이다.

따라서 람다식을 실행할 때 복사했던 변수값이 그 사이에 바뀌었다면 람다는 그것을 감지할 수 없어 람다의 변수와 바깥의 변수와의 괴리가 발생하기 때문에 람다식에 들어갈 변수는 final만 허용하는 것이다.

참고로 final 뿐만 아니라 **effectively final(람다식 이전에 값이 변경되지 않은 상태)** 도 허용된다.

# 참조

[람다에서 지역변수 값을 변경하지 못하는 이유 Variable used in lambda expression should be final or effectively final](https://code-killer.tistory.com/202)