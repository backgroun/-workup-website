-- Influencer Hub: 단가(비용) 필터/목록 테스트용 더미 데이터
-- Supabase SQL Editor에서 실행하세요 — 스키마 변경 아님, 순수 테스트 데이터 삽입입니다.
-- 앞서 등록해둔 더미 인플루언서(가나디/김도전/박러너/이여행/최패션/정낚시)를 닉네임으로 찾아 연결합니다.
-- effective_date를 오늘 이전으로 넣어야 ih_influencer_rates_current(현재 유효 단가)에 바로 반영됩니다.

INSERT INTO ih_influencer_rates (influencer_id, content_type, price, tax_type, effective_date, memo)
SELECT id, '릴스', 150000::bigint, 'VAT 별도', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '가나디'
UNION ALL
SELECT id, '피드', 90000::bigint, 'VAT 별도', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '가나디'
UNION ALL
SELECT id, '릴스', 80000::bigint, '3.3% 공제', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '김도전'
UNION ALL
SELECT id, '유튜브 영상', 300000::bigint, 'VAT 별도', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '박러너'
UNION ALL
SELECT id, '릴스', 60000::bigint, '3.3% 공제', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '이여행'
UNION ALL
SELECT id, '블로그', 200000::bigint, 'VAT 별도', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '최패션'
UNION ALL
SELECT id, '스토리', 50000::bigint, '3.3% 공제', '2026-07-01'::date, '테스트 데이터'
FROM ih_influencers WHERE nickname = '정낚시';
