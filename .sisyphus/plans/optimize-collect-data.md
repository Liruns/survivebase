# Plan: collect-data 스크립트 성능 최적화 (v2)

## 개요

`npm run collect-data` 스크립트의 Steam Store API 호출을 **병렬 처리**로 최적화하여 데이터 수집 시간을 단축한다.

## 현재 상태 분석

### 병목 지점
- **위치**: `lib/api/steamstore.ts:163-195` - `fetchSteamStoreGames()` 함수
- **문제**: 500개 게임을 순차적으로 1초 간격 요청 → 500초 (8.3분)
- **원인**: 병렬 처리 없음, 모든 요청이 직렬로 실행

### API 제약 (검증됨)
- Steam Store `/appdetails` API: **단일 appid만 지원**
- `?appids=1,2,3` 형태는 `400 Bad Request` 반환 (배치 불가)
- Rate Limit: 비공식적으로 ~200 req/5min, 동시 요청에 관대함
- 참고: GitHub 다수 프로젝트에서 동시 3-5개 요청 사용 중

## 목표

| 지표 | 현재 | 목표 | 
|------|------|------|
| 500개 게임 처리 시간 | ~500초 (8.3분) | ~100초 (1.7분) |
| 서버 부하 | 낮음 | 낮음 유지 |
| 안정성 | 단순 | 재시도/백오프 추가 |

## 구현 계획

### Task 1: 상수 추가
**파일**: `lib/constants.ts` (line 12 `STEAM_STORE_RATE_LIMIT` 아래에 추가)

```typescript
// Steam Store 병렬 처리 설정 (STEAM_STORE_RATE_LIMIT 대체)
export const STEAM_STORE_CONCURRENCY = 5;      // 동시 요청 수
export const STEAM_STORE_REQUEST_DELAY = 200;  // 요청 시작 간 딜레이 (ms)
```

**참고**: 기존 `STEAM_STORE_RATE_LIMIT = 1000`은 순차 모드용으로 유지 (폴백 시 사용)

**설계 근거**:
- 5개 동시 요청: GitHub 오픈소스 프로젝트들의 일반적 설정
- 200ms 딜레이: 초당 5개 = 분당 300개, Rate limit(200/5min=40/min)의 7.5배지만 동시 요청이므로 실제로는 안전

### Task 2: 병렬 처리 유틸리티 함수
**파일**: `lib/utils.ts`

제한된 동시성으로 배열 처리하는 함수:

```typescript
/**
 * 제한된 동시성으로 Promise 배열 처리
 * @param items 처리할 항목 배열
 * @param fn 각 항목에 적용할 async 함수
 * @param concurrency 최대 동시 실행 수
 * @param delayMs 각 요청 시작 전 딜레이
 */
export async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  delayMs: number = 0
): Promise<R[]>
```

**구현 방식**: 
- 세마포어 패턴으로 동시 실행 수 제한
- 각 작업 시작 전 delayMs 대기 (rate limit 보호)
- 개별 실패는 null 반환, 전체 중단 없음

### Task 3: 지수 백오프 재시도 로직
**파일**: `lib/utils.ts`

```typescript
/**
 * 지수 백오프로 재시도
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수 (기본 3)
 * @param initialDelayMs 초기 대기 시간 (기본 1000ms)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T>
```

**재시도 대상**:
- HTTP 429 (Rate Limited)
- HTTP 5xx (서버 오류)
- 네트워크 오류 (fetch failed)

**백오프 계산**: `initialDelayMs * 2^attempt` (1초 → 2초 → 4초)

### Task 4: fetchSteamStoreGame 수정
**파일**: `lib/api/steamstore.ts:87-157`

기존 함수에 재시도 로직 래핑. **중요: 429 체크를 `!response.ok` 체크보다 먼저 수행해야 함** (429도 ok가 아니므로 순서가 중요):

```typescript
export async function fetchSteamStoreGame(appid: number): Promise<SteamStoreGame | null> {
  return withRetry(async () => {
    const url = `${STEAM_STORE_API_URL}/appdetails?appids=${appid}&cc=kr&l=korean`;
    
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    
    // 429 Rate Limit - 반드시 !response.ok 체크 전에 확인
    // (429는 ok가 false이므로 순서가 중요)
    if (response.status === 429) {
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      throw new Error(`Steam Store API error: ${response.status}`);
    }
    
    // 기존 파싱 로직 (변경 없음)
    const data = await response.json();
    // ...
  });
}
```

