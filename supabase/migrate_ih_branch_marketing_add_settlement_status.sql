-- Influencer Hub — 지점 마케팅에 "정산예정"/"정산완료" 상태 추가
-- Supabase SQL Editor에서 실행하세요. (이미 이전 버전을 실행해 정산완료만 추가돼 있어도 이 파일을 다시
-- 실행하면 정산예정까지 포함하도록 제약이 갱신됩니다 — DROP 후 재생성이라 안전합니다.)
-- 통합 대시보드 "유형별 현황"에서 지점 마케팅 비용을 정산완료 건만 집계하기 위해 필요한 상태값이다.

ALTER TABLE ih_branch_marketing DROP CONSTRAINT IF EXISTS ih_branch_marketing_status_check;
ALTER TABLE ih_branch_marketing ADD CONSTRAINT ih_branch_marketing_status_check
  CHECK (status IN ('VISIT_SCHEDULED', 'VISIT_COMPLETED', 'REGISTRATION_SCHEDULED', 'REGISTRATION_COMPLETED', 'SETTLEMENT_SCHEDULED', 'SETTLEMENT_COMPLETED'));
