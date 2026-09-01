-- 브랜드별 조립형 카탈로그
-- 관리자(/admin/catalog/brands → "조립형 카탈로그" 탭)에서 이미지+정보를 입력하면
-- /brands/[슬러그]/catalog 에 통일 디자인으로 렌더된다.
-- Supabase SQL Editor에서 1회 실행.

-- brands: 카탈로그 메타 컬럼
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_enabled     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_cover_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_season      TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_headline    TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_intro       TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_tech_images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 조립형 카탈로그 제품 항목
CREATE TABLE IF NOT EXISTS brand_catalog_items (
  id          TEXT PRIMARY KEY,
  brand_id    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  category    TEXT NOT NULL DEFAULT '',
  name        TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price       TEXT NOT NULL DEFAULT '',
  specs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors      JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS brand_catalog_items_brand_idx ON brand_catalog_items (brand_id, sort_order);
-- 제품 메인 착용샷(세로형) — 나중에 추가된 컬럼
ALTER TABLE brand_catalog_items ADD COLUMN IF NOT EXISTS main_image_url TEXT NOT NULL DEFAULT '';

GRANT ALL ON TABLE brand_catalog_items TO anon, authenticated, service_role;
ALTER TABLE brand_catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brand_catalog_items;
CREATE POLICY "public_read" ON brand_catalog_items FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
