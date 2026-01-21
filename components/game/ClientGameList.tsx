'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Game, FilterState, SortOption, PriceRange, PlayMode } from '@/types';
import { PRICE_RANGES, GAMES_PER_PAGE } from '@/lib/constants';
import { sortGames } from '@/lib/api/merger';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import GameGrid from './GameGrid';
import GameCardSkeleton from './GameCardSkeleton';
import FilterSidebar from '@/components/filter/FilterSidebar';
import SortDropdown from '@/components/filter/SortDropdown';
import TagCloud from '@/components/TagCloud';
import RecentGamesSection from './RecentGamesSection';

interface ClientGameListProps {
  initialGames: Game[];
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  sort: 'popular',
  tags: [],
  priceRange: null,
  playMode: [],
};

export default function ClientGameList({ initialGames }: ClientGameListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterState>(() => {
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sort') as SortOption) || 'popular';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const priceRange = (searchParams.get('price') as PriceRange) || null;
    const playMode = (searchParams.get('mode')?.split(',').filter(Boolean) as PlayMode[]) || [];

    return { search, sort, tags, priceRange, playMode };
  });

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.sort !== 'popular') params.set('sort', newFilters.sort);
      if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
      if (newFilters.priceRange) params.set('price', newFilters.priceRange);
      if (newFilters.playMode.length > 0) params.set('mode', newFilters.playMode.join(','));

      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
    },
    [router]
  );

  // Filter handlers
  const handleSearchChange = useCallback(
    (search: string) => {
      const newFilters = { ...filters, search };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      const newFilters = { ...filters, sort };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const newFilters = { ...filters, tags };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handlePriceChange = useCallback(
    (priceRange: PriceRange | null) => {
      const newFilters = { ...filters, priceRange };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handlePlayModeChange = useCallback(
    (playMode: PlayMode[]) => {
      const newFilters = { ...filters, playMode };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    router.push('/', { scroll: false });
  }, [router]);

  const handleTagCloudClick = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      handleTagsChange(newTags);
    },
    [filters.tags, handleTagsChange]
  );

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let result = [...initialGames];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((game) => game.name.toLowerCase().includes(searchLower));
    }

    // Tag filter (OR)
    if (filters.tags.length > 0) {
      result = result.filter((game) =>
        filters.tags.some((tag) =>
          game.tags.some((gameTag) => gameTag.toLowerCase() === tag.toLowerCase())
        )
      );
    }

    // Price filter
    if (filters.priceRange) {
      const range = PRICE_RANGES[filters.priceRange];
      result = result.filter((game) => {
        if (filters.priceRange === 'free') {
          return game.price.isFree;
        }
        const price = Math.round(game.price.final / 100); // DB값을 원화로 변환
        return price >= range.min && price <= range.max;
      });
    }

    // Play mode filter (OR)
    if (filters.playMode.length > 0) {
      result = result.filter((game) =>
        filters.playMode.some((mode) => {
          if (mode === 'singleplayer') return game.categories.singleplayer;
          if (mode === 'multiplayer') return game.categories.multiplayer;
          if (mode === 'coop') return game.categories.coop;
          return false;
        })
      );
    }

    // Sort
    result = sortGames(result, filters.sort);

    return result;
  }, [initialGames, filters]);

  // Infinite scroll
  const { visibleItems, hasMore, loaderRef } = useInfiniteScroll({
    items: filteredGames,
    itemsPerPage: GAMES_PER_PAGE,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-64 lg:flex-shrink-0">
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <FilterSidebar
            filters={filters}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onTagsChange={handleTagsChange}
            onPriceChange={handlePriceChange}
            onPlayModeChange={handlePlayModeChange}
            onReset={handleReset}
          />

          {/* Tag Cloud */}
          <div className="hidden lg:block mt-6">
            <TagCloud
              games={initialGames}
              onTagClick={handleTagCloudClick}
              selectedTags={filters.tags}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Recent Games Section */}
        <RecentGamesSection allGames={initialGames} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-text-secondary">
              {filteredGames.length}개의 게임
              {filters.search && ` - "${filters.search}" 검색 결과`}
            </p>
          </div>
          <div className="hidden lg:block">
            <SortDropdown value={filters.sort} onChange={handleSortChange} />
          </div>
        </div>

        {/* Game Grid */}
        {visibleItems.length > 0 ? (
          <>
            <GameGrid games={visibleItems} />

            {/* Loader */}
            {hasMore && (
              <div
                ref={loaderRef}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <GameCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* End message */}
            {!hasMore && filteredGames.length > GAMES_PER_PAGE && (
              <p className="text-center text-text-secondary mt-8 py-4">
                모든 게임을 불러왔습니다
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-text-secondary mb-4">검색 결과가 없습니다</p>
            <button
              onClick={handleReset}
              className="text-accent hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
