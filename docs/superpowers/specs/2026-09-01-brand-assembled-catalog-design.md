# 브랜드별 조립형 카탈로그 (Brand Assembled Catalog) — 설계

작성일: 2026-09-01
상태: 설계 승인 대기

## 1. 배경 / 목적

입점 업체가 완성된 PDF 카탈로그를 통일된 형태로 주지 않고, 낱개 소재(착장컷·컬러별 누끼컷·기술서 이미지)와 텍스트 정보만 전달하는 경우가 많다.
관리자가 이미지 + 정보만 입력하면, 사이트가 **브랜드별로 통일된 디자인의 세로 스크롤 카탈로그**를 자동 렌더링하도록 한다.

이 프로젝트는 오프라인 방문 유도형 디지털 카탈로그이므로, 조립형 카탈로그의 각 제품에는 매장 방문·전화·카카오톡·문의 CTA가 붙는다. 온라인 판매 요소는 없다.

### 왜 PDF 업로드가 아니라 웹 입력인가

| 항목 | PDF 업로드(기존 `brand_catalogs`) | 웹 입력(본 설계) |
|---|---|---|
| 통일감 | 업체마다 제각각, 직접 디자인 필요 | 템플릿에 데이터만 주입 → 자동 통일 |
| 모바일 | 평면 이미지, 확대/이동 필요 | 반응형 세로 스크롤 |
| 오프라인 전환 | 제품에 링크/CTA 불가 | 제품마다 매장/전화/카톡/문의 CTA |
| SEO | 텍스트 없음 | 제품명·설명이 실제 텍스트 |
| 수정 | 한 제품만 바꿔도 전체 재출력·재업로드·재변환 | 해당 제품만 수정 |

## 2. 범위

### 신규 파일
- `app/brands/[id]/catalog/page.tsx` — 공개 카탈로그 페이지 (서버 컴포넌트)
- `app/admin/brands/[id]/catalog/page.tsx` — 관리자 편집기 (클라이언트 컴포넌트)
- `app/api/admin/brand-catalog/route.ts` — 카탈로그 메타(브랜드 단위) GET/PATCH
- `app/api/admin/brand-catalog/items/route.ts` — 제품 항목 GET(브랜드별)/POST
- `app/api/admin/brand-catalog/items/[itemId]/route.ts` — 제품 항목 PATCH/DELETE
- `components/BrandCatalogView.tsx` — 공개 렌더 컴포넌트 (커버·목차·제품 섹션·기술서·CTA), 서버 컴포넌트
- `components/BrandCatalogItem.tsx` — 제품 1개 렌더 + 컬러 교체 상태만 담당하는 작은 클라이언트 컴포넌트
- `data/brandCatalog.ts` — 타입 정의 + 빈 값 상수 (DB 행과 snake_case 1:1)
- `supabase/migrate_add_brand_catalog.sql` — 스키마 마이그레이션 (사용자가 Supabase SQL Editor에서 1회 실행)

### 수정 파일
- `app/brands/[id]/page.tsx` — 카탈로그가 공개 상태이고 제품이 1개 이상이면 "카탈로그 보기" 버튼/링크 노출
- `app/admin/brands/page.tsx` — 브랜드 목록/편집에서 `/admin/brands/[id]/catalog` 편집 진입 링크 추가

### 건드리지 않는 것
- 기존 `catalog_pages`(`/catalog` WORKUP 플립북)
- 기존 `brand_catalogs`(업체 PDF 뷰어, `/brands/[id]` 내 PDF 섹션)

## 3. 데이터 모델

### 3.1 `brands` 테이블에 컬럼 추가 (카탈로그 메타)

브랜드 1개 = 카탈로그 1개이므로 별도 메타 테이블 대신 기존 `brands` 행에 컬럼을 추가한다(기존 `migrate_patch_brands_columns` 패턴과 동일).

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `catalog_enabled` | boolean | false | 공개 여부. false면 공개 페이지 404 + 브랜드 페이지 버튼 숨김 |
| `catalog_cover_url` | text | '' | 커버 배경 이미지 (텍스트 없는 순수 비주얼) |
| `catalog_season` | text | '' | 예 "2026 Spring / Summer" |
| `catalog_headline` | text | '' | 커버에 HTML로 얹는 제목 (비우면 브랜드명 사용) |
| `catalog_intro` | text | '' | 커버 하단 소개 문단, `<meta description>` 소스 |
| `catalog_tech_images` | jsonb | `[]` | 카탈로그 맨 끝에 붙는 공용 기술서 이미지 URL 배열 |
| `catalog_updated_at` | timestamptz | now() | 편집 시각 |

