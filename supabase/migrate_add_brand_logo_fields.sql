-- 브랜드 히어로 로고 필드 추가
alter table brands
  add column if not exists logo_url  text default '',
  add column if not exists logo_text text default '';
