---
title: Facade 패턴을 적용해보자
description: Service 코드의 과중한 책임을 분산시키기 위해 Facade 패턴을 적용해보자
pubDate: 2025-05-26
tags: [개발, 개선, Facade 패턴]
---

# 목차

# 너무 무거운 Service 코드

아래는 현재 프로젝트에서 Sign Up을 수행하는 Service 코드이다.

```java
public class AccountService {
    private final AccountRepository accountRepository;
    private final HoroPointRepository pointRepository;
    private final ReferralHistoryRepository referralRepository;

    public AccountResponse signUp(CreateAccountRequest createAccountRequest) {
        boolean isWalletDuplicated = accountRepository.existsByWalletAddress(createAccountRequest.getWalletAddress());
        if (isWalletDuplicated) {
            throw new CustomException(ErrorCode.WALLET_DUPLICATED);
        }

        Account account = Account.builder()
                .nickname(createAccountRequest.getNickname())
                .birthday(createAccountRequest.getBirthday())
                .gender(createAccountRequest.getGender())
                .walletAddress(createAccountRequest.getWalletAddress())
                .build();

        Account savedAccount = accountRepository.save(account);

        if (createAccountRequest.getReferrerId() != null) {
            Account referrer = accountRepository.findById(createAccountRequest.getReferrerId())
                    .orElseThrow(() -> new CustomException(ErrorCode.REFERRER_NOT_FOUND));

            // Referral 데이터 생성
            ReferralHistory referralHistory = ReferralHistory.builder()
                    .referrer(referrer)
                    .referred(savedAccount)
                    .build();
            referralRepository.save(referralHistory);

            // 추천한 Account 포인트 적립
            HoroPoint referrerPoint = HoroPoint.builder()
                    .account(referrer)
                    .isIncrease(true)
                    .point(500) // 초대하면 500 포인트
                    .description("inviting friend")
                    .build();
            pointRepository.save(referrerPoint);

            // 추천받은 Account 포인트 적립
            HoroPoint referredPoint = HoroPoint.builder()
                    .account(savedAccount)
                    .isIncrease(true)
                    .point(100) // 초대받으면 100 포인트
                    .description("invited by friend")
                    .build();
            pointRepository.save(referredPoint);
        }
        return new AccountResponse(savedAccount);
    }
```

현재 프로젝트의 코드는 Service 코드에 모든 로직이 집중되어 있다. 따라서 코드가 길어질 뿐더러 여러 도메인의 Repository 의존성을 Service 코드가 갖게되어 관리가 어려워졌다.

그리고 코드의 중복을 막기 위해 Service 코드에서 다른 Service 코드에 의존하게 되는 현상도 벌어져 혼란을 가중시키는 중이었다.

# Facade 패턴 적용

이러한 문제를 개선하기 위해 조사하던 도중 **Facade 패턴**을 Service 계층에 적용하면 어떨까 하는 생각이 들었다.

Controller → Service → Repository 레이어드 구조에서 Service에 들어있는 과도한 책임을 분산시키기 위해 Contoller와 Service 사이에 Facade를 위치시키는 것이다.

