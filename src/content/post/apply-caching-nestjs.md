---
title: NestJS에 캐싱 적용하기 (Redis 설치 없이!)
description: 별도의 Redis 설치 및 환경 구성 없이 NestJS 내부 캐싱 기능을 사용하여 성능을 개선해보자
pubDate: 2025-06-11
tags: [개선, NestJS, 캐싱, cache-manager]
---

현재 프로젝트에는 투자 봇의 전체 기간 수익률, 최근 1년간 수익률, 전체 스테이킹 수량을 대시보드에 띄우는 기능이 존재하고 있다.

그런데 수익률 계산 공식 특성상 계산하고자 하는 기간이 넓으면 넓을 수록 계산 과정이 무거워지기 때문에 매 요청마다 계산을 수행하면 서버에 악영향을 끼칠 수 있다는 생각이 들었다.

수익률을 비롯한 봇 정보 조회는 매우 타이트하게 실시간 갱신을 적용할 필요는 없어 보이므로 캐싱을 도입한다면 성능 개선을 크게 이룰 수 있을 것이라고 생각했다.

캐싱을 적용하기 위해 Redis 환경을 구성해야 할까 싶었지만, 겨우 투자 봇 정보 조회를 위해 관리해야 하는 요소를 추가하는 것이 비효율적일 것 같아 고민이 잠시 들었다.

그러던 와중에 외부 캐시 DB 없이 **NestJS 자체에서** 캐싱을 적용할 수 있다는 사실을 알게 되었다.

---

```bash
npm install @nestjs/cache-manager cache-manager
```

NestJS에는 `cache-manager` 라는 패키지를 지원하는데, 이것을 설치하면 NestJS의 관리 아래에서 인메모리 캐시를 사용할 수 있다.

```tsx

// app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register({ isGlobal: true })],
  controllers: [AppController],
})
export class AppModule {}

// cache.service.ts
@Injectable()
export class CacheService {
	// 캐시 의존성 주입
	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
	
	...
}
```

cache-manager 설치 후 app.module.ts에 `CacheModule.register({ isGlobal: true })` 를 import하여 전역적으로 캐시를 사용하게 만들면 다른 모듈의 코드에서 의존성 주입으로 캐시를 사용할 수 있다.

이때 주의할 점이 있는데, app.module.ts에서 전역적으로 import하지 않고 각 모듈마다 import하게 된다면 각 모듈에서 사용하는 캐시는 별개의 캐시가 되어버린다. 데이터가 공유되지 않는다는 것이다.

---

```tsx
async getTotalPNL(tokenType: TokenType): Promise<BotInfoResDto> {
  const cachedPnl = await this.cacheManager.get(`totalPnl:${tokenType}`);
  if (cachedPnl) {
    this.logger.debug(`Cache hit for totalPnL:${tokenType}`);
    return { result: cachedPnl as number };
  }

  const startDate = new Date(0);
  const endDate = new Date();
  const pnl = await this.getPNL(tokenType, startDate, endDate);
  await this.cacheManager.set(
    `totalPnl:${tokenType}`,
    pnl,
    1000 * 60 * 60 * 1,
  ); // 캐시 저장 (1시간)

  return { result: pnl };
}
```

이제 캐시를 사용해보자. 캐시를 생성할 때는 `cacheManager.set()` 을 이용하여 원하는 key 이름으로 값을 저장할 수 있다.

그리고 **TTL(Time-To-Live)** 도 설정 가능하여 정해진 시간만큼만 캐시가 유효하고 이후에는 삭제되도록 만들 수도 있다.

그리고 캐시를 읽을 때는 `cacheManager.get()` 을 이용하여 원하는 key 이름으로 저장된 값을 불러올 수 있다. 저장된 값이 없다면 null이 반환된다.

이를 통해 위 코드처럼 전체 기간의 수익률을 조회하는 매 요청마다 캐시된 값이 있는지 확인하고, 있다면 그 값을 즉시 반환하고 없다면 수익률 계산을 수행하도록 하여 성능 효율을 높일 수 있다.

---

```tsx
// 캐시 전체 초기화
await this.cacheManager.clear();

// 캐시에서 특정 key 값 초기화
await this.cacheManager.del(`totalPnl:${tokenType}`);
```

만약 투자 봇의 Balance가 바뀌거나 어떤 유저가 스테이킹을 수행하면 수익률에 변화가 생길텐데, 이때 캐시된 수익률이 존재한다면 TTL동안은 이전 수익률이 계속 조회되어 실시간 수익률을 반영하는데 지연이 생길 것이다.

이를 막기 위해 수익률에 큰 변화가 생기는 부분에 **캐시를 초기화**하는 코드를 넣어 이전 수익률이 조회되지 않도록 만들 수 있다.

굳이 캐시된 값을 직접 바꿀 필요도 없다!

캐시된 값만 지운다면 그 다음 조회 요청에서 새 수익률을 계산해 캐시된 값에 넣어줄 것이다.

# 참조

[Documentation | NestJS - A progressive Node.js framework](https://docs.nestjs.com/techniques/caching)