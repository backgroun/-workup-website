-- 카탈로그 페이지에 '종류'(이미지/표지/목차/구분)와 종류별 데이터(JSONB)를 추가한다.
-- 기존 image 페이지는 page_type='image', data='{}' 기본값으로 그대로 유지된다.
-- Supabase SQL Editor에서 1회 실행.
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- PostgREST 스키마 캐시 새로고침 (새 컬럼을 API가 즉시 인식하도록)
NOTIFY pgrst, 'reload schema';
