-- Cloudinary → ImageKit 전환: 브랜드 카탈로그 삭제 시 원본 정리에 필요한 ImageKit fileId 컬럼 추가.
-- pdf_public_id 컬럼은 이제 ImageKit filePath(페이지 이미지 URL 생성용)를 저장한다.
-- Supabase SQL Editor에서 1회 실행.
ALTER TABLE brand_catalogs ADD COLUMN IF NOT EXISTS pdf_file_id TEXT;

NOTIFY pgrst, 'reload schema';
