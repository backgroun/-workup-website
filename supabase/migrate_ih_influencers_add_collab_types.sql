-- Influencer Hub Phase 5 보완: 인플루언서 "활동 유형"(제품 협찬 메이트 / 방문 인플루언서) 고정 구분값
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 왜 필요한가: 목록의 "구분" 배지를 실제 협찬/방문 이력 유무가 아니라, 등록/수정 화면에서
-- 관리자가 직접 지정하는 고정값으로 표시해야 한다(이력이 아직 없어도 구분이 보여야 함).
-- 값: 'SPONSOR'(제품 협찬 메이트) / 'VISIT'(방문 인플루언서) — 한 인플루언서가 둘 다 가질 수 있어 배열로 저장.
-- 영향: 기존 행은 전부 빈 배열('{}')로 채워지고, 목록의 "구분" 열만 이 값을 기준으로 바뀐다. 기존
-- 협찬/방문 이력 데이터에는 영향 없음.
-- 롤백: ALTER TABLE ih_influencers DROP COLUMN collab_types;

ALTER TABLE ih_influencers ADD COLUMN IF NOT EXISTS collab_types TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS ih_influencers_collab_types_gin ON ih_influencers USING GIN (collab_types);
