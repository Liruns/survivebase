// SurviveBase - Data Merger

import type { Game } from '@/types';
import type { SteamSpyGame } from './steamspy';
import type { SteamStoreGame } from './steamstore';
import { calculateReviewScore } from '@/lib/utils';
import { REQUIRED_TAGS, EXCLUDED_TAGS } from '@/lib/constants';

/**
 * Merge SteamSpy and Steam Store data into a unified Game object
 */
export function mergeGameData(
  steamSpyGame: SteamSpyGame,
  steamStoreGame: SteamStoreGame | null
): Game {
  const now = new Date().toISOString();

  // If we don't have Steam Store data, create a partial game
  if (!steamStoreGame) {
    return {
      appid: steamSpyGame.appid,
      name: steamSpyGame.name,
      description: '',
      headerImage: `https://cdn.akamai.steamstatic.com/steam/apps/${steamSpyGame.appid}/header.jpg`,
      screenshots: [],
      price: {
        initial: 0,
        final: 0,
        discountPercent: 0,
        isFree: false,
      },
      reviews: {
        positive: steamSpyGame.positive,
        negative: steamSpyGame.negative,
        score: calculateReviewScore(steamSpyGame.positive, steamSpyGame.negative),
      },
      releaseDate: '',
      tags: steamSpyGame.tags,
      categories: {
        singleplayer: false,
        multiplayer: false,
        coop: false,
      },
      owners: steamSpyGame.owners,
      playtime: steamSpyGame.averagePlaytime,
      updatedAt: now,
    };
  }

  // Merge both data sources
  return {
    appid: steamSpyGame.appid,
    name: steamStoreGame.name || steamSpyGame.name,
    description: steamStoreGame.description,
    headerImage: steamStoreGame.headerImage,
    screenshots: steamStoreGame.screenshots,
    price: steamStoreGame.price,
    reviews: {
      positive: steamSpyGame.positive,
      negative: steamSpyGame.negative,
      score: calculateReviewScore(steamSpyGame.positive, steamSpyGame.negative),
    },
    releaseDate: steamStoreGame.releaseDate,
    tags: steamSpyGame.tags,
    categories: steamStoreGame.categories,
    owners: steamSpyGame.owners,
    playtime: steamSpyGame.averagePlaytime,
    updatedAt: now,
  };
}

/**
 * Check if a game should be included based on tags
 * - Must have at least one required tag (crafting, building, etc.)
 * - Must NOT have any excluded tags (battle royale, MOBA, etc.)
 */
function shouldIncludeGame(tags: string[]): boolean {
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Check for excluded tags
  const hasExcludedTag = EXCLUDED_TAGS.some(excluded => 
    tagsLower.some(tag => tag.includes(excluded.toLowerCase()))
  );
  if (hasExcludedTag) return false;
  
  // Check for at least one required tag
  const hasRequiredTag = REQUIRED_TAGS.some(required =>
    tagsLower.some(tag => tag.includes(required.toLowerCase()))
  );
  
  return hasRequiredTag;
}

/**
 * Merge maps of SteamSpy and Steam Store games
 * Filters out games that don't match the survival/crafting genre
 */
export function mergeAllGames(
  steamSpyGames: Map<number, SteamSpyGame>,
  steamStoreGames: Map<number, SteamStoreGame>
): Game[] {
  const games: Game[] = [];
  let filtered = 0;

  for (const [appid, steamSpyGame] of steamSpyGames) {
    // Filter based on tags
    if (!shouldIncludeGame(steamSpyGame.tags)) {
      filtered++;
      continue;
    }
    
    const steamStoreGame = steamStoreGames.get(appid) || null;
    const mergedGame = mergeGameData(steamSpyGame, steamStoreGame);
    games.push(mergedGame);
  }

  if (filtered > 0) {
    console.log(`Filtered out ${filtered} games (missing required tags or has excluded tags)`);
  }

  return games;
}

/**
 * Sort games by different criteria
 */
export function sortGames(games: Game[], sortBy: string): Game[] {
  const sorted = [...games];

  switch (sortBy) {
    case 'popular':
      // Sort by owners (parse range string, use lower bound)
      return sorted.sort((a, b) => {
        const aOwners = parseOwners(a.owners);
        const bOwners = parseOwners(b.owners);
        return bOwners - aOwners;
      });

    case 'rating':
      // Sort by review score
      return sorted.sort((a, b) => b.reviews.score - a.reviews.score);

    case 'newest':
      // Sort by release date (newest first)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.releaseDate || '1970-01-01').getTime();
        const dateB = new Date(b.releaseDate || '1970-01-01').getTime();
        return dateB - dateA;
      });

    case 'trending':
      // Sort by recent popularity (owners * score)
      return sorted.sort((a, b) => {
        const aScore = parseOwners(a.owners) * (a.reviews.score / 100);
        const bScore = parseOwners(b.owners) * (b.reviews.score / 100);
        return bScore - aScore;
      });

    case 'rising':
      // Sort by review score for games with positive reviews
      // Prioritize games with high scores but moderate review counts
      return sorted.sort((a, b) => {
        const aTotal = a.reviews.positive + a.reviews.negative;
        const bTotal = b.reviews.positive + b.reviews.negative;
        // Wilson score approximation for ranking
        const aWilson = wilsonScore(a.reviews.positive, aTotal);
        const bWilson = wilsonScore(b.reviews.positive, bTotal);
        return bWilson - aWilson;
      });

    default:
      return sorted;
  }
}

/**
 * Parse owners string to number (lower bound)
 * e.g., "1,000,000 .. 2,000,000" -> 1000000
 */
function parseOwners(owners: string): number {
  if (!owners) return 0;

  const match = owners.match(/^([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }

  return 0;
}

/**
 * Wilson score for ranking (lower bound of confidence interval)
 */
function wilsonScore(positive: number, total: number): number {
  if (total === 0) return 0;

  const z = 1.96; // 95% confidence
  const phat = positive / total;

  const numerator = phat + (z * z) / (2 * total) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
  const denominator = 1 + (z * z) / total;

  return numerator / denominator;
}
