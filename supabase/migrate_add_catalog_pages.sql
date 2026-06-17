-- 카탈로그(디지털 카탈로그/룩북) 페이지 관리 테이블
-- 관리자(/admin/catalog)에서 이미지 + 제목/설명/링크를 등록하면 /catalog 플립북에 그대로 노출된다.
-- Supabase SQL Editor에서 1회 실행.
CREATE TABLE IF NOT EXISTS catalog_pages (
  id          TEXT PRIMARY KEY,
  admin_title TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  link_label  TEXT NOT NULL DEFAULT '',
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 앱이 사용하는 역할에 테이블 권한 부여 (이 단계가 없으면 "permission denied for table" 발생)
GRANT ALL ON TABLE catalog_pages TO anon, authenticated, service_role;

-- 공개(프론트)에서 읽기만 허용 — 쓰기는 서버(service role)에서만 수행
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON catalog_pages;
CREATE POLICY "public_read" ON catalog_pages FOR SELECT USING (true);

-- PostgREST 스키마 캐시 새로고침 (새 테이블/권한을 API가 즉시 인식하도록)
NOTIFY pgrst, 'reload schema';