### 3.2 신규 테이블 `brand_catalog_items`

제품 1개 = 1행 = 공개 페이지의 섹션 1개.

```sql
CREATE TABLE IF NOT EXISTS brand_catalog_items (
  id          TEXT PRIMARY KEY,
  brand_id    TEXT NOT NULL,                 -- brands.id 참조(문자/숫자 혼용이므로 FK 제약 없이 논리 참조)
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  category    TEXT NOT NULL DEFAULT '',      -- 그룹명(상의·하의…). 있으면 섹션으로 묶고 목차에 표시
  name        TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',      -- 한 줄 설명
  description TEXT NOT NULL DEFAULT '',      -- 상세 설명(선택)
  price       TEXT NOT NULL DEFAULT '',      -- 비우면 "가격 문의"
  specs       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{label,value}]
  colors      JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 아래 ColorVariant[]
  tech_images JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 이 제품 전용 기술서 이미지 URL[]
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

`id`는 기존 테이블들처럼 애플리케이션이 생성하는 TEXT(예: `crypto.randomUUID()`).

### 3.3 타입 (`data/brandCatalog.ts`)

```ts
export type CatalogSpec = { label: string; value: string };

export type CatalogColorVariant = {
  key: string;          // 해시 딥링크용 슬러그 (예: "black"), 항목 내 유일
  label: string;        // 표시명 (예: "블랙")
  swatch?: string;      // 색상칩 hex (선택)
  cutout_url: string;   // 누끼컷 (컬러 칩 썸네일)
  styled_url: string;   // 착장컷 (선택 시 큰 이미지). 비면 cutout_url 사용
  gallery?: string[];   // 추가 이미지(선택)
};

export type BrandCatalogItem = {
  id: string;
  brand_id: string;
  sort_order: number;
  is_visible: boolean;
  category: string;
  name: string;
  summary: string;
  description: string;
  price: string;
  specs: CatalogSpec[];
  colors: CatalogColorVariant[];
  tech_images: string[];
};

export type BrandCatalogMeta = {
  enabled: boolean;
  cover_url: string;
  season: string;
  headline: string;
  intro: string;
  tech_images: string[];
};

export const EMPTY_CATALOG_ITEM: Omit<BrandCatalogItem, "id" | "brand_id"> = {
  sort_order: 0, is_visible: true, category: "",
  name: "", summary: "", description: "", price: "",
  specs: [], colors: [], tech_images: [],
};

export const EMPTY_COLOR_VARIANT: CatalogColorVariant = {
  key: "", label: "", swatch: "", cutout_url: "", styled_url: "", gallery: [],
};
```

목차는 저장하지 않고 `items`에서 파생한다.

## 4. 공개 페이지 (`/brands/[id]/catalog`)

`[id]`는 기존 `/brands/[id]`와 동일하게 브랜드명(대소문자 무시 조회)이다. 새 중첩 라우트를 추가한다.

### 4.1 데이터 로드

- `noStore()` (관리자 수정 즉시 반영, 기존 `/catalog`·`/brands/[id]` 패턴과 동일)
- 브랜드 조회(`brands` `ilike name`) → `catalog_enabled` false거나 브랜드 없음 → `notFound()`
- `brand_catalog_items` where `brand_id` = 브랜드 id, `is_visible` = true, `sort_order` 오름차순
- 항목 0개 → `notFound()` (버튼도 이 조건으로 숨김 → 빈 페이지 노출 안 됨)

### 4.2 레이아웃 (세로 스크롤, 위 → 아래)

1. **커버**
   - 풀블리드 `catalog_cover_url` (커버 없으면 브랜드 `accent_color` 단색 배경)
   - HTML/CSS 레이어로 얹기: 브랜드 로고(`brand.logo_url`) 또는 `catalog_headline`(비면 브랜드명), `catalog_season`, `catalog_intro`
   - 이미지 내부에는 어떤 텍스트도 넣지 않음 (프로젝트 규칙)
   - 하단 스크롤 유도 표시
2. **목차**
   - `category`가 있는 항목은 카테고리로 그룹, 없으면 "제품" 단일 그룹
   - 각 항목 → `#item-<id>` 앵커로 스무스 스크롤
   - 스크롤이 커버를 벗어나면 상단에 고정되는 축약 목차 바 (브랜드 accent 색). 현재 섹션 하이라이트
