-- Supabase SQL Editor에 복사해서 실행하세요 (최초 1회)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  line TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  is_new BOOLEAN DEFAULT FALSE,
  tagline TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]',
  job_types JSONB NOT NULL DEFAULT '[]',
  field_test TEXT,
  wearer_quote JSONB,
  bg TEXT NOT NULL DEFAULT 'bg-[#1A2B4A]',
  colors JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  sub_images JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON products;
CREATE POLICY "public_read" ON products FOR SELECT USING (true);
