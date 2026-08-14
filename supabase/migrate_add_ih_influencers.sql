-- Influencer Hub: 인플루언서 마스터 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 1/7)
-- 기존 members/products 등 테이블과 이름·컬럼 충돌 없음.

CREATE TABLE IF NOT EXISTS ih_influencers (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nickname          TEXT NOT NULL,
  handle            TEXT,                              -- 채널 아이디
  channel           TEXT NOT NULL DEFAULT 'Instagram',
  channel_id        TEXT,                              -- 채널 고유 ID(있는 경우)
  channel_url       TEXT,                              -- 중복 판별 1순위
  follower_display  TEXT,                               -- 원본 표기 그대로("5.6만" 등)
  follower_count    INTEGER,                            -- 정규화된 숫자(가능한 경우 Import 시 계산)
  content_type      TEXT[] NOT NULL DEFAULT '{}',
  activity_area     TEXT,
  status            TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'INACTIVE', 'ENDED')),
  match_status      TEXT NOT NULL DEFAULT 'CONFIRMED'
                      CHECK (match_status IN ('CONFIRMED', 'NEEDS_REVIEW')),
  name              TEXT,
  gender            TEXT,
  phone             TEXT,
  address           TEXT,
  height            INTEGER,
  top_size          TEXT,
  bottom_size       TEXT,
  outer_size        TEXT,
  upload_cycle      TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  memo              TEXT,
  source_sheet      TEXT,                               -- 마이그레이션 출처 추적('제품협찬자들' 등, 수기 등록은 'manual')
  source_row_ref    TEXT,                               -- 원본 엑셀 행 참조(감사용)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 확실한 식별자(채널 URL / 채널 ID / 채널+아이디)는 DB 레벨에서 중복을 원천 차단.
-- 닉네임은 동명이인이 있을 수 있어 UNIQUE 걸지 않음(중복 판별 우선순위 4단계 정책은 애플리케이션/큐에서 처리).
CREATE UNIQUE INDEX IF NOT EXISTS ih_influencers_channel_url_uidx
  ON ih_influencers (channel_url) WHERE channel_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ih_influencers_channel_id_uidx
  ON ih_influencers (channel_id) WHERE channel_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ih_influencers_channel_handle_uidx
  ON ih_influencers (channel, handle) WHERE handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS ih_influencers_status_idx ON ih_influencers (status);
CREATE INDEX IF NOT EXISTS ih_influencers_match_status_idx ON ih_influencers (match_status);
CREATE INDEX IF NOT EXISTS ih_influencers_nickname_idx ON ih_influencers (nickname);
CREATE INDEX IF NOT EXISTS ih_influencers_activity_area_idx ON ih_influencers (activity_area);
CREATE INDEX IF NOT EXISTS ih_influencers_content_type_gin ON ih_influencers USING GIN (content_type);
CREATE INDEX IF NOT EXISTS ih_influencers_tags_gin ON ih_influencers USING GIN (tags);

-- 인플루언서 중복 후보 검수 큐 — 자동 병합하지 않고 관리자 수동 확인용으로 보존.
CREATE TABLE IF NOT EXISTS ih_influencer_duplicate_candidates (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id_a   BIGINT NOT NULL REFERENCES ih_influencers(id) ON DELETE CASCADE,
  influencer_id_b   BIGINT NOT NULL REFERENCES ih_influencers(id) ON DELETE CASCADE,
  matched_on        TEXT NOT NULL,                      -- 예: 'nickname'
  confidence        TEXT NOT NULL DEFAULT 'LOW'
                      CHECK (confidence IN ('LOW', 'MEDIUM')),
  status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'MERGED', 'REJECTED')),
  resolved_by       BIGINT REFERENCES members(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ih_dup_candidates_order_chk CHECK (influencer_id_a < influencer_id_b)
);

CREATE UNIQUE INDEX IF NOT EXISTS ih_dup_candidates_pair_uidx
  ON ih_influencer_duplicate_candidates (influencer_id_a, influencer_id_b);
CREATE INDEX IF NOT EXISTS ih_dup_candidates_status_idx
  ON ih_influencer_duplicate_candidates (status);

-- RLS: 기존 관례(audit_logs, store_events)와 동일 — anon/authenticated 정책 없음,
-- 앱은 항상 service_role로만 접근하고 실제 인가는 Next.js API 레벨(IH role 검증)에서 처리.
ALTER TABLE ih_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ih_influencer_duplicate_candidates ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_influencers TO service_role;
GRANT ALL PRIVILEGES ON TABLE ih_influencer_duplicate_candidates TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_influencers_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_influencer_duplicate_candidates_id_seq TO service_role;
