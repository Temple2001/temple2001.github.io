---
title: '단일 테이블 상속 전략으로 DB 구조 최적화하기'
description: '여러 테이블간의 중복된 field를 효과적으로 다루어보자'
pubDate: '2025-03-19'
tags: [개발, 개선, 단일 테이블 상속 전략, '@TableInheritance']
---

# 목차

# 개요

인턴 활동 중에 블록체인 지갑 애플리케이션의 백엔드 서버를 개발하는 과정에서 블록체인 네트워크의 거래 내역을 뜻하는 "트랜잭션 기록" 데이터를 DB에 저장하도록 설계해야 했다.

블록체인 지갑에서 다루는 트랜잭션 기록은 그 성격에 따라 '입금', '출금', 'Swap', 'Wrap', 'Unwrap' 등 여러 타입을 가지고 있는데, 문제는 각 타입별로 필요한 field가 약간씩 다르다는 것이었다.

그래서 처음 설계할 때는 각 타입별로 테이블을 분리하였으나, 이 테이블들은 트랜잭션 기록이라는 큰 틀에 모두 묶여있기 때문에 공통 field들이 많이 존재하게 되어 비효율성이 발생하였다.

그리고 요구사항 중 하나였던 "트랜잭션 기록 통합 검색" 기능을 구현하는 데에도 큰 어려움이 생겼다.
여러 타입의 트랜잭션 기록을 특정 조건에 따라 한번에 검색하려면 각 테이블에서 가져온 기록 데이터를 합친 후 반환해야 하는데, UNION 연산과 페이지네이션이 동시에 적용되어야 하므로 구현도 어려울 뿐더러 성능에도 악영향을 끼치게 된다.

따라서 현재 트랜잭션 기록 테이블 구조 상으로는 요구사항을 만족시키기 힘들 것이라고 판단했고, 다른 방법을 찾기 시작했다.

그렇게 해서 찾은 방법이 바로 **단일 테이블 상속 전략**이었다.

# 단일 테이블 상속 전략이란?

먼저 “단일 테이블 전략”에 대한 설명이 필요하다.

보통 테이블 간에 슈퍼타입, 서브타입 관계가 형성될 때 DB 테이블을 구성하는 방법에는 크게 세가지가 있다.

- 각각을 모두 테이블로 만들고 조회할 때 join을 사용 (가장 많이 쓰는 방법)
- 하나의 테이블로 만들어 사용, 일부의 필드만 사용하여 각각의 테이블을 표현한다
- 각각을 모두 테이블로 만들고 각 테이블에 외래키 없이 모든 필드를 작성

여기서 두번째 방법인 하나의 테이블로 만들어 사용하는 방법을 “단일 테이블 전략”이라고 한다.

하나의 테이블을 사용한다면 통합 검색 기능을 구현할 때 데이터를 따로 검색하고 합칠 필요 없이 그냥 테이블 내부에서 조건에 따른 쿼리를 실행하여 결과를 받으면 된다.

따라서 현재 상황에서 가장 효율적인 방법이라고 생각했다.

# @TableInheritance

NestJS에서는 단일 테이블 전략을 `@TableInheritance` 를 통해 구현할 수 있다.

```typescript
export enum PlayerType {
  FOOTBALL = 'FOOTBALL',
  CRICKET = 'CRICKET',
}

@Entity({ name: 'Player' })
@TableInheritance({ column: { type: 'enum', enum: PlayerType, name: 'type' } })
export class Player {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ enum: PlayerType, type: 'enum' })
  type: PlayerType

  public play() {
    console.log(`Player [${this.name}]: Play!!`)
  }
}

@ChildEntity(PlayerType.FOOTBALL)
export class Footballer extends Player {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  club: string

  // 오버라이딩
  public play() {
    console.log(`Footballer [${this.name}]: Play!!`)
  }
}

@ChildEntity(PlayerType.CRICKET)
export class Cricketer extends Player {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  batting: string

  // 오버라이딩
  public play() {
    console.log(`Cricketer [${this.name}]: Play!!`)
  }
}
```

위 코드와 같이 구성하면 DB에는 Player라는 테이블 하나만 생성되고, Footballer와 Cricketer같은 자식 엔티티의 필드들을 전부 가지게 된다.

그리고 `Repository<Player>` 로 DB 조회를 하게 되면 각 데이터가 타입에 맞게 자동으로 매핑되어 나오게 된다.

심지어 `play` 메서드 같이 오버라이딩 된 메서드가 있다면 일반적인 객체지향 코드처럼 다형성이 정상적으로 적용된다.

