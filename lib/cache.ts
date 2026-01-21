// SurviveBase - Caching System with Supabase Integration

import { promises as fs } from 'fs';
import path from 'path';
import type { Game } from '@/types';
import { 
  fetchGamesFromDB, 
  fetchGameByIdFromDB 
} from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const GAMES_CACHE_FILE = path.join(DATA_DIR, 'games.json');
const MOCK_GAMES_FILE = path.join(DATA_DIR, 'mock-games.json');

interface CacheData {
  games: Game[];
  updatedAt: string;
  version: number;
}

const CACHE_VERSION = 1;

// In-memory cache for performance
let memoryCache: { games: Game[]; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Read games from local file cache
 */
async function readGamesFromFile(): Promise<Game[]> {
  try {
    const content = await fs.readFile(GAMES_CACHE_FILE, 'utf-8');
    const data: CacheData = JSON.parse(content);

    if (data.version !== CACHE_VERSION) {
      console.warn('Cache version mismatch, returning empty array');
      return [];
    }

    return data.games;
  } catch (error) {
    console.warn('Failed to read games cache file:', error);
    return [];
  }
}

/**
 * Read mock games for development
 */
async function readMockGames(): Promise<Game[]> {
  try {
    const content = await fs.readFile(MOCK_GAMES_FILE, 'utf-8');
    const data: CacheData = JSON.parse(content);
    return data.games;
  } catch (error) {
    console.warn('Failed to read mock games:', error);
    return [];
  }
}

/**
 * Write games to local file cache (for local development)
 */
export async function writeGamesCache(games: Game[]): Promise<void> {
  await ensureDataDir();

  const data: CacheData = {
    games,
    updatedAt: new Date().toISOString(),
    version: CACHE_VERSION,
  };

  await fs.writeFile(GAMES_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wrote ${games.length} games to file cache`);
  
  // Clear memory cache
  memoryCache = null;
}

/**
 * Get games with fallback strategy:
 * 1. Memory cache (5 min TTL)
 * 2. Supabase database
 * 3. Local file cache
 * 4. Mock data
 */
export async function getGames(): Promise<Game[]> {
  // Check memory cache first
  if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL) {
    return memoryCache.games;
  }

  let games: Game[] = [];

  // Try Supabase first (production)
  if (isSupabaseConfigured()) {
    try {
      games = await fetchGamesFromDB();
      if (games.length > 0) {
        console.log(`Loaded ${games.length} games from Supabase`);
        memoryCache = { games, timestamp: Date.now() };
        return games;
      }
    } catch (error) {
      console.warn('Failed to fetch from Supabase:', error);
    }
  }

  // Fallback to file cache (development/backup)
  games = await readGamesFromFile();
  if (games.length > 0) {
    console.log(`Loaded ${games.length} games from file cache`);
    memoryCache = { games, timestamp: Date.now() };
    return games;
  }

  // Final fallback to mock data
  console.log('No cached games found, using mock data');
  games = await readMockGames();
  memoryCache = { games, timestamp: Date.now() };
  return games;
}

/**
 * Get a single game by appid with fallback
 */
export async function getGameById(appid: number): Promise<Game | null> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const game = await fetchGameByIdFromDB(appid);
      if (game) {
        return game;
      }
    } catch (error) {
      console.warn('Failed to fetch game from Supabase:', error);
    }
  }

  // Fallback to full list search
  const games = await getGames();
  return games.find((game) => game.appid === appid) || null;
}

/**
 * Check if file cache is stale (older than 24 hours)
 */
export async function isCacheStale(): Promise<boolean> {
  try {
    const content = await fs.readFile(GAMES_CACHE_FILE, 'utf-8');
    const data: CacheData = JSON.parse(content);
    const updatedAt = new Date(data.updatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  } catch {
    return true;
  }
}

/**
 * Get cache info
 */
export async function getCacheInfo(): Promise<{
  source: 'supabase' | 'file' | 'mock' | 'none';
  gameCount: number;
  updatedAt: string | null;
}> {
  // Check Supabase
  if (isSupabaseConfigured()) {
    try {
      const games = await fetchGamesFromDB();
      if (games.length > 0) {
        return {
          source: 'supabase',
          gameCount: games.length,
          updatedAt: games[0]?.updatedAt || null,
        };
      }
    } catch {
      // Continue to file fallback
    }
  }

  // Check file
  try {
    const content = await fs.readFile(GAMES_CACHE_FILE, 'utf-8');
    const data: CacheData = JSON.parse(content);
    return {
      source: 'file',
      gameCount: data.games.length,
      updatedAt: data.updatedAt,
    };
  } catch {
    // Continue to mock fallback
  }

  // Check mock
  try {
    const mockGames = await readMockGames();
    if (mockGames.length > 0) {
      return {
        source: 'mock',
        gameCount: mockGames.length,
        updatedAt: null,
      };
    }
  } catch {
    // No data available
  }

  return {
    source: 'none',
    gameCount: 0,
    updatedAt: null,
  };
}

/**
 * Clear memory cache (useful for testing)
 */
export function clearMemoryCache(): void {
  memoryCache = null;
}