3. **제품 섹션** — 카테고리 헤딩 + 항목들. 각 항목(`<BrandCatalogItem>`):
   - 큰 이미지: 선택된 컬러의 `styled_url`(없으면 `cutout_url`). 첫 진입 시 첫 번째 컬러
   - 컬러 칩 줄: 각 컬러의 `cutout_url` 썸네일 + `label`(+ `swatch` 있으면 점). 탭 → 큰 이미지 교체 + `history.replaceState`로 URL 해시를 `#item-<id>-<colorKey>`로 갱신 (컬러 딥링크 공유용)
   - 페이지 로드시 해시가 `#item-<id>-<colorKey>`면 해당 컬러 선택 상태로 시작
   - 제품명 `<h2>`, `summary`, `description`, 스펙 표(`specs`), 가격(`price` 없으면 "가격 문의")
   - `gallery` 이미지가 있으면 큰 이미지 아래 썸네일 나열
   - CTA 행: 가까운 매장 찾기(`/store`) · 전화 · 카카오톡 · 제품 문의 — 브랜드 페이지에서 쓰는 기존 CTA 컴포넌트/링크 재사용
   - 이 제품 `tech_images`가 있으면 섹션 끝에 풀폭 이미지
4. **공용 기술서** — `catalog_tech_images` 풀폭 이미지 순서대로
5. **하단 CTA** — 매장 방문·문의 유도 블록 (기존 카탈로그 빈 상태 CTA와 톤 일치)

### 4.3 클라이언트 / 서버 경계

- 페이지·`BrandCatalogView`는 서버 컴포넌트 (SEO: 제품명·설명·스펙이 초기 HTML에 포함)
- `BrandCatalogItem`만 클라이언트 컴포넌트 — 담당: 선택 컬러 `useState`, 칩 클릭 핸들러, 해시 동기화, 큰 이미지 `src` 스왑
- 상단 고정 목차 바의 스크롤 감지도 작은 클라이언트 컴포넌트(`CatalogTocBar`)로 분리 가능

## 5. 관리자 편집기 (`/admin/brands/[id]/catalog`)

기존 `/admin/catalog`(594줄, 이미지 업로드 + 드래그 정렬 + 실시간 미리보기)를 참고 패턴으로 삼는다.

### 5.1 화면 구성

- **카탈로그 설정**: 공개 토글, 커버 이미지 업로드, 시즌, 헤드라인, 인트로
- **제품 목록**: 카드 리스트, 드래그로 `sort_order` 변경, 항목별 표시/숨김 토글, 추가/수정/삭제
- **제품 편집 폼**:
  - 기본: 카테고리, 제품명, 한 줄 설명, 상세 설명, 가격
  - 스펙: `label`/`value` 행 추가·삭제
  - 컬러: 컬러 추가 → 라벨, 색상칩(color input, 선택), 누끼컷 업로드, 착장컷 업로드, 갤러리 이미지 추가. `key`는 라벨에서 슬러그 자동 생성(중복 시 `-2` 등 접미사)
  - 이 제품 전용 기술서 이미지 업로드 목록
- **공용 기술서**: 카탈로그 끝 기술서 이미지 업로드 목록
- **우측 미리보기**: 공개 `BrandCatalogView` / `BrandCatalogItem` 재사용

### 5.2 API (기존 `app/api/admin/*/route.ts` 패턴 준수)

모든 핸들러: `isAdmin()` 체크 → 실패 시 401, `createAdminClient()` 사용, 변경 시 `logAudit({ action, resource: "brand-catalog", ... })`.

| 메서드·경로 | 동작 |
|---|---|
| `GET /api/admin/brand-catalog?brandId=` | 메타(brands 행의 catalog_* ) + items 목록 |
| `PATCH /api/admin/brand-catalog` | body: `{ brandId, meta }` → `brands` 행의 catalog_* 컬럼 업데이트 |
| `GET /api/admin/brand-catalog/items?brandId=` | 항목 목록 |
| `POST /api/admin/brand-catalog/items` | 항목 생성 (id 서버 생성 가능) |
| `PATCH /api/admin/brand-catalog/items/[itemId]` | 항목 수정 |
| `DELETE /api/admin/brand-catalog/items/[itemId]` | 항목 삭제 |

- 이미지 업로드: 기존 `POST /api/admin/upload`(R2, 4MB 제한) 그대로 사용. 반환 `url`을 각 필드에 저장. 표시는 `ikSrc()`(ImageKit) 경유.
- 정렬 저장: 항목 배열 순서를 PATCH로 각 `sort_order` 반영 (기존 catalog 편집기 방식과 동일).

