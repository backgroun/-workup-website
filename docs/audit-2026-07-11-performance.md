# WORKUP 사이트 성능·트래픽 감사 리포트

- 작성일: 2026-07-11
- 범위: 프로덕션(web-site-five-mu.vercel.app) 실측 + 소스 코드 정독
- 초점: **트래픽(대역폭)을 많이 소모하는 요소**와 로딩 성능(Core Web Vitals)
- 상태: **분석만 수행, 코드 미수정.** (수정은 항목별 승인 후 진행)
- 참고: 2026-06-24 전체 감사(docs/audit-2026-06-24.md)의 후속. 보안·전환 항목 중
  이번에 재확인한 것만 §5에 기록.

---

## 0. 요약 (Executive Summary)

| # | 영역 | 심각도 | 한 줄 요약 | 예상 절감 |
|---|------|--------|------------|-----------|
| P1 | 이미지 | 🔴 최상 | 원본(1600×1600, ~110KB)을 220~280px 카드에 그대로 전송 — 공개 페이지 raw `<img>` 다수 | 이미지 트래픽 **약 85%↓** (실측 117KB→16.7KB) |
| P2 | 이미지 | 🔴 높음 | `/public` 대형 원본 직접 서빙 — hero-new-arrivals.png **1.8MB**, story-*.jpg 7장 **700~900KB** | /story 1회 방문 ~5MB → ~0.7MB |
| P3 | 서버 | 🔴 높음 | 홈 TTFB **1.6초**(워밍 3회 실측) — `force-dynamic` + 매 요청 Supabase 쿼리, CDN 캐시 항상 MISS | TTFB 1.6s → CDN HIT 시 ~0.1s |
| P4 | API | 🟡 중간 | `/api/products`가 캐시 불가(no-store) + 전 컬럼 응답(비압축 111KB) — 홈·제품목록마다 재전송 + Supabase 쿼리 | 전송량·DB 쿼리 대폭↓ |
| P5 | 비디오 | 🟡 중간 | 히어로 비디오 슬라이드가 PC용+모바일용 `<video autoPlay>`를 **동시 렌더**(CSS로만 숨김) → 이중 다운로드 | 비디오 트래픽 최대 50%↓ |
| P6 | 이미지 | 🟡 중간 | 카탈로그 플립북·상세 이미지도 원본 그대로 (P1과 동일 원인) | P1과 동일 처리 |
| P7 | 폰트/JS | 🟢 낮음 | 폰트 CSS·admin 전용 무거운 라이브러리는 실측상 영향 미미 (양호에 가까움) | — |
| S† | 보안 이월 | 🔴 치명 | `wu-member` 무서명 쿠키를 **관리자 인증이 그대로 신뢰** — 쿠키 위조 시 관리자 권한 탈취 가능 | (트래픽 무관, §5) |

---

## 1. 실측 데이터 (2026-07-11, 프로덕션)

### 1-1. 페이지 응답

| 경로 | 전송(gzip) | 비압축 | 비고 |
|------|-----------|--------|------|
| `/` | 24KB | 206KB | TTFB 1.61~1.69s (3회), `x-vercel-cache: MISS` 고정 |
| `/api/products` | 14.5KB | 111KB | 제품 35개 전 컬럼, `max-age=0, must-revalidate` |
| `/products` | 18KB | 222KB | |
| `/store` | 26.5KB | 238KB | |

HTML/JSON 자체는 양호. **문제는 이미지·서버 렌더링 지연.**

### 1-2. 이미지

| 자원 | 실측 | 표시 크기 | 문제 |
|------|------|-----------|------|
| 제품 이미지(ImageKit) | 1600×1600, 88~125KB/장 | 220~280px 카드 | 원본 그대로 전송 |
| 동일 이미지 + `?tr=w-440,q-80,f-auto` | **16.7KB** | — | 변환만 붙여도 86% 절감 확인 |
| 홈 히어로(ImageKit) | 1672×941, 302KB | 전체폭 | LCP 요소인데 raw `<img>`, preload 없음 |
| `/images/hero-new-arrivals.png` | **1.8MB** | 에디토리얼 히어로 | PNG 원본 직접 서빙 |
| `/images/story-*.jpg` 7장 | 700~900KB/장 | /story 페이지 | 1회 방문 = 약 5MB |

- ImageKit 변환 파라미터(`?tr=`)는 **현재 계정에서 동작 확인됨** (별도 설정 불필요).
- `next.config.ts`의 `images` 설정(AVIF/WebP, 31일 TTL, ImageKit/Supabase remotePatterns)은 이미 올바르게 준비되어 있으나, 정작 대부분의 공개 컴포넌트가 `next/image`를 쓰지 않아 무용지물.

---

## 2. 트래픽 주범 상세

