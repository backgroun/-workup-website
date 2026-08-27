-- Influencer Hub: 제품 협찬 "조회수" 컬럼 추가
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
-- 왜 필요한가: 제품 협찬 목록/상세에서 게시물 조회수를 수동으로 기록하고 확인할 수 있어야 한다
-- (자동 추출은 보류 — 수동 입력으로 진행하기로 결정됨).
-- 영향: 기존 행은 NULL로 채워지고, 조회 로직은 NULL을 "-"로 표시한다. 데이터 손실 없음.
-- 롤백: ALTER TABLE ih_sponsors DROP COLUMN views;

ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS views BIGINT;
