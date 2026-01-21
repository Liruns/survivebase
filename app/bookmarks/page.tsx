'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import GameGrid from '@/components/game/GameGrid';
import Button from '@/components/ui/Button';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { Game } from '@/types';

export default function BookmarksPage() {
  const { bookmarks, clear, count } = useBookmarks();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const prevBookmarksRef = useRef<string>('');

  // Only fetch when bookmark IDs actually change (addition/removal, not order)
  const bookmarkIds = useMemo(() => [...bookmarks].sort().join(','), [bookmarks]);

  useEffect(() => {
    // Skip if bookmarks haven't changed (same set of IDs)
    if (prevBookmarksRef.current === bookmarkIds) {
      return;
    }
    prevBookmarksRef.current = bookmarkIds;

    async function loadGames() {
      if (bookmarks.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch only bookmarked games (optimized)
        const response = await fetch(`/api/games?ids=${bookmarks.join(',')}`);
        if (response.ok) {
          const bookmarkedGames: Game[] = await response.json();
          setGames(bookmarkedGames);
        }
      } catch (error) {
        console.error('Failed to load bookmarked games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [bookmarkIds, bookmarks]);

  // Sort games by bookmark order (client-side, no re-fetch needed)
  const sortedGames = useMemo(() => {
    return [...games].sort(
      (a, b) => bookmarks.indexOf(a.appid) - bookmarks.indexOf(b.appid)
    );
  }, [games, bookmarks]);

  return (
    <div className="py-10">
      <Container>
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-text-secondary hover:text-accent transition-colors mb-6 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 transition-transform group-hover:-translate-x-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            목록으로 돌아가기
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                관심 목록
              </h1>
              <p className="text-text-secondary">
                {count > 0 ? `${count}개의 게임이 저장되어 있습니다.` : '저장된 게임이 없습니다.'}
              </p>
            </div>

            {count > 0 && (
              <Button variant="ghost" onClick={clear}>
                전체 삭제
              </Button>
            )}
          </div>
        </div>

      {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">불러오는 중...</p>
          </div>
        ) : sortedGames.length > 0 ? (
          <GameGrid games={sortedGames} />
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 text-text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-text-primary mb-2">
              관심 목록이 비어 있습니다
            </h2>
            <p className="text-text-secondary mb-6">
              게임 카드의 하트 아이콘을 눌러 관심 목록에 추가하세요.
            </p>
            <Link href="/">
              <Button variant="primary">게임 둘러보기</Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
