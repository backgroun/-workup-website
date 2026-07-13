# workupkorea.com 실전 전환 체크리스트

`www.workupkorea.com` / `workupkorea.com`을 구 홈페이지(메이크샵)에서 리뉴얼 사이트(Vercel)로 전환하는 작업 문서.

---

## 🔴 즉시 조치 (전환일 기다리지 말고 지금)

### 1. `NEXT_PUBLIC_SITE_URL` 환경변수 설정 — 현재 문제 발생 중

`new.workupkorea.com`을 Production 환경에 연결한 순간 Vercel의 `VERCEL_PROJECT_PRODUCTION_URL`이 그 도메인으로 바뀌었다. `lib/site.ts`의 폴백이 이 값을 쓰기 때문에, **현재 라이브 사이트의 sitemap·robots·OG·canonical이 전부 아직 접속도 안 되는 `new.workupkorea.com`을 가리키고 있다.**

실제 확인 (2026-07-10):
```
https://web-site-five-mu.vercel.app/robots.txt
  → Sitemap: https://new.workupkorea.com/sitemap.xml
https://web-site-five-mu.vercel.app/sitemap.xml
  → <loc>https://new.workupkorea.com</loc>   (전체 URL이 이 주소)
```

**조치**: Vercel → Settings → Environment Variables → Production
```
NEXT_PUBLIC_SITE_URL = https://web-site-five-mu.vercel.app
```
저장 후 **재배포 필수**. 전환 당일에 `https://www.workupkorea.com`으로 값을 교체한다.

### 2. 테스트 도메인 색인 차단

`app/robots.ts`가 모든 도메인에 `Allow: /`를 내보내므로 `new.workupkorea.com`이 외부에 알려지면 구글이 색인한다 → 구 홈페이지와 중복 콘텐츠. 테스트 기간에는 Vercel **Deployment Protection(Password Protection)** 을 켜거나, 최소한 이 주소를 외부에 공유하지 않는다.

---

## 배경 (반드시 알아야 할 것)

- `workupkorea.com`은 가비아에 **등록**만 되어 있고, **실제 DNS는 메이크샵 네임서버**(`ns1/ns2.makeshop.kr`, `ns1/ns2.makeshop.com`)가 관리 중이다.
- 가비아 "DNS 관리" 화면에 보이는 레코드는 **실제로 적용되는 게 아닌 예전 백업 설정**(하이웍스 메일 등)이다. 여기만 수정하면 반영되지 않는다.
- 실제 라이브 값 (2026-07-10 확인):
  - `@`, `www` A레코드 → `14.129.113.64` (메이크샵 서버, 구 홈페이지)
  - 메일서버: **사용 안 함** → 전환 시 MX/SPF 신경 쓰지 않아도 됨
- 구 홈페이지 특성:
  - `https://www.workupkorea.com` 접속 시 **HTTP로 302 리다이렉트**됨 (`http://www.workupkorea.com/index.html`) → 사실상 HTTP 사이트
  - sitemap에 등록된 URL **66개, 전부 `/shop/shopbrand.html?type=X&xcode=...&mcode=...` 형태**
  - 기타 실제 페이지: `/index.html`, `/html/info.html`, `/board/board.html?code=...`, `/shop/page.html?id=1` 등
- 메이크샵 서비스는 **곧 종료 예정**. 종료 전에 네임서버를 가비아로 되돌려야 도메인이 정상 관리된다.
- `new.workupkorea.com` 테스트용 CNAME은 **메이크샵 관리자 페이지의 DNS 설정**에 추가해야 반영된다 (가비아 패널 아님).

---

## SEO — 검색 노출 유지 대책 (가장 중요)

도메인은 그대로지만 **URL 구조가 완전히 바뀐다**. 조치 없이 전환하면 기존 색인 66개가 전부 404가 되어 검색 순위를 잃는다.

### 3. 301 리다이렉트 설정 (전환 전 코드에 미리 반영)

`next.config.ts`에 `redirects()`를 추가해 구 URL → 신 URL 매핑. 최소한 아래는 필수:

| 구 URL | 신 URL |
|---|---|
| `/index.html` | `/` |
| `/shop/shopbrand.html` (전체) | `/products` |
| `/board/board.html` (전체) | `/journal` 또는 `/pr` |
| `/html/info.html` | `/story` |
| `/shop/page.html?id=1` | `/story` |
| `/shop/basket.html`, `/shop/coupon_zone.html`, `/shop/mypage.html` | `/` (온라인 판매 기능 없음) |
| `/shop/faq.html` | `/support` |

