'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRecentGames } from '@/hooks/useRecentGames';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarkButton from './BookmarkButton';
import ImageWithFallback from '../ui/ImageWithFallback';

interface GameDetailClientProps {
  appid: number;
}

export function RecentGameTracker({ appid }: GameDetailClientProps) {
  const { add } = useRecentGames();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      add(appid);
    }
  }, [appid, add]);

  return null;
}

export function GameDetailBookmark({ appid }: GameDetailClientProps) {
  return (
    <BookmarkButton appid={appid} showLabel size="lg" />
  );
}

interface ScreenshotGalleryProps {
  screenshots: string[];
  gameName: string;
}

export function ScreenshotGallery({ screenshots, gameName }: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    if (e.key === 'Escape') {
      setSelectedIndex(null);
    } else if (e.key === 'ArrowLeft') {
      setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'ArrowRight') {
      setSelectedIndex((prev) => 
        prev !== null && prev < screenshots.length - 1 ? prev + 1 : prev
      );
    }
  }, [selectedIndex, screenshots.length]);

  useEffect(() => {
    if (selectedIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedIndex, handleKeyDown]);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {screenshots.slice(0, 4).map((screenshot, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-video rounded-lg overflow-hidden border border-border group cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <ImageWithFallback
              src={screenshot}
              alt={`${gameName} screenshot ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-bg-primary/0 group-hover:bg-bg-primary/20 transition-colors flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-md"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-bg-secondary/80 flex items-center justify-center text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Previous button */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex - 1);
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-bg-secondary/80 flex items-center justify-center text-text-primary hover:bg-bg-tertiary transition-colors"
                aria-label="이전"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {selectedIndex < screenshots.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex + 1);
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-bg-secondary/80 flex items-center justify-center text-text-primary hover:bg-bg-tertiary transition-colors"
                aria-label="다음"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Image */}
            <motion.div
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90vw] h-[80vh] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithFallback
                src={screenshots[selectedIndex]}
                alt={`${gameName} screenshot ${selectedIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-bg-secondary/80 text-sm text-text-primary">
              {selectedIndex + 1} / {screenshots.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    {
      name: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: 'hover:bg-[#1877F2]/20 hover:text-[#1877F2]',
    },
    {
      name: 'KakaoTalk',
      href: `https://story.kakao.com/share?url=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.664 6.201 3 12 3z" />
        </svg>
      ),
      color: 'hover:bg-[#FEE500]/20 hover:text-[#3C1E1E]',
    },
    {
      name: 'Copy Link',
      href: '#',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      color: 'hover:bg-accent/20 hover:text-accent',
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
          alert('링크가 복사되었습니다!');
        } catch {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('링크가 복사되었습니다!');
        }
      },
    },
  ];

  return (
    <div className="flex gap-2">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          onClick={link.onClick}
          target={link.onClick ? undefined : '_blank'}
          rel={link.onClick ? undefined : 'noopener noreferrer'}
          className={`w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary transition-colors ${link.color}`}
          aria-label={`${link.name}에 공유하기`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
