-- Influencer Hub: 제품 협찬 "비용" 세분화(원가 + 택배비)
-- Supabase SQL Editor에서 실행하세요 — 실행 전 사용자 승인 필요, 아직 미실행.
--
-- 왜 필요한가: 지금까지 "비용" 하나로만 저장했는데, 실제로는 제품 원가와 택배비를 구분해서
-- 입력하고 그 합계를 비용으로 쓰고 싶다는 요청.
-- 방식: 새 컬럼 product_cost/shipping_cost를 추가하고, 기존 cost 컬럼은 그대로 둔 채
-- "원가+택배비 합계"를 저장하는 용도로 계속 사용한다(기존 목록/필터/상세 화면이 cost를 그대로 읽으므로
-- 별도 화면 수정 없이 호환됨). 원가/택배비를 입력하지 않고 총액만 입력하는 기존 방식(Excel 업로드 등)도
-- 계속 지원한다 — 그 경우 product_cost/shipping_cost는 NULL로 남는다.
-- 영향: 기존 행은 product_cost/shipping_cost가 NULL로 채워지고 cost는 그대로 유지된다. 데이터 손실 없음.
-- 롤백: ALTER TABLE ih_sponsors DROP COLUMN product_cost, DROP COLUMN shipping_cost;

ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS product_cost BIGINT;
ALTER TABLE ih_sponsors ADD COLUMN IF NOT EXISTS shipping_cost BIGINT;
