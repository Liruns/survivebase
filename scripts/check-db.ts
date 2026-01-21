import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // 오래된 데이터
  const { data: oldData, error: oldError } = await supabase
    .from('games')
    .select('appid, name, price_initial, price_final, updated_at')
    .gt('price_final', 0)
    .order('updated_at', { ascending: true })
    .limit(5);

  if (oldError) {
    console.error('Error:', oldError);
    return;
  }

  console.log('=== 가장 오래된 유료 게임 ===\n');
  oldData?.forEach(g => {
    console.log(`${g.name}`);
    console.log(`  DB값: price_final = ${g.price_final}`);
    console.log(`  표시: ₩${Math.round(g.price_final / 100).toLocaleString()}`);
    console.log(`  updated_at: ${g.updated_at}`);
    console.log();
  });

  // 비정상 데이터 찾기 (100만 이상)
  const { data: badData } = await supabase
    .from('games')
    .select('appid, name, price_final')
    .gt('price_final', 100000000)
    .limit(5);

  if (badData && badData.length > 0) {
    console.log('=== 비정상 가격 데이터 (원본 > 1억) ===\n');
    badData.forEach(g => {
      console.log(`${g.name}: ${g.price_final} -> ₩${Math.round(g.price_final / 100).toLocaleString()}`);
    });
  } else {
    console.log('비정상 가격 데이터 없음');
  }
}

check();
