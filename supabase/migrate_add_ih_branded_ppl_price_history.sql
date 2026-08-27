-- Influencer Hub — 브랜디드 PPL 단가 변경 이력
-- Supabase SQL Editor에서 실행하세요.
-- 단가(cost)가 수정될 때마다 이전값/새값/변경 사유/시각을 기록해 상세 페이지에서 이력을 확인할 수 있게 한다.

CREATE TABLE IF NOT EXISTS ih_branded_ppl_price_history (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branded_ppl_id    BIGINT NOT NULL REFERENCES ih_branded_ppl(id) ON DELETE CASCADE,
  old_cost          BIGINT,
  new_cost          BIGINT,
  reason            TEXT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_branded_ppl_price_history_ppl_id_idx ON ih_branded_ppl_price_history (branded_ppl_id);

ALTER TABLE ih_branded_ppl_price_history ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_branded_ppl_price_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_branded_ppl_price_history_id_seq TO service_role;
