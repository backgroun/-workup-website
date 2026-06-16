-- 기존 products 테이블에 컬럼 추가 (이미 테이블이 있는 경우 실행)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS related_ids JSONB NOT NULL DEFAULT '[]';
