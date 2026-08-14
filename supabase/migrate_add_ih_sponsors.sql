-- Influencer Hub: 제품 협찬 이력 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 3/7)
-- 결정사항: RED 탭('지정홍보인플_일정', '제품협찬_업로드리스트') 데이터는 마이그레이션하지 않는다.
-- 이 테이블은 0건으로 시작하며, Influencer Hub 협찬 등록 기능(추후 Phase)을 통해서만 데이터가 쌓인다.
-- 금액은 항상 KRW 원 단위 정수로 저장한다(예: "500만원" → 5000000).

CREATE TABLE IF NOT EXISTS ih_sponsors (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id     BIGINT NOT NULL REFERENCES ih_influencers(id),
  product           TEXT NOT NULL,
  round             INTEGER,
  support_type      TEXT,
  send_date         DATE,
  upload_due_date   DATE,
  upload_date       DATE,
  content_url       TEXT,
  cost              BIGINT,                              -- KRW 원 단위
  status            TEXT NOT NULL DEFAULT 'PLANNED'
                      CHECK (status IN (
                        'PLANNED', 'SENT', 'RECEIVED', 'PRODUCING',
                        'UPLOAD_SCHEDULED', 'UPLOADED', 'ENDED'
                      )),
  memo              TEXT,
  created_by        BIGINT REFERENCES members(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_sponsors_influencer_id_idx ON ih_sponsors (influencer_id);
CREATE INDEX IF NOT EXISTS ih_sponsors_status_idx ON ih_sponsors (status);
CREATE INDEX IF NOT EXISTS ih_sponsors_upload_due_date_idx ON ih_sponsors (upload_due_date);

ALTER TABLE ih_sponsors ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_sponsors TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_sponsors_id_seq TO service_role;
