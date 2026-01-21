'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Game } from '@/types';
import { formatPrice } from '@/lib/utils';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface HeaderSearchProps {
  games: Game[];
}

export default function HeaderSearch({ games }: HeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      const searchLower = query.toLowerCase();
      const filtered = games
        .filter((game) => game.name.toLowerCase().includes(searchLower))
        .slice(0, 5);
      setResults(filtered);
      setSelectedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, games]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // If item selected via arrow keys, go to that item
        if (selectedIndex >= 0 && results[selectedIndex]) {
          router.push(`/game/${results[selectedIndex].appid}`);
          setIsOpen(false);
          setQuery('');
        } 
        // If no selection but has results, go to first result
        else if (results.length > 0) {
          router.push(`/game/${results[0].appid}`);
          setIsOpen(false);
          setQuery('');
        }
        return;
      }

      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    },
    [isOpen, results, selectedIndex, router]
  );

  const handleSearch = useCallback(() => {
    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/game/${results[selectedIndex].appid}`);
    } else if (results.length > 0) {
      router.push(`/game/${results[0].appid}`);
    }
    setIsOpen(false);
    setQuery('');
  }, [results, selectedIndex, router]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <button
          type="button"
          onClick={handleSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors"
          aria-label="검색"
        >
          <svg
            className="w-4 h-4"
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
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="게임 검색..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden z-50">
          {results.length > 0 ? (
            <ul>
              {results.map((game, index) => (
                <li key={game.appid}>
                  <Link
                    href={`/game/${game.appid}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center gap-3 p-3 hover:bg-bg-tertiary transition-colors ${
                      index === selectedIndex ? 'bg-bg-tertiary' : ''
                    }`}
                  >
                    <div className="relative w-16 h-9 rounded overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={game.headerImage}
                        alt={game.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {game.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatPrice(game.price.final)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-text-secondary">
              검색 결과 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
}
