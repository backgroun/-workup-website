-- 매장 방문/전환 이벤트 수집
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS store_events (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER,                 -- FK 안 검(지점 삭제돼도 이벤트 보존)
  store_name TEXT DEFAULT '',       -- 지점명 스냅샷(이름 변경/삭제 대비)
  event_type TEXT NOT NULL,         -- view | list_click | directions_kakao | directions_naver | call | kakao_chat
  path TEXT DEFAULT '',
  visitor_id TEXT DEFAULT '',       -- 익명 방문자 식별(랜덤)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_events_store_idx ON store_events (store_id);
CREATE INDEX IF NOT EXISTS store_events_type_idx ON store_events (event_type);
CREATE INDEX IF NOT EXISTS store_events_created_idx ON store_events (created_at);

-- RLS: 정책 없음 → 공개(anon)로는 읽기/쓰기 불가.
-- 기록은 서버 API(service role)로만, 조회는 관리자 API(service role)로만.
ALTER TABLE store_events ENABLE ROW LEVEL SECURITY;

-- 기간별 지점·행동별 집계 (서버 GROUP BY → 작은 결과만 반환)
CREATE OR REPLACE FUNCTION store_event_stats(since TIMESTAMPTZ)
RETURNS TABLE(store_id INTEGER, store_name TEXT, event_type TEXT, cnt BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT
    e.store_id,
    MAX(e.store_name) AS store_name,
    e.event_type,
    COUNT(*) AS cnt
  FROM store_events e
  WHERE e.created_at >= since
  GROUP BY e.store_id, e.event_type
$$;
