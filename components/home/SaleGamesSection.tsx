import React from 'react';
import Link from 'next/link';
import { Game } from '@/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

interface SaleGamesSectionProps {
  games: Game[];
}

export default function SaleGamesSection({ games }: SaleGamesSectionProps) {
  if (games.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          🔥 지금 할인 중
        </h2>
        <span className="text-xs text-text-secondary">{games.length}개의 할인 상품</span>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide">
        {games.map((game) => (
          <Link
            key={game.appid}
            href={`/game/${game.appid}`}
            className="flex-none w-48 group snap-start"
          >
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-2 border border-border/30 group-hover:border-[var(--accent)]/50 transition-colors">
              <ImageWithFallback
                src={game.headerImage}
                alt={game.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="192px"
              />
              <div className="absolute top-2 left-2">
                <Badge variant="success">
                  -{game.price.discountPercent}%
                </Badge>
              </div>
            </div>
            <div className="px-1">
              <h3 className="text-sm font-semibold text-text-primary truncate mb-1 group-hover:text-[var(--accent)] transition-colors">
                {game.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-secondary line-through">
                  {formatPrice(game.price.initial)}
                </span>
                <span className="text-xs font-bold text-success">
                  {formatPrice(game.price.final)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
