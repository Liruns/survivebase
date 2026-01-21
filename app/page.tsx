import { Suspense } from 'react';
import { getGames } from '@/lib/cache';
import Container from '@/components/layout/Container';
import ClientGameList from '@/components/game/ClientGameList';
import GameCardSkeleton from '@/components/game/GameCardSkeleton';
import FeaturedSlider from '@/components/home/FeaturedSlider';
import StatsBar from '@/components/home/StatsBar';
import QuickTagCloud from '@/components/home/QuickTagCloud';
import SaleGamesSection from '@/components/home/SaleGamesSection';

export const revalidate = 3600; // Revalidate every hour

function GameListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const games = await getGames();
  
  // Get top 5 games by review score for featured slider
  const featuredGames = [...games]
    .sort((a, b) => b.reviews.score - a.reviews.score)
    .slice(0, 5);

  // Filter games on sale
  const saleGames = games.filter((g) => g.price.discountPercent > 0);

  return (
    <div className="py-10">
      <Container>
        {/* Featured Games Slider */}
        <FeaturedSlider games={featuredGames} />

        {/* Site Statistics Bar */}
        <StatsBar games={games} />
        
        {/* Hero Section with gradient background */}
        <section className="mb-12 text-center md:text-left relative py-12 -mx-4 px-4 rounded-2xl bg-gradient-to-br from-bg-primary via-bg-secondary/50 to-bg-tertiary/30 border border-border/30 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-success/10 blur-[100px] rounded-full" />
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4 animate-fade-in-up relative z-10">
            탐색하세요,{' '}
            <span className="bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] bg-clip-text text-transparent">
              SurviveBase
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl animate-fade-in-up-delay relative z-10">
            최고의 오픈월드 생존 건설 게임들을 한눈에 확인하세요. 스팀의 수많은 게임들 중에서 당신에게 꼭 맞는 생존 경험을 찾아드립니다.
          </p>
        </section>

        {/* Popular Tags */}
        <QuickTagCloud games={games} />

        {/* Flash Sales */}
        <SaleGamesSection games={saleGames} />

        <Suspense fallback={<GameListSkeleton />}>
          <ClientGameList initialGames={games} />
        </Suspense>
      </Container>
    </div>
  );
}
