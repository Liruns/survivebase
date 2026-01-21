'use client';

import { Game } from '@/types';
import GameCard from './GameCard';

interface GameGridProps {
  games: Game[];
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {games.map((game) => (
        <div key={game.appid} className="animate-fade-in-up">
          <GameCard game={game} />
        </div>
      ))}
    </div>
  );
}
