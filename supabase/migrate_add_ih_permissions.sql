-- Influencer Hub: 권한(역할) 테이블
-- Supabase SQL Editor에서 실행하세요 (Phase 1 - 7/7, ih_branches 이후에 실행할 것)
-- 기존 members.grade(일반회원/VIP/.../관리자)는 절대 변경하지 않는다.
-- Influencer Hub 전용 역할을 별도 테이블로 관리한다.
-- MVP: 회원 1명당 IH 역할 1개(UNIQUE member_id). 다중 역할이 필요해지면
-- 이 UNIQUE 제약만 풀고 애플리케이션에서 "가장 넓은 권한 우선" 등의 규칙을 추가하면 되도록,
-- 코드 쪽에서는 이 테이블을 "역할 1건 조회"가 아니라 "역할 목록 조회" 형태의 함수로 감싸 두는 것을 권장한다.

CREATE TABLE IF NOT EXISTS ih_user_roles (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id     BIGINT NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN', 'MARKETING', 'BRANCH', 'VIEWER')),
  branch_id     BIGINT REFERENCES ih_branches(id),   -- role = 'BRANCH'일 때만 값이 있어야 함(아래 CHECK로 DB가 보장)
  granted_by    BIGINT REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- BRANCH 역할 무결성: role='BRANCH' ⇔ branch_id IS NOT NULL.
  -- 앱 레벨 검증만으로는 API를 우회한 직접 INSERT/UPDATE를 막을 수 없으므로 DB CHECK로도 강제한다.
  CONSTRAINT ih_user_roles_branch_scope_chk
    CHECK ((role = 'BRANCH') = (branch_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS ih_user_roles_role_idx ON ih_user_roles (role);
CREATE INDEX IF NOT EXISTS ih_user_roles_branch_id_idx ON ih_user_roles (branch_id);

-- RLS: 다른 ih_* 테이블과 동일 관례. 권한 판정 자체가 이 테이블 조회로 이루어지므로
-- anon/authenticated에게는 절대 직접 접근을 열지 않는다(service_role 전용).
ALTER TABLE ih_user_roles ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE ih_user_roles TO service_role;
GRANT USAGE, SELECT ON SEQUENCE ih_user_roles_id_seq TO service_role;