# 이를 적용해보면?

이제 단일 상속 테이블 전략을 현재 상황에 적용해보자.

아래는 적용 이전의 기존 코드이다.

```typescript
@Entity()
export class TokenWrapHistory extends BaseEntity {
  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'userWalletId' })
  @ApiHideProperty()
  userWallet: Wallet;

  @Column({ nullable: true })
  userWalletId?: string;

  @Column()
  txHash: string;

  @Column()
  targetAddress: string;

  @Column()
  inputTokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  inputTokenAmount: string;

  @Column()
  outputTokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  outputTokenAmount: string;

  @Column('decimal', { precision: 78, scale: 18 })
  txFee: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.NONE,
  })
  status: TransactionStatus;
}

@Entity()
export class TokenDepositHistory extends BaseEntity {
  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'userWalletId' })
  @ApiHideProperty()
  userWallet: Wallet;

  @Column({ nullable: true })
  userWalletId?: string;

  @Column()
  txHash: string;

  @Column()
  targetAddress: string;

  @Column()
  tokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  tokenAmount: string;

  @Column('decimal', { precision: 78, scale: 18 })
  txFee: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.NONE,
  })
  status: TransactionStatus;
}
```

---

아래는 단일 상속 테이블 전략을 적용한 이후의 코드이다.

```typescript
@Entity()
@TableInheritance({
  column: { type: 'enum', enum: TransactionHistoryType, name: 'type' },
})
export class TransactionHistory extends BaseEntity {
  @Column({ type: 'enum', enum: TransactionHistoryType })
  type: TransactionHistoryType;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'userWalletId' })
  @ApiHideProperty()
  userWallet: Wallet;

  @Column({ nullable: true })
  userWalletId?: string;

  @Column()
  txHash: string;

  @Column()
  targetAddress: string;

  @Column('decimal', { precision: 78, scale: 18 })
  txFee: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TokenType })
  tokenType: TokenType;

  getTokenAmount(): string {
    return '0';
  }
}

// TokenDepositHistory : 토큰 입금 기록
@ChildEntity(TransactionHistoryType.DEPOSIT)
export class TokenDepositHistory extends TransactionHistory {
  @Column()
  tokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  tokenAmount: string;

  getTokenAmount(): string {
    return this.tokenAmount;
  }
}

// TokenWrapHistory : 토큰 Wrap 기록
@ChildEntity(TransactionHistoryType.WRAP)
export class TokenWrapHistory extends TransactionHistory {
  @Column()
  inputTokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  inputTokenAmount: string;

  @Column()
  outputTokenSymbol: string;

  @Column('decimal', { precision: 78, scale: 18 })
  outputTokenAmount: string;

  getTokenAmount(): string {
    return this.inputTokenAmount;
  }
}
```

DB에는 TransactionHistory 라는 테이블 하나만 존재하게 되고, 여러 타입의 트랜잭션 기록들을 한번에 조회해야 하는 상황에서도 별다른 설정 없이 조회할 수 있게 된다.

그리고 트랜잭션 기록을 각 타입별로 조회해야 하는 상황에서도 각 타입에 대한 정보가 @ChildEntity에 할당하는 타입 정보로 DB에 저장되므로 그에 대한 조건 하나만 달아주면 문제없이 조회할 수 있다.

이 전략의 단점을 생각해본다면 한 테이블에 모든 필드가 들어가게 되어 상당히 비대해지고 많은 필드가 nullable이 될 수 있다는 것인데, 그런 단점들에도 불구하고 현재 요구사항을 만족하는 방법은 이 단일 테이블 전략 말고는 없다는 생각이 든다.

그리고 타입이 달라도 결국은 "트랜잭션 기록"이기 때문에, 필드 종류에만 차이가 있을 뿐 거의 같은 기능을 하므로 TransactionHistory 테이블 하나로 묶는게 오히려 이상적인 구조라는 생각도 든다.

그리고 `getTokenAmount` 메서드처럼 오버라이딩을 통한 다형성을 이용해 통합 검색 기능에서 각 타입별로 다르게 계산되는 필드가 있을 때 유연하게 대처할 수도 있다.

이로써 단일 상속 테이블 전략을 통해 타입별로 다른 필드를 가지는 테이블들을 통합하여 구조를 단순화시키고 요구사항을 만족시킬 수 있었다.

# 참조

https://velog.io/@loakick/Nest.js-TypeORM-%EB%A6%AC%ED%8C%A9%ED%84%B0%EB%A7%81-SingleTableInheritance