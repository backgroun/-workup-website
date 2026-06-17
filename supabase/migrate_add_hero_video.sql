-- 히어로 슬라이드에 동영상(PC/모바일) 컬럼 추가.
-- slide_type='video' 슬라이드는 이미지 대신 동영상을 배경으로 재생하며, 홈 메인 슬라이더에 함께 노출된다.
-- Supabase SQL Editor에서 1회 실행.
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS pc_video_url TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS mobile_video_url TEXT;

NOTIFY pgrst, 'reload schema';
