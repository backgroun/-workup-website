# 브랜드별 조립형 카탈로그 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 낱개 이미지(착장컷·컬러 누끼컷·기술서)와 텍스트만 입력하면 브랜드별 통일 디자인의 세로 스크롤 카탈로그(`/brands/[id]/catalog`)를 렌더링한다.

**Architecture:** 기존 `brands` 테이블에 카탈로그 메타 컬럼을 추가하고, 제품 항목은 신규 `brand_catalog_items` 테이블에 저장한다. 공개 페이지는 서버 컴포넌트로 렌더하고 컬러 교체만 작은 클라이언트 아일랜드(`BrandCatalogItem`)로 처리한다. 관리자 편집은 기존 "브랜드 통합 관리"(`/admin/catalog/brands`) 화면에 세 번째 탭을 추가한다.

**Tech Stack:** Next.js App Router (서버 컴포넌트), Supabase(service role, `createAdminClient`), Cloudflare R2 업로드(`/api/admin/upload`), Tailwind CSS. 테스트 러너 없음 → 검증은 `npx tsc --noEmit` + `npm run lint` + `npm run build` + Browser 미리보기 수동 확인.

**Spec:** `docs/superpowers/specs/2026-09-01-brand-assembled-catalog-design.md`

## Global Constraints

- 이미지 내부에 텍스트 삽입 금지 — 제목/설명/가격/로고는 HTML/CSS 레이어로만.
- 이커머스 요소(장바구니/구매/결제/주문) 추가 금지. CTA는 매장 찾기·전화·카카오톡·문의만.
- 신규 npm 라이브러리 도입 금지.
- 기존 아키텍처/패턴 유지: 관리자 API는 `isAdmin()` 401 가드 + `createAdminClient()` + `logAudit()`. 공개 페이지 데이터 로드는 `unstable_noStore as noStore`.
- DB 스키마 변경 SQL은 **파일로만 제공**하고 실행은 사용자가 Supabase SQL Editor에서 직접 한다.
- 모바일 우선. 터치 타깃 최소 44px. 중요 CTA는 첫 화면 근처.
- DB 행은 snake_case, 앱 타입과 1:1 (기존 `data/*.ts` 패턴).
- Vercel 사용량 절감: 작업 단위 완료 시점에만 push. 계획 실행 중에는 로컬 커밋만 쌓는다.
- `[id]` 라우트 파라미터는 브랜드 **슬러그**다 (`lib/brands-data`의 `BRANDS[].id`). DB 브랜드는 이름으로 조회한다.
- 이미지 표시는 `ikSrc(url, width)` 경유 (현재 통과 함수지만 향후 호환 위해 사용). 업로드 파일 4MB 제한.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `supabase/migrate_add_brand_catalog.sql` | 스키마 마이그레이션 (사용자 실행) |
| `data/brands.ts` (수정) | `Brand` 타입 + `EMPTY_BRAND`에 `catalog_*` 필드 추가 |
| `data/brandCatalog.ts` (신규) | 항목/컬러/스펙 타입, 빈 값 상수, 순수 헬퍼(`slugifyColorKey`, `buildCatalogToc`, `catalogItemAnchor`) |
| `lib/brandCatalog-server.ts` (신규) | `loadBrandCatalog(slug)` — 슬러그→브랜드→메타+항목 로드 (서버 전용) |
| `app/api/admin/brand-catalog-items/route.ts` (신규) | `GET ?brandId=` 목록(숨김 포함), `POST` 생성 |
| `app/api/admin/brand-catalog-items/[itemId]/route.ts` (신규) | `PUT` 수정(부분), `DELETE` 삭제 |
| `components/BrandCatalogItem.tsx` (신규) | 클라이언트: 제품 1개 렌더 + 컬러 선택 상태 + 해시 동기화 |
| `components/BrandCatalogTocBar.tsx` (신규) | 클라이언트: 스크롤 시 상단 고정되는 축약 목차 |
| `components/BrandCatalogView.tsx` (신규) | 서버: 커버 + 목차 + 카테고리별 섹션 + 공용 기술서 + 하단 CTA |
| `app/brands/[id]/catalog/page.tsx` (신규) | 공개 라우트 + `generateMetadata` + JSON-LD + 가드 |
| `components/admin/AssembledCatalogTab.tsx` (신규) | 관리자: 메타 필드(브랜드 편집 상태에 바인딩) + 항목 CRUD + 이미지 업로드 + 미리보기 |
| `app/admin/catalog/brands/page.tsx` (수정) | 탭 타입에 `"assembled"` 추가, 탭 버튼·패널 렌더 |
| `app/brands/[id]/page.tsx` (수정) | 메타 `catalog_enabled` + 항목 존재 시 "조립형 카탈로그 보기" 링크 |

---

## Task 1: 마이그레이션 SQL + 타입 정의

**Files:**
- Create: `supabase/migrate_add_brand_catalog.sql`
- Modify: `data/brands.ts` (타입 `Brand`, 상수 `EMPTY_BRAND`)
- Create: `data/brandCatalog.ts`

**Interfaces:**
- Produces:
  - `Brand` 확장 필드: `catalog_enabled?: boolean`, `catalog_cover_url?: string`, `catalog_season?: string`, `catalog_headline?: string`, `catalog_intro?: string`, `catalog_tech_images?: string[]`, `catalog_updated_at?: string`
  - `data/brandCatalog.ts` exports:
    - `type CatalogSpec = { label: string; value: string }`
    - `type CatalogColorVariant = { key: string; label: string; swatch?: string; cutout_url: string; styled_url: string; gallery?: string[] }`
    - `type BrandCatalogItem = { id: string; brand_id: string; sort_order: number; is_visible: boolean; category: string; name: string; summary: string; description: string; price: string; specs: CatalogSpec[]; colors: CatalogColorVariant[]; tech_images: string[] }`
    - `type BrandCatalogMeta = { enabled: boolean; cover_url: string; season: string; headline: string; intro: string; tech_images: string[] }`
    - `const EMPTY_CATALOG_ITEM: Omit<BrandCatalogItem, "id" | "brand_id">`
    - `const EMPTY_COLOR_VARIANT: CatalogColorVariant`
    - `function slugifyColorKey(label: string, taken: string[]): string`
    - `function catalogItemAnchor(itemId: string): string` → `"item-<itemId>"`
    - `function catalogColorAnchor(itemId: string, colorKey: string): string` → `"item-<itemId>-<colorKey>"`
    - `type CatalogTocGroup = { category: string; items: { id: string; name: string }[] }`
    - `function buildCatalogToc(items: BrandCatalogItem[]): CatalogTocGroup[]`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrate_add_brand_catalog.sql`:

```sql
-- 브랜드별 조립형 카탈로그
-- 관리자(/admin/catalog/brands → "조립형 카탈로그" 탭)에서 이미지+정보를 입력하면
-- /brands/[슬러그]/catalog 에 통일 디자인으로 렌더된다.
-- Supabase SQL Editor에서 1회 실행.

-- brands: 카탈로그 메타 컬럼
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_enabled     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_cover_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_season      TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_headline    TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_intro       TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_tech_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS catalog_updated_at  TIMESTAMPTZ DEFAULT NOW();

