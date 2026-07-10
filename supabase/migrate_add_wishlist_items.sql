-- 회원별 찜(피팅 리스트) 저장 — 기기가 바뀌어도 계정에 남는다.
-- 제품 정보(이름·가격·이미지)는 저장하지 않고 products 에서 최신값을 조회해 조립한다.
-- Supabase SQL Editor 에서 1회 실행하세요.

create table if not exists wishlist_items (
  id         bigint generated always as identity primary key,
  member_id  text not null,
  product_id text not null,
  size       text not null default '',
  color      text not null default '',
  color_hex  text not null default '',
  created_at timestamptz not null default now(),
  -- 같은 회원이 동일 제품·사이즈·색상을 중복 저장하지 않도록
  unique (member_id, product_id, size, color)
);

create index if not exists idx_wishlist_member on wishlist_items (member_id, created_at desc);

-- 서버(service_role)만 접근. 앱은 createAdminClient 로만 읽고 쓴다.
grant all on table wishlist_items to service_role;
alter table wishlist_items enable row level security;
