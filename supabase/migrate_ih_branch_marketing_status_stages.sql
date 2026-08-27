-- Influencer Hub: 지점 마케팅 상태값을 방문예정/방문완료/등록예정/등록완료 4단계로 변경
-- Supabase SQL Editor에서 실행하세요.
-- 기존 상태(IN_PROGRESS/COMPLETED)로 저장된 행이 있다면 먼저 새 값으로 옮긴 뒤 제약을 교체한다.

UPDATE ih_branch_marketing SET status = 'VISIT_SCHEDULED' WHERE status = 'IN_PROGRESS';
UPDATE ih_branch_marketing SET status = 'REGISTRATION_COMPLETED' WHERE status = 'COMPLETED';

ALTER TABLE ih_branch_marketing DROP CONSTRAINT IF EXISTS ih_branch_marketing_status_check;
ALTER TABLE ih_branch_marketing ADD CONSTRAINT ih_branch_marketing_status_check
  CHECK (status IN ('VISIT_SCHEDULED', 'VISIT_COMPLETED', 'REGISTRATION_SCHEDULED', 'REGISTRATION_COMPLETED'));
ALTER TABLE ih_branch_marketing ALTER COLUMN status SET DEFAULT 'VISIT_SCHEDULED';
