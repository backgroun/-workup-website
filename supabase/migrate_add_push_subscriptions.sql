-- 지점 담당자 웹푸시 구독 저장 (지점 출고 패스 공지 오픈 알림용)
-- Supabase SQL Editor에서 1회 실행하세요.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_store_id_idx ON push_subscriptions (store_id);

-- audit_logs/notices와 동일한 관례: service_role에 명시적으로 권한을 부여해야 한다.
GRANT ALL ON TABLE push_subscriptions TO service_role;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- RLS 활성화(정책 없음) — anon/authenticated의 직접 접근을 차단하고 service_role만 우회 허용
-- (구독 등록/해제 API + 알림 발송 로직 모두 createAdminClient()로만 접근)
