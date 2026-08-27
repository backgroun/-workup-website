-- Influencer Hub Phase 7 보완: 팔로워(인플루언서)와 구독자(PPL)는 사실상 같은 의미이므로
-- follower_display 컬럼을 없애고 subscriber_display 하나로 통합한다.
-- Supabase SQL Editor에서 실행하세요.

-- 기존에 follower_display에만 값이 있던 행(인플루언서 구분)을 subscriber_display로 옮긴다.
UPDATE ih_branded_ppl
SET subscriber_display = follower_display
WHERE follower_display IS NOT NULL AND subscriber_display IS NULL;

ALTER TABLE ih_branded_ppl DROP COLUMN IF EXISTS follower_display;
