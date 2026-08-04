-- 지점 출고 패스 신청 시스템 — 신규 테이블 + 기존 테이블 컬럼 추가
-- Supabase SQL Editor에서 1회 실행하세요.

-- 상품: 임시등록/정식등록 상태 (MD가 빠르게 등록하고 나중에 정식 정보를 채우는 흐름 지원)
ALTER TABLE products ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT '임시등록';

-- 지점: 패스 담당자명 + 지점 전용 링크 토큰 (로그인 없이 토큰이 지점코드 역할)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pass_link_token TEXT UNIQUE;

-- 기존 지점에 토큰 일괄 발급 (1회성 백필 — 이미 토큰이 있는 지점은 건너뜀)
UPDATE stores SET pass_link_token = encode(gen_random_bytes(6), 'hex') WHERE pass_link_token IS NULL;

-- 공지: 하루 한 건 이상 등록 가능, 상품은 기존 products 재사용
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id),
  notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT '대기',      -- 대기 | 진행중 | 마감
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지별 추가 설명·사진 (정식등록된 상품이라도 이번 공지에 한해 하단에 덧붙일 수 있는 내용).
-- 상품 자체 데이터(tagline/detail_blocks)는 건드리지 않고, 지점 화면에서 대표 사진 아래에만 노출된다.
ALTER TABLE notices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS extra_images JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS notices_status_idx ON notices (status);
CREATE INDEX IF NOT EXISTS notices_notice_date_idx ON notices (notice_date DESC);

-- 패스 접수: 지점별 출고/패스 상태. 지점당 공지당 한 건만 존재(수정은 upsert)
CREATE TABLE IF NOT EXISTS pass_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  status TEXT NOT NULL DEFAULT '출고',      -- 출고 | 패스
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notice_id, store_id)
);

CREATE INDEX IF NOT EXISTS pass_entries_notice_id_idx ON pass_entries (notice_id);

-- audit_logs와 동일한 관례: service_role에 명시적으로 권한을 부여해야 한다
-- (신규 테이블은 service_role이라도 자동으로 권한이 생기지 않는다 — 이걸 빠뜨리면
--  "permission denied for table notices" 오류가 난다).
GRANT ALL ON TABLE notices TO service_role;
GRANT ALL ON TABLE pass_entries TO service_role;

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_entries ENABLE ROW LEVEL SECURITY;
-- RLS 활성화(정책 없음) — anon/authenticated의 직접 접근을 차단하고 service_role만 우회 허용
-- (관리자 API + /b/[token] 공개 페이지 모두 createAdminClient()로만 접근)

-- 1회성 보정: registration_status 컬럼을 새로 추가하면서 DEFAULT('임시등록')가
-- 기존에 등록되어 있던 모든 상품에도 그대로 채워져, 이미 정식으로 등록된 상품까지
-- "정식등록 대기" 목록에 잘못 나타나는 문제가 있었다.
-- 1차 보정: 이미 판매중/예약판매/품절 등으로 노출되고 있던 상품.
UPDATE products
SET registration_status = '정식등록'
WHERE status IN ('판매중', '예약판매', '품절');

-- 2차 보정: 엑셀 일괄등록(웹 업로드 · 스크립트) 등으로 이미 가격까지 갖춰서 들어온 상품은
-- 아직 진열 전(진열대기)이라도 임시등록(빠른 등록) 대상이 아니므로 함께 정식등록 처리한다.
UPDATE products
SET registration_status = '정식등록'
WHERE registration_status = '임시등록' AND price IS NOT NULL AND price <> '';

-- 3차 보정: 지점 출고 패스에서 빠르게 임시등록한 상품(아직 정식등록 안 됨)은
-- 실제 사이트(고객)에 노출되면 안 된다. 진열대기로 전환해 공개 화면에서 숨긴다.
-- (지점 출고 패스 화면 자체는 status와 무관하게 항상 정상 노출되므로 영향 없음)
UPDATE products
SET status = '진열대기'
WHERE registration_status = '임시등록' AND status IN ('판매중', '예약판매', '품절');
