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
  bg TEXT NOT NULL DEFAULT 'bg-[#303236]',
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

-- ── 가맹·창업 / 입점·제휴 문의 접수 ──
-- 폼 제출/조회는 서버 API(service_role)를 통해서만 처리한다. RLS만 켜고 공개 정책은 두지 않음.
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                       -- 'franchise' | 'wholesale'
  payload JSONB NOT NULL DEFAULT '{}',      -- 폼 입력값
  status TEXT NOT NULL DEFAULT 'new',       -- 'new' | 'processing' | 'done'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inquiries_created_idx ON inquiries (created_at DESC);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
