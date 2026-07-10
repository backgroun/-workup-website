-- inquiries 테이블에 member_id 추가 — 로그인 회원이 남긴 문의를 마이페이지에서 조회하기 위함.
-- nullable 이므로 비로그인 문의(가맹·창업, 입점·제휴 등)는 그대로 접수된다.
-- 기존 문의는 작성자 식별이 불가능하므로 소급 연결하지 않는다(타인 문의 노출 방지).
-- Supabase SQL Editor 에서 1회 실행하세요.

alter table inquiries add column if not exists member_id text;

create index if not exists idx_inquiries_member_id on inquiries (member_id);
