-- 공지 상품을 더 이상 products 테이블(사이트 상품 카탈로그)에 만들지 않고,
-- 공지(notices) 자체에 이름/썸네일/설명을 직접 저장하는 "마감패스 전용" 상품으로 등록한다.
-- Supabase SQL Editor에서 1회 실행하세요.

ALTER TABLE notices ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS temp_name TEXT;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS temp_image_url TEXT;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS temp_tagline TEXT;
