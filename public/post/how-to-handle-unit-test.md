---
title: 단위 테스트의 유지보수
description: 단위 테스트는 언제 수행되어야 하는지에 대해 고찰해보았다
pubDate: 2025-05-15
tags: [리서치, 단위 테스트, 구현 테스트, 동작 테스트]
---

# 목차

# 단위 테스트는 언제 수정되어야 할까?

Service 메서드 최적화를 수행하다가 기존에 작성했던 단위 테스트가 실패하는 것을 보고 문득 생각이 들었는데, **“단위 테스트는 언제 수정되어야 하는가?”** 이다.

처음에는 아래와 같이 생각했다.

> 어떤 메서드의 테스트 코드를 작성할 때, 해당 메서드의 입력이나 출력의 내용이 수정되지 않는다면 반드시 성공해야 하는 것 아닌가?

실제로 메서드에 입력을 주고, 결과가 맞는지 테스트하는 방향으로 단위 테스트가 이루어지기 때문이다.

그러나 내가 지금까지 작성한 단위 테스트, 그리고 인터넷에 있는 거의 모든 단위 테스트 코드들은 given 단계에서 findById, findByUsername 같은 레포지토리 메서드에 입력에 대한 결과값을 미리 stub해두고 있다.

만약 최적화 등의 이유로 내부에서 사용한 레포지토리 메서드를 교체하거나 줄이는 식으로 코드에 수정을 가한다면 테스트는 반드시 실패할 것이다.

그럼 결국 단위 테스트는 입력이나 출력의 내용이 수정되지 않아도 내부 로직의 변화에 의해 결과가 바뀔 수 있다는 뜻이 되지 않겠는가?

예를 들어, 서비스에 전혀 문제가 되지 않고 오히려 개선을 시켜주는 최적화 리팩토링을 수행해도 단위 테스트가 실패하게 되는 것이다. 이는 뭔가 모순적이다.

이것에 대해 조사를 해보았지만, 인터넷에 있는 대부분의 Service 단위 테스트 코드는 지금까지 내가 해왔던 것처럼 레포지토리 메서드에 mock을 걸고 stub을 적용하는 코드 뿐이었다. 내가 고민했던 내용에 대한 내용도 찾을 수 없었다.

---

곰곰히 생각해본 결과, 결국 이 문제는 내 작성한 테스트 코드나 인터넷에 있는 수많은 테스트 코드들이 **애초에 내부 로직을 검사하려는 목적을 갖고 만들어졌기 때문**이라고 생각한다.

given/when/then 구조에서 given에 stub을 수행해 “이 레포지토리 메서드는 이렇게 동작한다고 가정해야 해”라는 의미를 내포시킨 것이다.

그러므로 메서드의 입력/출력에 변화를 주지 않는 최적화 리팩토링을 수행해도 **이미 가정된 레포지토리 메서드의 동작 방식을 위반했기 때문에** 테스트에 실패하는 것이다.

최적화 리팩토링에 영향이 없는 테스트 코드를 만들기 위해서는 내부 로직을 검사하려는 목적을 완전히 제거해야 할 것이다.

실무에서 어떠한 단위 테스트의 목적이 주로 사용될지는 모르겠다.

내 의견을 말하자면, 현재 방식처럼 내부 로직을 strict 하게 규정하고 검사하는 것은 리팩토링에 큰 위협이 될 수 있다는 의견이다.

# 구현 테스트 vs 동작 테스트

gpt에게 위 의견을 물어보았는데, 이 문제가 **구현 테스트와 동작 테스트의 차이**에 대한 이야기라고 말해주었다.

- **구현 테스트** : "나는 답이 무엇인지 상관하지 않고, 답을 구하는 과정에서 특정 동작을 수행하는지 확인하고 싶다."
- **동작 테스트** : "나는 어떻게 답이 도출되었는지 상관하지 않고, 주어진 상황에서 답이 올바른지 확인하고 싶다."

레포지토리 메서드를 mocking 해서 stub을 수행하는 것은 명백히 구현 테스트 접근 방식이다.

**어떻게** 메서드가 동작하는지를 테스트하기 때문에 내부 구현이 변경되면 테스트가 실패하게 된다.

**"리팩토링 내성"** 이라는 지표는 코드의 내부 구현이 변경되더라도 그 외부 동작이 동일하다면 테스트는 여전히 통과해야 함을 의미하는데, 동작 테스트 형태로 작성하는 것이 리팩토링 내성을 높일 수 있다.

---

