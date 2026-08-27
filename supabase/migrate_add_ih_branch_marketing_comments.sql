-- Influencer Hub Phase 8: 지점 마케팅 콘텐츠 성과 — 댓글
-- Supabase SQL Editor에서 실행하세요.
-- 기존 ih_branch_marketing.reactions(반응수)는 좋아요와 같은 의미로 그대로 쓰고, 댓글만 새로 추가한다.

ALTER TABLE ih_branch_marketing ADD COLUMN IF NOT EXISTS comments BIGINT;
