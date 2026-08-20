-- ============================================================
-- brands 테이블 생성 + 기존 브랜드 데이터 삽입
-- Supabase SQL Editor에서 1회 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
  id                  TEXT PRIMARY KEY,          -- slug (kenta, dewalt …)
  name                TEXT NOT NULL DEFAULT '',
  positioning         TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  description_ko      TEXT NOT NULL DEFAULT '',
  accent_color        TEXT NOT NULL DEFAULT '#000000',
  image_bg            TEXT NOT NULL DEFAULT '',  -- CSS 그라디언트 (히어로 배경 폴백)
  mega_menu_image     TEXT NOT NULL DEFAULT '',
  mega_menu_image_x   INTEGER NOT NULL DEFAULT 50,
  mega_menu_image_y   INTEGER NOT NULL DEFAULT 30,
  mega_menu_visible   BOOLEAN NOT NULL DEFAULT TRUE,
  brand_page_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_visible          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE brands TO anon, authenticated, service_role;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brands;
CREATE POLICY "public_read" ON brands FOR SELECT USING (true);

-- 기존 정적 브랜드 데이터 삽입 (이미 존재하면 무시)
INSERT INTO brands (id, name, positioning, description, description_ko, accent_color, image_bg, sort_order)
VALUES
  ('kenta',   'KENTA',    'EVERYDAY BASIC',        '일과 일상 어디에서든 자연스럽게 어울리는 베이직웨어',    '매일 입는 데일리 베이직',         '#E5541B', 'radial-gradient(ellipse at 40% 30%, #ede7dc 0%, #d9d2c6 45%, #c5beb2 75%, #b5ada1 100%)', 0),
  ('dewalt',  'DEWALT',   'PERFORMANCE WORKWEAR',  '강한 퍼포먼스와 내구성을 갖춘 워크웨어',                 '현장에서 증명된 퍼포먼스',         '#FFCD11', 'radial-gradient(ellipse at 45% 35%, #241d0c 0%, #140e04 50%, #0c0a04 75%, #1a1408 100%)', 1),
  ('volcom',  'VOLCOM',   'WORKWEAR & STREET',     '자유로운 움직임과 스타일을 모두 만족시키는 워크웨어',     '스트리트 감성을 담은 워크웨어',    '#E8E8E8', 'radial-gradient(ellipse at 50% 30%, #272727 0%, #131313 55%, #1c1c1c 100%)',              2),
  ('grbd',    'GRBD',     'SAFETY WORKWEAR',       '높은 시인성과 보호 기능을 갖춘 현장 중심 워크웨어',       '안전을 최우선으로 생각하는 워크웨어', '#4aab4a', 'radial-gradient(ellipse at 40% 30%, #162818 0%, #0a140a 55%, #0f1d10 100%)',            3),
  ('denver',  'DENVER',   'PERFORMANCE OUTDOOR',   '워크와 아웃도어를 연결하는 퍼포먼스웨어',                 '어떤 환경에서도 최상의 퍼포먼스',  '#4a8fd4', 'radial-gradient(ellipse at 40% 25%, #163050 0%, #0a1828 55%, #0e1f38 100%)',             4),
  ('detroit', 'DETRO.IT', 'EUROPEAN WORKWEAR',     '유럽 워크웨어의 디자인과 실용성을 담은 브랜드',           '유러피안 감성의 워크웨어',         '#9e9ea8', 'radial-gradient(ellipse at 45% 32%, #222228 0%, #111116 55%, #18181e 100%)',             5),
  ('maddog',  'MAD DOG',  'DURABLE WORKWEAR',      '거친 환경에서도 오래 입을 수 있는 실용적인 워크웨어',     '강한 내구성의 실용 워크웨어',      '#8b3a22', 'radial-gradient(ellipse at 42% 30%, #201008 0%, #0f0804 55%, #180c08 100%)',            6)
ON CONFLICT (id) DO NOTHING;

-- brand_catalogs 에 season 컬럼 추가 (이미 추가한 경우 무시)
ALTER TABLE brand_catalogs ADD COLUMN IF NOT EXISTS season TEXT;

NOTIFY pgrst, 'reload schema';