### P1. 🔴 raw `<img>` + 원본 URL — 최대 트래픽 소모원
- 전수: `<img` 93곳 / 42파일. 이 중 **공개 페이지** 핵심:
  - `components/HeroCarousel.tsx:190,201` — 홈 히어로 (LCP 직결)
  - `components/HomeNewArrivals.tsx:193,240` — 홈 신상품 카드 (280px에 1600px 원본)
  - `components/HomeCategoryGrid.tsx`, `components/PopupBanner.tsx:203`
  - `components/StorySectionView.tsx` 6곳, `components/PeopleGrid.tsx` 4곳
  - `components/CatalogPageView.tsx` 3곳, `components/UnifiedCatalogViewer.tsx:62,208`
  - `components/ProductTabs.tsx` 4곳 (상세 이미지 — `loading="lazy"`는 있음)
- 이미 `next/image`를 쓰는 곳(양호): `ProductsGrid`, `ProductDetailClient`,
  `ProductImageGallery`, `Header`, `Footer`, `FeatureProductGrid`, `CartView`.
- 수정 방안 (택1, 혼용 가능):
  - **A. `next/image` 전환** — srcset·AVIF/WebP·lazy 자동. 단 Vercel 이미지 최적화
    호출량이 과금 대상(Image Optimization Transformations)이므로 트래픽이 커지면 비용 검토.
  - **B. ImageKit URL 변환 헬퍼** — `lib/image-url.ts`에
    `ikResize(url, w)` 하나 만들어 `?tr=w-{w},q-80,f-auto` 부여 + `<img loading="lazy" decoding="async">`.
    변경 최소·CDN 비용은 ImageKit 무료쿼터 활용. **권장: 카드/썸네일류는 B, LCP 히어로는 A(priority).**
- 예상 효과: 홈 첫 화면 이미지 전송량 약 3~4MB → 0.5MB 수준.

### P2. 🔴 `/public` 대형 원본
- `public/images/hero-new-arrivals.png` **1.8MB** — `data/editorial.ts:299`에서 에디토리얼 히어로로 사용(`FeatureHeroLayout` raw `<img>`).
- `public/images/story-*.jpg` 7장 700~900KB — `data/story.ts`에서 /story 섹션들에 사용.
- 수정 방안: ① 원본을 적정 해상도 WebP로 재저장(사전 최적화, 스크립트 1회), ② 해당 컴포넌트 `next/image` 전환(로컬 파일은 Vercel 최적화 자동 적용). 둘 다 하면 최선.

### P3. 🔴 홈 TTFB 1.6초 — 서버 렌더링 병목
- `app/page.tsx:13` `export const dynamic = "force-dynamic"` → 매 요청 SSR, CDN 캐시 불가(`x-vercel-cache: MISS` 고정).
- 매 요청 실행되는 것: `components/Hero.tsx:35` `noStore()` + Supabase `hero_slides` 쿼리. (레이아웃의 topbar/footer/nav 등 6개 설정은 `unstable_cache`로 이미 캐시됨 — 양호.)
- 수정 방안: Hero 조회를 `unstable_cache`(tag: `hero_slides`, 관리자 저장 시 `revalidateTag`)로 전환하고 `force-dynamic` 제거 → ISR/정적 + 태그 무효화. 스케줄 노출(scheduled_start/end)은 `revalidate: 60` 수준으로 보완.
- 효과: 첫 페이지 체감 로딩 1.5초 단축 = 모바일 이동 중 검색 사용자의 이탈 감소(오프라인 전환 직결).

### P4. 🟡 `/api/products` — 캐시 불가 + 과대 응답
- `app/api/products/route.ts:5` `revalidate = 0` → 홈(`HomeNewArrivals`)·제품목록(`ProductsGrid`)·admin에서 방문마다 전량 재전송 + Supabase 쿼리.
- `select("*")` → 목록에 불필요한 `description`, `detailBlocks`, `sizeGuide` 등까지 포함(비압축 111KB, 제품 늘수록 비례 증가).
- 수정 방안:
  - 응답에 `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` 부여(또는 `revalidate = 300`) — Vercel 엣지 HIT로 전환.
  - 목록용 필드 화이트리스트(id, name, sku, line, price, imageUrl, category, colors, sizes, isNew, tagline 등)로 분리. 상세는 기존 유지.
- 관리자 수정 즉시 반영이 필요하면 저장 API에서 `revalidateTag("products")` 패턴(이미 site-settings에서 쓰는 방식과 동일)으로 해결.

