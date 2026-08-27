-- Influencer Hub Phase 7: 브랜디드 PPL 모델 단가(게런티) 예상 리스트 테이블
-- Supabase SQL Editor에서 실행하세요.
-- 실제 인플루언서 등록/집행 이력이 아니라 연예인/PPL(유튜브)/인플루언서 단가를 미리 정리해두는
-- 견적 리스트라 ih_influencers와 연결하지 않는다(실제 진행 확정 시 사용자가 인플루언서 탭에 수동 등록).
-- 구분(연예인/PPL/인플루언서)별로 필요한 필드가 서로 달라 전용 컬럼을 두고, 구분에 맞지 않는 칸은 비워둔다.
-- (이 테이블을 이미 만든 적이 있다면 실행 전에 DROP TABLE IF EXISTS ih_branded_ppl; 로 먼저 지워주세요.)

CREATE TABLE IF NOT EXISTS ih_branded_ppl (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category            TEXT NOT NULL DEFAULT 'INFLUENCER'      -- 구분: 연예인/PPL/인플루언서
                        CHECK (category IN ('CELEBRITY', 'PPL', 'INFLUENCER')),
  name                TEXT NOT NULL,                          -- 모델명 / 채널명 / 인플루언서명
  height              TEXT,                                    -- 키 — 연예인 전용
  opinion             TEXT,                                    -- 의견(포지셔닝) — 연예인 전용
  contract_period     TEXT,                                    -- 기준(예: 6개월) — 연예인 전용
  subscriber_count    BIGINT,                                  -- 구독자/팔로워 수 — PPL·인플루언서 공용
  main_cast           TEXT,                                    -- 메인패널(출연진) — PPL 전용
  ad_product          TEXT,                                    -- 광고상품/콘텐츠 형태 — PPL·인플루언서
  channel_link        TEXT,                                    -- 채널 링크 — PPL·인플루언서
  cost                BIGINT,                                  -- 단가(게런티), KRW 원 단위
  status              TEXT NOT NULL DEFAULT 'NEGOTIATING'
                        CHECK (status IN ('NEGOTIATING', 'CONFIRMED', 'ENDED')),
  memo                TEXT,                                    -- 비고
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_branded_ppl_status_idx ON ih_branded_ppl (status);
CREATE INDEX IF NOT EXISTS ih_branded_ppl_category_idx ON ih_branded_ppl (category);

ALTER TABLE ih_branded_ppl ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_branded_ppl TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_branded_ppl_id_seq TO service_role;
