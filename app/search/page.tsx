'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import GameGrid from '@/components/game/GameGrid';
import type { Game } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function searchGames() {
      if (!query.trim()) {
        setGames([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/games?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results: Game[] = await response.json();
          setGames(results);
        }
      } catch (error) {
        console.error('Failed to search games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    searchGames();
  }, [query]);

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

          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            검색 결과
          </h1>
          <p className="text-text-secondary">
            {query ? (
              <>
                &quot;{query}&quot; 검색 결과 {loading ? '...' : `${games.length}개`}
              </>
            ) : (
              '검색어를 입력해주세요.'
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">검색 중...</p>
          </div>
        ) : games.length > 0 ? (
          <GameGrid games={games} />
        ) : query ? (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-text-primary mb-2">
              검색 결과가 없습니다
            </h2>
            <p className="text-text-secondary mb-6">
              다른 검색어로 시도해보세요.
            </p>
            <Link href="/">
              <button className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                전체 게임 보기
              </button>
            </Link>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
