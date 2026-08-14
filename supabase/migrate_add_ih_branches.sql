-- Influencer Hub: 지점(마케팅 관리용) 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 2/7)
-- 주의: 기존 고객용 매장 정보 테이블 stores(supabase/migrate_add_stores_and_jobs.sql, id SERIAL = INTEGER)와는
-- 별개 테이블이다. ih_branches는 Influencer Hub 마케팅 관리 전용이며, stores와 재사용/통합하지 않는다(결정사항 A안).
-- 다만 향후 실제 매장과 연결할 수 있도록 store_id를 nullable FK로 열어둔다.
-- FK 타입은 stores.id 실제 타입(INTEGER, SERIAL)과 정확히 일치시켰다.

CREATE TABLE IF NOT EXISTS ih_branches (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_name   TEXT NOT NULL,
  branch_type   TEXT,                     -- 예: 직영/지원
  region        TEXT,
  status        TEXT NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'INACTIVE')),
  store_id      INTEGER REFERENCES stores(id) ON DELETE SET NULL,  -- 옵션: 실제 WORKUP 매장과 연결
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_branches_region_idx ON ih_branches (region);
CREATE INDEX IF NOT EXISTS ih_branches_status_idx ON ih_branches (status);
CREATE INDEX IF NOT EXISTS ih_branches_store_id_idx ON ih_branches (store_id);

ALTER TABLE ih_branches ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_branches TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_branches_id_seq TO service_role;
