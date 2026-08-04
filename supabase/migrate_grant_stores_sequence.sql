-- 증상: 관리자 "매장 추가"에서 "permission denied for sequence stores_id_seq" 발생.
-- 원인: stores.id(SERIAL) 자동 증가에 쓰이는 시퀀스에 service_role 권한이 없어서 INSERT가 막힘.
-- Supabase SQL Editor에서 1회 실행하세요.

GRANT USAGE, SELECT ON SEQUENCE stores_id_seq TO service_role;
