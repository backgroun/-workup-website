-- products 테이블에 hide_brand_prefix 컬럼 추가
-- 코드(ProductForm·productDisplayName·mapToDb)는 이미 이 필드를 사용하지만
-- DB 컬럼이 없어 상품 등록/수정이 실패하던 문제를 해결한다.
-- 기본값 false = 제품명 앞에 "[브랜드]" 를 표시(기존 동작 유지).
-- Supabase SQL Editor 에서 1회 실행하세요.

alter table products add column if not exists hide_brand_prefix boolean not null default false;