- 반드시 **301 (permanent)** 을 쓴다. 302는 검색엔진이 색인을 옮기지 않는다.
- `xcode`/`mcode` 값별로 카테고리 매칭이 가능하면 `/products?category=...`로 세분화하면 더 좋다.

### 4. www vs apex 정규화

- 하나를 정식 주소로 정하고 (권장: `www.workupkorea.com` — 구 사이트가 www를 써왔으므로 색인 승계에 유리) 다른 하나는 301 리다이렉트.
- Vercel Domains에서 두 도메인 모두 등록 후, apex → www 리다이렉트 설정.

### 5. HTTP → HTTPS

- 구 사이트는 HTTP로 색인돼 있을 가능성이 크다. Vercel은 HTTP 요청을 자동으로 HTTPS로 301 리다이렉트하므로 **별도 조치 불필요**.
- `next.config.ts:8`의 HSTS는 `includeSubDomains` 포함, `preload` 미포함이라 안전하다. 단, **HTTP만 지원하는 서브도메인이 있으면 접속 불가**가 되므로 `db.workupkorea.com`(A `121.254.168.75`) 용도를 반드시 확인할 것.

### 6. 서치콘솔 / 네이버 서치어드바이저

현재 코드에 소유권 확인 메타태그가 **전혀 없다** (`verification` 없음). 전환 후 아래 작업 필요:
- [ ] **구글 서치콘솔**: `www.workupkorea.com` 속성 등록 → 소유권 확인 → `sitemap.xml` 제출
- [ ] **구글 서치콘솔**: 기존 속성이 있다면 "주소 변경 도구"는 도메인이 같으므로 불필요. 대신 새 sitemap 제출 + 색인 생성 요청
- [ ] **네이버 서치어드바이저**: 사이트 등록 → 소유권 확인 → `sitemap.xml` 제출 → 수집 요청
- [ ] 소유권 확인은 메타태그 방식이면 `app/layout.tsx` metadata에 `verification` 필드 추가, HTML 파일 방식이면 `public/`에 배치

### 7. canonical 태그

현재 `alternates.canonical` 설정이 없다. `metadataBase`만으로는 canonical이 자동 생성되지 않으므로, www/apex·쿼리스트링 중복을 막으려면 페이지별 canonical 추가를 권장 (선택사항, 1번 조치 후 우선순위 낮음).

### 8. 구조화 데이터 (LocalBusiness)

