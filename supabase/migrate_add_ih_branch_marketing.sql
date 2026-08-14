-- Influencer Hub: 지점 마케팅 집행 이력 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 4/7)
-- 결정사항: influencer_id는 NULL 허용 — 원본 엑셀에서 인플루언서 매칭이 확실하지 않은 건을
-- 억지로 연결하지 않고, 매칭되지 않은 상태로 보존한다(추후 관리자 화면에서 수동 연결).
-- 금액은 항상 KRW 원 단위 정수로 저장한다.

CREATE TABLE IF NOT EXISTS ih_branch_marketing (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id         BIGINT NOT NULL REFERENCES ih_branches(id),
  influencer_id     BIGINT REFERENCES ih_influencers(id),   -- nullable: 미매칭 원본 데이터 보존
  operation_type    TEXT,                                    -- 운영구분(지원/직영 등)
  marketing_date    DATE,                                    -- 진행일자
  round             INTEGER,
  cost              BIGINT,                                  -- KRW 원 단위
  support_content   TEXT,
  support_date      DATE,
  region            TEXT,
  follower_display  TEXT,                                    -- 원본 표기("5.6만" 등)
  views             INTEGER,
  reactions         INTEGER,
  content_url       TEXT,
  status            TEXT NOT NULL DEFAULT 'IN_PROGRESS'
                      CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  memo              TEXT,
  source_sheet      TEXT,                                    -- 마이그레이션 출처('점별마케팅지원' 등)
  source_row_ref    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_branch_marketing_branch_id_idx ON ih_branch_marketing (branch_id);
CREATE INDEX IF NOT EXISTS ih_branch_marketing_influencer_id_idx ON ih_branch_marketing (influencer_id);
CREATE INDEX IF NOT EXISTS ih_branch_marketing_date_idx ON ih_branch_marketing (marketing_date);
CREATE INDEX IF NOT EXISTS ih_branch_marketing_status_idx ON ih_branch_marketing (status);

ALTER TABLE ih_branch_marketing ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_branch_marketing TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_branch_marketing_id_seq TO service_role;
