-- 타사 브랜드 PDF 카탈로그 테이블 (브랜드 1개 = 1행)
-- 관리자(/admin/catalog/brands)에서 PDF 업로드 → ImageKit이 페이지 이미지로 변환 → /brands 뷰어에서 플립북으로 노출.
-- (pdf_file_id 컬럼은 supabase/migrate_imagekit_brand_catalogs.sql 에서 추가)
-- Supabase SQL Editor에서 1회 실행.
CREATE TABLE IF NOT EXISTS brand_catalogs (
  id            TEXT PRIMARY KEY,
  brand_name    TEXT NOT NULL DEFAULT '',
  pdf_public_id TEXT,             -- ImageKit filePath (페이지 이미지 생성용)
  pdf_url       TEXT,             -- 원본 PDF URL (대체 보기용)
  page_count    INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,             -- 표지(1페이지) 썸네일
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 앱이 사용하는 역할에 권한 부여 (없으면 "permission denied for table" 발생)
GRANT ALL ON TABLE brand_catalogs TO anon, authenticated, service_role;

-- 공개(프론트)에서 읽기만 허용
ALTER TABLE brand_catalogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brand_catalogs;
CREATE POLICY "public_read" ON brand_catalogs FOR SELECT USING (true);

-- PostgREST 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
