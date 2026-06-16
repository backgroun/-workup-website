"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { mainCategories, type MainCategory, type Product } from "@/data/products";

export default function HomeNewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<MainCategory | "전체">("전체");
  const [showLeft, setShowLeft] = useState(false);
  const [title, setTitle] = useState("신상품이 입고 되었어요");
  const [loading, setLoading] = useState(true);
  const pcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/admin/site-settings/new_arrivals").then((r) => r.json()).catch(() => null),
    ]).then(([prods, cfg]) => {
      if (Array.isArray(prods)) setProducts(prods);
      if (cfg?.title) setTitle(cfg.title);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const newCategories = new Set(products.filter((p) => p.isNew).map((p) => p.category));
  const availableTabs: (MainCategory | "전체")[] = [
    "전체",
    ...mainCategories.filter((cat) => newCategories.has(cat)),
  ];

  const newItems = products
    .filter((p) => p.isNew)
    .filter((p) => activeTab === "전체" || p.category === activeTab)
    .slice(0, 10);

  const handlePcScroll = () => setShowLeft((pcRef.current?.scrollLeft ?? 0) > 10);
  const scroll = (dir: "left" | "right") =>
    pcRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });

  if (loading) {
    return (
      <section className="bg-white pt-12 pb-14">
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

  if (newItems.length === 0) return null;

  return (
    <section className="bg-white pt-12 pb-14 overflow-x-hidden">
      <div className="px-[15px] md:px-[70px]">
        <h2 className="text-xl md:text-2xl font-bold text-[#1A2B4A] mb-5">{title}</h2>

        {/* 카테고리 탭 */}
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
                  ? "text-[#1A2B4A] font-bold border-b-2 border-[#1A2B4A] -mb-px"
                  : "text-gray-400 hover:text-[#1A2B4A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* PC 가로 스크롤 캐러셀 */}
        <div className="hidden md:block relative -mr-[70px]">
          {showLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="이전"
              className="absolute top-[140px] -translate-y-1/2 z-10 flex items-center justify-center"
              style={{ left: "85px" }}
            >
              <svg width="18" height="34" viewBox="0 0 18 34" fill="none" stroke="#1A2B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 5L5 17L13 29" />
              </svg>
            </button>
          )}
          <button
            onClick={() => scroll("right")}
            aria-label="다음"
            className="absolute top-[140px] -translate-y-1/2 z-10 flex items-center justify-center"
            style={{ right: "85px" }}
          >
            <svg width="18" height="34" viewBox="0 0 18 34" fill="none" stroke="#1A2B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5L13 17L5 29" />
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
                  className="flex items-center justify-center overflow-hidden bg-[#f0f0f0]"
                  style={{ width: "280px", height: "280px" }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-[#1A2B4A]/10 text-6xl font-black select-none">WU</span>
                  )}
                </div>
                <div className="pt-3">
                  {p.isNew && (
                    <span className="inline-block bg-[#ff550c] text-white text-[9px] font-bold px-2 py-0.5 tracking-widest mb-1.5">NEW</span>
                  )}
                  <p className="text-[13px] text-[#1A2B4A] font-medium leading-snug line-clamp-2 mb-1 group-hover:underline underline-offset-2">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">{p.tagline}</p>
                  <p className="text-[14px] font-bold text-[#1A2B4A]">{p.price}</p>
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
                  className="flex items-center justify-center overflow-hidden bg-[#f0f0f0]"
                  style={{ width: "220px", height: "220px" }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#1A2B4A]/10 text-5xl font-black select-none">WU</span>
                  )}
                </div>
                <div className="pt-2.5">
                  {p.isNew && (
                    <span className="inline-block bg-[#ff550c] text-white text-[9px] font-bold px-2 py-0.5 tracking-widest mb-1">NEW</span>
                  )}
                  <p className="text-[13px] text-[#1A2B4A] font-medium leading-snug line-clamp-2 mb-1">{p.name}</p>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-1.5">{p.tagline}</p>
                  <p className="text-[13px] font-bold text-[#1A2B4A]">{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
