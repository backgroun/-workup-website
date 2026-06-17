-- 문의 '보여주기' 리스트용 더미 데이터 테이블 (실제 inquiries 와 분리)
-- 공개 페이지의 우측 리스트는 inquiries(실제, 마스킹) + inquiry_dummies(더미)를 합쳐 보여준다.
-- Supabase SQL Editor에서 1회 실행.
CREATE TABLE IF NOT EXISTS inquiry_dummies (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL DEFAULT 'franchise',  -- franchise | wholesale
  name       TEXT NOT NULL DEFAULT '',           -- 이미 마스킹된 표시용 이름 (예: 김**)
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE inquiry_dummies TO anon, authenticated, service_role;
ALTER TABLE inquiry_dummies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON inquiry_dummies;
CREATE POLICY "public_read" ON inquiry_dummies FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS inquiry_dummies_created_idx ON inquiry_dummies (created_at DESC);
NOTIFY pgrst, 'reload schema';
