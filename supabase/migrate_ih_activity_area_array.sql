-- Influencer Hub: activity_area를 TEXT → TEXT[]로 변경 (Phase 4.1 결정사항: B안)
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 배경: 인플루언서 1명이 복수 지역에서 활동할 수 있어 배열 구조가 필요하다.
-- ih_influencers가 현재 0건이라 기존 데이터 손실 위험 없이 안전하게 타입 변경 가능하다
-- (USING 절은 혹시 남아있을 단일 문자열 값을 1개짜리 배열로 감싸 보존한다).

ALTER TABLE ih_influencers
  ALTER COLUMN activity_area TYPE TEXT[]
  USING CASE WHEN activity_area IS NULL THEN NULL ELSE ARRAY[activity_area] END;

ALTER TABLE ih_influencers ALTER COLUMN activity_area SET DEFAULT '{}';
UPDATE ih_influencers SET activity_area = '{}' WHERE activity_area IS NULL;
ALTER TABLE ih_influencers ALTER COLUMN activity_area SET NOT NULL;

-- 배열 포함 검색(예: '경기'가 들어간 인플루언서)에 맞게 인덱스도 GIN으로 교체.
DROP INDEX IF EXISTS ih_influencers_activity_area_idx;
CREATE INDEX IF NOT EXISTS ih_influencers_activity_area_gin ON ih_influencers USING GIN (activity_area);
