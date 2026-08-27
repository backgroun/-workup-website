-- 브랜디드 PPL(ih_branded_ppl) 확인용 더미 데이터
-- 반드시 migrate_add_ih_branded_ppl_campaigns.sql과 migrate_ih_branded_ppl_subscriber_count.sql을
-- 먼저 실행한 뒤 이 스크립트를 실행하세요.
-- 구독자/팔로워는 숫자(subscriber_count)로 저장되고, 화면에서는 "1.3만" 형태로 자동 변환되어 보입니다.

INSERT INTO ih_branded_ppl
  (category, name, height, opinion, contract_period, subscriber_count, main_cast, ad_product, channel_link, cost, status, memo)
VALUES
  ('CELEBRITY', '강하늘', '181', '전세대 호감형 / 배우 / 동백꽃 이후 중장년 인지도 상승', '6개월', NULL, NULL, NULL, NULL, 400000000, 'CONFIRMED', 'G마켓 TVC / KBS2 문모'),
  ('CELEBRITY', '장혁',   '174', '높은 인지도 / 액션·남성미 이미지 / 40~50대 타깃 영향력 높음', '6개월', NULL, NULL, NULL, NULL, 350000000, 'NEGOTIATING', '쿠팡플레이 지금 불륜이 문제가 아닙니다 / KBS2 문모'),
  ('CELEBRITY', '이준',   '178', '최근 예능 화제성 상승 / 친근한 이미지 / 대중 인지도 높음', '6개월', NULL, NULL, NULL, NULL, 150000000, 'NEGOTIATING', 'MBC 플레이리스트109 / 유튜브 워크'),

  ('PPL', 'B급 스튜디오', NULL, NULL, NULL, 450000, '최성민, 남호연, 김승진', '브랜디드 룡폼', 'https://www.youtube.com/@B%EA%B8%89studio', 35000000, 'NEGOTIATING', '웹예능 토크콘텐츠'),
  ('PPL', 'MBC플러스',    NULL, NULL, NULL, 318000, '김구라, 김선우', '브랜디드 룡폼', 'https://www.youtube.com/@sportstalkking', 15000000, 'NEGOTIATING', '스포츠 예능 토크쇼'),
  ('PPL', '메타코미디(피식대학)', NULL, NULL, NULL, 2830000, '김민수, 이용주, 정재형', '기획 PPL', 'https://www.youtube.com/@피식대학', 70000000, 'CONFIRMED', '민수롭다 / 피식쇼 / 노포인용주 / 급식'),

  ('INFLUENCER', 'd_yom_94', NULL, NULL, NULL, 6000, NULL, '릴스', 'https://www.instagram.com/d_yom_94/', 300000, 'NEGOTIATING', '30대 유부녀 룩북 댄스(몸치)'),
  ('INFLUENCER', '우사이',   NULL, NULL, NULL, 13000, NULL, '릴스', 'https://www.instagram.com/usa2u__reels/', 800000, 'CONFIRMED', '리얼 후기 콘텐츠'),
  ('INFLUENCER', '수슬리',   NULL, NULL, NULL, 137000, NULL, '릴스', 'https://www.instagram.com/so0syl/', 3800000, 'ENDED', '패션 룩북 숏폼 콘텐츠');
