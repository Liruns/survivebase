import { getGameById, getGames } from '@/lib/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import SimilarGames from '@/components/game/SimilarGames';
import { RecentGameTracker, GameDetailBookmark, ScreenshotGallery, ShareButtons } from '@/components/game/GameDetailClient';
import { formatPrice, getReviewLabel, getReviewVariant, getSteamUrl } from '@/lib/utils';

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate static params for SSG
export async function generateStaticParams() {
  const games = await getGames();
  return games.map((game) => ({
    id: game.appid.toString(),
  }));
}

// Generate dynamic metadata for each game
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const gameId = parseInt(resolvedParams.id);
  const game = await getGameById(gameId);

  if (!game) {
    return {
      title: '게임을 찾을 수 없습니다',
    };
  }

  const description = game.description?.slice(0, 160) || `${game.name} - SurviveBase에서 확인하세요`;
  const ogImageUrl = `/api/og?title=${encodeURIComponent(game.name)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(game.headerImage)}&price=${encodeURIComponent(formatPrice(game.price.final))}&score=${game.reviews.score}`;

  return {
    title: game.name,
    description,
    openGraph: {
      title: game.name,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: game.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: game.name,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const resolvedParams = await params;
  const gameId = parseInt(resolvedParams.id);
  
  const [game, allGames] = await Promise.all([
    getGameById(gameId),
    getGames(),
  ]);

  if (!game) {
    notFound();
  }

  const hasDiscount = game.price.discountPercent > 0;

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: game.description,
    image: game.headerImage,
    url: `https://survivebase.vercel.app/game/${game.appid}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: game.reviews.score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1000, // Estimated count
    },
    offers: {
      '@type': 'Offer',
      price: game.price.final / 100,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: getSteamUrl(game.appid),
    },
    datePublished: game.releaseDate,
    genre: game.tags.slice(0, 5),
    gamePlatform: 'PC',
    applicationCategory: 'Game',
  };

  return (
    <div className="pb-20">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Track recent game view */}
      <RecentGameTracker appid={game.appid} />
      
      {/* Hero Header with Glassmorphism */}
      <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
        {/* Background Image with blur */}
        <ImageWithFallback
          src={game.headerImage}
          alt={game.name}
          fill
          priority
          className="object-cover scale-105 blur-sm"
        />
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-sm" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Container>
            <div className="max-w-4xl">
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
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tight mb-6">
                {game.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-8">
                {game.tags.slice(0, 8).map((tag) => (
                  <Badge key={tag} variant="outline" className="px-3 py-1 text-xs bg-bg-secondary/50 backdrop-blur-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Container>
        </div>
      </div>

      <Container className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 border-l-4 border-accent pl-4">게임 정보</h2>
              <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-wrap">
                {game.description}
              </p>
            </section>

            {game.screenshots.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 border-l-4 border-accent pl-4">스크린샷</h2>
                <ScreenshotGallery screenshots={game.screenshots} gameName={game.name} />
              </section>
            )}
          </div>

          {/* Sidebar with Glassmorphism */}
          <div className="space-y-6">
            <div className="bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 shadow-xl">
              <div className="space-y-6">
                {/* Price Section */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs text-text-secondary font-medium">현재 가격</h3>
                    <div className="flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-xl font-bold text-accent">
                            {formatPrice(game.price.final)}
                          </span>
                          <Badge variant="success" className="text-xs">
                            -{game.price.discountPercent}%
                          </Badge>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-text-primary">
                          {formatPrice(game.price.final)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Section */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs text-text-secondary font-medium">사용자 평가</h3>
                    <div className="flex items-center gap-2">
                      <Badge reviewVariant={getReviewVariant(game.reviews.score)} className="text-xs">
                        {getReviewLabel(game.reviews.score)}
                      </Badge>
                      <span className="text-sm text-text-secondary">
                        {game.reviews.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Release Date */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs text-text-secondary font-medium">출시일</h3>
                    <span className="text-sm font-medium text-text-primary">{game.releaseDate}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 space-y-3">
                  <a
                    href={getSteamUrl(game.appid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full py-6 text-lg" variant="primary">
                      Steam에서 보기
                    </Button>
                  </a>
                  <GameDetailBookmark appid={game.appid} />
                </div>

                {/* Share Buttons */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-xs text-text-secondary font-medium mb-3">공유하기</h3>
                  <ShareButtons 
                    title={game.name} 
                    url={`https://survivebase.vercel.app/game/${game.appid}`} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Games Section */}
        <SimilarGames currentGame={game} allGames={allGames} />
      </Container>
    </div>
  );
}
