import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // 특정 게임 확인
  const appid = process.argv[2] ? parseInt(process.argv[2]) : 771870;
  
  const { data, error } = await supabase
    .from('games')
    .select('appid, name')
    .eq('appid', appid)
    .single();

  if (error) {
    console.log(`appid ${appid} 게임 없음:`, error.message);
  } else {
    console.log(`appid ${appid} 게임 있음:`, data);
  }
}

check();