### Task 5: fetchSteamStoreGames 리팩토링
**파일**: `lib/api/steamstore.ts:163-195`

순차 처리를 병렬 처리로 교체:

```typescript
export async function fetchSteamStoreGames(
  appids: number[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, SteamStoreGame>> {
  const gamesMap = new Map<number, SteamStoreGame>();
  let completed = 0;
  const total = appids.length;

  const results = await pMap(
    appids,
    async (appid) => {
      const game = await fetchSteamStoreGame(appid);
      completed++;
      onProgress?.(completed, total);
      return { appid, game };
    },
    STEAM_STORE_CONCURRENCY,
    STEAM_STORE_REQUEST_DELAY
  );

  for (const { appid, game } of results) {
    if (game) {
      gamesMap.set(appid, game);
    }
  }

  return gamesMap;
}
```

### Task 6: 테스트 및 검증

**테스트 방법**: `scripts/collect-data.ts`에 임시로 `--test` 플래그 지원 추가

```typescript
// scripts/collect-data.ts 상단에 추가
const isTestMode = process.argv.includes('--test');
const TEST_LIMIT = 20;

// fetchSteamStoreGames 호출 전에 추가
const targetAppids = isTestMode ? appids.slice(0, TEST_LIMIT) : appids;
const steamStoreGames = await fetchSteamStoreGames(targetAppids, ...);
```

1. **소규모 테스트** (20개 게임)
   ```bash
   npm run collect-data -- --test
   ```
   - 검증 항목:
     - 동작 확인 (에러 없이 완료)
     - 소요 시간 ~4-5초 예상 (20개 ÷ 5동시)
     - 진행률 출력 정상 작동

2. **전체 테스트** (전체 게임)
   ```bash
   npm run collect-data
   ```
   - 검증 항목:
     - 전체 소요 시간 2분 이내
     - Rate limit (429) 재시도 후 모두 성공
     - 기존과 동일한 결과 데이터

## 예상 성능

```
현재: 500게임 × 1초 순차 = 500초 (8.3분)

개선 후:
- 500게임 ÷ 5동시 = 100 라운드
- 각 라운드 ~1초 (응답시간 + 딜레이)
- 총 ~100초 (1.7분)

예상 개선: 8.3분 → 1.7분 (약 5배 향상)
```

## 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| Rate limit (429) | 중간 | 중간 | 지수 백오프 재시도 (최대 3회) |
| 개별 요청 실패 | 낮음 | 낮음 | null 반환, 로깅, 계속 진행 |
| 네트워크 지연 | 중간 | 낮음 | 재시도로 자동 복구 |

### 폴백 전략
Rate limit이 지속 발생 시:
1. `STEAM_STORE_CONCURRENCY`를 3으로 줄임
2. `STEAM_STORE_REQUEST_DELAY`를 500ms로 늘림
3. 최악의 경우 기존 순차 방식으로 복귀 (상수만 변경)

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `lib/constants.ts` | 2개 상수 추가 (CONCURRENCY, REQUEST_DELAY) |
| `lib/utils.ts` | 2개 함수 추가 (pMap, withRetry) |
| `lib/api/steamstore.ts` | fetchSteamStoreGame에 재시도 추가, fetchSteamStoreGames 병렬화 |
| `scripts/collect-data.ts` | `--test` 플래그 지원 추가 (테스트용) |

### Import 변경 사항

**`lib/api/steamstore.ts`** (line 3-4):
```typescript
// Before
import { STEAM_STORE_API_URL, STEAM_STORE_RATE_LIMIT } from '@/lib/constants';
import { delay } from '@/lib/utils';

// After
import { STEAM_STORE_API_URL, STEAM_STORE_CONCURRENCY, STEAM_STORE_REQUEST_DELAY } from '@/lib/constants';
import { delay, pMap, withRetry } from '@/lib/utils';
```

## 비변경 사항

- `scripts/collect-data.ts` - 호출 인터페이스 동일 유지
- `lib/api/steamspy.ts` - 이미 충분히 빠름 (9개 태그 = 9초)
- API 응답 타입 - 기존 타입 그대로 사용
- `lib/api/merger.ts` - 변경 없음

## 검증 체크리스트

- [ ] pMap 함수가 동시성을 올바르게 제한하는가
- [ ] withRetry 함수가 429 응답에 대해 재시도하는가
- [ ] 진행률 콜백이 정확하게 호출되는가
- [ ] 전체 실행 시간이 2분 이내인가
- [ ] Rate limit 에러 없이 완료되는가
