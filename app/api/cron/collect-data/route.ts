import { NextResponse } from 'next/server';
import { fetchSteamStoreGames } from '@/lib/api/steamstore';
import { upsertGamesToDB } from '@/lib/supabase/queries';
import { fetchOldestGameAppids } from '@/lib/supabase/queries';

// Vercel Cron requires specific runtime
export const runtime = 'nodejs';
export const maxDuration = 10; // Hobby plan: 10 second limit

const BATCH_SIZE = 50; // Process 50 games per day (Hobby: 1 cron/day)

/**
 * Cron job for incremental data collection
 * Vercel Hobby Plan: Runs once per day at 00:00 UTC
 * Updates oldest games in DB with fresh Steam Store data
 * Full cycle: ~19,000 games / 50 per day = ~380 days
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Unauthorized request');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Cron] Daily update started at', new Date().toISOString());

  try {
    // Step 1: Get oldest games from DB (limited by Hobby plan timeout)
    console.log(`[Cron] Fetching ${BATCH_SIZE} oldest games from DB...`);
    const appids = await fetchOldestGameAppids(BATCH_SIZE);
    
    if (appids.length === 0) {
      console.log('[Cron] No games to update');
      return NextResponse.json({
        success: true,
        message: 'No games to update',
        stats: { processed: 0 },
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Cron] Updating games: ${appids.slice(0, 5).join(', ')}... (${appids.length} total)`);

    // Step 2: Fetch fresh data from Steam Store
    const steamStoreGames = await fetchSteamStoreGames(appids);
    console.log(`[Cron] Fetched ${steamStoreGames.size} games from Steam Store`);

    // Step 3: Convert to Game format and upsert
    const games = Array.from(steamStoreGames.values()).map((storeGame) => ({
      appid: storeGame.appid,
      name: storeGame.name,
      description: storeGame.description,
      headerImage: storeGame.headerImage,
      screenshots: storeGame.screenshots,
      price: storeGame.price,
      reviews: { positive: 0, negative: 0, score: 0 }, // Will be preserved from existing data
      releaseDate: storeGame.releaseDate,
      tags: storeGame.genres,
      categories: storeGame.categories,
      owners: '',
      playtime: 0,
      updatedAt: new Date().toISOString(),
    }));

    // Step 4: Upsert to Supabase (this updates updated_at automatically)
    const upsertedCount = await upsertGamesToDB(games);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Cron] Updated ${upsertedCount} games in ${elapsed}s`);

    return NextResponse.json({
      success: true,
      message: 'Incremental update completed',
      stats: {
        requested: appids.length,
        fetched: steamStoreGames.size,
        upserted: upsertedCount,
        elapsedSeconds: parseFloat(elapsed),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Cron] Update failed after ${elapsed}s:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Update failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsedSeconds: parseFloat(elapsed),
      },
      { status: 500 }
    );
  }
}
