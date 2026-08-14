-- Phase 1 배포 검증 스크립트 — 7개 ih_* migration 실행 직후 Supabase SQL Editor에서 실행.
-- 이 스크립트는 읽기 전용(SELECT)만 수행하며 데이터를 변경하지 않는다.
-- 결과를 통째로 복사해서 Claude에게 붙여넣으면 [PHASE 1 DB DEPLOY RESULT]를 판독한다.

-- 1) 테이블 존재 여부
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ih_influencers','ih_influencer_duplicate_candidates','ih_branches',
    'ih_sponsors','ih_branch_marketing','ih_influencer_rates',
    'ih_models','ih_branded_channels','ih_user_roles'
  )
order by table_name;

-- 2) 컬럼/타입
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name like 'ih\_%' escape '\'
order by table_name, ordinal_position;

-- 3) PK
select tc.table_name, kcu.column_name, tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
  and tc.table_name like 'ih\_%' escape '\'
order by tc.table_name;

-- 4) FK (요청하신 7개 관계 포함 전체)
select
  tc.table_name as fk_table, kcu.column_name as fk_column,
  ccu.table_name as ref_table, ccu.column_name as ref_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
  and (tc.table_name like 'ih\_%' escape '\' or ccu.table_name like 'ih\_%' escape '\')
order by fk_table, fk_column;

-- 5) UNIQUE / 6) 일반 INDEX (전체 인덱스 목록, unique 여부 포함)
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename like 'ih\_%' escape '\'
order by tablename, indexname;

-- 7) CHECK constraint
select tc.table_name, tc.constraint_name, cc.check_clause
from information_schema.table_constraints tc
join information_schema.check_constraints cc
  on tc.constraint_name = cc.constraint_name and tc.table_schema = cc.constraint_schema
where tc.constraint_type = 'CHECK' and tc.table_schema = 'public'
  and tc.table_name like 'ih\_%' escape '\'
order by tc.table_name;

-- 8) RLS 활성화 여부
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname like 'ih\_%' escape '\'
  and relkind = 'r'
order by relname;

-- 9) VIEW 존재 여부 + 정의 확인
select table_name, view_definition
from information_schema.views
where table_schema = 'public' and table_name = 'ih_influencer_rates_current';

-- 10) VIEW/테이블 권한 (anon, authenticated에는 아무 권한도 없어야 함)
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('ih_influencer_rates_current')
order by grantee;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'ih\_%' escape '\'
  and grantee in ('anon','authenticated')
order by table_name, grantee;
-- (위 쿼리가 0 rows여야 정상 — anon/authenticated에 부여된 권한이 없다는 뜻)

-- 11) 기존 stores/members 데이터 영향 여부 + ih_* 신규 테이블 0건 확인
select 'stores' as table_name, count(*) as row_count from stores
union all
select 'members', count(*) from members
union all
select 'ih_influencers', count(*) from ih_influencers
union all
select 'ih_influencer_duplicate_candidates', count(*) from ih_influencer_duplicate_candidates
union all
select 'ih_branches', count(*) from ih_branches
union all
select 'ih_sponsors', count(*) from ih_sponsors
union all
select 'ih_branch_marketing', count(*) from ih_branch_marketing
union all
select 'ih_influencer_rates', count(*) from ih_influencer_rates
union all
select 'ih_models', count(*) from ih_models
union all
select 'ih_branded_channels', count(*) from ih_branded_channels
union all
select 'ih_user_roles', count(*) from ih_user_roles;
