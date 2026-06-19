-- 스토어 관리 및 채용공고 테이블
-- Supabase SQL Editor에서 실행하세요

-- stores 테이블 (관리자가 편집 가능한 매장 정보)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT DEFAULT '',
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  hours TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_urls JSONB DEFAULT '[]',
  brands JSONB DEFAULT '[]',
  parking BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  store_type TEXT DEFAULT '직영점',
  kakao_channel_url TEXT DEFAULT '',
  store_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stores_is_active_idx ON stores (is_active);
CREATE INDEX IF NOT EXISTS stores_sort_order_idx ON stores (sort_order);
CREATE INDEX IF NOT EXISTS stores_region_idx ON stores (region);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON stores;
CREATE POLICY "public_read" ON stores FOR SELECT USING (true);

-- store_jobs 테이블 (지점별 채용공고)
CREATE TABLE IF NOT EXISTS store_jobs (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  employment_type TEXT DEFAULT '정규직',
  salary_info TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_jobs_store_id_idx ON store_jobs (store_id);
CREATE INDEX IF NOT EXISTS store_jobs_is_active_idx ON store_jobs (is_active);
CREATE INDEX IF NOT EXISTS store_jobs_deadline_idx ON store_jobs (deadline);

ALTER TABLE store_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON store_jobs;
CREATE POLICY "public_read" ON store_jobs FOR SELECT USING (true);
