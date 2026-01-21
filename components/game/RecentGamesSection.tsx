'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRecentGames } from '@/hooks/useRecentGames';
import type { Game } from '@/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { formatPrice, getReviewLabel, cn } from '@/lib/utils';

interface RecentGamesSectionProps {
  allGames: Game[];
}

export default function RecentGamesSection({ allGames }: RecentGamesSectionProps) {
  const { recentGames } = useRecentGames();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (client-side)
  if (!mounted || recentGames.length === 0) {
    return null;
  }

  // Get recent game data (최대 5개)
  const recentGameData = recentGames
    .map((appid) => allGames.find((g) => g.appid === appid))
    .filter((g): g is Game => g !== undefined)
    .slice(0, 5);

  if (recentGameData.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">최근 본 게임</h2>
        <span className="text-sm text-text-secondary">{recentGameData.length}개</span>
      </div>
      
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent">
          {recentGameData.map((game) => (
            <Link
              key={game.appid}
              href={`/game/${game.appid}`}
              className="flex-shrink-0 w-48 group"
            >
              <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:border-accent/30">
                <div className="relative aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={game.headerImage}
                    alt={game.name}
                    fill
                    sizes="192px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                    {game.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        game.reviews.score >= 70 ? 'text-success' : 'text-warning'
                      )}
                    >
                      {getReviewLabel(game.reviews.score)}
                    </span>
                    <span className="text-xs font-bold text-text-secondary">
                      {formatPrice(game.price.final)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
