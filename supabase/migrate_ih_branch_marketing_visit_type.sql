-- Influencer Hub Phase 4.3: ih_branch_marketing에 "방문 인플루언서" 지원 컬럼 추가
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 결정사항(Phase 4.3):
-- - "방문 인플루언서"는 ih_sponsors가 아니라 ih_branch_marketing에 저장한다(B안 승인됨).
-- - tax_type은 세금 "유형"만 기록한다(예: "3.3%", "원천징수", "면세") — cost에서 세액/실지급액을
--   자동 계산하는 회계 로직은 이번 Phase에서 구현하지 않는다. 기존 cost는 실제 협업 비용 그대로 유지.
-- - operation_type(기존 컬럼, Excel "운영구분" 의미로 이미 쓰이는 자유 텍스트)에 방문 여부를 섞으면
--   Phase 11 Import 시 의미가 충돌할 수 있어, "방문 인플루언서 vs 일반 지점 마케팅" 구분은
--   별도의 전용 컬럼 activity_type으로 관리할 것을 제안한다(GENERAL 기본값 — 기존/향후 Import 데이터는
--   전부 GENERAL로 남고, 이번에 새로 만드는 "방문 인플루언서" 등록만 INFLUENCER_VISIT로 표시됨).

ALTER TABLE ih_branch_marketing ADD COLUMN IF NOT EXISTS tax_type TEXT;

ALTER TABLE ih_branch_marketing
  ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'GENERAL'
  CHECK (activity_type IN ('GENERAL', 'INFLUENCER_VISIT'));

CREATE INDEX IF NOT EXISTS ih_branch_marketing_activity_type_idx ON ih_branch_marketing (activity_type);
