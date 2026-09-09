-- 공지에 뱃지 텍스트 추가 (재공지, 정보변경, 가격변동 또는 커스텀)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS badge text DEFAULT NULL;
