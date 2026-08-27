-- Influencer Hub: 제품 협찬 목록 테스트용 더미 데이터
-- Supabase SQL Editor에서 실행하세요 — 스키마 변경 아님, 순수 테스트 데이터 삽입입니다.
-- 앞서 등록해둔 더미 인플루언서(가나디/김도전/박러너/이여행/최패션/정낚시)를 닉네임으로 찾아 연결합니다.
-- 해당 닉네임의 인플루언서가 없으면 그 행만 조용히 건너뜁니다(에러 없음).
-- UNION으로 리터럴 타입을 추론할 때 date/bigint 캐스팅이 자동으로 되지 않아 명시적으로 ::date/::bigint를 붙인다.

INSERT INTO ih_sponsors (influencer_id, product, round, support_type, content_format, send_date, cost, status, memo)
SELECT id, '쿨링 재킷', 1, '상 95', '릴스', '2026-08-10'::date, 120000::bigint, 'PLANNED', '테스트 데이터'
FROM ih_influencers WHERE nickname = '가나디'
UNION ALL
SELECT id, '방한 조끼', 2, '상 95', '피드', '2026-07-20'::date, 90000::bigint, 'UPLOADED', '테스트 데이터'
FROM ih_influencers WHERE nickname = '가나디'
UNION ALL
SELECT id, '등산 팬츠', 1, '하 32', '유튜브 영상', '2026-08-15'::date, 150000::bigint, 'PRODUCING', '테스트 데이터'
FROM ih_influencers WHERE nickname = '김도전'
UNION ALL
SELECT id, '런닝화', 1, '270', '릴스', '2026-08-18'::date, 180000::bigint, 'SENT', '테스트 데이터'
FROM ih_influencers WHERE nickname = '박러너'
UNION ALL
SELECT id, '니트 세트', 1, '상 M · 하 M', '블로그', '2026-06-30'::date, 130000::bigint, 'ENDED', '테스트 데이터'
FROM ih_influencers WHERE nickname = '최패션'
UNION ALL
SELECT id, '낚시 조끼', 1, '상 L', '스토리', '2026-08-22'::date, 95000::bigint, 'UPLOAD_SCHEDULED', '테스트 데이터'
FROM ih_influencers WHERE nickname = '정낚시';