## 6. 마이그레이션 (`supabase/migrate_add_brand_catalog.sql`)

기존 마이그레이션 파일 규칙 준수:

```sql
-- brands 카탈로그 메타 컬럼
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_enabled     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_cover_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_season      TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_headline    TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_intro       TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_tech_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_updated_at  TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS brand_catalog_items ( ... 3.2 참조 ... );
CREATE INDEX IF NOT EXISTS brand_catalog_items_brand_idx ON brand_catalog_items (brand_id, sort_order);

GRANT ALL ON TABLE brand_catalog_items TO anon, authenticated, service_role;
ALTER TABLE brand_catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brand_catalog_items;
CREATE POLICY "public_read" ON brand_catalog_items FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
```

**사용자가 Supabase SQL Editor에서 1회 직접 실행한다.** (프로젝트 규칙: DB에 큰 영향을 주는 작업은 사전 고지 + 사용자 실행)

## 7. SEO

- `generateMetadata`: title `"{브랜드명} 카탈로그 | WORKUP"`, description = `catalog_intro`(없으면 브랜드 `description`), OpenGraph 이미지 = `catalog_cover_url`
- 제품명 `<h2>`, 카테고리 `<h3>` 등 시맨틱 마크업. 설명·스펙은 실제 텍스트
- `alt`: `"{브랜드명} {제품명} {컬러 라벨}"`. 커버 `alt`는 `"{브랜드명} 카탈로그 커버"`
- JSON-LD: `BreadcrumbList`(홈 > 브랜드 > {브랜드} 카탈로그) + `Brand`. 개별 `Product` 스키마는 2차 과제
- 지역 검색 유입을 위해 하단 CTA에서 `/store` 링크 유지

## 8. 성능

- 서버 렌더 우선, 컬러 교체 아일랜드만 클라이언트
- `ikSrc()` 반응형 폭 지정, 커버만 `priority`, 나머지 `loading="lazy"`
- 컬러 큰 이미지: 선택된 것만 즉시 로드, 나머지 컬러의 `styled_url`은 프리로드하지 않음(칩 탭 시 로드)
- 신규 라이브러리 도입 없음

## 9. 테스트 계획

로컬 `npm run dev`:
1. 마이그레이션 SQL 실행 후, 관리자에서 브랜드 하나에 제품 2개(각 컬러 2개), 제품별 기술서 1장, 공용 기술서 1장 등록, 공개 토글 ON
2. `/brands/[id]/catalog` 접속 → 커버·목차·제품 섹션·기술서·하단 CTA 렌더 확인
3. 컬러 칩 탭 → 큰 이미지 교체, URL 해시 `#item-<id>-<colorKey>` 갱신 확인
4. 해당 해시 URL 새로고침 → 그 컬러 선택 상태로 진입
5. 목차 항목 탭 → 해당 섹션 스크롤, 상단 고정 목차 바 동작
6. 모바일 뷰포트(375px) → 레이아웃·터치 영역(44px)·CTA 확인
7. 공개 토글 OFF 또는 항목 0개 → `/brands/[id]`에 버튼 없음, `/brands/[id]/catalog` 404
8. `npm run build` — 타입 오류·린트 통과
9. 관리자 API: 비로그인 요청 → 401

## 10. 하지 않는 것 (YAGNI)

- PDF 내보내기 / 인쇄용 레이아웃
- 컬러별 독립 URL 페이지 (해시 딥링크로 충분)
- `/catalog` 플립북 뷰어에 합류
- 장바구니 · 구매 · 결제 · 주문 관련 일체
- 개별 제품 `Product` JSON-LD (2차)
- 다국어

## 11. 리스크

| 리스크 | 대응 |
|---|---|
| `brands.id` 타입 혼용(string \| number) | `brand_id`는 TEXT, 저장·조회 시 문자열로 캐스팅 |
| 컬러 `key` 중복 → 해시 충돌 | 라벨 슬러그화 + 항목 내 유일성 보장(접미사) |
| 커버/기술서에 텍스트 박힌 이미지가 업로드될 수 있음 | 편집기 안내 문구로 규칙 고지(강제는 아님) |
| 이미지 다수 업로드로 R2/ImageKit 트래픽 증가 | 관리자가 넣는 만큼만 발생, 대량 재업로드 아님. 편집기에서 4MB 제한 안내 |