`app/store/[id]/page.tsx`의 매장 JSON-LD가 `siteUrl` 기반 절대경로를 쓴다. **1번 조치를 하면 자동 해결**. 오프라인 매장 방문 유도의 핵심 SEO 자산이므로 전환 후 [리치 결과 테스트](https://search.google.com/test/rich-results)로 반드시 검증.

---

## 사전 준비 (전환 전 완료해둘 것)

- [x] `new.workupkorea.com` 서브도메인 테스트 (메이크샵 어드민에 CNAME 등록)
- [x] 카카오 Web 플랫폼 JavaScript SDK 도메인에 `https://www.workupkorea.com`, `https://workupkorea.com`, `https://new.workupkorea.com` 등록 완료
- [x] 메일서버 미사용 확인 → MX/SPF 무시 가능
- [ ] `NEXT_PUBLIC_SITE_URL` 임시 설정 (위 1번)
- [ ] `next.config.ts`에 301 리다이렉트 코드 작성 및 배포 (위 3번)
- [ ] `db.workupkorea.com` 용도 확인 (HSTS·레코드 유지 여부 판단)
- [ ] Meta 비즈니스 관리자에서 `workupkorea.com` 도메인 인증 (Meta 픽셀 사용 시)

---

## 전환 당일 진행 순서

### 1단계. 가비아 DNS 패널 정리
- `MX`, `TXT`(하이웍스) → 메일 미사용이므로 **삭제**
- `A db 121.254.168.75` → 용도 확인 후 유지/삭제
- `A @`, `A www` (211.43.203.11) → 아래 4단계에서 Vercel 값으로 교체

### 2단계. 네임서버 변경 (메이크샵 → 가비아)
My가비아 → 도메인 → 네임서버 설정
```
변경 전: ns1.makeshop.kr / ns1.makeshop.com / ns2.makeshop.kr / ns2.makeshop.com
변경 후: 가비아 기본 네임서버
```
전파까지 최대 24~48시간. 이 시점부터 구 홈페이지는 필요 없으므로 중간에 잠깐 안 보여도 무방.

### 3단계. Vercel 도메인 연결
1. `web-site` 프로젝트 → Settings → Domains → Add
2. `www.workupkorea.com` 추가 (Connect to an environment → Production)
3. `workupkorea.com` (apex) 추가 → **www로 301 리다이렉트** 설정
4. Vercel이 안내하는 정확한 레코드 값 확인 (apex는 A 레코드일 수 있음)

### 4단계. 가비아 DNS에 Vercel 레코드 등록
```
CNAME   www   [Vercel이 안내하는 값].   (마침표 필수)
A       @     [Vercel이 안내하는 apex IP]
```

### 5단계. Vercel 환경변수 교체
```
NEXT_PUBLIC_SITE_URL = https://www.workupkorea.com
```
Production 적용 → 저장 → **재배포 필수**

### 6단계. DNS 반영 대기
Vercel Domains 화면에서 `www.workupkorea.com`, `workupkorea.com` 둘 다 "Valid Configuration"(초록색) 확인.

---

## 전환 후 검증

### 기능
- [ ] `https://www.workupkorea.com` → 리뉴얼 사이트 정상 노출
- [ ] `https://workupkorea.com` → www로 301 리다이렉트
- [ ] `http://www.workupkorea.com` → https로 301 리다이렉트
- [ ] 카카오맵(매장 위치) 정상 로딩
- [ ] 카카오톡 공유 시 OG 미리보기(제목/이미지) 정상 노출
- [ ] 모바일: 매장찾기 → 길찾기 / 전화 문의 / 카카오톡 상담 버튼 정상 작동
- [ ] Google Safe Browsing 경고 해소 확인 (`*.vercel.app` 공유도메인 오탐 이슈)
- [ ] `db` 레코드로 연결되던 서비스가 있었다면 정상 작동 확인

### SEO
- [ ] `https://www.workupkorea.com/robots.txt` → Sitemap 주소가 www로 정확히 출력
- [ ] `https://www.workupkorea.com/sitemap.xml` → 모든 `<loc>`이 www 주소
- [ ] 구 URL 301 확인: `curl -I http://www.workupkorea.com/index.html` → 301 → `/`
- [ ] 구 URL 301 확인: `/shop/shopbrand.html?type=X&xcode=004` → 301 → `/products`
- [ ] 구글 서치콘솔 sitemap 제출 + 색인 생성 요청
- [ ] 네이버 서치어드바이저 사이트 등록 + sitemap 제출 + 수집 요청
- [ ] [리치 결과 테스트](https://search.google.com/test/rich-results)로 매장 페이지 LocalBusiness 구조화 데이터 검증
- [ ] 전환 후 1~2주간 서치콘솔 "적용 범위" 리포트에서 404 급증 여부 모니터링

### 분석/광고
- [ ] Vercel Analytics / Speed Insights — 도메인 변경 시 통계가 새 도메인 기준으로 분리 집계됨 (데이터 손실 아님, 비교 시 감안)
- [ ] GA4 데이터 스트림 설정 확인
- [ ] Meta 픽셀 — 비즈니스 관리자 도메인 인증 상태 확인
- [ ] 네이버·카카오 픽셀 정상 수집 확인

---

## 문제 발생 시 롤백

- 네임서버를 메이크샵 값으로 되돌리면 구 홈페이지로 복구 (전파 최대 24~48시간)
- **메이크샵을 이미 종료했다면 되돌릴 수 없다. 네임서버 전환은 반드시 메이크샵 완전 종료 전에 끝낼 것.**

---

## 주의사항 — 다중 PC 동기화

이 문서는 auto-sync로 자동 commit/push된다. 회사 PC와 집 PC를 오가며 작업 시 **시작 전 반드시 `git pull` 먼저 실행**할 것. 그렇지 않으면 다른 PC의 오래된 상태가 이 파일을 덮어써서 삭제된다 (2026-07-09 실제 발생: 14:47 생성 → 14:49 다른 PC 동기화로 삭제).
