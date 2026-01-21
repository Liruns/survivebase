// SurviveBase - Supabase Query Functions

import { supabase, supabaseAdmin, isSupabaseConfigured } from './client';
import type { Game } from '@/types';
import type { GameRow, Database } from './types';

type GameInsert = Database['public']['Tables']['games']['Insert'];

/**
 * Convert database row to Game type
 */
function rowToGame(row: GameRow): Game {
  return {
    appid: row.appid,
    name: row.name,
    description: row.description || '',
    headerImage: row.header_image || '',
    screenshots: row.screenshots || [],
    price: {
      initial: row.price_initial,
      final: row.price_final,
      discountPercent: row.discount_percent,
      isFree: row.is_free,
    },
    reviews: {
      positive: row.review_positive,
      negative: row.review_negative,
      score: row.review_score,
    },
    releaseDate: row.release_date || '',
    tags: row.tags || [],
    categories: {
      singleplayer: row.singleplayer,
      multiplayer: row.multiplayer,
      coop: row.coop,
    },
    owners: row.owners || '',
    playtime: row.playtime,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all games from Supabase with pagination
 * Supabase has a default limit of 1000 rows per query
 */
export async function fetchGamesFromDB(): Promise<Game[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured, returning empty array');
    return [];
  }

  const PAGE_SIZE = 1000;
  const allGames: Game[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('review_score', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching games from Supabase:', error);
      break;
    }

    if (data && data.length > 0) {
      allGames.push(...data.map(rowToGame));
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  console.log(`Loaded ${allGames.length} games from Supabase`);
  return allGames;
}

/**
 * Fetch a single game by appid
 */
export async function fetchGameByIdFromDB(appid: number): Promise<Game | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('appid', appid)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToGame(data);
}

/**
 * Fetch games on sale
 */
export async function fetchGamesOnSale(): Promise<Game[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .gt('discount_percent', 0)
    .order('discount_percent', { ascending: false });

  if (error) {
    console.error('Error fetching sale games:', error);
    return [];
  }

  return (data || []).map(rowToGame);
}

/**
 * Upsert games to database (batch)
 * Uses admin client to bypass RLS
 */
export async function upsertGamesToDB(games: Game[]): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Convert Game[] to database format
  const rows: GameInsert[] = games.map((game) => ({
    appid: game.appid,
    name: game.name,
    description: game.description || null,
    header_image: game.headerImage || null,
    screenshots: game.screenshots || [],
    price_initial: game.price.initial,
    price_final: game.price.final,
    discount_percent: game.price.discountPercent,
    is_free: game.price.isFree,
    review_positive: game.reviews.positive,
    review_negative: game.reviews.negative,
    review_score: game.reviews.score,
    release_date: game.releaseDate || null,
    owners: game.owners || null,
    playtime: game.playtime,
    singleplayer: game.categories.singleplayer,
    multiplayer: game.categories.multiplayer,
    coop: game.categories.coop,
    tags: game.tags || [],
  }));

  // Batch upsert in chunks of 100
  const BATCH_SIZE = 100;
  let totalUpserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    // Use type assertion to work around Supabase client type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from('games')
      .upsert(batch, { onConflict: 'appid' });

    if (error) {
      console.error(`Error upserting batch ${i}-${i + batch.length}:`, error);
      continue;
    }

    totalUpserted += batch.length;
  }

  console.log(`Upserted ${totalUpserted} games to database`);
  return totalUpserted;
}

/**
 * Fetch oldest updated games (for incremental cron updates)
 * Returns appids of games with oldest updated_at timestamp
 */
export async function fetchOldestGameAppids(limit: number = 30): Promise<number[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('games')
    .select('appid')
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching oldest games:', error);
    return [];
  }

  return (data || []).map((row: { appid: number }) => row.appid);
}

/**
 * Get database stats
 */
export async function getDBStats(): Promise<{
  totalGames: number;
  onSale: number;
  lastUpdated: string | null;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { totalGames: 0, onSale: 0, lastUpdated: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const [countResult, saleResult, lastResult] = await Promise.all([
    client.from('games').select('*', { count: 'exact', head: true }),
    client.from('games').select('*', { count: 'exact', head: true }).gt('discount_percent', 0),
    client.from('games').select('updated_at').order('updated_at', { ascending: false }).limit(1),
  ]);

  return {
    totalGames: countResult.count || 0,
    onSale: saleResult.count || 0,
    lastUpdated: lastResult.data?.[0]?.updated_at || null,
  };
}
