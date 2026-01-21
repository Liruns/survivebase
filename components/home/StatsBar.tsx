import React from 'react';
import { Game } from '@/types';

interface StatsBarProps {
  games: Game[];
}

export default function StatsBar({ games }: StatsBarProps) {
  const totalGames = games.length;
  const totalReviews = games.reduce(
    (acc, game) => acc + game.reviews.positive + game.reviews.negative,
    0
  );
  const averageRating =
    games.length > 0
      ? Math.round(
          games.reduce((acc, game) => acc + game.reviews.score, 0) / games.length
        )
      : 0;

  return (
    <div className="w-full py-6 mb-8 border-y border-border/50 bg-bg-secondary/30 backdrop-blur-sm">
      <div className="flex flex-wrap justify-around gap-8">
        <div className="flex flex-col items-center">
          <span className="text-sm text-text-secondary mb-1">총 게임 수</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--accent)]">
              {totalGames.toLocaleString()}
            </span>
            <span className="text-lg">🎮</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center border-x border-border/30 px-8 md:px-16">
          <span className="text-sm text-text-secondary mb-1">총 리뷰 수</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {totalReviews.toLocaleString()}
            </span>
            <span className="text-lg">💬</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-sm text-text-secondary mb-1">평균 평점</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-success">
              {averageRating}%
            </span>
            <span className="text-lg">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}
