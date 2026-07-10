-- members 테이블 최초 생성 — 회원가입/로그인/관리자 회원관리 기능에 필요.
-- Supabase SQL Editor에서 1회 실행하세요. (이미 테이블이 있다면 아무 영향 없음)

CREATE TABLE IF NOT EXISTS members (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  phone             TEXT,
  memo              TEXT,
  grade             TEXT NOT NULL DEFAULT '일반회원',   -- 일반회원 | VIP | VVIP | 도매회원 | 거래처 | 관리자
  status            TEXT NOT NULL DEFAULT 'active',     -- active | dormant | withdrawn
  password_hash     TEXT,
  last_login_at     TIMESTAMPTZ,
  withdrawn_at      TIMESTAMPTZ,
  withdrawn_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS members_created_idx ON members (created_at DESC);

-- 조회/가입/로그인/비밀번호 리셋 등은 모두 서버 API(service_role)를 통해서만 처리한다.
-- RLS만 켜고 공개 정책은 두지 않음 (products의 public_read 정책과 다른 패턴).
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