```java
// AccountFacade.java
public class AccountFacade {
    private final AccountService accountService;
    private final HoroPointService horoPointService;
    
		public AccountResponse signUp(CreateAccountRequest createAccountRequest) {
		    accountService.checkIsWalletDuplicated(createAccountRequest.getWalletAddress());
		    Account newAccount = accountService.createAccount(createAccountRequest);
		
		    if (createAccountRequest.getReferrerId() != null) {
		        Account referrer = accountService.getValidReferrer(createAccountRequest.getReferrerId());
		        accountService.createReferralHistory(referrer, newAccount);
		        horoPointService.grantReferralPoints(referrer, newAccount);
		    }
		
		    return new AccountResponse(newAccount);
		}
}

// AccountService.java
public class AccountService {
    private final AccountRepository accountRepository;
    private final ReferralHistoryRepository referralRepository;
    
		public Account getAccountByWalletAddress(String walletAddress) {
		    return accountRepository.findByWalletAddress(walletAddress).orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_NOT_FOUND));
		}
		
		public Account getValidReferrer(String referrerId) {
		    return accountRepository.findById(referrerId)
		            .orElseThrow(() -> new CustomException(ErrorCode.REFERRER_NOT_FOUND));
		}
		
		public void checkIsWalletDuplicated(String walletAddress) {
		    if (accountRepository.existsByWalletAddress(walletAddress)) {
		        throw new CustomException(ErrorCode.WALLET_DUPLICATED);
		    }
		}
		
		public Account createAccount(CreateAccountRequest createAccountRequest) {
		    Account account = Account.builder()
		            .nickname(createAccountRequest.getNickname())
		            .birthday(createAccountRequest.getBirthday())
		            .gender(createAccountRequest.getGender())
		            .walletAddress(createAccountRequest.getWalletAddress())
		            .build();
		
		    return accountRepository.save(account);
		}
		
		public void createReferralHistory(Account referrer, Account referred) {
		    ReferralHistory referralHistory = ReferralHistory.builder()
		            .referrer(referrer)
		            .referred(referred)
		            .build();
		    referralRepository.save(referralHistory);
		}
}
```

위처럼 AccountFacade를 추가하여 AccountController는 AccountFacade만을 의존하고, AccountFacade는 로직을 위해 여러 Service들에 의존하게 되는 구조로 변경하였다.

이를 통해 AccountService에 편중된 책임을 AccountFacade에 분산시키고, AccountService가 account와 상관없는 Repository까지 의존하게 되는 현상을 방지할 수 있었다.

다만 이 리팩토링으로 인해 단위 테스트를 전부 갈아엎어야 한다는 점은 뼈아픈 요소였다.

# Facade 패턴 적용 후기

시간을 들여 Facade 패턴 적용과 그에 따른 단위 테스트 코드 변경까지 모두 마무리했다.

처음 계획할 때는 몰랐지만 기존 Service 코드를 전부 건드리는 막대한 작업이었다 보니 단위 테스트 코드를 변경하는데 꽤 많은 시간을 소모하게 되었다.

하지만 다음과 같은 이유들로 그만한 노력의 가치가 충분히 있다고 느꼈다.

1. 명확해진 계층 구조
    
    기존 코드에서 Service 코드는 API의 ‘필요한 Repository의 호출 + Repository 호출로 받은 데이터를 가공하는 로직 수행’ 역할을 모두 가지고 있었다.
    
    이번에 Controller와 Service 사이에 Facade 계층을 추가함으로써 받아온 **데이터를 모아 가공**하는 건 **Facade**가, **각 도메인에 맞게 Repository를 호출**하는 건 **Service**가 수행하도록 만들어 역할을 명확하게 나눌 수 있게 되었다.
    
2. dto 의존성 하락
    
    request dto를 Facade까지만 받고 Service로 넘겨줄 때는 비구조화 하여 파라미터 형태로 넣어주도록 해 전체 로직이 dto에 지나치게 의존하지 않도록 만들 수 있었다.
    
3. 메서드 간략화
    
    이전에는 Service 메서드 하나당 로직이 집중되어 길이가 매우 길어졌는데, Facade 추가를 통해 역할별 메서드를 만들어 간소화시킬 수 있었다.
    
    더불어 단위 테스트도 이전보다 더욱 작은 단위로 테스트할 수 있게 변화되어 단위 테스트라는 이름에 어울리게 될 수 있었다.
    

Facade 패턴을 적용하면서 비용이 꽤 들긴 했지만 그 이상으로 얻을 수 있는 것이 많았다.

프로젝트 전체가 CRUD만으로 이루어진 극단적으로 단순한 프로젝트가 아닌 이상 처음부터 Facade 패턴을 기반으로 구현을 시작하는 것도 충분히 효율적일 것이라고 생각한다.