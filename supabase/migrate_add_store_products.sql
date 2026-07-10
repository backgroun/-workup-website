-- 매장별 판매제품(최대 3개) 지정 기능
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE stores ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]';
