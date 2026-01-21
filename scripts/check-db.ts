import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // 태그 확인
  const { data: tagData } = await supabase
    .from('games')
    .select('name, tags')
    .not('tags', 'eq', '{}')
    .limit(5);

  console.log('=== DB 태그 값 ===\n');
  tagData?.forEach(g => {
    console.log(`${g.name}`);
    console.log(`  tags: ${JSON.stringify(g.tags)}`);
    console.log();
  });
}

check();
