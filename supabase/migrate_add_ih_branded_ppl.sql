-- Influencer Hub: 브랜디드/PPL — 모델 DB + 채널/인플루언서 DB
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 6/7)
-- 민감 정보(게런티/단가) 테이블 — 서버 API에서 IH role(ADMIN/MARKETING만) 검증 후에만 값을 반환해야 한다.
-- 금액은 항상 KRW 원 단위 정수로 저장한다(원본 엑셀 "만원" 표기는 Import 단계에서 ×10,000 환산).

CREATE TABLE IF NOT EXISTS ih_models (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              TEXT NOT NULL,
  height            INTEGER,
  opinion           TEXT,
  guarantee         BIGINT,          -- KRW 원 단위, 민감 정보
  contract_period   TEXT,
  memo              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_models_name_idx ON ih_models (name);

CREATE TABLE IF NOT EXISTS ih_branded_channels (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  subscribers   INTEGER,
  panel         TEXT,               -- 메인 패널(출연진)
  channel_url   TEXT,
  price         BIGINT,             -- KRW 원 단위, 민감 정보
  ad_type       TEXT,
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_branded_channels_name_idx ON ih_branded_channels (name);

ALTER TABLE ih_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ih_branded_channels ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_models TO service_role;
GRANT ALL PRIVILEGES ON TABLE ih_branded_channels TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_models_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_branded_channels_id_seq TO service_role;
