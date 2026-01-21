// SurviveBase - Utility Functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in KRW
 */
export function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return `₩${price.toLocaleString('ko-KR')}`;
}

/**
 * Calculate review score percentage
 */
export function calculateReviewScore(positive: number, negative: number): number {
  const total = positive + negative;
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
}

/**
 * Get review label based on score
 */
export function getReviewLabel(score: number): string {
  if (score >= 95) return '압도적으로 긍정적';
  if (score >= 85) return '매우 긍정적';
  if (score >= 70) return '긍정적';
  if (score >= 40) return '복합적';
  if (score >= 20) return '부정적';
  return '매우 부정적';
}

/**
 * Review variant type for Badge component
 */
export type ReviewVariant = 
  | 'overwhelming' 
  | 'very-positive' 
  | 'positive' 
  | 'mixed' 
  | 'negative' 
  | 'very-negative';

/**
 * Get review variant for Badge component based on score
 */
export function getReviewVariant(score: number): ReviewVariant {
  if (score >= 95) return 'overwhelming';
  if (score >= 80) return 'very-positive';
  if (score >= 70) return 'positive';
  if (score >= 40) return 'mixed';
  if (score >= 20) return 'negative';
  return 'very-negative';
}

/**
 * Format date to Korean locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Delay function for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Get Steam store URL for a game
 */
export function getSteamUrl(appid: number): string {
  return `https://store.steampowered.com/app/${appid}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * 제한된 동시성으로 Promise 배열 처리 (글로벌 레이트 리미터 적용)
 * @param items 처리할 항목 배열
 * @param fn 각 항목에 적용할 async 함수
 * @param concurrency 최대 동시 실행 수
 * @param delayMs 요청 간 최소 간격 (글로벌, 기본 0)
 * @returns 결과 배열 (입력 순서 유지)
 */
export async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  
  // 뮤텍스 기반 레이트 리미터
  let rateLimitQueue: Promise<void> = Promise.resolve();
  
  async function acquireRateLimit(): Promise<void> {
    const previousQueue = rateLimitQueue;
    let resolve: () => void;
    rateLimitQueue = new Promise((r) => { resolve = r; });
    
    await previousQueue;
    
    if (delayMs > 0) {
      await delay(delayMs);
    }
    
    resolve!();
  }

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];

      // 레이트 리미트 획득 (순차적으로 딜레이 적용)
      await acquireRateLimit();

      try {
        results[index] = await fn(item, index);
      } catch (error) {
        // 개별 실패는 결과에 포함하지 않음 (null/undefined로 처리)
        results[index] = null as R;
      }
    }
  }

  // concurrency 수만큼 worker 생성
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker()
  );

  await Promise.all(workers);
  return results;
}

/**
 * 지수 백오프로 재시도
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수 (기본 3)
 * @param initialDelayMs 초기 대기 시간 (기본 1000ms)
 * @returns fn의 반환값
 * @throws 모든 재시도 실패 시 마지막 에러
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 마지막 시도면 재시도하지 않음
      if (attempt === maxRetries) {
        break;
      }

      // 재시도 가능한 에러인지 확인
      const isRetryable =
        lastError.message.includes('Rate limited') ||
        lastError.message.includes('500') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('504') ||
        lastError.message.includes('fetch failed') ||
        lastError.message.includes('network');

      if (!isRetryable) {
        throw lastError;
      }

      // 지수 백오프 대기
      const delayTime = initialDelayMs * Math.pow(2, attempt);
      console.warn(
        `Retry ${attempt + 1}/${maxRetries} after ${delayTime}ms: ${lastError.message}`
      );
      await delay(delayTime);
    }
  }

  throw lastError;
}
