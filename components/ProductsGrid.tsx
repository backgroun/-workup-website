"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import LoginPromptModal from "@/components/LoginPromptModal";
import {
  products as staticProducts,
  productDisplayName,
} from "@/data/products";
import {
  DEFAULT_PRODUCT_FILTERS,
  normalizeProductFilters,
  type ProductFiltersConfig,
} from "@/lib/product-filters";

// 카테고리 분류 구조 (관리자 DB 설정과 동일한 형태)
export type CatItem = { name: string; subs: string[] };

// 제품 데이터의 seasons 값("봄/가을"|"여름"|"겨울")과 일치시켜야 필터가 동작한다.
const SEASONS = ["봄/가을", "여름", "겨울"];

function Accordion({
  label, open, onToggle, children,
}: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-[14px] font-medium text-[#303236]"
      >
        <span>{label}</span>
        <span className="text-[22px] font-thin text-gray-400 leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function FilterDropdown({
  label, options, selected, onToggle, activeCount,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 border text-[12px] transition-colors ${
          activeCount > 0 ? "border-[#303236] bg-[#303236] text-white" : "border-gray-300 text-gray-600 hover:border-[#303236]"
        }`}
      >
        {label}
        {activeCount > 0 && <span className="text-[11px] font-bold">({activeCount})</span>}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 shadow-lg min-w-[140px] py-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => { onToggle(opt); }}
                  className="w-3.5 h-3.5 accent-[#303236]" />
                <span className="text-[13px] text-gray-700 whitespace-nowrap">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsGrid({ initialCats = [] }: { initialCats?: CatItem[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState(staticProducts);
  // 서버에서 전달받은 최신 분류로 시작 → 옛 카테고리가 깜빡이지 않는다 (정적 fallback 제거)
  const [cats, setCats] = useState<CatItem[]>(initialCats);
  const catParam = searchParams.get("cat") || searchParams.get("category");
  const subParam = searchParams.get("sub") || searchParams.get("subcategory");
  const [activeCategory, setActiveCategory] = useState<string>(catParam ?? "전체");
  const [activeSubCategory, setActiveSubCategory] = useState<string>(subParam ?? "전체");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(false);
  // 브랜드 필터 목록 표시 언어 — 한글명이 등록된 브랜드만 전환되고, 없는 브랜드는 원래 이름 그대로 노출된다.
  const [brandDisplayKo, setBrandDisplayKo] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [filtersCfg, setFiltersCfg] = useState<ProductFiltersConfig>(DEFAULT_PRODUCT_FILTERS);
  const { count, hasProduct, toggleProduct } = useCart();
  const [memberSession, setMemberSession] = useState<{ name: string; grade: string } | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const searchQuery = searchParams.get("q") ?? "";
  // 브랜드명(영문) → 한글 검색명 매핑 — 검색 시 "노스페이스"로도 "NORTH FACE" 상품이 찾아지도록
  const [brandAliasMap, setBrandAliasMap] = useState<Record<string, string>>({});
  // 브랜드 필터 표시용 — 검색 매칭용 brandAliasMap과 달리 원래 대소문자를 그대로 보존한다.
  const [brandKoMap, setBrandKoMap] = useState<Record<string, string>>({});
  const [brandList, setBrandList] = useState<string[]>([]);
  // 목록을 한 번에 다 그리면(200개+) 초기 로딩이 무거워져서, "더보기"로 점진적으로 늘려 보여준다.
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProducts(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data: { name: string; name_ko?: string | null }[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, string> = {};
        const koMap: Record<string, string> = {};
        const brands: string[] = [];
        data.forEach((b) => {
          if (b.name) {
            brands.push(b.name);
            if (b.name_ko) {
              map[b.name.toLowerCase()] = b.name_ko.toLowerCase();
              koMap[b.name] = b.name_ko;
            }
          }
        });
        setBrandAliasMap(map);
        setBrandKoMap(koMap);
        setBrandList(brands.sort((a, b) => a.localeCompare(b, "ko")));
      })
      .catch(() => {});
  }, []);

  // 카테고리 분류 — 클라이언트에서 한 번 더 최신화 (서버 prop이 캐시됐을 경우 대비)
  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCats(data.categories as CatItem[]);
        }
      })
      .catch(() => {});
  }, []);

  // 관리자가 선정한 브랜드 — 있으면 그것만 사용, 없으면 전체 사용
  useEffect(() => {
    fetch("/api/admin/site-settings/featured-brands")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.featured_brands && Array.isArray(data.featured_brands) && data.featured_brands.length > 0) {
          setBrandList(data.featured_brands);
        }
      })
      .catch(() => {});
  }, []);

  // 상단 필터(사이즈·가격 구간) 설정 — 관리자 "필터 관리"에서 조정
  useEffect(() => {
    fetch("/api/admin/site-settings/product_filters")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setFiltersCfg(normalizeProductFilters(d)); })
      .catch(() => {});
  }, []);

  // 회원 로그인 세션 — 카드 하트(찜) 게이팅용
  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((d) => setMemberSession(d ?? null))
      .catch(() => setMemberSession(null));
  }, []);

  // 카테고리·서브카테고리 선택을 주소창 URL(?cat=&sub=)에도 반영 — 배너 등에서 특정 카테고리로 바로 연결하는 링크를 만들 수 있도록.
  // 검색 결과를 보던 중 다른 카테고리를 누르면 검색(q)은 해제한다 — 안 그러면 검색어가 남아
  // 카테고리를 눌러도 화면이 그대로(검색 결과만 계속 필터링)인 것처럼 보이는 문제가 있었다.
  const navigateToCategory = useCallback((cat: string, sub: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("subcategory");
    params.delete("q");
    if (cat === "전체") params.delete("cat"); else params.set("cat", cat);
    if (sub === "전체") params.delete("sub"); else params.set("sub", sub);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubCategory("전체");
    navigateToCategory(cat, "전체");
  };

  const handleSubCategoryChange = (sub: string) => {
    setActiveSubCategory(sub);
    navigateToCategory(activeCategory, sub);
  };

  const toggleSeason = (v: string) =>
    setSelectedSeasons((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleSize = (v: string) =>
    setSelectedSizes((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleBrand = (v: string) =>
    setSelectedBrands((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  // 한글명이 등록된 브랜드만 전환 표시하고, 없는 브랜드는 원래 이름 그대로 보여준다.
  const brandLabel = (b: string) => (brandDisplayKo && brandKoMap[b]) || b;

  const resetFilters = () => {
    setSelectedSeasons([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
  };

  const resetAll = () => {
    resetFilters();
    handleCategoryChange("전체");
    if (searchQuery) router.push("/products");
  };

  const subCats: string[] =
    activeCategory !== "전체"
      ? (cats.find((c) => c.name === activeCategory)?.subs ?? [])
      : [];

  const allCats: string[] = ["전체", ...cats.map((c) => c.name)];

  const getProductCats = (p: typeof products[0]) => {
    const raw = (p as Record<string, unknown>).categories as { main: string; sub: string }[] | undefined;
    return raw?.length ? raw : p.category ? [{ main: p.category, sub: p.subCategory ?? "" }] : [];
  };

  const filtered = products
    .filter((p) => {
      // 검색어·카테고리·사이즈·브랜드·시즌 조건을 전부 AND로 검사한다 — 예전엔 검색어가 있으면
      // 그 즉시 검색 결과만으로 판단하고 나머지 필터(사이즈 등)를 건너뛰어서, 필터 칩은 선택된
      // 채로 보이는데 실제로는 적용 안 되는 문제가 있었다.
      if (searchQuery) {
        // 띄어쓰기로 여러 단어를 입력하면, 순서·연속 여부와 무관하게 모든 단어가 상품명·카테고리·
        // 소개·브랜드 중 어딘가에 흩어져 있어도 찾는다(기존엔 입력 문자열 전체가 한 번에 이어져 있어야 매치됐음).
        const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const cats = getProductCats(p);
        const brand = (p.brand ?? "").toLowerCase();
        const brandAlias = brandAliasMap[brand] ?? "";
        const haystack = [
          p.name.toLowerCase(),
          p.tagline?.toLowerCase() ?? "",
          brand,
          brandAlias,
          ...cats.map((c) => c.main.toLowerCase()),
          ...cats.map((c) => c.sub.toLowerCase()),
        ].join(" ");
        if (!tokens.every((t) => haystack.includes(t))) return false;
      }
      if (activeCategory !== "전체") {
        const cats = getProductCats(p);
        if (!cats.some(c => c.main === activeCategory)) return false;
        if (activeSubCategory !== "전체" && !cats.some(c => c.main === activeCategory && c.sub === activeSubCategory)) return false;
      }
      if (selectedSizes.length > 0) {
        if (!selectedSizes.some((s) => (p.sizes ?? []).includes(s))) return false;
      }
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(p.brand ?? "")) return false;
      }
      if (selectedSeasons.length > 0) {
        if (!selectedSeasons.some((s) => (p.seasons ?? []).some((ps) => ps === s))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      // 최종 수정(updatedAt)이 최근인 상품이 위로 — 값이 없는 옛 데이터는 생성일로 대체.
      const aTime = a.updatedAt ?? a.createdAt ?? "";
      const bTime = b.updatedAt ?? b.createdAt ?? "";
      return bTime.localeCompare(aTime);
    });

  // 검색어·카테고리·필터가 바뀌면 노출 개수를 다시 초기값으로 되돌린다(다른 조건으로 바꿨는데
  // 이전 필터에서 늘려둔 개수가 그대로 남아 목록이 뒤죽박죽 보이는 것 방지).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeCategory, activeSubCategory, selectedSizes, selectedBrands, selectedSeasons]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const showMore = () => setVisibleCount((v) => Math.min(v + PAGE_SIZE, filtered.length));

  const currentTitle =
    activeSubCategory !== "전체"
      ? activeSubCategory
      : activeCategory !== "전체"
      ? activeCategory
      : "전체 상품";

  // ── Shared filter accordions ──────────────────────────
  const filterAccordions = (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={resetAll}
          className="text-[11px] text-gray-400 hover:text-[#303236] transition-colors whitespace-nowrap"
        >
          초기화
        </button>
      </div>

      <Accordion label="사이즈" open={sizeOpen} onToggle={() => setSizeOpen(!sizeOpen)}>
        <div className="flex flex-wrap gap-2">
          {filtersCfg.sizes.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 border text-[12px] transition-colors ${
                selectedSizes.includes(s) ? "border-[#303236] bg-[#303236] text-white" : "border-gray-200 text-gray-600 hover:border-[#303236]"
              }`}
            >{s}</button>
          ))}
        </div>
      </Accordion>

      <Accordion label="브랜드" open={brandOpen} onToggle={() => setBrandOpen(!brandOpen)}>
        <div className="flex justify-end mb-2.5">
          <button
            type="button"
            onClick={() => setBrandDisplayKo((v) => !v)}
            aria-label="브랜드명 한/영 전환"
            className="text-[11px] text-[#303236] hover:text-[#E5541B] border border-[#303236] hover:border-[#E5541B] rounded px-2 py-1 transition-colors"
          >
            {brandDisplayKo ? "A" : "가"} · {brandDisplayKo ? "영문으로" : "한글로"}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {brandList.map((b) => (
            <label key={b} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)}
                className="w-[14px] h-[14px] accent-[#303236] flex-shrink-0" />
              <span className="text-[13px] text-gray-700">{brandLabel(b)}</span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* Bottom buttons */}
      <div className="flex gap-2 border-t border-gray-200 pt-4 mt-2">
        <button onClick={resetFilters}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 py-3 text-[12px] text-gray-700 hover:border-[#303236] transition-colors">
          검색 초기화
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button className="flex-1 bg-[#303236] text-white py-3 text-[12px] font-semibold hover:bg-[#243d5e] transition-colors">
          {filtered.length} 상품보기
        </button>
      </div>
    </div>
  );

  // 카드 하트 = 찜(피팅 리스트) 토글. 로그인 필요 — "피팅 리스트에 담기" 정책과 동일.
  const toggleFav = (product: typeof products[0]) => {
    if (!memberSession) {
      setLoginPromptOpen(true);
      return;
    }
    toggleProduct({
      productId: product.id,
      name: productDisplayName(product),
      sku: product.sku,
      line: product.line,
      price: product.price,
      size: "",
      color: product.colors?.[0]?.name ?? "",
      colorHex: product.colors?.[0]?.hex ?? "#000",
      bg: product.bg,
      imageUrl: product.imageUrl,
      allSizes: product.sizes,
      allColors: product.colors,
    });
  };

  // ── Product card (shared) ─────────────────────────────
  const ProductCard = ({ product, mobile }: { product: typeof products[0]; mobile?: boolean }) => (
    <div className={`flex flex-col ${mobile ? "w-[calc(50%-5px)]" : "w-full"}`}>
      <Link
        href={`/products/${product.id}`}
        className={`${product.bg} relative overflow-hidden aspect-square flex-shrink-0 w-full`}
      >
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover"
            sizes={mobile ? "50vw" : "(min-width: 1280px) 25vw, 33vw"} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-white/20 text-[10px] tracking-widest uppercase">WORKUP</span>
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-white/90 text-[#E5541B] text-[10px] tracking-[0.2em] px-2 py-0.5 z-10">NEW</span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleFav(product); }}
          className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center z-10"
          aria-label="찜하기"
        >
          <svg
            className="w-7 h-7 transition-colors duration-150"
            fill={hasProduct(product.id) ? "#E5541B" : "none"}
            stroke={hasProduct(product.id) ? "#E5541B" : "white"}
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </Link>
      <div className={mobile ? "pt-2.5" : "pt-3"}>
        {product.colors?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {/* 색상명이 데이터상 중복될 수 있어(예: "네이비"가 두 번 등록) 이름만으로는 key가 겹칠 수 있다 —
                인덱스를 함께 써서 React key 경고·중복 렌더링을 방지한다. */}
            {product.colors.slice(0, 5).map((c, i) => (
              <div key={`${c.name}-${i}`} className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
          </div>
        )}
        <h3 className={`font-medium text-[#303236] leading-snug ${mobile ? "text-[12px]" : "text-[13px]"}`}>
          <Link href={`/products/${product.id}`} className="hover:underline underline-offset-4 decoration-1 transition-colors">{productDisplayName(product)}</Link>
        </h3>
      </div>
    </div>
  );

  return (
    <section className="bg-white min-h-screen">

      {/* ══════════════════ MOBILE ══════════════════════ */}
      <div className="md:hidden">

        {/* 상단 컨트롤 고정 — 모바일: 헤더가 non-sticky이므로 탑바 높이만 오프셋 */}
        <div
          className="sticky z-40 bg-white"
          style={{ top: "var(--wu-topbar-h, 36px)" }}
        >

        {/* Top bar: ← Title Cart */}
        <div className="flex items-center justify-between px-[15px] py-3 border-b border-gray-200">
          <button
            onClick={() => {
              if (activeSubCategory !== "전체") {
                handleSubCategoryChange("전체");
              } else {
                router.back();
              }
            }}
            className="p-1 text-[#303236]"
            aria-label="뒤로"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-[16px] font-bold text-[#303236] tracking-tight">{currentTitle}</h1>

          <Link href="/cart" className="relative p-1 text-[#303236]" aria-label="찜 목록">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-[#E5541B] text-white text-[9px] font-bold flex items-center justify-center rounded-full px-0.5">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* ── Main category strip ── */}
        <div
          className="flex border-b border-gray-200 overflow-x-auto bg-white"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allCats.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-4 py-3 text-[13px] whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-[#303236] text-[#303236] font-bold"
                    : "border-transparent text-gray-500"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Subcategory strip ── */}
        {subCats.length > 0 && (
          <div
            className="flex items-center gap-5 px-[15px] py-3 border-b border-gray-100 bg-white overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {["전체", ...subCats].map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubCategoryChange(sub)}
                className={`flex-shrink-0 text-[13px] whitespace-nowrap transition-colors pb-0.5 ${
                  activeSubCategory === sub
                    ? "font-bold text-[#303236] border-b-2 border-[#303236]"
                    : "text-gray-400"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Search banner */}
        {searchQuery && (
          <div className="mx-[15px] mt-3 pb-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <p className="text-[14px] text-[#303236]">
              <span className="font-bold">&apos;{searchQuery}&apos;</span>의 검색결과
              <span className="text-[11px] text-gray-400 font-normal ml-1.5">{filtered.length}개</span>
            </p>
            <button onClick={() => router.push("/products")} className="text-[11px] text-gray-400">초기화</button>
          </div>
        )}

        {/* ── 상품 수 + 필터 바 ── */}
        <div className="px-[15px] pt-3 pb-2 bg-white border-b border-gray-200">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-400">
                <span className="font-medium text-gray-600">{filtered.length}</span>개 상품
              </span>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-1.5 text-[12px] text-gray-500 border border-gray-300 px-2.5 py-1"
              >
                필터
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1.5" x2="13" y2="1.5" />
                  <line x1="3" y1="6" x2="11" y2="6" />
                  <line x1="5" y1="10.5" x2="9" y2="10.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        </div>
        {/* ── 상단 고정 컨트롤 끝 ── */}

        {/* Product grid — 10px gap */}
        <div className="px-[15px] pt-4 pb-10">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">해당 카테고리의 제품이 없습니다.</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-[10px]" data-nosnippet>
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} mobile />
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={showMore}
                  className="w-full mt-5 py-3 border border-gray-300 text-[13px] font-semibold text-gray-600 hover:border-[#303236] hover:text-[#303236] transition-colors"
                >
                  더보기 ({visibleCount} / {filtered.length})
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Mobile filter overlay (slides in from right) ── */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
            <div className="w-[85vw] max-w-[340px] bg-white h-full overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-[16px] font-bold text-[#303236]">필터</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-[#303236] p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-5 py-4 flex-1 overflow-y-auto">
                {filterAccordions}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ DESKTOP ═════════════════════ */}
      <div className="hidden md:block">

        {/* 카테고리 타이틀 */}
        <div className="px-[70px] pt-8 pb-2 bg-white border-b border-gray-200">
          <h2 className="text-[26px] font-bold text-[#303236] leading-tight pb-4">{currentTitle}</h2>
        </div>

        {/* 사이드바 + 제품 */}
        <div className="pt-6 pb-10">
          <div className="px-[70px]">

            {searchQuery && (
              <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <p className="text-[17px] text-[#303236]">
                  <span className="font-bold">&apos;{searchQuery}&apos;</span>의 검색결과
                  <span className="text-[13px] text-gray-400 font-normal ml-2">{filtered.length}개</span>
                </p>
                <button onClick={() => router.push("/products")} className="text-[12px] text-gray-400 hover:text-[#303236] transition-colors">
                  검색 초기화
                </button>
              </div>
            )}

            {/* ── 카테고리 가로 탭 ── 첫 항목을 콘텐츠 좌측(타이틀·서브·정렬과 동일선)에 정렬 */}
            <div className="flex items-center gap-8 border-b border-gray-200 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {allCats.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`flex-shrink-0 py-3 text-[15px] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      isActive ? "border-[#303236] text-[#303236] font-bold" : "border-transparent text-gray-500 hover:text-[#303236]"
                    }`}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* ── 하위 카테고리 탭 ── */}
            {subCats.length > 0 && (
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                {["전체", ...subCats].map((sub) => (
                  <button key={sub} onClick={() => handleSubCategoryChange(sub)}
                    className={`text-[14px] whitespace-nowrap transition-colors pb-0.5 ${
                      activeSubCategory === sub ? "font-bold text-[#303236] border-b-2 border-[#303236]" : "text-gray-400 hover:text-[#303236]"
                    }`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* ── 콘텐츠 (전체 폭) ── */}
            <div>

                {/* 필터 드롭다운 + 상품 수 */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  {/* 사이즈 필터와 브랜드 필터 같은 라인 */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* 사이즈 필터 */}
                    <div className="flex-shrink-0">
                      <FilterDropdown label="사이즈" options={filtersCfg.sizes} selected={selectedSizes} onToggle={toggleSize} activeCount={selectedSizes.length} />
                    </div>

                    {/* 스페이서 */}
                    <div className="flex-1" />

                    {/* 브랜드 필터 - 가로 태그 형태 (오른쪽 끝) */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => setBrandDisplayKo((v) => !v)}
                        aria-label="브랜드명 한/영 전환"
                        title={brandDisplayKo ? "영문으로 보기" : "한글로 보기"}
                        className="px-2 py-1.5 border border-[#303236] text-[#303236] text-[11px] font-bold hover:border-[#E5541B] hover:text-[#E5541B] transition-colors rounded flex-shrink-0"
                      >
                        {brandDisplayKo ? "A" : "가"}
                      </button>
                      {brandList.slice(0, 10).map((brand) => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`px-3 py-1.5 border text-[12px] transition-colors rounded ${
                            selectedBrands.includes(brand)
                              ? "bg-[#303236] text-white border-[#303236]"
                              : "border-gray-200 text-gray-600 hover:border-[#303236]"
                          }`}
                        >
                          {brandLabel(brand)}
                        </button>
                      ))}
                      {brandList.length > 10 && (
                        <button
                          onClick={() => setBrandExpanded(!brandExpanded)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-[12px] hover:border-[#303236] transition-colors rounded flex items-center gap-1 flex-shrink-0"
                        >
                          더보기
                          <svg className={`w-3 h-3 transition-transform ${brandExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      {/* 초기화 + 상품 수 */}
                      {(selectedSizes.length > 0 || selectedBrands.length > 0) && (
                        <button onClick={resetFilters}
                          className="text-[11px] text-gray-400 hover:text-[#E5541B] transition-colors underline underline-offset-2 ml-2">
                          초기화
                        </button>
                      )}
                      <span className="text-[12px] text-gray-500 ml-2 whitespace-nowrap flex-shrink-0">
                        <span className="font-semibold text-[#303236]">{filtered.length}</span>개 상품
                      </span>
                    </div>
                  </div>

                  {/* 브랜드 드롭다운 - 더보기 클릭 시 표시 */}
                  {brandExpanded && brandList.length > 10 && (
                    <div className="grid grid-cols-5 gap-2 mb-4 pt-3 border-t border-gray-100">
                      {brandList.slice(10).map((brand) => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`px-3 py-1.5 border text-[12px] transition-colors rounded text-center ${
                            selectedBrands.includes(brand)
                              ? "bg-[#303236] text-white border-[#303236]"
                              : "border-gray-200 text-gray-600 hover:border-[#303236]"
                          }`}
                        >
                          {brandLabel(brand)}
                        </button>
                      ))}
                    </div>
                  )}

                </div>

                {/* 상품 그리드 */}
                {filtered.length === 0 ? (
                  <div className="py-24 text-center text-sm text-gray-400">해당 카테고리의 제품이 없습니다.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-5" data-nosnippet>
                      {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={showMore}
                          className="px-8 py-3 border border-gray-300 text-sm font-semibold text-gray-600 hover:border-[#303236] hover:text-[#303236] transition-colors"
                        >
                          더보기 ({visibleCount} / {filtered.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* 비로그인 시 로그인 유도 모달 */}
      <LoginPromptModal
        open={loginPromptOpen}
        onCancel={() => setLoginPromptOpen(false)}
        onConfirm={() => router.push("/member/login?from=cart")}
      />
    </section>
  );
}
