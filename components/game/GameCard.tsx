import Link from 'next/link';
import { Game } from '@/types';
import { formatPrice, getReviewLabel, getReviewVariant, translateTag } from '@/lib/utils';
import ImageWithFallback from '../ui/ImageWithFallback';
import Badge from '../ui/Badge';
import BookmarkButton from './BookmarkButton';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const hasDiscount = game.price.discountPercent > 0;
  const reviewVariant = getReviewVariant(game.reviews.score);

  return (
    <Link href={`/game/${game.appid}`} className="group block">
      <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_0_20px_var(--glow-color)] group-hover:border-accent/50 flex flex-col h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback
            src={game.headerImage}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
          <BookmarkButton
            appid={game.appid}
            size="sm"
            className="absolute top-2 left-2 shadow-lg shadow-bg-primary/40"
          />
          {hasDiscount && (
            <div className="absolute bottom-2 right-2 z-10">
              <Badge variant="success" className="text-xs px-2 py-1">
                -{game.price.discountPercent}%
              </Badge>
            </div>
          )}
          
          {/* Hidden Tag Overlay - slides up on hover */}
          {game.tags && game.tags.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/80 to-transparent p-3 pt-8 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <div className="flex flex-wrap gap-1">
                {game.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[9px] bg-bg-secondary/50">
                    {translateTag(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow gap-3">
          <h3 className="font-bold text-text-primary line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-accent transition-colors">
            {game.name}
          </h3>

          <div className="mt-auto flex flex-col gap-2">
            {/* Review with colored badge */}
            <div className="flex items-center gap-2">
              <Badge reviewVariant={reviewVariant} className="text-[10px]">
                {getReviewLabel(game.reviews.score)}
              </Badge>
              <span className="text-[10px] text-text-secondary">
                ({game.reviews.score}%)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-xs text-text-secondary line-through">
                    {formatPrice(game.price.initial)}
                  </span>
                  <span className="text-sm font-bold text-accent">
                    {formatPrice(game.price.final)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-text-primary">
                  {formatPrice(game.price.final)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