### P5. 🟡 히어로 비디오 이중 로드 (잠재)
- `components/HeroCarousel.tsx:160~186` — 슬라이드마다 PC용·모바일용 `<video autoPlay preload="metadata">` 2개를 모두 렌더하고 CSS(`hidden md:block` / `md:hidden`)로만 숨김. `display:none`이어도 `autoPlay`가 걸린 비디오는 다운로드가 진행됨 → 모바일 사용자가 PC용 비디오까지 받음.
- 현재 프로덕션 히어로는 이미지 1장이라 당장 발생하진 않지만, 관리자가 비디오 슬라이드를 올리는 순간 최대 트래픽원이 됨.
- 수정 방안: `matchMedia("(min-width:768px)")` 기준으로 해당 뷰포트용 `<video>` 하나만 렌더 + 비활성 슬라이드는 `preload="none"` + `poster` 지정.

### P6. 🟡 카탈로그 플립북
- `UnifiedCatalogViewer`/`BrandCatalogViewer`/`CatalogFlipBook`(react-pageflip)이 전 페이지를 `<img>`로 렌더. `loading="lazy"`가 있어도 플립북 구조상 상당수가 즉시 로드되며, 페이지 스캔 이미지가 원본 해상도면 카탈로그 1권 열람에 수십 MB 가능.
- 수정 방안: P1-B 헬퍼로 페이지 이미지에 `tr=w-1200,q-80,f-auto` 적용(뷰어 표시폭 기준). 표지±2페이지만 즉시, 나머지는 지연 로드.

### P7. 🟢 영향 미미 확인 (양호)
- **폰트**: Google Fonts 10패밀리 + Pretendard CDN CSS — CSS 자체는 압축 1KB 미만이며 폰트 파일은 unicode-range로 사용 시에만 로드. 본문 폰트는 `next/font`(Noto Sans KR, display:optional)로 이미 최적. 우선순위 낮음. (장식 폰트 10종이 전 페이지에 필요한지는 추후 정리 여지)
- **무거운 라이브러리**: `xlsx`(admin 4곳)·`pdf-lib`(admin 1곳)는 해당 admin 라우트 번들에만 포함(Next 라우트 단위 분리), `tesseract.js`는 동적 import(`lib/sizeGuideOcr.ts:90`) — 공개 페이지 번들 오염 없음.
- **기타 양호**: 보안 헤더, robots/sitemap, Vercel Analytics + Speed Insights 탑재, `poweredByHeader: false`, 이미지 캐시 TTL 31일.

---

## 3. 권장 실행 순서 (트래픽 절감 크기순)

1. **P1-B: ImageKit 변환 헬퍼 + 공개 컴포넌트 일괄 적용** — 변경 최소, 절감 최대(~85%).
2. **P3: 홈 force-dynamic 제거 + Hero 캐시(tag 무효화)** — TTFB 1.6s 해소, 모바일 이탈 감소.
3. **P2: /public 대형 이미지 사전 압축 + next/image** — /story·에디토리얼 5MB→1MB 미만.
4. **P4: /api/products 엣지 캐시 + 목록 필드 경량화.**
5. **P5·P6: 비디오 단일 렌더 / 플립북 지연 로드** — 예방적 조치.
6. (별도, §5) **회원 세션 쿠키 서명** — 트래픽과 무관하나 심각도 최상.

각 단계는 독립적이라 항목별 승인 후 개별 PR로 진행 가능.

---

## 4. 검증 방법 (수정 시)

- 수정 전/후 `curl -w`로 TTFB·전송량 비교, Chrome DevTools Network 총 전송량 비교(홈, /products, /story, 카탈로그 1권).
- Vercel Speed Insights에서 LCP/CLS 추이 확인(이미 탑재됨).
- 관리자에서 히어로/신상품/카탈로그 저장 → 공개 페이지 반영 시간 확인(캐시 무효화 동작).
- 모바일(저속 3G 스로틀)에서 첫 화면 CTA 노출까지 시간 측정.

---

## 5. 2026-06-24 감사 이월 항목 재확인

| 항목 | 상태 |
|------|------|
| S1. 회원 PII GET 무인증 | ✅ **수정 확인** — `app/api/admin/members/route.ts` GET에 `isAdmin()` 적용됨 |
| S3. 공개 API 공급가 노출 | ✅ **수정 확인** — `app/api/products/route.ts` `toPublic()`이 `supplyPrice` 제거 |
| S2. 회원 세션 쿠키 무서명 | 🔴 **미해결 + 악화** — `wu-member`가 여전히 회원 id 원문(`app/api/member/login/route.ts:33`). 그런데 새 관리자 인증(`lib/admin-auth.ts`)이 이 쿠키의 grade="관리자" 여부로 admin 전체를 보호 → **쿠키에 관리자 회원 id를 넣으면 관리자 권한 획득 가능.** HMAC 서명(또는 세션 테이블) 도입 시급. |
| 기타(C1~C5, B1~B4) | 이번 감사 범위 외 — 6월 리포트 기준으로 별도 진행 필요 |

---

> 본 리포트는 분석 결과이며, 실제 코드 수정은 승인 후 항목별로 진행합니다.
