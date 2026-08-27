-- Influencer Hub Phase 8: 제품 협찬 콘텐츠 성과 — 좋아요/댓글
-- Supabase SQL Editor에서 실행하세요.
-- 기존 ih_sponsors.views(조회수)에 이어 좋아요/댓글을 추가한다. 둘 다 NULL 허용(값을 모르면 비워둠).

ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS likes BIGINT;
ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS comments BIGINT;
