-- Influencer Hub: 인플루언서 상태에 "차단" 추가
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 왜 필요한가: 기존 상태(ACTIVE/INACTIVE/ENDED)만으로는 문제 인플루언서를 표시할 방법이 없다.
-- 영향: 기존 행의 값은 그대로 유지되며(모두 기존 3개 값 중 하나), CHECK 제약만 넓어진다. 데이터 손실 없음.
-- 롤백: 아래 두 명령을 반대로 실행 — BLOCKED로 저장된 행이 있다면 먼저 다른 상태로 바꾼 뒤,
--   ALTER TABLE ih_influencers DROP CONSTRAINT ih_influencers_status_check;
--   ALTER TABLE ih_influencers ADD CONSTRAINT ih_influencers_status_check CHECK (status IN ('ACTIVE','INACTIVE','ENDED'));

ALTER TABLE ih_influencers DROP CONSTRAINT IF EXISTS ih_influencers_status_check;
ALTER TABLE ih_influencers ADD CONSTRAINT ih_influencers_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'ENDED', 'BLOCKED'));
