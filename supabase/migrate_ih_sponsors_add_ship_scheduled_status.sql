-- Influencer Hub: 제품 협찬 상태값에 "제품 발송 예정"(SHIP_SCHEDULED) 단계 추가
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE ih_sponsors DROP CONSTRAINT IF EXISTS ih_sponsors_status_check;
ALTER TABLE ih_sponsors ADD CONSTRAINT ih_sponsors_status_check
  CHECK (status IN (
    'PLANNED', 'SHIP_SCHEDULED', 'SENT', 'RECEIVED', 'PRODUCING',
    'UPLOAD_SCHEDULED', 'UPLOADED', 'ENDED'
  ));
