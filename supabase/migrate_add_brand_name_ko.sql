-- brands 테이블에 한글 검색명(name_ko) 컬럼 추가
-- 브랜드가 영문으로 등록돼 있어도 고객이 한글로 검색하면 찾을 수 있도록
-- 관리자 "브랜드 관리" 화면에서 입력하는 선택 항목.
-- Supabase SQL Editor 에서 1회 실행하세요.

alter table brands add column if not exists name_ko text;
