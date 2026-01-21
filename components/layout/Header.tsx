import Link from 'next/link';
import { getGames } from '@/lib/cache';
import Container from './Container';
import ThemeToggle from '@/components/ui/ThemeToggle';
import HeaderSearch, { type SearchGame } from './HeaderSearch';

export default async function Header() {
  const games = await getGames();
  
  // Extract only necessary fields for search (reduces client payload significantly)
  const searchGames: SearchGame[] = games.map((g) => ({
    appid: g.appid,
    name: g.name,
    headerImage: g.headerImage,
    priceFinal: g.price.final,
  }));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-16 flex items-center">
      <Container className="flex items-center justify-between w-full gap-4">
        <Link href="/" className="text-2xl font-bold text-accent tracking-tighter flex-shrink-0">
          SurviveBase
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 max-w-md">
          <HeaderSearch games={searchGames} />
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <Link
            href="/?focus=search"
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-bg-tertiary border border-border hover:bg-bg-secondary hover:border-accent transition-colors"
            aria-label="검색"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>

          {/* Bookmarks Link */}
          <Link
            href="/bookmarks"
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-bg-tertiary border border-border hover:bg-bg-secondary hover:border-accent transition-colors"
            aria-label="관심 목록"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
