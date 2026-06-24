"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import LoginPromptModal from "@/components/LoginPromptModal";
import {
  products as staticProducts,
  mainCategories,
  subCategoriesByMain,
  type MainCategory,
  type SubCategory,
} from "@/data/products";

type SortOption = "신상품순" | "낮은 가격순" | "높은 가격순";

const SORT_OPTIONS: SortOption[] = ["신상품순", "낮은 가격순", "높은 가격순"];
// 제품 데이터의 seasons 값("봄/가을"|"여름"|"겨울")과 일치시켜야 필터가 동작한다.
const SEASONS = ["봄/가을", "여름", "겨울"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const PRICE_RANGES = ["3만원 이하", "3~5만원", "5~8만원", "8만원 이상"];

function priceInRange(priceStr: string, range: string): boolean {
  const n = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
  if (range === "3만원 이하") return n < 30000;
  if (range === "3~5만원") return n >= 30000 && n < 50000;
  if (range === "5~8만원") return n >= 50000 && n < 80000;
  if (range === "8만원 이상") return n >= 80000;
  return true;
}

function Accordion({
  label, open, onToggle, children,
}: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-[14px] font-medium text-[#1A2B4A]"
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
          activeCount > 0 ? "border-[#1A2B4A] bg-[#1A2B4A] text-white" : "border-gray-300 text-gray-600 hover:border-[#1A2B4A]"
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
                  className="w-3.5 h-3.5 accent-[#1A2B4A]" />
                <span className="text-[13px] text-gray-700 whitespace-nowrap">{opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState(staticProducts);
  const catParam = searchParams.get("cat") || searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState<MainCategory | "전체">(
    catParam && mainCategories.includes(catParam as MainCategory) ? (catParam as MainCategory) : "전체"
  );
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | "전체">("전체");
  const [sortBy, setSortBy] = useState<SortOption>("신상품순");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const { count, hasProduct, toggleProduct } = useCart();
  const [memberSession, setMemberSession] = useState<{ name: string; grade: string } | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const searchQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProducts(data); })
      .catch(() => {});
  }, []);

  // 회원 로그인 세션 — 카드 하트(찜) 게이팅용
  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((d) => setMemberSession(d ?? null))
      .catch(() => setMemberSession(null));
  }, []);

  const handleCategoryChange = (cat: MainCategory | "전체") => {
    setActiveCategory(cat);
    setActiveSubCategory("전체");
  };

  const toggleSeason = (v: string) =>
    setSelectedSeasons((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleSize = (v: string) =>
    setSelectedSizes((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const togglePrice = (v: string) =>
    setSelectedPrices((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const resetFilters = () => {
    setSelectedSeasons([]);
    setSelectedSizes([]);
    setSelectedPrices([]);
  };

  const resetAll = () => {
    resetFilters();
    handleCategoryChange("전체");
    if (searchQuery) router.push("/products");
  };

  const subCats: SubCategory[] =
    activeCategory !== "전체"
      ? subCategoriesByMain[activeCategory as MainCategory]
      : [];

  const allCats: (MainCategory | "전체")[] = ["전체", ...mainCategories];

  const getProductCats = (p: typeof products[0]) => {
    const raw = (p as Record<string, unknown>).categories as { main: string; sub: string }[] | undefined;
    return raw?.length ? raw : p.category ? [{ main: p.category, sub: p.subCategory ?? "" }] : [];
  };

  const filtered = products
    .filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const cats = getProductCats(p);
        return (
          p.name.toLowerCase().includes(q) ||
          cats.some(c => c.main.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q)) ||
          (p.tagline?.toLowerCase().includes(q) ?? false)
        );
      }
      if (activeCategory !== "전체") {
        const cats = getProductCats(p);
        if (!cats.some(c => c.main === activeCategory)) return false;
        if (activeSubCategory !== "전체" && !cats.some(c => c.main === activeCategory && c.sub === activeSubCategory)) return false;
      }
      if (selectedPrices.length > 0) {
        if (!selectedPrices.some((r) => priceInRange(p.price, r))) return false;
      }
      if (selectedSizes.length > 0) {
        if (!selectedSizes.some((s) => (p.sizes ?? []).includes(s))) return false;
      }
      if (selectedSeasons.length > 0) {
        if (!selectedSeasons.some((s) => (p.seasons ?? []).some((ps) => ps === s))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "신상품순") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (sortBy === "낮은 가격순")
        return parseInt(a.price.replace(/[^0-9]/g, "")) - parseInt(b.price.replace(/[^0-9]/g, ""));
      if (sortBy === "높은 가격순")
        return parseInt(b.price.replace(/[^0-9]/g, "")) - parseInt(a.price.replace(/[^0-9]/g, ""));
      return 0;
    });

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
          className="text-[11px] text-gray-400 hover:text-[#1A2B4A] transition-colors whitespace-nowrap"
        >
          초기화
        </button>
      </div>

      <Accordion label="사이즈" open={sizeOpen} onToggle={() => setSizeOpen(!sizeOpen)}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 border text-[12px] transition-colors ${
                selectedSizes.includes(s) ? "border-[#1A2B4A] bg-[#1A2B4A] text-white" : "border-gray-200 text-gray-600 hover:border-[#1A2B4A]"
              }`}
            >{s}</button>
          ))}
        </div>
      </Accordion>

      <Accordion label="가격" open={priceOpen} onToggle={() => setPriceOpen(!priceOpen)}>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={selectedPrices.includes(r)} onChange={() => togglePrice(r)}
                className="w-[14px] h-[14px] accent-[#1A2B4A] flex-shrink-0" />
              <span className="text-[13px] text-gray-700">{r}</span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* Bottom buttons */}
      <div className="flex gap-2 border-t border-gray-200 pt-4 mt-2">
        <button onClick={resetFilters}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 py-3 text-[12px] text-gray-700 hover:border-[#1A2B4A] transition-colors">
          검색 초기화
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button className="flex-1 bg-[#1A2B4A] text-white py-3 text-[12px] font-semibold hover:bg-[#243d5e] transition-colors">
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
      name: product.name,
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
          <span className="absolute top-2 left-2 bg-[#ff550c] text-white text-[9px] font-bold px-2 py-0.5 tracking-widest z-10">NEW</span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleFav(product); }}
          className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center z-10"
          aria-label="찜하기"
        >
          <svg
            className="w-7 h-7 transition-colors duration-150"
            fill={hasProduct(product.id) ? "#ff550c" : "none"}
            stroke={hasProduct(product.id) ? "#ff550c" : "white"}
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
            {product.colors.slice(0, 5).map((c) => (
              <div key={c.name} className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
          </div>
        )}
        <h3 className={`font-medium text-[#1A2B4A] leading-snug ${mobile ? "text-[12px]" : "text-[13px]"}`}>
          <Link href={`/products/${product.id}`} className="hover:text-[#ff550c] transition-colors">{product.name}</Link>
        </h3>
        {product.sku && (
          <p className={`text-gray-400 tracking-wider mt-0.5 mb-1 ${mobile ? "text-[9px]" : "text-[10px]"}`}>{product.sku}</p>
        )}
        <p className={`font-bold text-[#1A2B4A] ${mobile ? "text-[13px]" : "text-[14px]"}`}>{product.price}</p>
      </div>
    </div>
  );

  return (
    <section className="bg-white min-h-screen">

      {/* ══════════════════ MOBILE ══════════════════════ */}
      <div className="md:hidden">

        {/* 상단 컨트롤 고정 — 타이틀·카테고리·하위카테고리·정렬/필터까지 sticky(헤더 바로 아래),
            상품 리스트만 스크롤. top = 공지바 높이(--wu-topbar-h) + 헤더 높이(56px) */}
        <div
          className="sticky z-40 bg-white"
          style={{ top: "calc(var(--wu-topbar-h, 36px) + 56px)" }}
        >

        {/* Top bar: ← Title Cart */}
        <div className="flex items-center justify-between px-[15px] py-3 border-b border-gray-200">
          <button
            onClick={() => {
              if (activeSubCategory !== "전체") {
                setActiveSubCategory("전체");
              } else {
                router.back();
              }
            }}
            className="p-1 text-[#1A2B4A]"
            aria-label="뒤로"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-[16px] font-bold text-[#1A2B4A] tracking-tight">{currentTitle}</h1>

          <Link href="/cart" className="relative p-1 text-[#1A2B4A]" aria-label="찜 목록">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-[#ff550c] text-white text-[9px] font-bold flex items-center justify-center rounded-full px-0.5">
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
                    ? "border-[#1A2B4A] text-[#1A2B4A] font-bold"
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
            {(["전체", ...subCats] as (SubCategory | "전체")[]).map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                className={`flex-shrink-0 text-[13px] whitespace-nowrap transition-colors pb-0.5 ${
                  activeSubCategory === sub
                    ? "font-bold text-[#1A2B4A] border-b-2 border-[#1A2B4A]"
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
          <div className="mx-[15px] mt-3 flex items-center justify-between gap-3 bg-amber-50 border-l-4 border-[#ff550c] px-4 py-2.5">
            <p className="text-[12px] text-[#1A2B4A]">
              <span className="font-bold">"{searchQuery}"</span>
              <span className="text-gray-400 ml-1">{filtered.length}개</span>
            </p>
            <button onClick={() => router.push("/products")} className="text-[11px] text-gray-400">✕</button>
          </div>
        )}

        {/* ── Sort + count/filter + 품절 바 ── */}
        <div className="px-[15px] pt-3 pb-2 bg-white border-b border-gray-200">
          {/* 첫 줄: 정렬 버튼 | 상품수 + 필터 */}
          <div className="flex items-center justify-between mb-2">
            {/* 정렬 — 버튼 클릭 시 바텀시트 */}
            <button
              onClick={() => setSortSheetOpen(true)}
              className="flex items-center gap-3 border-b border-gray-400 pb-1 flex-shrink-0"
            >
              <span className="text-[13px] text-gray-600 whitespace-nowrap">{sortBy}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1l5 5 5-5" />
              </svg>
            </button>

            {/* 상품 수 + 필터 버튼 */}
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

        {/* ── 정렬 바텀시트 ── */}
        {sortSheetOpen && (
          <div className="fixed inset-0 z-[150] flex flex-col justify-end md:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSortSheetOpen(false)} />
            <div className="relative bg-white rounded-t-2xl pt-4 pb-8 px-5 shadow-xl">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); setSortSheetOpen(false); }}
                  className="w-full flex items-center gap-3 py-3.5 border-b border-gray-100 last:border-0"
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sortBy === opt ? "border-[#1A2B4A]" : "border-gray-300"}`}>
                    {sortBy === opt && <span className="w-2.5 h-2.5 rounded-full bg-[#1A2B4A]" />}
                  </span>
                  <span className={`text-[14px] ${sortBy === opt ? "font-semibold text-[#1A2B4A]" : "text-gray-600"}`}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product grid — 10px gap */}
        <div className="px-[15px] pt-4 pb-10">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">해당 카테고리의 제품이 없습니다.</div>
          ) : (
            <div className="flex flex-wrap gap-[10px]">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} mobile />
              ))}
            </div>
          )}
        </div>

        {/* ── Mobile filter overlay (slides in from right) ── */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
            <div className="w-[85vw] max-w-[340px] bg-white h-full overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-[16px] font-bold text-[#1A2B4A]">필터</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-[#1A2B4A] p-1">
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
          <h2 className="text-[26px] font-bold text-[#1A2B4A] leading-tight pb-4">{currentTitle}</h2>
        </div>

        {/* 사이드바 + 제품 */}
        <div className="pt-6 pb-10">
          <div className="px-[70px]">

            {searchQuery && (
              <div className="mb-6 flex items-center justify-between gap-3 bg-amber-50 border-l-4 border-[#ff550c] px-4 py-3">
                <p className="text-[13px] text-[#1A2B4A]">
                  <span className="font-bold">"{searchQuery}"</span> 검색 결과
                  <span className="text-gray-400 ml-2">{filtered.length}개</span>
                </p>
                <button onClick={() => router.push("/products")} className="text-xs text-gray-400 hover:text-[#1A2B4A] transition-colors">
                  검색 초기화 ✕
                </button>
              </div>
            )}

            {/* ── 카테고리 가로 탭 (모바일 메뉴 스타일) ── */}
            <div className="flex items-center border-b border-gray-200 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {allCats.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`flex-shrink-0 px-5 py-3 text-[15px] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      isActive ? "border-[#1A2B4A] text-[#1A2B4A] font-bold" : "border-transparent text-gray-500 hover:text-[#1A2B4A]"
                    }`}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* ── 하위 카테고리 탭 ── */}
            {subCats.length > 0 && (
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                {(["전체", ...subCats] as (SubCategory | "전체")[]).map((sub) => (
                  <button key={sub} onClick={() => setActiveSubCategory(sub)}
                    className={`text-[14px] whitespace-nowrap transition-colors pb-0.5 ${
                      activeSubCategory === sub ? "font-bold text-[#1A2B4A] border-b-2 border-[#1A2B4A]" : "text-gray-400 hover:text-[#1A2B4A]"
                    }`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* ── 콘텐츠 (전체 폭) ── */}
            <div>

                {/* 정렬 + 필터 드롭다운 바 */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 gap-4 flex-wrap">
                  {/* 정렬 */}
                  <div className="flex items-center gap-5">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt} onClick={() => setSortBy(opt)}
                        className={`text-[13px] whitespace-nowrap transition-colors ${
                          sortBy === opt ? "font-bold text-[#1A2B4A]" : "text-gray-400 hover:text-[#1A2B4A]"
                        }`}
                      >{opt}</button>
                    ))}
                  </div>

                  {/* 필터 드롭다운 + 상품 수 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FilterDropdown label="시즌" options={SEASONS} selected={selectedSeasons} onToggle={toggleSeason} activeCount={selectedSeasons.length} />
                    <FilterDropdown label="사이즈" options={SIZES} selected={selectedSizes} onToggle={toggleSize} activeCount={selectedSizes.length} />
                    <FilterDropdown label="가격" options={PRICE_RANGES} selected={selectedPrices} onToggle={togglePrice} activeCount={selectedPrices.length} />
                    {(selectedSeasons.length + selectedSizes.length + selectedPrices.length) > 0 && (
                      <button onClick={resetFilters}
                        className="text-[11px] text-gray-400 hover:text-[#ff550c] transition-colors underline underline-offset-2 ml-1">
                        초기화
                      </button>
                    )}
                    <span className="text-[12px] text-gray-500 ml-2 whitespace-nowrap">
                      <span className="font-semibold text-[#1A2B4A]">{filtered.length}</span>개 상품
                    </span>
                  </div>
                </div>

                {/* 상품 그리드 */}
                {filtered.length === 0 ? (
                  <div className="py-24 text-center text-sm text-gray-400">해당 카테고리의 제품이 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
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