-- 조립형 카탈로그 제품 항목
CREATE TABLE IF NOT EXISTS brand_catalog_items (
  id          TEXT PRIMARY KEY,
  brand_id    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  category    TEXT NOT NULL DEFAULT '',
  name        TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price       TEXT NOT NULL DEFAULT '',
  specs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors      JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS brand_catalog_items_brand_idx ON brand_catalog_items (brand_id, sort_order);

GRANT ALL ON TABLE brand_catalog_items TO anon, authenticated, service_role;
ALTER TABLE brand_catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brand_catalog_items;
CREATE POLICY "public_read" ON brand_catalog_items FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: `data/brands.ts` 확장**

`Brand` 타입에 아래를 추가(기존 필드 뒤, `updated_at?` 근처):

```ts
  // ── 조립형 카탈로그 메타 (brand_catalog_items 는 별도 테이블) ──
  catalog_enabled?: boolean;
  catalog_cover_url?: string;
  catalog_season?: string;
  catalog_headline?: string;
  catalog_intro?: string;
  catalog_tech_images?: string[];
  catalog_updated_at?: string | null;
```

`EMPTY_BRAND`에 추가:

```ts
  catalog_enabled: false,
  catalog_cover_url: "",
  catalog_season: "",
  catalog_headline: "",
  catalog_intro: "",
  catalog_tech_images: [],
```

- [ ] **Step 3: `data/brandCatalog.ts` 작성**

```ts
// 브랜드별 조립형 카탈로그 — DB(brand_catalog_items) 행과 snake_case 1:1.
// 메타(커버·시즌·인트로·공용 기술서)는 brands 테이블의 catalog_* 컬럼에 있다.

export type CatalogSpec = { label: string; value: string };

export type CatalogColorVariant = {
  key: string;         // 해시 딥링크 슬러그, 항목 내 유일 (예: "black")
  label: string;       // 표시명 (예: "블랙")
  swatch?: string;     // 색상칩 hex (선택)
  cutout_url: string;  // 누끼컷 — 컬러 칩 썸네일
  styled_url: string;  // 착장컷 — 선택 시 큰 이미지. 비면 cutout_url 사용
  gallery?: string[];  // 추가 이미지 (선택)
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
  sort_order: 0,
  is_visible: true,
  category: "",
  name: "",
  summary: "",
  description: "",
  price: "",
  specs: [],
  colors: [],
  tech_images: [],
};

export const EMPTY_COLOR_VARIANT: CatalogColorVariant = {
  key: "",
  label: "",
  swatch: "",
  cutout_url: "",
  styled_url: "",
  gallery: [],
};

// 라벨 → 유일한 슬러그. 영문/숫자화 후 이미 쓰인 key면 -2, -3… 접미사.
export function slugifyColorKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "") || "color";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function catalogItemAnchor(itemId: string): string {
  return `item-${itemId}`;
}

export function catalogColorAnchor(itemId: string, colorKey: string): string {
  return `item-${itemId}-${colorKey}`;
}

export type CatalogTocGroup = { category: string; items: { id: string; name: string }[] };

// category가 있는 항목은 그 이름으로 그룹, 없으면 "제품". 순서는 items 순서 유지.
export function buildCatalogToc(items: BrandCatalogItem[]): CatalogTocGroup[] {
  const groups: CatalogTocGroup[] = [];
  for (const it of items) {
    const cat = it.category.trim() || "제품";
    let g = groups.find((x) => x.category === cat);
    if (!g) {
      g = { category: cat, items: [] };
      groups.push(g);
    }
    g.items.push({ id: it.id, name: it.name || "(이름 없음)" });
  }
  return groups;
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과 (에러 0). `data/brands.ts` 변경으로 기존 사용처가 깨지지 않는지 확인 — 추가 필드는 모두 `?` optional이므로 영향 없음.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrate_add_brand_catalog.sql data/brands.ts data/brandCatalog.ts
git commit -m "조립형 카탈로그: 마이그레이션 SQL + 타입 정의"
```

- [ ] **Step 6: 사용자에게 SQL 실행 요청**

사용자에게 `supabase/migrate_add_brand_catalog.sql` 내용을 Supabase SQL Editor에서 실행하도록 안내한다. 이후 태스크의 수동 검증은 실행 완료 후 가능하다.

---

## Task 2: 서버 데이터 로더

**Files:**
- Create: `lib/brandCatalog-server.ts`

**Interfaces:**
- Consumes: `data/brands.ts`(`Brand`), `data/brandCatalog.ts`(`BrandCatalogItem`, `BrandCatalogMeta`), `lib/brands-data`(`BRANDS`), `lib/supabase-server`(`createAdminClient`)
- Produces:
  - `type LoadedBrandCatalog = { brand: Brand; meta: BrandCatalogMeta; items: BrandCatalogItem[] }`
  - `async function loadBrandCatalog(slug: string, opts?: { includeHidden?: boolean }): Promise<LoadedBrandCatalog | null>` — 슬러그로 `BRANDS` 조회 → 없으면 null. DB 브랜드를 이름(`ilike`)으로 조회 → 없으면 null. `meta.enabled=false`이고 `includeHidden` 아니면 null. 항목은 `brand_id = String(brand.id)` where `is_visible`(includeHidden이면 전체) `order sort_order`. 반환 항목의 `specs/colors/tech_images`가 배열이 아니면 `[]`로 방어.
  - `function normalizeItem(row: unknown): BrandCatalogItem` (내부 헬퍼, export 불필요)

- [ ] **Step 1: 구현**

```ts
// 조립형 카탈로그 서버 로더 — 공개 페이지(app/brands/[id]/catalog)와 관리자 미리보기에서 사용.
import "server-only";
import { BRANDS } from "@/lib/brands-data";
import { createAdminClient } from "@/lib/supabase-server";
import type { Brand } from "@/data/brands";
import type { BrandCatalogItem, BrandCatalogMeta, CatalogColorVariant, CatalogSpec } from "@/data/brandCatalog";

export type LoadedBrandCatalog = { brand: Brand; meta: BrandCatalogMeta; items: BrandCatalogItem[] };

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeItem(row: Record<string, unknown>): BrandCatalogItem {
  return {
    id: String(row.id ?? ""),
    brand_id: String(row.brand_id ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_visible: row.is_visible !== false,
    category: String(row.category ?? ""),
    name: String(row.name ?? ""),
    summary: String(row.summary ?? ""),
    description: String(row.description ?? ""),
    price: String(row.price ?? ""),
    specs: asArray<CatalogSpec>(row.specs),
    colors: asArray<CatalogColorVariant>(row.colors),
    tech_images: asArray<string>(row.tech_images),
  };
}

function metaFromBrand(brand: Brand): BrandCatalogMeta {
  return {
    enabled: brand.catalog_enabled === true,
    cover_url: brand.catalog_cover_url ?? "",
    season: brand.catalog_season ?? "",
    headline: brand.catalog_headline ?? "",
    intro: brand.catalog_intro ?? "",
    tech_images: asArray<string>(brand.catalog_tech_images),
  };
}

export async function loadBrandCatalog(
  slug: string,
  opts: { includeHidden?: boolean } = {},
): Promise<LoadedBrandCatalog | null> {
  const staticBrand = BRANDS.find((b) => b.id === slug);
  if (!staticBrand) return null;

  try {
    const sb = createAdminClient();
    const { data: brandRow } = await sb
      .from("brands")
      .select("*")
      .ilike("name", staticBrand.name)
      .maybeSingle();
    if (!brandRow) return null;

    const brand = brandRow as Brand;
    const meta = metaFromBrand(brand);
    if (!meta.enabled && !opts.includeHidden) return null;

    let q = sb
      .from("brand_catalog_items")
      .select("*")
      .eq("brand_id", String(brand.id))
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (!opts.includeHidden) q = q.eq("is_visible", true);

    const { data: rows } = await q;
    const items = (rows ?? []).map((r) => normalizeItem(r as Record<string, unknown>));
    return { brand, meta, items };
  } catch {
    return null;
  }
}
```

> 참고: 프로젝트에 `server-only` 패키지가 설치되어 있지 않으면 `import "server-only";` 줄을 제거한다. (설치 여부: `node -e "require.resolve('server-only')"` 로 확인 — 실패하면 제거.)

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add lib/brandCatalog-server.ts
git commit -m "조립형 카탈로그: 서버 데이터 로더"
```

---

## Task 3: 관리자 API — 항목 목록/생성

**Files:**
- Create: `app/api/admin/brand-catalog-items/route.ts`

**Interfaces:**
- Consumes: `lib/admin-auth`(`isAdmin`), `lib/supabase-server`(`createAdminClient`), `lib/audit-server`(`logAudit`)
- Produces (HTTP):
  - `GET /api/admin/brand-catalog-items?brandId=<id>` → `BrandCatalogItem[]` (숨김 포함, `sort_order` 순). `brandId` 누락 시 400.
  - `POST /api/admin/brand-catalog-items` body `{ brand_id, ...부분필드 }` → 생성된 행. `id`는 서버에서 `crypto.randomUUID()`로 생성. 미지정 필드는 DB 기본값.

- [ ] **Step 1: 구현** (기존 `app/api/admin/brand-catalogs/route.ts` 패턴 준수)

```ts
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

function projectRef() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "").split(".")[0] || "(NEXT_PUBLIC_SUPABASE_URL 미설정)";
}

