import React from 'react';
import Link from 'next/link';
import { Game } from '@/types';

interface QuickTagCloudProps {
  games: Game[];
}

export default function QuickTagCloud({ games }: QuickTagCloudProps) {
  // Extract and count tags
  const tagCounts: Record<string, number> = {};
  games.forEach((game) => {
    game.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Sort by frequency and get top 10
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxCount = topTags.length > 0 ? topTags[0][1] : 1;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <span className="text-[var(--accent)]">#</span> 인기 태그
      </h2>
      <div className="flex flex-wrap gap-3">
        {topTags.map(([tag, count]) => {
          // Calculate relative importance (0.6 to 1.0 opacity/scale)
          const weight = 0.6 + (count / maxCount) * 0.4;
          
          return (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="px-4 py-2 rounded-full bg-bg-tertiary border border-border/50 hover:border-[var(--accent)] hover:bg-bg-tertiary/80 transition-all text-sm font-medium text-text-secondary hover:text-[var(--accent)]"
              style={{
                opacity: weight,
                transform: `scale(${0.9 + (count / maxCount) * 0.1})`,
              }}
            >
              {tag}
              <span className="ml-2 text-xs opacity-50 font-normal">{count}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
