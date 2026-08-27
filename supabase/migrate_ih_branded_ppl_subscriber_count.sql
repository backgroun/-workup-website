-- Influencer Hub Phase 7 보완: 구독자/팔로워를 텍스트("450,000", "0.6만" 등)가 아니라
-- 숫자로 입력받도록 subscriber_display(TEXT) → subscriber_count(BIGINT)로 교체한다.
-- 화면에는 formatFollowerDisplay()로 "1.3만" 형태로 자동 변환해서 보여준다.
-- Supabase SQL Editor에서 실행하세요. (이 테이블은 아직 예상 리스트/더미 데이터 단계라 자동 값 이전 없이 컬럼만 교체합니다.)

ALTER TABLE ih_branded_ppl DROP COLUMN IF EXISTS subscriber_display;
ALTER TABLE ih_branded_ppl ADD COLUMN IF NOT EXISTS subscriber_count BIGINT;