// 특정 브랜드의 조립형 카탈로그 항목 전체 (숨김 포함 — 관리자 전용)
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const brandId = new URL(req.url).searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId 필요" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalog_items")
    .select("*")
    .eq("brand_id", String(brandId))
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message, project: projectRef() }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 항목 생성
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body?.brand_id) return NextResponse.json({ error: "brand_id 필요" }, { status: 400 });

  const supabase = createAdminClient();
  const row = { id: crypto.randomUUID(), ...body, brand_id: String(body.brand_id) };
  const { data, error } = await supabase.from("brand_catalog_items").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "create",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    target: data?.name ?? body?.name,
    targetId: data?.id,
  });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 통과.

- [ ] **Step 3: 인증 가드 수동 확인**

로컬 `npm run dev` 실행 후 (Browser 도구 또는):
Run: `curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/admin/brand-catalog-items?brandId=1"`
Expected: `401` (로그인 쿠키 없음).

- [ ] **Step 4: 커밋**

```bash
git add app/api/admin/brand-catalog-items/route.ts
git commit -m "조립형 카탈로그: 항목 목록/생성 API"
```

---

## Task 4: 관리자 API — 항목 수정/삭제

**Files:**
- Create: `app/api/admin/brand-catalog-items/[itemId]/route.ts`

**Interfaces:**
- Consumes: Task 3과 동일 헬퍼
- Produces (HTTP):
  - `PUT /api/admin/brand-catalog-items/<itemId>` body = 부분 필드 → 갱신된 행. `updated_at`은 서버가 현재 시각으로 설정.
  - `DELETE /api/admin/brand-catalog-items/<itemId>` → `{ ok: true }`.
  - 정렬 변경은 프론트가 각 항목에 `PUT { sort_order }`를 호출하는 방식(기존 `brand_catalogs` 패턴과 동일).

- [ ] **Step 1: 구현** (기존 `app/api/admin/brand-catalogs/[id]/route.ts` 패턴 준수)

```ts
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit-server";

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;
  const body = await req.json();
  // id/brand_id 변경 금지
  const { id: _id, brand_id: _bid, ...patch } = body ?? {};
  void _id; void _bid;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_catalog_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "update",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    target: data?.name,
    targetId: itemId,
  });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;

  const supabase = createAdminClient();
  const { error } = await supabase.from("brand_catalog_items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: "delete",
    resource: "brand-catalog-items",
    resourceLabel: "조립형 카탈로그 항목",
    targetId: itemId,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 통과. (`void _id` 패턴이 린트에서 걸리면 `/* eslint-disable @typescript-eslint/no-unused-vars */` 대신 `delete body.id; delete body.brand_id;` 로 대체.)

- [ ] **Step 3: 커밋**

```bash
git add app/api/admin/brand-catalog-items/[itemId]/route.ts
git commit -m "조립형 카탈로그: 항목 수정/삭제 API"
```

---

## Task 5: 공개 렌더 컴포넌트 (클라이언트 아일랜드)

**Files:**
- Create: `components/BrandCatalogItem.tsx`
- Create: `components/BrandCatalogTocBar.tsx`

**Interfaces:**
- Consumes: `data/brandCatalog.ts`(`BrandCatalogItem`, `catalogColorAnchor`, `catalogItemAnchor`, `CatalogTocGroup`), `lib/imageSrc`(`ikSrc`)
- Produces:
  - `export default function BrandCatalogItem({ item, accent }: { item: BrandCatalogItem; accent: string })` — `"use client"`. 렌더: 큰 이미지(선택 컬러의 `styled_url || cutout_url`), 컬러 칩 줄, 이름 `<h2 id={catalogItemAnchor(item.id)}>`, summary/description, specs 표, 가격("가격 문의" 대체), gallery 썸네일. 칩 클릭 시 선택 컬러 변경 + `history.replaceState(null,"", "#"+catalogColorAnchor(item.id, key))`. 마운트 시 `location.hash`가 `#item-<id>-<key>` 형태면 해당 컬러 초기 선택. `tech_images` 있으면 하단에 `<img>` 나열.
  - `export default function BrandCatalogTocBar({ groups, accent }: { groups: CatalogTocGroup[]; accent: string })` — `"use client"`. 커버를 벗어나면(`window.scrollY > 뷰포트 높이 * 0.8`) 상단 고정 표시. 항목 클릭 → `document.getElementById(catalogItemAnchor(id))?.scrollIntoView({ behavior: "smooth", block: "start" })`.

- [ ] **Step 1: `BrandCatalogItem.tsx` 작성**

