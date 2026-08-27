-- Influencer Hub: 지점 마케팅의 "지점"을 별도 ih_branches 테이블 대신 기존 stores(고객용 매장) 테이블을 그대로 참조하도록 변경
-- Supabase SQL Editor에서 실행하세요.
-- ih_branch_marketing에 아직 등록된 행이 없어(0건) 데이터 이관 없이 FK만 바꾸면 된다.
-- ih_branches 테이블 자체는 삭제하지 않고 남겨둔다(사용하지 않게 될 뿐, 필요시 나중에 직접 정리).

ALTER TABLE ih_branch_marketing DROP CONSTRAINT IF EXISTS ih_branch_marketing_branch_id_fkey;
ALTER TABLE ih_branch_marketing ADD CONSTRAINT ih_branch_marketing_branch_id_fkey
  FOREIGN KEY (branch_id) REFERENCES stores(id);
