-- SurviveBase Database Schema
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- 1. Games Table
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  appid INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  header_image TEXT,
  screenshots TEXT[] DEFAULT '{}',
  
  -- Price info
  price_initial INTEGER DEFAULT 0,
  price_final INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  
  -- Review info
  review_positive INTEGER DEFAULT 0,
  review_negative INTEGER DEFAULT 0,
  review_score INTEGER DEFAULT 0,
  
  -- Meta info
  release_date TEXT,
  owners TEXT,
  playtime INTEGER DEFAULT 0,
  
  -- Categories
  singleplayer BOOLEAN DEFAULT FALSE,
  multiplayer BOOLEAN DEFAULT FALSE,
  coop BOOLEAN DEFAULT FALSE,
  
  -- Tags (stored as array for simplicity)
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_games_review_score ON games(review_score DESC);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_price_final ON games(price_final);
CREATE INDEX IF NOT EXISTS idx_games_discount ON games(discount_percent DESC);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_games_tags ON games USING GIN(tags);

-- ============================================
-- 3. Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON games
  FOR SELECT
  USING (true);

-- Allow service role full access (for cron job)
CREATE POLICY "Allow service role full access" ON games
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. Upsert Function for Batch Insert
-- ============================================
CREATE OR REPLACE FUNCTION upsert_games(games_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  game JSONB;
BEGIN
  FOR game IN SELECT * FROM jsonb_array_elements(games_data)
  LOOP
    INSERT INTO games (
      appid, name, description, header_image, screenshots,
      price_initial, price_final, discount_percent, is_free,
      review_positive, review_negative, review_score,
      release_date, owners, playtime,
      singleplayer, multiplayer, coop, tags
    ) VALUES (
      (game->>'appid')::INTEGER,
      game->>'name',
      game->>'description',
      game->>'headerImage',
      COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(game->'screenshots') AS x), '{}'),
      COALESCE((game->'price'->>'initial')::INTEGER, 0),
      COALESCE((game->'price'->>'final')::INTEGER, 0),
      COALESCE((game->'price'->>'discountPercent')::INTEGER, 0),
      COALESCE((game->'price'->>'isFree')::BOOLEAN, FALSE),
      COALESCE((game->'reviews'->>'positive')::INTEGER, 0),
      COALESCE((game->'reviews'->>'negative')::INTEGER, 0),
      COALESCE((game->'reviews'->>'score')::INTEGER, 0),
      game->>'releaseDate',
      game->>'owners',
      COALESCE((game->>'playtime')::INTEGER, 0),
      COALESCE((game->'categories'->>'singleplayer')::BOOLEAN, FALSE),
      COALESCE((game->'categories'->>'multiplayer')::BOOLEAN, FALSE),
      COALESCE((game->'categories'->>'coop')::BOOLEAN, FALSE),
      COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(game->'tags') AS x), '{}')
    )
    ON CONFLICT (appid) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      header_image = EXCLUDED.header_image,
      screenshots = EXCLUDED.screenshots,
      price_initial = EXCLUDED.price_initial,
      price_final = EXCLUDED.price_final,
      discount_percent = EXCLUDED.discount_percent,
      is_free = EXCLUDED.is_free,
      review_positive = EXCLUDED.review_positive,
      review_negative = EXCLUDED.review_negative,
      review_score = EXCLUDED.review_score,
      release_date = EXCLUDED.release_date,
      owners = EXCLUDED.owners,
      playtime = EXCLUDED.playtime,
      singleplayer = EXCLUDED.singleplayer,
      multiplayer = EXCLUDED.multiplayer,
      coop = EXCLUDED.coop,
      tags = EXCLUDED.tags,
      updated_at = NOW();
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Helper Views
-- ============================================

-- View: Games with sale
CREATE OR REPLACE VIEW games_on_sale AS
SELECT * FROM games
WHERE discount_percent > 0
ORDER BY discount_percent DESC;

-- View: Top rated games
CREATE OR REPLACE VIEW games_top_rated AS
SELECT * FROM games
WHERE review_score > 0
ORDER BY review_score DESC
LIMIT 100;

-- ============================================
-- Done!
-- ============================================
