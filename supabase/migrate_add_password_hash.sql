-- members 테이블에 password_hash 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT;
