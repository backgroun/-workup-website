-- 관리자 활동 로그(감사 로그) 테이블
-- "어떤 담당자가 무엇을 어떻게 수정했는지"를 한 줄 요약으로 기록한다.
-- Supabase SQL Editor 에서 1회 실행하세요.

create table if not exists audit_logs (
  id              bigint generated always as identity primary key,
  actor_id        text,                              -- 작업한 회원(members.id), 식별 불가 시 null
  actor_name      text not null default '알 수 없음', -- 작업 당시 이름 스냅샷
  action          text not null,                     -- create | update | delete
  resource        text not null,                     -- 내부 키: products | stores | members | ...
  resource_label  text,                              -- 사람이 읽는 분류명(예: 상품, 매장)
  target          text,                              -- 대상 이름(제품명/매장명 등)
  target_id       text,                              -- 대상 id
  summary         text not null,                     -- 한 줄 요약
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);
create index if not exists idx_audit_logs_actor      on audit_logs (actor_id);
create index if not exists idx_audit_logs_resource   on audit_logs (resource);
create index if not exists idx_audit_logs_action     on audit_logs (action);
