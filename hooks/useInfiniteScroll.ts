'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage: number;
}

interface UseInfiniteScrollReturn<T> {
  visibleItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  loaderRef: React.RefObject<HTMLDivElement | null>;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const prevItemsRef = useRef(items);

  // Reset page when items array changes (filter applied)
  // Compare by reference since filtered arrays are always new
  useEffect(() => {
    if (items !== prevItemsRef.current) {
      setPage(1);
      prevItemsRef.current = items;
    }
  }, [items]);

  const visibleItems = items.slice(0, page * itemsPerPage);
  const hasMore = visibleItems.length < items.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(loader);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    loaderRef,
    reset,
  };
}
