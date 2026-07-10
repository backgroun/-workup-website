-- 매장 공개 여부(is_active)와는 별개로, 매장 상세 페이지(/store/[id]) 노출 여부를 개별 제어
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE stores ADD COLUMN IF NOT EXISTS page_active BOOLEAN DEFAULT true;
