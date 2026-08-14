-- Influencer Hub: 인플루언서 단가 이력 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 5/7)
-- 결정사항: 단가는 UPDATE로 덮어쓰지 않고 effective_date를 기준으로 새 행을 추가해 이력을 보존한다.
-- 금액은 항상 KRW 원 단위 정수로 저장한다.

CREATE TABLE IF NOT EXISTS ih_influencer_rates (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id     BIGINT NOT NULL REFERENCES ih_influencers(id),
  content_type      TEXT,                    -- 예: 릴스, 피드, 스토리
  price             BIGINT,                  -- KRW 원 단위
  tax_type          TEXT,                    -- 예: VAT 별도
  effective_date    DATE NOT NULL,
  memo              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ih_influencer_rates_influencer_id_idx ON ih_influencer_rates (influencer_id);
-- "이 인플루언서·콘텐츠 유형의 현재 유효 단가"를 빠르게 찾기 위한 복합 인덱스
-- (influencer_id, content_type) 로 묶고 effective_date 내림차순으로 최신 이력을 먼저 스캔한다.
CREATE INDEX IF NOT EXISTS ih_influencer_rates_lookup_idx
  ON ih_influencer_rates (influencer_id, content_type, effective_date DESC);

-- 오늘 기준 유효 단가 — 인플루언서×콘텐츠유형별로 effective_date가 오늘(CURRENT_DATE) 이전이거나
-- 같은 이력 중 가장 최근 것을 뽑는다. 미래 effective_date(예약된 단가 인상)는 아직 유효하지 않으므로 제외한다.
-- 동일 influencer_id+content_type+effective_date가 여러 건(같은 날 정정 입력 등)이라도 결과가
-- 비결정적이지 않도록 ORDER BY 마지막 기준으로 id DESC(가장 나중에 입력된 행 우선)를 추가한다.
--
-- ⚠️ 보안 원칙: 이 VIEW는 단가(민감정보)를 반환한다. Browser가 Supabase를 직접 호출해 이 VIEW를
-- 조회하는 구조는 절대 사용하지 않는다. 반드시 Browser → Next.js Server/API Route → Supabase(service_role)
-- 순서로만 접근하고, API 라우트에서 IH role(ADMIN/MARKETING만 허용)을 확인한 뒤에만 값을 반환한다.
-- (아래 REVOKE로 anon/authenticated에는 애초에 조회 권한 자체를 주지 않아, PostgREST를 통한 직접 노출도 차단된다.)
CREATE OR REPLACE VIEW ih_influencer_rates_current AS
SELECT DISTINCT ON (influencer_id, content_type)
  id,
  influencer_id,
  content_type,
  price,
  tax_type,
  effective_date,
  memo
FROM ih_influencer_rates
WHERE effective_date <= CURRENT_DATE
ORDER BY influencer_id, content_type, effective_date DESC, id DESC;

ALTER TABLE ih_influencer_rates ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_influencer_rates TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_influencer_rates_id_seq TO service_role;

-- 민감정보 VIEW — service_role 외 접근 명시적 차단(PostgREST anon/authenticated 노출 방지).
REVOKE ALL ON ih_influencer_rates_current FROM PUBLIC;
GRANT SELECT ON ih_influencer_rates_current TO service_role;
