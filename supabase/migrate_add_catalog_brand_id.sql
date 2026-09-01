-- 카탈로그 페이지를 브랜드별로 분리한다.
--   brand_id = ''         → WORKUP 메인 카탈로그 (/catalog) — 기존 동작 그대로
--   brand_id = '<브랜드id>' → 그 브랜드의 조립형 카탈로그 (/brands/[슬러그]/catalog)
-- split(분할) 페이지 종류는 page_type='split' + data(JSONB) 라 별도 컬럼이 필요 없다.
-- Supabase SQL Editor에서 1회 실행.

ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS brand_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS catalog_pages_brand_idx ON catalog_pages (brand_id, sort_order);

NOTIFY pgrst, 'reload schema';
