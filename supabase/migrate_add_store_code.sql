-- 지점코드(예: WUP001) — 사내 매장 식별 코드. pass_link_token(출고패스 보안 토큰)과는 별개.
-- Supabase SQL Editor에서 1회 실행하세요.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_code TEXT;

-- 지점 현황(담당자·연락처·출고안내번호·이메일·오픈일 등 운영 참고 정보) — 엑셀 업로드/개별수정으로 관리.
-- 기존 관례대로 site_settings(section+config) 재사용, 새 테이블 없음.
