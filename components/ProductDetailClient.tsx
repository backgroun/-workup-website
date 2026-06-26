"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import LoginPromptModal from "@/components/LoginPromptModal";
import { normalizeProductBanners, type ProductBanner } from "@/lib/product-banners";
import { stores } from "@/data/stores";
import { productDisplayName, type Product } from "@/data/products";

const SIZES = ["S", "M", "L", "XL", "2XL"];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

type NearStore = { id: number; name: string; address: string; distance: number; lat: number; lng: number };

export default function ProductDetailClient({
  product,
  relatedProducts = [],
  isNewLayout = false,
}: {
  product: Product;
  relatedProducts?: Product[];
  isNewLayout?: boolean;
}) {
  const { hasProduct, toggleProduct } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  // 사이즈별 가격 — 선택 사이즈에 지정가가 있으면 그 가격, 없으면 기본 판매가
  const sizePriceMap = new Map((product.sizePrices ?? []).filter((sp) => sp.price?.trim()).map((sp) => [sp.size, sp.price]));
  const hasSizePrices = sizePriceMap.size > 0;
  const displayPrice = (selectedSize && sizePriceMap.get(selectedSize)) || product.price;
  // 회원 로그인 세션 — 피팅 리스트 담기 게이팅용 (null = 비로그인)
  const [memberSession, setMemberSession] = useState<{ name: string; grade: string } | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [banners, setBanners] = useState<ProductBanner[]>([]);

  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((data) => setMemberSession(data ?? null))
      .catch(() => setMemberSession(null));
  }, []);

  // "가까운 매장 찾기" 하단 배너 (관리자 설정) — 이미지 있는 배너만
  useEffect(() => {
    fetch("/api/admin/site-settings/product_detail_banners")
      .then((r) => r.json())
      .then((d) => setBanners(normalizeProductBanners(d).banners.filter((b) => b.imageUrl)))
      .catch(() => {});
  }, []);

  const [showStorePanel, setShowStorePanel] = useState(false);
  const [nearStores, setNearStores] = useState<NearStore[]>([]);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locError, setLocError] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!showStorePanel) return;
    if (locStatus === "success") return;
    setLocStatus("loading");
    setLocError("");
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const coords = { lat, lng };
        setUserCoords(coords);
        const nearest = stores
          .map((s) => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);
        setNearStores(nearest);
        setLocStatus("success");
        fetch("/api/route-distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: coords, destinations: nearest.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })) }),
        })
          .then((r) => r.json())
          .then(({ results }: { results: { id: number; distance: number }[] }) => {
            const dm = new Map(results.map((r) => [r.id, r.distance]));
            setNearStores((prev) =>
              [...prev].map((s) => ({ ...s, distance: dm.get(s.id) ?? s.distance })).sort((a, b) => a.distance - b.distance)
            );
          })
          .catch(() => {});
      },
      (err) => {
        setLocStatus("error");
        setLocError(err.code === err.PERMISSION_DENIED ? "위치 접근 권한을 허용해 주세요." : "위치를 가져올 수 없습니다.");
      },
      { timeout: 10000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStorePanel]);

  const openKakao = (s: NearStore) => {
    const dest = `${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
    const url = userCoords
      ? `https://map.kakao.com/link/from/${encodeURIComponent("내 위치")},${userCoords.lat},${userCoords.lng}/to/${dest}`
      : `https://map.kakao.com/link/to/${dest}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch { /* 취소됨 */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* noop */ }
  };

  // 찜(하트) — 피팅 리스트 토글. 선택한 사이즈/컬러가 있으면 함께 담김. 로그인 필요.
  const toggleFav = () => {
    if (!memberSession) {
      setLoginPromptOpen(true);
      return;
    }
    toggleProduct({ productId: product.id, name: productDisplayName(product), sku: product.sku, line: product.line, price: displayPrice, size: selectedSize, color: selectedColor?.name ?? "", colorHex: selectedColor?.hex ?? "#000", bg: product.bg, imageUrl: product.imageUrl, allSizes: product.sizes, allColors: product.colors });
  };

  const StoreList = () => (
    <>
      {locStatus === "loading" && (
        <div className="flex items-center gap-3 py-6 text-sm text-gray-500">
          <span className="w-5 h-5 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          위치를 확인하는 중입니다...
        </div>
      )}
      {locStatus === "error" && (
        <div className="py-4">
          <p className="text-sm text-red-500 mb-3">{locError}</p>
          <button onClick={() => { setLocStatus("idle"); setShowStorePanel(false); setTimeout(() => setShowStorePanel(true), 50); }}
            className="text-xs text-[#1A2B4A] border border-[#1A2B4A] px-4 py-2 hover:bg-[#1A2B4A] hover:text-white transition-colors">
            다시 시도
          </button>
        </div>
      )}
      {locStatus === "success" && nearStores.length > 0 && (
        <div className="space-y-3">
          {nearStores.map((s, i) => (
            <div key={s.id} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${i === 0 ? "bg-[#ff550c] text-white" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-[#1A2B4A]">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.address}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold mb-1 ${i === 0 ? "text-[#ff550c]" : "text-gray-500"}`}>{formatDist(s.distance)}</p>
                <button onClick={() => openKakao(s)} className="text-xs text-[#1A2B4A] underline hover:text-[#ff550c] transition-colors">길찾기</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
    <div className="px-6 md:px-10 lg:px-14 py-8 md:py-12 space-y-7">

      {/* 이름 → 가격 → 브랜드·제품번호 (데스크탑 카테고리는 상단 브레드크럼이 담당) */}
      <div>
        {/* 카테고리 — 모바일 전용 (데스크탑은 상단 브레드크럼에 표시) */}
        {product.category && (
          <div className="md:hidden flex items-center gap-1.5 text-[11px] text-gray-400 mb-2.5">
            <span>{product.category}</span>
            {product.subCategory && (
              <>
                <span className="text-gray-300">›</span>
                <span>{product.subCategory}</span>
              </>
            )}
          </div>
        )}
        <h1 className="text-xl md:text-[28px] font-bold text-[#1A2B4A] leading-tight mb-2">{productDisplayName(product)}</h1>
        <p className="text-2xl md:text-3xl font-bold text-[#1A2B4A]">{displayPrice}</p>
        {hasSizePrices && (
          <p className="text-xs text-gray-400 mt-1">사이즈에 따라 가격이 다릅니다{selectedSize ? "" : " — 사이즈를 선택하면 해당 가격이 표시됩니다"}.</p>
        )}
        {(product.brand || product.sku) && (
          <div className="flex items-center gap-2.5 flex-wrap mt-3.5">
            {product.brand && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{product.brand}</span>
            )}
            {product.sku && (
              <span className="text-xs text-gray-400 tracking-wider">
                제품번호 · <span className="text-gray-500">{product.sku}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* 핵심 가치 — 신규 레이아웃만. 구 레이아웃의 상세·제품 정보는 하단 "상세 정보" 탭으로 일원화 */}
      {isNewLayout && product.coreValues && (
        <>
          <ul className="space-y-3">
            {product.coreValues.map((v) => (
              <li key={v} className="flex items-start gap-3 text-sm text-[#1A2B4A] font-medium leading-relaxed">
                <span className="w-5 h-5 bg-[#ff550c] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                {v}
              </li>
            ))}
          </ul>
          {product.fieldTest && (
            <div className="flex items-start gap-2.5 bg-orange-50 px-4 py-3 border-l-2 border-[#ff550c]">
              <span className="text-[#ff550c] text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
              <p className="text-xs text-gray-600 leading-relaxed">{product.fieldTest}</p>
            </div>
          )}
          <div className="h-px bg-gray-100" />
        </>
      )}

      {/* 컬러 */}
      {product.colors.length > 0 && (
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            {product.colors.map((c) => (
              <button key={c.name} onClick={() => setSelectedColor(c)} title={c.name}
                className={`w-7 h-7 rounded-full transition-all ${
                  selectedColor?.name === c.name ? "border-[3px] border-[#ebebeb] scale-110" : "border-2 border-transparent ring-1 ring-gray-200 hover:ring-gray-400"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {selectedColor && <span className="text-xs text-gray-500">{selectedColor.name}</span>}
          </div>
        </div>
      )}

      {/* 사이즈 */}
      <div>
        <div className="flex gap-2 flex-wrap">
          {(product.sizes && product.sizes.length > 0 ? product.sizes : SIZES).map((s) => (
            <button key={s} onClick={() => setSelectedSize(s)}
              className={`min-w-[48px] h-10 px-3 text-sm border transition-colors ${
                selectedSize === s
                  ? "bg-[#1A2B4A] text-white border-[#1A2B4A]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1A2B4A] hover:text-[#1A2B4A]"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 연관 상품 */}
      {relatedProducts.length > 0 && (
        <div>
          <p className="text-[15px] font-bold text-[#1A2B4A] mb-3">연관 상품</p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/products/${rp.id}`} className="flex-shrink-0 w-[88px] group">
                <div className={`relative w-[88px] h-[88px] overflow-hidden mb-2 ${rp.bg}`}>
                  {rp.imageUrl
                    ? <Image src={rp.imageUrl} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="88px" />
                    : <span className="absolute inset-0 flex items-center justify-center text-white/20 text-[8px]">WORKUP</span>
                  }
                </div>
                <p className="text-[11px] text-gray-600 leading-tight truncate">{productDisplayName(rp)}</p>
                <p className="text-xs font-semibold text-[#1A2B4A] mt-0.5">{rp.price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-gray-100" />

      {/* CTA: 가까운 매장 찾기 + 찜·공유 (1줄) → 피팅 리스트 안내 */}
      <div className="space-y-2.5">
        <div className="flex gap-2.5">
          {/* 가까운 매장 찾기 — 모바일: 바텀시트 / 데스크탑: 인라인 */}
          <button
            onClick={() => setShowStorePanel(!showStorePanel)}
            className="store-cta flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            가까운 매장 찾기
          </button>

          {/* 찜(하트) — 피팅 리스트 담기 */}
          <button onClick={toggleFav} aria-label="찜하기" title="찜하기"
            className="flex-shrink-0 w-[52px] flex items-center justify-center border border-gray-300 hover:border-[#ff550c] transition-colors">
            <svg className="w-5 h-5 transition-colors"
              fill={hasProduct(product.id) ? "#ff550c" : "none"}
              stroke={hasProduct(product.id) ? "#ff550c" : "#9ca3af"}
              strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* 공유 */}
          <button onClick={handleShare} aria-label="공유하기" title="공유하기"
            className="flex-shrink-0 w-[52px] flex items-center justify-center border border-gray-300 text-gray-600 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
            {shareCopied ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>
        </div>

        {/* 피팅 리스트 안내 — 버튼 바로 아래 */}
        <div className="bg-gray-50 px-4 py-4 border-l-2 border-gray-200">
          <p className="text-xs font-semibold text-[#1A2B4A] mb-1">피팅 리스트란?</p>
          <p className="text-xs text-gray-500 leading-relaxed">원하는 제품을 담아두고 매장 방문 시 직원에게 보여주세요.</p>
          <Link href="/cart" className="text-xs text-[#ff550c] font-semibold mt-2 inline-block hover:underline">피팅 리스트 보기 →</Link>
        </div>
      </div>

      {/* 가까운 매장 찾기 하단 배너 (관리자 설정) */}
      {banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((b, i) => (
            b.link ? (
              <a key={i} href={b.link} target={b.link.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt={`상세 배너 ${i + 1}`} className="w-full h-auto block" />
              </a>
            ) : (
              <div key={i} className="overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt={`상세 배너 ${i + 1}`} className="w-full h-auto block" />
              </div>
            )
          ))}
        </div>
      )}

      {/* 데스크탑 인라인 매장 패널 */}
      {showStorePanel && (
        <div className="hidden md:block border border-gray-200 bg-white overflow-hidden">
          <div className="bg-[#1A2B4A] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-widest text-[#ff550c] uppercase">내 주변 매장</p>
              <p className="text-sm font-bold text-white mt-0.5">가까운 매장 5곳</p>
            </div>
            <Link href="/store" className="text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1">
              전체 매장
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="p-5">
            <StoreList />
            {locStatus === "success" && (
              <Link href="/store" className="block text-center text-xs text-gray-400 hover:text-[#1A2B4A] transition-colors pt-3">전체 매장 보기 →</Link>
            )}
          </div>
        </div>
      )}

    </div>

    {/* 모바일 바텀시트 매장 패널 — 전 상품 공통 */}
    {showStorePanel && (
      <div className="md:hidden">
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowStorePanel(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl max-h-[75vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="px-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[11px] tracking-widest text-[#ff550c] uppercase">내 주변 매장</p>
              <p className="text-base font-bold text-[#1A2B4A]">가까운 매장 찾기</p>
            </div>
            <button onClick={() => setShowStorePanel(false)} className="text-gray-400 hover:text-gray-700 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <StoreList />
          </div>
          <div className="p-4 border-t border-gray-100 flex-shrink-0" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <Link href="/store" className="block w-full bg-[#1A2B4A] text-white text-center py-4 font-bold text-sm tracking-widest">
              전체 매장 바로가기 →
            </Link>
          </div>
        </div>
      </div>
    )}

    {/* 비로그인 시 로그인 유도 모달 */}
    <LoginPromptModal
      open={loginPromptOpen}
      onCancel={() => setLoginPromptOpen(false)}
      onConfirm={() => router.push("/member/login?from=cart")}
    />
    </>
  );
}