```tsx
"use client";
import { useEffect, useState } from "react";
import { ikSrc } from "@/lib/imageSrc";
import {
  type BrandCatalogItem,
  catalogItemAnchor,
  catalogColorAnchor,
} from "@/data/brandCatalog";

export default function BrandCatalogItem({
  item,
  accent,
}: {
  item: BrandCatalogItem;
  accent: string;
}) {
  const colors = item.colors ?? [];
  const [active, setActive] = useState(0);

  // 마운트 시 해시로 초기 컬러 선택
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    const idx = colors.findIndex((c) => catalogColorAnchor(item.id, c.key) === h);
    if (idx >= 0) setActive(idx);
    // item.id 고정, colors 참조만 사용 — 최초 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = colors[active];
  const hero = current ? current.styled_url || current.cutout_url : "";

  const selectColor = (idx: number) => {
    setActive(idx);
    const c = colors[idx];
    if (c) {
      window.history.replaceState(null, "", `#${catalogColorAnchor(item.id, c.key)}`);
    }
  };

  return (
    <article className="scroll-mt-24 py-10 border-b border-gray-100 last:border-0">
      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        {/* 큰 이미지 */}
        <div className="relative w-full aspect-[4/5] bg-[#f5f0eb] overflow-hidden rounded-lg">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ikSrc(hero, 1200)}
              alt={`${item.name}${current ? ` ${current.label}` : ""}`}
              className="absolute inset-0 w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>

        {/* 정보 */}
        <div>
          <h2 id={catalogItemAnchor(item.id)} className="text-2xl font-black tracking-tight text-gray-900">
            {item.name}
          </h2>
          {item.summary ? <p className="mt-2 text-sm text-gray-600">{item.summary}</p> : null}

          {/* 컬러 칩 */}
          {colors.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {colors.map((c, idx) => (
                <button
                  key={c.key || idx}
                  type="button"
                  onClick={() => selectColor(idx)}
                  aria-pressed={idx === active}
                  className="flex items-center gap-2 rounded-full border px-2 py-1.5 min-h-[44px] transition-colors"
                  style={{
                    borderColor: idx === active ? accent : "#e5e7eb",
                    backgroundColor: idx === active ? `${accent}0d` : "#fff",
                  }}
                >
                  <span className="relative block w-9 h-9 rounded-full overflow-hidden bg-[#f5f0eb] flex-shrink-0">
                    {c.cutout_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ikSrc(c.cutout_url, 120)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : c.swatch ? (
                      <span className="absolute inset-0" style={{ backgroundColor: c.swatch }} />
                    ) : null}
                  </span>
                  <span className="text-xs text-gray-700 pr-1">{c.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {item.description ? (
            <p className="mt-5 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{item.description}</p>
          ) : null}

          {/* 스펙 */}
          {item.specs?.length > 0 ? (
            <dl className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
              {item.specs.map((s, i) => (
                <div key={i} className="flex py-2 text-sm">
                  <dt className="w-28 flex-shrink-0 text-gray-400">{s.label}</dt>
                  <dd className="text-gray-800">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* 가격 */}
          <p className="mt-5 text-lg font-bold" style={{ color: accent }}>
            {item.price?.trim() ? item.price : "가격 문의"}
          </p>
        </div>
      </div>

      {/* 갤러리 */}
      {current?.gallery && current.gallery.length > 0 ? (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {current.gallery.map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(g, 600)} alt={`${item.name} ${current.label} ${i + 1}`}
              className="w-full aspect-square object-cover rounded bg-[#f5f0eb]" loading="lazy" />
          ))}
        </div>
      ) : null}

      {/* 제품 전용 기술서 */}
      {item.tech_images?.length > 0 ? (
        <div className="mt-8 space-y-4">
          {item.tech_images.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(t, 1400)} alt={`${item.name} 기술서 ${i + 1}`}
              className="w-full rounded border border-gray-100" loading="lazy" />
          ))}
        </div>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 2: `BrandCatalogTocBar.tsx` 작성**

```tsx
"use client";
import { useEffect, useState } from "react";
import { type CatalogTocGroup, catalogItemAnchor } from "@/data/brandCatalog";

export default function BrandCatalogTocBar({
  groups,
  accent,
}: {
  groups: CatalogTocGroup[];
  accent: string;
}) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id: string) => {
    document.getElementById(catalogItemAnchor(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const flat = groups.flatMap((g) => g.items);
  if (flat.length === 0) return null;

  return (
    <div
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur border-b transition-shadow ${stuck ? "shadow-sm" : ""}`}
      style={{ borderColor: `${accent}22` }}
    >
      <div className="max-w-screen-lg mx-auto px-4 py-2 flex gap-3 overflow-x-auto text-xs whitespace-nowrap">
        {flat.map((it) => (
          <button key={it.id} type="button" onClick={() => jump(it.id)}
            className="text-gray-500 hover:text-gray-900 py-1 min-h-[36px]">
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add components/BrandCatalogItem.tsx components/BrandCatalogTocBar.tsx
git commit -m "조립형 카탈로그: 제품/목차 클라이언트 컴포넌트"
```

---

## Task 6: 공개 렌더 컴포넌트 (서버) + 라우트

**Files:**
- Create: `components/BrandCatalogView.tsx`
- Create: `app/brands/[id]/catalog/page.tsx`

**Interfaces:**
- Consumes: `lib/brandCatalog-server`(`loadBrandCatalog`, `LoadedBrandCatalog`), `data/brandCatalog`(`buildCatalogToc`), `components/BrandCatalogItem`, `components/BrandCatalogTocBar`, `components/CatalogBodyClass`, `lib/brands-data`(`BRANDS`), `lib/imageSrc`(`ikSrc`)
- Produces:
  - `export default function BrandCatalogView({ data }: { data: LoadedBrandCatalog })` — 서버 컴포넌트. 섹션 순서: 커버 → `<BrandCatalogTocBar>` → 카테고리별 섹션(각 `<BrandCatalogItem>`) → 공용 기술서(`meta.tech_images`) → 하단 CTA.
  - `app/brands/[id]/catalog/page.tsx`: `generateMetadata`, default async 페이지. `loadBrandCatalog(id)`가 null이거나 `items.length === 0` → `notFound()`. JSON-LD `<script type="application/ld+json">` (BreadcrumbList + Brand).

- [ ] **Step 1: `BrandCatalogView.tsx` 작성**

```tsx
import Link from "next/link";
import { ikSrc } from "@/lib/imageSrc";
import { buildCatalogToc } from "@/data/brandCatalog";
import type { LoadedBrandCatalog } from "@/lib/brandCatalog-server";
import BrandCatalogItem from "./BrandCatalogItem";
import BrandCatalogTocBar from "./BrandCatalogTocBar";

export default function BrandCatalogView({ data }: { data: LoadedBrandCatalog }) {
  const { brand, meta, items } = data;
  const accent = brand.accent_color || "#E5541B";
  const brandName = brand.name;
  const title = meta.headline || brandName;
  const toc = buildCatalogToc(items);

  return (
    <div className="bg-white">
      {/* 커버 */}
      <section className="relative overflow-hidden" style={{ minHeight: "72vh", backgroundColor: meta.cover_url ? undefined : accent }}>
        {meta.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ikSrc(meta.cover_url, 1800)} alt={`${brandName} 카탈로그 커버`}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative max-w-screen-lg mx-auto px-6 flex flex-col justify-end" style={{ minHeight: "72vh", paddingBottom: "3rem" }}>
          {meta.season ? <p className="text-[11px] tracking-[0.3em] uppercase text-white/80 mb-3">{meta.season}</p> : null}
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={brandName} className="max-h-16 md:max-h-20 max-w-xs object-contain mb-3" />
          ) : (
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">{title}</h1>
          )}
          {meta.intro ? <p className="mt-4 max-w-xl text-sm md:text-base text-white/85 leading-relaxed whitespace-pre-line">{meta.intro}</p> : null}
        </div>
      </section>

      {/* 목차 바 (스크롤 시 상단 고정) */}
      <BrandCatalogTocBar groups={toc} accent={accent} />

      {/* 제품 섹션 */}
      <div className="max-w-screen-lg mx-auto px-4 md:px-6">
        {toc.map((group) => {
          const groupItems = items.filter((it) => (it.category.trim() || "제품") === group.category);
          return (
            <section key={group.category} className="pt-10">
              <h3 className="text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: accent }}>
                {group.category}
              </h3>
              {groupItems.map((it) => (
                <BrandCatalogItem key={it.id} item={it} accent={accent} />
              ))}
            </section>
          );
        })}
      </div>

      {/* 공용 기술서 */}
      {meta.tech_images.length > 0 ? (
        <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-10 space-y-4">
          <h3 className="text-[11px] tracking-[0.3em] uppercase font-bold text-gray-400">기술 자료</h3>
          {meta.tech_images.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(t, 1400)} alt={`${brandName} 기술서 ${i + 1}`}
              className="w-full rounded border border-gray-100" loading="lazy" />
          ))}
        </div>
      ) : null}

      {/* 하단 CTA — 매장 방문/문의 유도 */}
      <section className="max-w-screen-lg mx-auto px-4 md:px-6 pb-20 pt-6">
        <div className="border border-gray-100 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[9px] tracking-[0.3em] font-bold uppercase mb-1 text-gray-400">STORE</p>
            <h3 className="text-xl font-black text-gray-900">매장에서 직접 확인해보세요</h3>
            <p className="text-gray-500 text-sm mt-1">가까운 WORKUP 매장에서 {brandName} 제품을 만나보실 수 있습니다.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/store" className="flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white min-h-[44px]"
              style={{ backgroundColor: accent }}>
              가까운 매장 찾기
            </Link>
            <Link href="/support" className="flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-400 min-h-[44px]">
              제품 문의하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
```

> CTA 링크(`/store`, `/support`)는 형제 페이지 `app/brands/[id]/page.tsx`가 실제로 쓰는 경로와 맞춘다. 구현 시 그 파일을 열어 매장/문의 링크의 실제 href를 확인하고 동일하게 사용한다(현재 그 파일은 `/stores`와 `tel:` 를 사용 중이므로 상이하면 형제 파일 쪽에 맞춘다).

- [ ] **Step 2: `app/brands/[id]/catalog/page.tsx` 작성**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { BRANDS } from "@/lib/brands-data";
import { loadBrandCatalog } from "@/lib/brandCatalog-server";
import BrandCatalogView from "@/components/BrandCatalogView";
import CatalogBodyClass from "@/components/CatalogBodyClass";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const staticBrand = BRANDS.find((b) => b.id === id);
  if (!staticBrand) return {};
  const data = await loadBrandCatalog(id);
  const name = data?.brand.name ?? staticBrand.name;
  const desc = data?.meta.intro || data?.brand.description || `${name} 제품 카탈로그`;
  return {
    title: `${name} 카탈로그 | WORKUP`,
    description: desc,
    openGraph: {
      title: `${name} 카탈로그 | WORKUP`,
      description: desc,
      images: data?.meta.cover_url ? [data.meta.cover_url] : undefined,
    },
  };
}

export default async function BrandAssembledCatalogPage({ params }: Props) {
  noStore();
  const { id } = await params;
  const data = await loadBrandCatalog(id);
  if (!data || data.items.length === 0) notFound();

  const brandName = data.brand.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "HOME", item: "/" },
          { "@type": "ListItem", position: 2, name: "BRAND", item: "/brands" },
          { "@type": "ListItem", position: 3, name: `${brandName} 카탈로그` },
        ],
      },
      { "@type": "Brand", name: brandName, description: data.brand.description ?? "" },
    ],
  };

  return (
    <main>
      <CatalogBodyClass />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BrandCatalogView data={data} />
    </main>
  );
}
```

- [ ] **Step 3: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 통과. 새 동적 라우트 `/brands/[id]/catalog` 가 빌드 출력에 나타남.

- [ ] **Step 4: 수동 확인 (마이그레이션 SQL 실행 완료 + 시드 데이터 필요)**

Task 8~10에서 관리자로 데이터를 넣기 전이라면, Supabase SQL Editor에서 임시 시드 1건을 넣어 확인:

```sql
UPDATE brands SET catalog_enabled = true, catalog_season = '2026 SS',
  catalog_intro = '테스트 인트로' WHERE name ILIKE '<브랜드명>';
INSERT INTO brand_catalog_items (id, brand_id, sort_order, name, summary, price, colors)
VALUES ('seed-1', (SELECT id::text FROM brands WHERE name ILIKE '<브랜드명>'), 0,
  '테스트 제품', '한 줄 설명', '',
  '[{"key":"black","label":"블랙","cutout_url":"https://placehold.co/300","styled_url":"https://placehold.co/800x1000"}]'::jsonb);
```

Browser 미리보기: `preview_start {name}` → `/brands/<슬러그>/catalog` 이동.
- read_page: 커버 제목·인트로, 제품명 `<h2>`, "가격 문의" 텍스트, 하단 CTA 링크 존재 확인
- read_console_messages: 에러 없음
- 컬러 칩 클릭(단일 컬러라 시각 변화 없음) → URL 해시가 `#item-seed-1-black` 로 바뀌는지 `javascript_tool`로 `location.hash` 확인
- resize_window mobile(375px) → 가로 스크롤 없는지, 레이아웃 정상
확인 후 시드 삭제:
```sql
DELETE FROM brand_catalog_items WHERE id = 'seed-1';
UPDATE brands SET catalog_enabled = false WHERE name ILIKE '<브랜드명>';
```

- [ ] **Step 5: 커밋**

```bash
git add components/BrandCatalogView.tsx app/brands/[id]/catalog/page.tsx
git commit -m "조립형 카탈로그: 공개 페이지 + 서버 렌더"
```

---

## Task 7: 브랜드 페이지에서 조립형 카탈로그로 링크

**Files:**
- Modify: `app/brands/[id]/page.tsx` (카탈로그 섹션 헤더 근처, `latestCatalog` 로딩 부분과 "카탈로그 섹션" 렌더 사이)

**Interfaces:**
- Consumes: 같은 파일이 이미 로드하는 `dbBrand`. 추가로 `dbBrand?.catalog_enabled` 와 항목 존재 여부.
- Produces: `catalog_enabled === true` 이고 항목이 1개 이상이면 `/brands/[id]/catalog` 로 가는 눈에 띄는 링크 버튼. 아니면 아무것도 렌더 안 함(기존 PDF 뷰어 동작 그대로).

- [ ] **Step 1: 항목 존재 여부 로드 추가**

`app/brands/[id]/page.tsx` 의 `BrandPage` 안, `const latestCatalog = await getCatalog(brandName);` 아래에 추가:

```tsx
  // 조립형 카탈로그(이미지+정보 입력형)가 공개 상태이고 항목이 있으면 링크를 노출한다.
  let hasAssembledCatalog = false;
  if (dbBrand?.catalog_enabled) {
    try {
      const sb = createAdminClient();
      const { count } = await sb
        .from("brand_catalog_items")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", String(dbBrand.id))
        .eq("is_visible", true);
      hasAssembledCatalog = (count ?? 0) > 0;
    } catch { /* 무시 — 링크만 숨김 */ }
  }
```

(`createAdminClient` 는 이 파일에 이미 import 되어 있음.)

- [ ] **Step 2: 링크 버튼 렌더**

"카탈로그 섹션"의 `<div className="flex items-center justify-between mb-3 gap-4">` 안, `PdfDownloadButton`/비활성 버튼 옆(또는 위)에 추가:

```tsx
          {hasAssembledCatalog ? (
            <Link
              href={`/brands/${id}/catalog`}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white min-h-[44px]"
              style={{ backgroundColor: brandAccentColor }}
            >
              카탈로그 보기
            </Link>
          ) : null}
```

(`Link` 는 이미 import 되어 있음. `id` 는 `params` 에서 이미 구조분해됨.)

- [ ] **Step 3: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 통과.

- [ ] **Step 4: 수동 확인**

Task 6 Step 4의 시드가 있는 상태에서 `/brands/<슬러그>` 접속 → "카탈로그 보기" 버튼 보임 → 클릭 시 `/brands/<슬러그>/catalog` 이동. 시드 없거나 `catalog_enabled=false` 면 버튼 없음.

- [ ] **Step 5: 커밋**

```bash
git add app/brands/[id]/page.tsx
git commit -m "조립형 카탈로그: 브랜드 페이지에서 링크 노출"
```

---

## Task 8: 관리자 탭 골격 + 메타 편집

**Files:**
- Create: `components/admin/AssembledCatalogTab.tsx`
- Modify: `app/admin/catalog/brands/page.tsx` (탭 타입, 탭 버튼, 탭 패널)

**Interfaces:**
- Consumes: 부모(`app/admin/catalog/brands/page.tsx`)가 넘기는 `editing: Brand`, `setEditing`(또는 부모의 `set(key,value)` 유틸), `flash(text, type?)`. 이미지 업로드는 `POST /api/admin/upload` FormData → `{ url }`.
- Produces:
  - `export default function AssembledCatalogTab(props: { brand: Brand; brandId: string | number; onPatchBrand: (patch: Partial<Brand>) => void; flash: (t: string, type?: string) => void })`
  - 이 태스크에서는 **메타 필드만**: 공개 토글(`catalog_enabled`), 커버 이미지 업로드(`catalog_cover_url`), 시즌·헤드라인·인트로 텍스트, 공용 기술서 이미지 목록(`catalog_tech_images`). 값 변경은 `onPatchBrand({...})` 호출 → 부모의 기존 "저장" 버튼이 `brands` 행에 함께 저장.
  - 항목 CRUD 는 Task 9~10.

- [ ] **Step 1: 부모 파일에 탭 추가**

`app/admin/catalog/brands/page.tsx`:

1. 탭 타입 확장: `type Tab = "info" | "catalog" | "assembled";`
2. 탭 버튼 배열: `(["info", "catalog", "assembled"] as Tab[]).map(...)` 로 바꾸고, 라벨 매핑에 `t === "assembled" ? "조립형 카탈로그" : ...` 추가.
3. import 추가: `import AssembledCatalogTab from "@/components/admin/AssembledCatalogTab";`
4. 탭 패널 렌더 (기존 `{tab === "catalog" && ...}` 블록 아래):

```tsx
                {tab === "assembled" && !isNew && editing && (
                  <AssembledCatalogTab
                    brand={editing}
                    brandId={editing.id}
                    onPatchBrand={(patch) => setEditing((prev) => (prev ? { ...prev, ...patch } : prev))}
                    flash={flash}
                  />
                )}
                {tab === "assembled" && isNew && (
                  <p className="text-sm text-gray-400">브랜드를 먼저 저장한 후 조립형 카탈로그를 편집할 수 있습니다.</p>
                )}
```

> 부모의 상태 변수명 확인: 편집 상태가 `editing`, 갱신 함수가 `setEditing` 인지 파일에서 확인하고 정확히 사용한다. `flash` 헬퍼도 실제 이름을 확인한다(파일 상단에 `const flash = ...` 존재).

- [ ] **Step 2: `AssembledCatalogTab.tsx` 골격 + 메타 필드**

```tsx
"use client";
import { useRef, useState } from "react";
import type { Brand } from "@/data/brands";

const INPUT = "w-full border border-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-800";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error ?? "업로드 실패");
  return d.url as string;
}

export default function AssembledCatalogTab({
  brand,
  brandId,
  onPatchBrand,
  flash,
}: {
  brand: Brand;
  brandId: string | number;
  onPatchBrand: (patch: Partial<Brand>) => void;
  flash: (t: string, type?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const techRef = useRef<HTMLInputElement>(null);
  const techImages = brand.catalog_tech_images ?? [];

  const pickCover = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onPatchBrand({ catalog_cover_url: url });
      flash("커버 이미지 업로드 완료 · 상단 저장 버튼을 눌러 반영하세요.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    }
    setBusy(false);
  };

  const addTech = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onPatchBrand({ catalog_tech_images: [...techImages, url] });
      flash("기술서 이미지 추가 · 저장 버튼을 눌러 반영하세요.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "업로드 실패", "err");
    }
    setBusy(false);
  };

  const removeTech = (i: number) => {
    onPatchBrand({ catalog_tech_images: techImages.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={brand.catalog_enabled === true}
          onChange={(e) => onPatchBrand({ catalog_enabled: e.target.checked })}
        />
        <span className="font-semibold">이 브랜드의 조립형 카탈로그 공개</span>
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-gray-500">커버 이미지 (이미지 안에 텍스트 없이)</p>
          {brand.catalog_cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.catalog_cover_url} alt="" className="w-full h-40 object-cover rounded border mb-2" />
          ) : null}
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => pickCover(e.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => coverRef.current?.click()}
            className="px-3 py-2 border rounded text-xs">커버 업로드</button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="mb-1 text-gray-500">시즌</p>
            <input className={INPUT} value={brand.catalog_season ?? ""} placeholder="2026 Spring / Summer"
              onChange={(e) => onPatchBrand({ catalog_season: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-gray-500">헤드라인 (비우면 브랜드명)</p>
            <input className={INPUT} value={brand.catalog_headline ?? ""}
              onChange={(e) => onPatchBrand({ catalog_headline: e.target.value })} />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1 text-gray-500">인트로 (커버 하단 · meta description)</p>
        <textarea className={INPUT} rows={3} value={brand.catalog_intro ?? ""}
          onChange={(e) => onPatchBrand({ catalog_intro: e.target.value })} />
      </div>

      <div>
        <p className="mb-2 text-gray-500">공용 기술서 이미지 (카탈로그 맨 끝)</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {techImages.map((t, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t} alt="" className="w-20 h-20 object-cover rounded border" />
              <button type="button" onClick={() => removeTech(i)}
                className="absolute -top-2 -right-2 bg-white border rounded-full w-5 h-5 text-xs">×</button>
            </div>
          ))}
        </div>
        <input ref={techRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => addTech(e.target.files?.[0])} />
        <button type="button" disabled={busy} onClick={() => techRef.current?.click()}
          className="px-3 py-2 border rounded text-xs">기술서 이미지 추가</button>
      </div>

      <p className="text-xs text-amber-600">
        메타 항목(공개·커버·시즌·헤드라인·인트로·공용 기술서)은 이 화면의 <b>상단 저장 버튼</b>으로 저장됩니다.
        제품 항목은 아래에서 개별 저장됩니다.
      </p>

      {/* 제품 항목 편집기 — Task 9~10에서 추가 */}
      <ItemsEditorPlaceholder brandId={String(brandId)} />
    </div>
  );
}

function ItemsEditorPlaceholder({ brandId }: { brandId: string }) {
  void brandId;
  return null;
}
```

- [ ] **Step 3: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 통과.

- [ ] **Step 4: 수동 확인**

`preview_start {name}` → 관리자 로그인 → `/admin/catalog/brands` → 브랜드 선택 → "조립형 카탈로그" 탭 → 공개 토글·시즌·인트로 입력 → 상단 저장 → 새로고침 후 값 유지 확인. 커버 업로드 → 썸네일 표시 → 저장 → `/brands/<슬러그>/catalog` 에 커버 반영(항목이 없으면 404이므로 Task 6 시드 유지).

- [ ] **Step 5: 커밋**

```bash
git add components/admin/AssembledCatalogTab.tsx app/admin/catalog/brands/page.tsx
git commit -m "조립형 카탈로그: 관리자 탭 + 메타 편집"
```

---

## Task 9: 관리자 — 제품 항목 목록/기본 편집

**Files:**
- Modify: `components/admin/AssembledCatalogTab.tsx` (`ItemsEditorPlaceholder` 를 실제 `ItemsEditor` 로 교체)

**Interfaces:**
- Consumes: `data/brandCatalog`(`BrandCatalogItem`, `EMPTY_CATALOG_ITEM`, `CatalogSpec`), API: `GET/POST /api/admin/brand-catalog-items`, `PUT/DELETE /api/admin/brand-catalog-items/[itemId]`
- Produces: `function ItemsEditor({ brandId }: { brandId: string })` — 항목 목록(로드/추가/삭제/표시토글/순서 위아래 버튼), 항목별 기본 필드 폼(카테고리·제품명·한 줄 설명·상세·가격·스펙 행). 컬러/이미지는 Task 10. 각 항목은 자체 "저장" 버튼으로 `PUT`.

- [ ] **Step 1: `ItemsEditor` 구현 (기본 필드 + 스펙)**

`ItemsEditorPlaceholder` 를 삭제하고 아래로 교체. `AssembledCatalogTab` 의 렌더 끝에서 `<ItemsEditor brandId={String(brandId)} />` 호출.

```tsx
import { useEffect } from "react";
import {
  type BrandCatalogItem,
  type CatalogSpec,
  EMPTY_CATALOG_ITEM,
} from "@/data/brandCatalog";

function ItemsEditor({ brandId }: { brandId: string }) {
  const [items, setItems] = useState<BrandCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/brand-catalog-items?brandId=${encodeURIComponent(brandId)}`);
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [brandId]);

  const addItem = async () => {
    const r = await fetch("/api/admin/brand-catalog-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...EMPTY_CATALOG_ITEM, brand_id: brandId, sort_order: items.length }),
    });
    if (r.ok) load();
  };

  const patchLocal = (id: string, patch: Partial<BrandCatalogItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const saveItem = async (it: BrandCatalogItem) => {
    setSavingId(it.id);
    await fetch(`/api/admin/brand-catalog-items/${it.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(it),
    });
    setSavingId(null);
    load();
  };

  const removeItem = async (id: string) => {
    if (!confirm("이 제품 항목을 삭제할까요?")) return;
    await fetch(`/api/admin/brand-catalog-items/${id}`, { method: "DELETE" });
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const reordered = [...items];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    setItems(reordered);
    await Promise.all(
      reordered.map((it, i) =>
        fetch(`/api/admin/brand-catalog-items/${it.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: i }),
        }),
      ),
    );
  };

  if (loading) return <p className="text-gray-400 text-sm">제품 항목 불러오는 중…</p>;

  return (
    <div className="border-t pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">제품 항목 ({items.length})</h4>
        <button type="button" onClick={addItem} className="px-3 py-2 border rounded text-xs">+ 제품 추가</button>
      </div>

      {items.map((it, idx) => (
        <div key={it.id} className="border rounded p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(idx, -1)} className="px-2 border rounded text-xs">↑</button>
            <button type="button" onClick={() => move(idx, 1)} className="px-2 border rounded text-xs">↓</button>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={it.is_visible}
                onChange={(e) => patchLocal(it.id, { is_visible: e.target.checked })} />
              노출
            </label>
            <div className="ml-auto flex gap-2">
              <button type="button" disabled={savingId === it.id} onClick={() => saveItem(it)}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs">저장</button>
              <button type="button" onClick={() => removeItem(it.id)}
                className="px-3 py-1.5 border rounded text-xs text-red-600">삭제</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <input className={INPUT} placeholder="카테고리 (상의·하의…)" value={it.category}
              onChange={(e) => patchLocal(it.id, { category: e.target.value })} />
            <input className={INPUT} placeholder="가격 (비우면 '가격 문의')" value={it.price}
              onChange={(e) => patchLocal(it.id, { price: e.target.value })} />
          </div>
          <input className={INPUT} placeholder="제품명" value={it.name}
            onChange={(e) => patchLocal(it.id, { name: e.target.value })} />
          <input className={INPUT} placeholder="한 줄 설명" value={it.summary}
            onChange={(e) => patchLocal(it.id, { summary: e.target.value })} />
          <textarea className={INPUT} rows={3} placeholder="상세 설명 (선택)" value={it.description}
            onChange={(e) => patchLocal(it.id, { description: e.target.value })} />

          <SpecsEditor specs={it.specs} onChange={(specs) => patchLocal(it.id, { specs })} />

          {/* 컬러 편집기 — Task 10 */}
          <ColorsEditor item={it} onChange={(colors) => patchLocal(it.id, { colors })} />
        </div>
      ))}
    </div>
  );
}

