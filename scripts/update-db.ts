#!/usr/bin/env npx tsx

/**
 * SurviveBase - DB Update Script
 *
 * DB의 모든 게임을 Steam Store API에서 새로 가져와 업데이트합니다.
 *
 * Usage:
 *   npx tsx scripts/update-db.ts              # 전체 업데이트
 *   npx tsx scripts/update-db.ts --limit 100  # 100개만 업데이트 (오래된 순)
 *   npx tsx scripts/update-db.ts --dry-run    # 실제 업데이트 없이 테스트
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { fetchSteamStoreGames } from '../lib/api/steamstore';

// Parse CLI args
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;
const isDryRun = args.includes('--dry-run');

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('='.repeat(60));
  console.log('SurviveBase DB Update');
  if (isDryRun) console.log('[DRY RUN] No actual changes will be made');
  if (limit) console.log(`[LIMITED] Processing ${limit} games only`);
  console.log('='.repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Step 1: Fetch appids from DB (oldest first)
    console.log('Step 1: Fetching game appids from DB...');
    
    let query = supabase
      .from('games')
      .select('appid')
      .order('updated_at', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data: games, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch games: ${error.message}`);
    }

    const appids = games?.map((g: { appid: number }) => g.appid) || [];
    console.log(`Found ${appids.length} games in DB`);
    console.log();

    if (appids.length === 0) {
      console.log('No games to update');
      return;
    }

    // Step 2: Fetch fresh data from Steam Store
    console.log('Step 2: Fetching data from Steam Store API...');
    console.log('This may take a while...');
    console.log();

    const steamStoreGames = await fetchSteamStoreGames(appids, (current, total) => {
      const percent = Math.round((current / total) * 100);
      process.stdout.write(`\r  Progress: ${current}/${total} (${percent}%)`);
    });

    console.log();
    console.log(`Fetched ${steamStoreGames.size} games from Steam Store`);
    console.log();

    if (isDryRun) {
      console.log('[DRY RUN] Skipping DB update');
      console.log('Sample data:');
      const sample = Array.from(steamStoreGames.values()).slice(0, 3);
      for (const game of sample) {
        console.log(`  ${game.name}: ₩${Math.round(game.price.final / 100).toLocaleString()}`);
      }
      return;
    }

    // Step 3: Update DB
    console.log('Step 3: Updating DB...');
    
    const now = new Date().toISOString();
    const rows = Array.from(steamStoreGames.values()).map((game) => ({
      appid: game.appid,
      name: game.name,
      description: game.description || null,
      header_image: game.headerImage || null,
      screenshots: game.screenshots || [],
      price_initial: game.price.initial,
      price_final: game.price.final,
      discount_percent: game.price.discountPercent,
      is_free: game.price.isFree,
      release_date: game.releaseDate || null,
      singleplayer: game.categories.singleplayer,
      multiplayer: game.categories.multiplayer,
      coop: game.categories.coop,
      tags: game.genres || [],
      updated_at: now,
    }));

    // Batch upsert (100 at a time)
    const BATCH_SIZE = 100;
    let totalUpserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      const { error: upsertError } = await supabase
        .from('games')
        .upsert(batch, { onConflict: 'appid' });

      if (upsertError) {
        console.error(`Batch ${i}-${i + batch.length} failed:`, upsertError.message);
        continue;
      }

      totalUpserted += batch.length;
      process.stdout.write(`\r  Upserted: ${totalUpserted}/${rows.length}`);
    }

    console.log();
    console.log();

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('='.repeat(60));
    console.log('Update Complete!');
    console.log('='.repeat(60));
    console.log(`Games processed: ${appids.length}`);
    console.log(`Games fetched: ${steamStoreGames.size}`);
    console.log(`Games upserted: ${totalUpserted}`);
    console.log(`Time elapsed: ${elapsed} minutes`);

  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

main();
