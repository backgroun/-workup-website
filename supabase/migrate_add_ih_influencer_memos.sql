-- Influencer Hub Phase 4.3: 인플루언서 메모 이력 테이블
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
-- 기존 ih_influencers.memo(단일 필드)는 그대로 유지하고 삭제/변경하지 않는다.
-- 이 테이블은 날짜/작성자별로 누적되는 별도의 "메모 이력"이다.

CREATE TABLE IF NOT EXISTS ih_influencer_memos (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id     BIGINT NOT NULL REFERENCES ih_influencers(id) ON DELETE CASCADE,
  author_member_id  BIGINT REFERENCES members(id),
  author_name       TEXT,                     -- 작성 당시 이름 스냅샷(회원 탈퇴/변경에도 기록 보존)
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_influencer_memos_influencer_id_idx ON ih_influencer_memos (influencer_id);
CREATE INDEX IF NOT EXISTS ih_influencer_memos_created_at_idx ON ih_influencer_memos (created_at DESC);

ALTER TABLE ih_influencer_memos ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_influencer_memos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_influencer_memos_id_seq TO service_role;
