-- Influencer Hub Phase 5: 제품 협찬 "콘텐츠 형태" 컬럼 추가
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 왜 필요한가: 협찬 목록/필터/상세에 "콘텐츠 형태"(릴스/피드/유튜브 영상/블로그 등)를 노출해야 하는데
-- 기존 ih_sponsors에는 이 정보를 담을 컬럼이 없다. "제공 제품/사이즈"는 기존 미사용 support_type
-- 컬럼을 라벨만 바꿔 재활용하므로 별도 컬럼이 필요 없다.
-- 영향: 현재 ih_sponsors는 0건이라 기존 데이터 손실 위험 없음. 있다 해도 전부 NULL로 채워지고
-- 조회 로직은 NULL을 "-"로 표시한다.
-- 롤백: ALTER TABLE ih_sponsors DROP COLUMN content_format;

ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS content_format TEXT;
CREATE INDEX IF NOT EXISTS ih_sponsors_content_format_idx ON ih_sponsors (content_format);