내부 작업을 검증하는 구현 테스트를 화이트박스 테스트로, 내부 구조를 모르는 상태에서 기능을 검사하는 동작 테스트를 블랙박스 테스트로 말하기도 한다.

이때 블랙박스 테스트는 버그를 많이 발견할 수는 없지만 리팩토링에 흔들리지 않고, 화이트박스 테스트는 버그를 많이 발견할 수 있지만 리팩토링에 취약하다는 점이 있다고 한다.

이를 통해 버그 잡기와 리팩토링 내성은 trade-off 관계임을 알 수 있다.

# 리팩토링 내성이 높은 테스트를 구성하려면

그럼 구현 테스트 대신 동작 테스트 형태로 단위 테스트를 구성하려면 어떻게 해야 할까?

```java
public interface AccountRepository extends JpaRepository<Account, String> {
}

public interface ReferralHistoryRepository extends JpaRepository<ReferralHistory, Long> {
    List<ReferralHistory> findByReferrerWithFetchJoin(Account referrer);
}
```

보통 Spring Boot 개발에서 쓰는 JpaRepository를 상속한 인터페이스의 레포지토리 메서드를 사용하는 방식에서 mock + stub 이외의 방법을 사용하기란 쉽지 않다.

따라서 새로운 구조가 필요하다.

```java
public interface AccountReader {
    Account getById(String accountId);
}

public interface ReferralHistoryReader {
    List<ReferralHistory> getByReferrer(Account account);
}

@Repository
public class AccountJpaReader implements AccountReader {

    private final AccountRepository accountRepository;

    public AccountJpaReader(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public Account getById(String accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_NOT_FOUND));
    }
}

@Repository
public class ReferralHistoryJpaReader implements ReferralHistoryReader {

    private final ReferralHistoryRepository referralRepository;

    public ReferralHistoryJpaReader(ReferralHistoryRepository referralRepository) {
        this.referralRepository = referralRepository;
    }

    @Override
    public List<ReferralHistory> getByReferrer(Account account) {
        return referralRepository.findByReferrerWithFetchJoin(account);
    }
}

```

바로 위 코드처럼 추상화를 적용해 **절대 변하지 않을 핵심 기능**을 정하고 그 기능을 가진 interface를 Service 코드에서 사용하게 만드는 것이다.

해당 interface를 구현하는 구현체에서 상세한 내부 작업을 작성하게 되면, 구현체의 코드가 아무리 바뀌더라도 Service 코드에 영향이 가지 않는다.

```java
@Service
@RequiredArgsConstructor
public class ReferralService {

    private final AccountReader accountReader;
    private final ReferralHistoryReader referralHistoryReader;

    public List<ReferralHistoryResponse> getReferralHistory(String accountId) {
        Account account = accountReader.getById(accountId);
        List<ReferralHistory> histories = referralHistoryReader.getByReferrer(account);

        return histories.stream()
                .map(ReferralHistoryResponse::new)
                .toList();
    }
}
```

따라서 Service 코드의 단위 테스트를 mock + stub 방식으로 만들어도 리팩토링이 발생했을 때 테스트 코드가 영향 받지 않아 리팩토링 내성이 높일 수 있다.

---

하지만 완전히 내부 로직의 영향에서 벗어난 건 아니다.

getById나 getByReferrer 처럼 추상화된 인터페이스에도 메서드가 필요하며 이는 **절대 변하지 않을 핵심 기능**에 해당한다.

이 메서드의 명세가 바뀌면 이전처럼 테스트 코드를 변경해야 할 일이 생기게 된다.

따라서 해당 메서드들을 바꾸는 작업이 리팩토링 수준이 아니게 되도록 핵심적인 내용으로 안정적으로 구성하는 것이 가장 중요할 것이다.

그리고 재미있게도, 방금 수행한 개선 작업이 **DIP(Dependency Inversion Principle)** 를 실천한 하나의 사례이다!

> **DIP란**
> 
> 상위 모듈 **(ReferralService)** 는 하위 모듈 **(AccountRepository, ReferralHistoryRepository)** 에 의존하지 않으며,
> 둘 다 추상화 **(AccountReader, ReferralHistoryReader)** 에 의존해야 한다.

결국 Service→Repository 의존관계에 DIP를 적용한 것이 리팩토링 내성이 높은 동작 테스트를 만드는 데 도움을 주게 된 것이다.

# 참조

[Testing Behavior vs. Testing Implementation](https://launchscout.com/blog/testing-behavior-vs-testing-implementation)

[좋은 단위 테스트의 4대요소(회귀방지, 리팩터링 내성, 빠른 피드백, 유지보수성)](https://healthcoding.tistory.com/41)