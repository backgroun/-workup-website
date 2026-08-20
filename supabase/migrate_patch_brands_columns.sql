-- ============================================================
-- brands 테이블 누락 컬럼 추가 패치
-- 기존 테이블이 있고 일부 컬럼이 없을 때 실행
-- ============================================================

ALTER TABLE brands ADD COLUMN IF NOT EXISTS positioning         TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS description         TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS description_ko      TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS accent_color        TEXT NOT NULL DEFAULT '#000000';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_bg            TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS mega_menu_image     TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS mega_menu_image_x   INTEGER NOT NULL DEFAULT 50;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS mega_menu_image_y   INTEGER NOT NULL DEFAULT 30;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS mega_menu_visible   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_page_visible  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS sort_order          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_visible          BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS hero_text_color     TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();

-- brand_catalogs 에 season 컬럼 추가
ALTER TABLE brand_catalogs ADD COLUMN IF NOT EXISTS season TEXT;

NOTIFY pgrst, 'reload schema';
