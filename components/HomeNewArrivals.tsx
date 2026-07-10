"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import LoginPromptModal from "@/components/LoginPromptModal";
import { productDisplayName, type Product } from "@/data/products";
import {
  DEFAULT_NEW_ARRIVALS,
  normalizeNewArrivals,
  selectNewArrivalsPool,
  type NewArrivalsConfig,
} from "@/lib/new-arrivals";

// 시드 기반 셔플 — 같은 시드면 같은 순서(리렌더 안정). 시드는 마운트마다 바뀌어 방문 시 랜덤 노출.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeNewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [showLeft, setShowLeft] = useState(false);
  const [cfg, setCfg] = useState<NewArrivalsConfig>(DEFAULT_NEW_ARRIVALS);
  const [loading, setLoading] = useState(true);
  // 방문(마운트)마다 랜덤 순서 — 마운트 후 시드를 새로 뽑아 셔플. 리렌더 중엔 시드 고정이라 순서 안 튐.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => { setShuffleSeed(Math.floor(Math.random() * 1_000_000) + 1); }, []);
  const pcRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { hasProduct, toggleProduct } = useCart();
  const [memberSession, setMemberSession] = useState<{ name: string; grade: string } | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/admin/site-settings/new_arrivals").then((r) => r.json()).catch(() => null),
    ]).then(([prods, cfgRaw]) => {
      if (Array.isArray(prods)) setProducts(prods);
      setCfg(normalizeNewArrivals(cfgRaw));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // 회원 로그인 세션 — 찜(카드 하트) 게이팅용
  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((d) => setMemberSession(d ?? null))
      .catch(() => setMemberSession(null));
  }, []);

  // 카드 하트 = 찜(피팅 리스트) 토글. 로그인 필요 — 제품 리스트와 동일 정책.
  const toggleFav = (p: Product) => {
    if (!memberSession) {
      setLoginPromptOpen(true);
      return;
    }
    toggleProduct({
      productId: p.id,
      name: productDisplayName(p),
      sku: p.sku,
      line: p.line,
      price: p.price,
      size: "",
      color: p.colors?.[0]?.name ?? "",
      colorHex: p.colors?.[0]?.hex ?? "#000",
      bg: p.bg,
      imageUrl: p.imageUrl,
      allSizes: p.sizes,
      allColors: p.colors,
    });
  };

  // 관리자 "신상품 영역" 설정을 반영해 노출 상품 선정 (수동선택·자동·정렬·카테고리·품절숨김)
  const basePool = useMemo(() => selectNewArrivalsPool(products, cfg), [products, cfg]);
  // 방문마다 랜덤 순서로 노출 (탭 목록은 basePool 기준으로 안정 유지)
  const pool = useMemo(() => seededShuffle(basePool, shuffleSeed), [basePool, shuffleSeed]);

  // 카테고리 탭 — 자동 모드 + 탭 표시 설정일 때만. 실제 존재하는 카테고리만 노출 (순서 고정)
  const showTabs =
    cfg.show_category_tabs &&
    cfg.mode === "auto" &&
    new Set(basePool.map((p) => p.category).filter(Boolean)).size > 1;
  const availableTabs: string[] = showTabs
    ? ["전체", ...new Set(basePool.map((p) => p.category).filter(Boolean))]
    : [];

  const tabbed = showTabs && activeTab !== "전체"
    ? pool.filter((p) => p.category === activeTab)
    : pool;
  // 수동 모드는 선택한 상품을 모두 노출, 자동 모드는 설정한 개수만큼
  const newItems = cfg.mode === "manual" ? tabbed : tabbed.slice(0, cfg.count);

  const handlePcScroll = () => setShowLeft((pcRef.current?.scrollLeft ?? 0) > 10);
  const scroll = (dir: "left" | "right") =>
    pcRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });

  if (loading) {
    return (
      <section className="bg-white pt-6 pb-8 md:pt-12 md:pb-14">
        <div className="px-[15px] md:px-[70px]">
          <div className="h-7 w-52 bg-gray-100 rounded animate-pulse mb-5" />
          <div className="hidden md:flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px]">
                <div className="w-[280px] h-[280px] bg-gray-100 animate-pulse" />
                <div className="pt-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!cfg.is_visible || newItems.length === 0) return null;

  return (
    <section className="bg-white pt-6 pb-8 md:pt-12 md:pb-14 overflow-x-hidden">
      <div className="px-[15px] md:px-[70px]">
        <h2 className="text-xl md:text-2xl font-bold text-[#303236] mb-5">{cfg.title}</h2>

        {/* 카테고리 탭 — 자동 모드 + 탭 표시 설정일 때만 */}
        {availableTabs.length > 0 && (
          <div
            className="flex items-end overflow-x-auto border-b border-gray-200 mb-6"
            style={{ scrollbarWidth: "none" }}
          >
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 text-[13px] pb-2.5 px-3 mr-1 whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "text-[#303236] font-bold border-b-2 border-[#303236] -mb-px"
                    : "text-gray-400 hover:text-[#303236]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* PC 가로 스크롤 캐러셀 — 화살표는 마우스 오버 시에만 표시되는 반투명 흰 원형 버튼(작은 chevron), 이미지 위에 오버레이 */}
        <div className="hidden md:block relative group/nav -mr-[70px]">
          {showLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="이전"
              className="absolute left-4 top-[140px] -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-white/90"
            >
              <svg className="w-3.5 h-3.5 text-[#303236]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => scroll("right")}
            aria-label="다음"
            className="absolute right-4 top-[140px] -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-white/90"
          >
            <svg className="w-3.5 h-3.5 text-[#303236]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            ref={pcRef}
            onScroll={handlePcScroll}
            className="flex gap-4 overflow-x-auto pb-1 pr-[70px]"
            style={{ scrollbarWidth: "none" }}
          >
            {newItems.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="flex-shrink-0 group" style={{ width: "280px" }}>
                <div
                  className="relative flex items-center justify-center overflow-hidden bg-[#f0f0f0]"
                  style={{ width: "280px", height: "280px" }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-[#303236]/10 text-6xl font-black select-none">WU</span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); toggleFav(p); }}
                    className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center z-10"
                    aria-label="찜하기"
                  >
                    <svg className="w-7 h-7 transition-colors duration-150"
                      fill={hasProduct(p.id) ? "#ff550c" : "none"}
                      stroke={hasProduct(p.id) ? "#ff550c" : "white"}
                      strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="pt-3">
                  {p.isNew && (
                    <span className="inline-block bg-[#ff550c] text-white text-[9px] font-bold px-2 py-0.5 tracking-widest mb-1.5">NEW</span>
                  )}
                  <p className="text-[13px] text-[#303236] font-medium leading-snug line-clamp-2 mb-1 group-hover:underline underline-offset-2">
                    {productDisplayName(p)}
                  </p>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">{p.tagline}</p>
                  <p className="text-[14px] font-bold text-[#303236]">{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 모바일 가로 캐러셀 */}
        <div className="md:hidden">
          <div
            className="flex gap-3 overflow-x-auto pb-1 -mx-[15px] px-[15px]"
            style={{ scrollbarWidth: "none" }}
          >
            {newItems.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="flex-shrink-0 group" style={{ width: "220px" }}>
                <div
                  className="relative flex items-center justify-center overflow-hidden bg-[#f0f0f0]"
                  style={{ width: "220px", height: "220px" }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#303236]/10 text-5xl font-black select-none">WU</span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); toggleFav(p); }}
                    className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center z-10"
                    aria-label="찜하기"
                  >
                    <svg className="w-7 h-7 transition-colors duration-150"
                      fill={hasProduct(p.id) ? "#ff550c" : "none"}
                      stroke={hasProduct(p.id) ? "#ff550c" : "white"}
                      strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="pt-2.5">
                  {p.isNew && (
                    <span className="inline-block bg-[#ff550c] text-white text-[9px] font-bold px-2 py-0.5 tracking-widest mb-1">NEW</span>
                  )}
                  <p className="text-[13px] text-[#303236] font-medium leading-snug line-clamp-2 mb-1">{productDisplayName(p)}</p>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-1.5">{p.tagline}</p>
                  <p className="text-[13px] font-bold text-[#303236]">{p.price}</p>
                </div>
              </Link>
            ))}
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
