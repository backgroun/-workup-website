-- Influencer Hub Phase 6: 지점 마케팅 "콘텐츠 형태" 컬럼 추가
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 왜 필요한가: 지점 마케팅 목록/등록/상세에 "콘텐츠 형태"(릴스/피드/유튜브 영상 등)를 노출해야 하는데
-- 기존 ih_branch_marketing에는 이 정보를 담을 컬럼이 없다(ih_sponsors에 이미 있는 동일 개념 컬럼과 대응).
-- 영향: 기존 행은 전부 NULL로 채워지며, 조회 로직은 NULL을 "-"로 표시하도록 방어한다.
-- 롤백: ALTER TABLE ih_branch_marketing DROP COLUMN content_format;

ALTER TABLE ih_branch_marketing ADD COLUMN IF NOT EXISTS content_format TEXT;
CREATE INDEX IF NOT EXISTS ih_branch_marketing_content_format_idx ON ih_branch_marketing (content_format);
