-- 실제 가맹·창업 / 입점·제휴 문의 접수 테이블.
-- 증상: 공개 폼에서 "permission denied for table inquiries" → service_role 에 테이블 권한이 없어서 발생.
-- 고객 개인정보(이름/연락처)가 담기므로 공개(anon) 읽기는 막고, 서버(service_role)만 접근하도록 RLS 적용.
-- Supabase SQL Editor 에서 1회 실행.

CREATE TABLE IF NOT EXISTS inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,                 -- franchise | wholesale
  payload    JSONB NOT NULL DEFAULT '{}',   -- 폼 입력값(이름/연락처/지역/내용 등)
  status     TEXT NOT NULL DEFAULT 'new',   -- new | done 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 권한 부여 (없으면 "permission denied for table inquiries" 발생)
GRANT ALL ON TABLE inquiries TO anon, authenticated, service_role;

-- 개인정보 보호: RLS 켜고 공개 정책은 만들지 않는다.
--  → anon/authenticated 는 행을 읽거나 쓸 수 없음. service_role(서버 API)은 RLS 우회하여 접근.
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 정렬·조회 성능
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_type_idx        ON inquiries (type);

-- PostgREST 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
