#!/usr/bin/env npx ts-node

/**
 * SurviveBase - Data Collection Script
 *
 * This script collects game data from SteamSpy and Steam Store APIs
 * and saves it to the cache file.
 *
 * Usage:
 *   npm run collect-data          # 전체 수집
 *   npm run collect-data -- --test # 테스트 모드 (20개만 수집)
 */

import { fetchGamesForTags } from '../lib/api/steamspy';
import { fetchSteamStoreGames } from '../lib/api/steamstore';
import { mergeAllGames } from '../lib/api/merger';
import { writeGamesCache } from '../lib/cache';
import { CORE_TAGS } from '../lib/constants';

// 테스트 모드 설정
const isTestMode = process.argv.includes('--test');
const TEST_LIMIT = 20;

async function main() {
  console.log('='.repeat(60));
  console.log('SurviveBase Data Collection');
  if (isTestMode) {
    console.log(`[TEST MODE] Limited to ${TEST_LIMIT} games`);
  }
  console.log('='.repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Step 1: Fetch games from SteamSpy for all core tags
    console.log('Step 1: Fetching games from SteamSpy...');
    console.log(`Tags to fetch: ${CORE_TAGS.join(', ')}`);
    console.log();

    const steamSpyGames = await fetchGamesForTags([...CORE_TAGS]);

    console.log();
    console.log(`Total unique games from SteamSpy: ${steamSpyGames.size}`);
    console.log();

    // Step 2: Fetch detailed info from Steam Store
    console.log('Step 2: Fetching details from Steam Store...');
    if (!isTestMode) {
      console.log('Using parallel processing (5 concurrent requests)...');
    }
    console.log();

    const allAppids = Array.from(steamSpyGames.keys());
    const appids = isTestMode ? allAppids.slice(0, TEST_LIMIT) : allAppids;

    if (isTestMode) {
      console.log(`[TEST MODE] Fetching ${appids.length} of ${allAppids.length} games`);
    }

    const steamStoreGames = await fetchSteamStoreGames(appids, (current, total) => {
      const percent = Math.round((current / total) * 100);
      process.stdout.write(`\r  Progress: ${current}/${total} (${percent}%)`);
    });

    console.log();
    console.log(`Successfully fetched: ${steamStoreGames.size} games from Steam Store`);
    console.log();

    // Step 3: Merge data
    console.log('Step 3: Merging data...');
    const games = mergeAllGames(steamSpyGames, steamStoreGames);
    console.log(`Merged ${games.length} games`);
    console.log();

    // Step 4: Save to cache
    console.log('Step 4: Saving to cache...');
    await writeGamesCache(games);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log();
    console.log('='.repeat(60));
    console.log('Collection Complete!');
    console.log('='.repeat(60));
    console.log(`Total games: ${games.length}`);
    console.log(`Time elapsed: ${elapsed} minutes`);
    console.log();

    // Stats
    const withStoreData = games.filter((g) => g.description).length;
    const freeGames = games.filter((g) => g.price.isFree).length;
    const multiplayerGames = games.filter((g) => g.categories.multiplayer).length;

    console.log('Stats:');
    console.log(`  With Steam Store data: ${withStoreData}`);
    console.log(`  Free games: ${freeGames}`);
    console.log(`  Multiplayer games: ${multiplayerGames}`);
  } catch (error) {
    console.error('Collection failed:', error);
    process.exit(1);
  }
}

main();
