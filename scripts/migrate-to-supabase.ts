#!/usr/bin/env npx tsx

/**
 * Migrate games.json data to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

interface Game {
  appid: number;
  name: string;
  description: string;
  headerImage: string;
  screenshots: string[];
  price: { initial: number; final: number; discountPercent: number; isFree: boolean };
  reviews: { positive: number; negative: number; score: number };
  releaseDate: string;
  tags: string[];
  categories: { singleplayer: boolean; multiplayer: boolean; coop: boolean };
  owners: string;
  playtime: number;
  updatedAt: string;
}

// Load from .env.local - run with: npx tsx scripts/migrate-to-supabase.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure .env.local exists with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('='.repeat(60));
  console.log('SurviveBase - Migrate to Supabase');
  console.log('='.repeat(60));
  console.log();

  // Read from file cache directly
  console.log('Reading games from file cache...');
  const cacheFile = path.join(process.cwd(), 'data', 'games.json');
  const content = await fs.readFile(cacheFile, 'utf-8');
  const data = JSON.parse(content);
  const games: Game[] = data.games;
  console.log(`Found ${games.length} games`);

  if (games.length === 0) {
    console.log('No games to migrate');
    return;
  }

  // Convert to database format
  const rows = games.map((game) => ({
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

  // Batch upsert
  const BATCH_SIZE = 500;
  let totalUpserted = 0;
  const startTime = Date.now();

  console.log();
  console.log(`Uploading in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('games')
      .upsert(batch, { onConflict: 'appid' });

    if (error) {
      console.error(`Error at batch ${i}-${i + batch.length}:`, error.message);
      continue;
    }

    totalUpserted += batch.length;
    const percent = Math.round((totalUpserted / rows.length) * 100);
    process.stdout.write(`\r  Progress: ${totalUpserted}/${rows.length} (${percent}%)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log();
  console.log();
  console.log('='.repeat(60));
  console.log('Migration Complete!');
  console.log('='.repeat(60));
  console.log(`Total games uploaded: ${totalUpserted}`);
  console.log(`Time elapsed: ${elapsed}s`);
}

migrate().catch(console.error);
