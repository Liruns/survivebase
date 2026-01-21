import { NextResponse } from 'next/server';
import { fetchGamesForTags } from '@/lib/api/steamspy';
import { fetchSteamStoreGames } from '@/lib/api/steamstore';
import { mergeAllGames } from '@/lib/api/merger';
import { upsertGamesToDB } from '@/lib/supabase/queries';
import { CORE_TAGS } from '@/lib/constants';

// Vercel Cron requires specific runtime
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * Cron job for daily data collection
 * Triggered by Vercel Cron at UTC 00:00 (KST 09:00)
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, verify CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Unauthorized request');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Data collection started at', new Date().toISOString());

  try {
    // Step 1: Fetch games from SteamSpy for all core tags
    console.log('[Cron] Step 1: Fetching from SteamSpy...');
    const steamSpyGames = await fetchGamesForTags([...CORE_TAGS]);
    console.log(`[Cron] Found ${steamSpyGames.size} unique games from SteamSpy`);

    if (steamSpyGames.size === 0) {
      throw new Error('No games fetched from SteamSpy');
    }

    // Step 2: Fetch detailed info from Steam Store
    console.log('[Cron] Step 2: Fetching from Steam Store...');
    const appids = Array.from(steamSpyGames.keys());
    
    // Limit to avoid timeout (process in batches if needed)
    const MAX_GAMES = 500; // Adjust based on timeout limits
    const limitedAppids = appids.slice(0, MAX_GAMES);
    
    const steamStoreGames = await fetchSteamStoreGames(limitedAppids, (current, total) => {
      if (current % 50 === 0) {
        console.log(`[Cron] Steam Store progress: ${current}/${total}`);
      }
    });
    console.log(`[Cron] Fetched ${steamStoreGames.size} games from Steam Store`);

    // Step 3: Merge data
    console.log('[Cron] Step 3: Merging data...');
    const games = mergeAllGames(steamSpyGames, steamStoreGames);
    console.log(`[Cron] Merged ${games.length} games`);

    // Step 4: Upsert to Supabase
    console.log('[Cron] Step 4: Upserting to database...');
    const upsertedCount = await upsertGamesToDB(games);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Cron] Collection complete! ${upsertedCount} games in ${elapsed}s`);

    return NextResponse.json({
      success: true,
      message: 'Data collection completed',
      stats: {
        steamSpyGames: steamSpyGames.size,
        steamStoreGames: steamStoreGames.size,
        mergedGames: games.length,
        upsertedGames: upsertedCount,
        elapsedSeconds: parseFloat(elapsed),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Cron] Data collection failed after ${elapsed}s:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Data collection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsedSeconds: parseFloat(elapsed),
      },
      { status: 500 }
    );
  }
}