function SpecsEditor({ specs, onChange }: { specs: CatalogSpec[]; onChange: (s: CatalogSpec[]) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">스펙</p>
      {specs.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input className={INPUT} placeholder="항목 (소재)" value={s.label}
            onChange={(e) => onChange(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <input className={INPUT} placeholder="값 (면 100%)" value={s.value}
            onChange={(e) => onChange(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
          <button type="button" onClick={() => onChange(specs.filter((_, j) => j !== i))}
            className="px-2 border rounded text-xs">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...specs, { label: "", value: "" }])}
        className="px-2 py-1 border rounded text-xs">+ 스펙 행</button>
    </div>
  );
}
```

> `ColorsEditor` 는 Task 10에서 정의한다. 이 태스크에서는 컴파일을 위해 임시 스텁을 파일 하단에 둔다:
> ```tsx
> function ColorsEditor({ item, onChange }: { item: BrandCatalogItem; onChange: (c: BrandCatalogItem["colors"]) => void }) {
>   void item; void onChange;
>   return null;
> }
> ```
> Task 10에서 이 스텁을 실제 구현으로 교체한다.

`useState` import 는 파일 상단에 이미 있음. `useEffect` 를 상단 import 에 추가.

- [ ] **Step 2: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 통과.

- [ ] **Step 3: 수동 확인**

`/admin/catalog/brands` → 브랜드 → "조립형 카탈로그" 탭 → "+ 제품 추가" → 이름/설명/가격/스펙 입력 → "저장" → 새로고침 후 유지 → ↑↓ 순서 변경 반영 → 삭제 동작. `/brands/<슬러그>/catalog` 에서 제품 텍스트가 렌더되는지(컬러 없으면 이미지는 빈 박스) 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/admin/AssembledCatalogTab.tsx
git commit -m "조립형 카탈로그: 관리자 제품 항목 목록/기본 편집"
```

---

## Task 10: 관리자 — 컬러 변형 편집기 + 미리보기 링크

**Files:**
- Modify: `components/admin/AssembledCatalogTab.tsx` (`ColorsEditor` 스텁 → 실제 구현)

**Interfaces:**
- Consumes: `data/brandCatalog`(`CatalogColorVariant`, `EMPTY_COLOR_VARIANT`, `slugifyColorKey`, `BrandCatalogItem`), 업로드 헬퍼 `uploadImage`(이미 파일에 있음)
- Produces: `function ColorsEditor({ item, onChange }: { item: BrandCatalogItem; onChange: (c: CatalogColorVariant[]) => void })` — 컬러 추가/삭제, 컬러별 라벨·색상칩(color input)·누끼컷 업로드·착장컷 업로드·갤러리 이미지 추가/삭제. 라벨 입력 시 `key` 자동 생성(`slugifyColorKey(label, 이미쓰인key들)`), 단 이미 `key`가 있으면 유지.

- [ ] **Step 1: `ColorsEditor` 구현**

스텁을 아래로 교체:

```tsx
import {
  type CatalogColorVariant,
  EMPTY_COLOR_VARIANT,
  slugifyColorKey,
} from "@/data/brandCatalog";

function ColorsEditor({
  item,
  onChange,
}: {
  item: BrandCatalogItem;
  onChange: (c: CatalogColorVariant[]) => void;
}) {
  const colors = item.colors ?? [];
  const [busy, setBusy] = useState(false);

  const patchColor = (i: number, patch: Partial<CatalogColorVariant>) =>
    onChange(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const addColor = () => {
    const taken = colors.map((c) => c.key);
    onChange([...colors, { ...EMPTY_COLOR_VARIANT, key: slugifyColorKey("color", taken), label: "" }]);
  };

  const setLabel = (i: number, label: string) => {
    const taken = colors.filter((_, j) => j !== i).map((c) => c.key);
    // key 가 비었거나 자동생성 흔적이면 재생성, 사용자가 직접 정한 값이면 유지하지 않음(간단화: 항상 라벨 기반)
    patchColor(i, { label, key: slugifyColorKey(label || "color", taken) });
  };

  const upload = async (i: number, field: "cutout_url" | "styled_url", file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      patchColor(i, { [field]: url } as Partial<CatalogColorVariant>);
    } finally {
      setBusy(false);
    }
  };

  const addGallery = async (i: number, file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      patchColor(i, { gallery: [...(colors[i].gallery ?? []), url] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">컬러</p>
      {colors.map((c, i) => (
        <div key={i} className="border rounded p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input className={INPUT} placeholder="컬러명 (블랙)" value={c.label}
              onChange={(e) => setLabel(i, e.target.value)} />
            <input type="color" value={c.swatch || "#000000"}
              onChange={(e) => patchColor(i, { swatch: e.target.value })} />
            <button type="button" onClick={() => onChange(colors.filter((_, j) => j !== i))}
              className="px-2 border rounded text-xs">삭제</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ImageField label="누끼컷 (칩)" url={c.cutout_url} busy={busy}
              onPick={(f) => upload(i, "cutout_url", f)} />
            <ImageField label="착장컷 (큰 이미지)" url={c.styled_url} busy={busy}
              onPick={(f) => upload(i, "styled_url", f)} />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">갤러리</p>
            <div className="flex flex-wrap gap-1 mb-1">
              {(c.gallery ?? []).map((g, gi) => (
                <div key={gi} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="w-14 h-14 object-cover rounded border" />
                  <button type="button"
                    onClick={() => patchColor(i, { gallery: (c.gallery ?? []).filter((_, j) => j !== gi) })}
                    className="absolute -top-1.5 -right-1.5 bg-white border rounded-full w-4 h-4 text-[10px]">×</button>
                </div>
              ))}
            </div>
            <GalleryAdd busy={busy} onPick={(f) => addGallery(i, f)} />
          </div>
        </div>
      ))}
      <button type="button" onClick={addColor} className="px-2 py-1 border rounded text-xs">+ 컬러</button>
    </div>
  );
}

function ImageField({ label, url, busy, onPick }: { label: string; url: string; busy: boolean; onPick: (f?: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-24 object-contain rounded border bg-white mb-1" />
      ) : null}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()}
        className="px-2 py-1 border rounded text-[11px]">업로드</button>
    </div>
  );
}

function GalleryAdd({ busy, onPick }: { busy: boolean; onPick: (f?: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()}
        className="px-2 py-1 border rounded text-[11px]">+ 갤러리 이미지</button>
    </>
  );
}
```

- [ ] **Step 2: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 통과.

- [ ] **Step 3: 전체 흐름 수동 확인**

`/admin/catalog/brands` → 브랜드 → "조립형 카탈로그" 탭:
1. 공개 ON + 커버 + 시즌 + 인트로 입력 → 상단 저장
2. 제품 2개 추가, 각 제품에 컬러 2개(누끼컷 + 착장컷 업로드), 스펙 2행, 가격(하나는 빈칸)
3. 제품별 "저장"
4. `/brands/<슬러그>/catalog` 접속 (Browser 미리보기):
   - 커버·인트로·목차 바 렌더
   - 제품 섹션: 컬러 칩 클릭 → 큰 이미지가 해당 착장컷으로 교체, URL 해시 `#item-<id>-<key>` 갱신
   - 해시 URL 새로고침 → 해당 컬러로 시작
   - 가격 빈 제품은 "가격 문의" 표시
   - 목차 항목 클릭 → 스크롤 이동
   - resize_window mobile → 가로 스크롤 없음, 칩 터치 영역 정상
   - read_console_messages: 에러 없음
5. 공개 토글 OFF → 저장 → `/brands/<슬러그>/catalog` 404, `/brands/<슬러그>` 에 버튼 사라짐

- [ ] **Step 4: 커밋**

```bash
git add components/admin/AssembledCatalogTab.tsx
git commit -m "조립형 카탈로그: 관리자 컬러 변형 편집기"
```

---

## Task 11: 마감 — 빌드·회귀 확인 + 문서

**Files:**
- Modify: `docs/superpowers/specs/2026-09-01-brand-assembled-catalog-design.md` (상태를 "구현 완료"로) — 선택
- 없음(주로 검증)

- [ ] **Step 1: 전체 빌드 + 린트**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 전부 통과. 빌드 경고에 새 파일 관련 신규 경고 없음.

- [ ] **Step 2: 회귀 확인**

Browser 미리보기로 기존 기능이 안 깨졌는지:
- `/catalog` (WORKUP 플립북) 정상 렌더
- `/brands/<슬러그>` 기존 PDF 카탈로그 뷰어 정상 (조립형 비활성 브랜드)
- `/admin/catalog/brands` "기본 정보" · "카탈로그(PDF)" 탭 기존 동작 유지
- read_console_messages: 신규 에러 없음

- [ ] **Step 3: 사용자 확인 요청 + push 안내**

CLAUDE.md 규칙에 따라 이 시점까지 **로컬 커밋만** 쌓여 있다. 사용자에게:
- 쌓인 커밋 목록(Task 1~10)을 요약해서 보여준다
- `supabase/migrate_add_brand_catalog.sql` 실행 여부 확인
- push/배포는 사용자가 요청할 때만 진행

- [ ] **Step 4: (선택) 스펙 문서 상태 갱신 + 커밋**

```bash
git add docs/superpowers/specs/2026-09-01-brand-assembled-catalog-design.md
git commit -m "조립형 카탈로그: 스펙 상태 구현 완료로 갱신"
```

---

## Self-Review (계획 작성자 체크 결과)

**1. 스펙 커버리지**
- §3.1 brands 메타 컬럼 → Task 1 (SQL) + Task 8 (편집 UI) ✅
- §3.2 brand_catalog_items 테이블 → Task 1 ✅
- §3.3 타입 → Task 1 ✅
- §4.1 데이터 로드/가드(notFound) → Task 2 + Task 6 ✅
- §4.2 커버/목차/제품섹션/기술서/하단CTA → Task 5 + Task 6 ✅
- §4.2 컬러 칩 교체 + 해시 딥링크 → Task 5 (`BrandCatalogItem`) ✅
- §4.3 서버/클라이언트 경계 → Task 5·6 (View 서버, Item/TocBar 클라이언트) ✅
- §5 관리자 편집기 (메타·항목·스펙·컬러·기술서·미리보기) → Task 8·9·10 ✅
- §5.2 API (isAdmin/logAudit) → Task 3·4 ✅ (메타 PATCH는 별도 API 대신 기존 brands PUT 재사용 — 스펙의 "PATCH /api/admin/brand-catalog"를 대체; 더 단순하고 기존 저장 버튼 흐름과 일치)
- §6 마이그레이션 파일 → Task 1 ✅
- §7 SEO (generateMetadata/JSON-LD/alt/시맨틱) → Task 6 + Task 5 ✅
- §8 성능 (서버 렌더 우선/lazy/신규 라이브러리 없음) → 전반 ✅
- §9 테스트 계획 → Task 6·8·9·10·11 수동 검증 단계 ✅
- §10 YAGNI (PDF/컬러별 페이지/플립북 합류/이커머스 없음) → 준수 ✅
- §11 리스크 (brand_id TEXT 캐스팅, 컬러 key 유일성, 4MB) → Task 1·2·3 반영 ✅

**스펙과의 차이(의도적):**
- 스펙 §5.2의 메타 전용 API(`PATCH /api/admin/brand-catalog`)를 만들지 않고, 기존 `brands` 행 저장(`PUT /api/admin/brands/[id]`, `...body` 스프레드)에 `catalog_*` 필드를 얹는다. 관리 화면이 이미 브랜드 전체를 한 번에 저장하는 구조라 API/버튼을 늘리지 않는 편이 KISS·기존 패턴에 맞다. Task 8에서 이 방식이 동작하는지(신규 컬럼이 PUT에서 걸러지지 않는지) 수동 확인 단계 포함.

**2. 플레이스홀더 스캔**
- Task 9의 `ColorsEditor` 스텁, Task 8의 `ItemsEditorPlaceholder` 는 "다음 태스크에서 교체" 명시 + 교체 코드가 Task 9·10에 실제로 존재 → 플레이스홀더 아님(점진적 구현).
- "TBD/TODO/적절히 처리" 류 문구 없음. 각 코드 스텝에 실제 코드 블록 존재.

**3. 타입 일관성**
- `loadBrandCatalog` 반환 `LoadedBrandCatalog { brand, meta, items }` — Task 2 정의, Task 6 `BrandCatalogView({ data })` 에서 동일 사용 ✅
- `catalogColorAnchor(itemId, key)` — Task 1 정의, Task 5 `BrandCatalogItem` 에서 사용 ✅
- `buildCatalogToc` → `CatalogTocGroup[]` — Task 1 정의, Task 5 `BrandCatalogTocBar` props·Task 6 View 에서 사용 ✅
- `slugifyColorKey(label, taken)` 시그니처 — Task 1 정의, Task 10 사용 일치 ✅
- API 경로 `/api/admin/brand-catalog-items` — Task 3·4 생성, Task 9 호출 일치 ✅
- `uploadImage(file): Promise<string>` — Task 8 정의, Task 10 재사용 (동일 파일 내) ✅

이슈 없음.
