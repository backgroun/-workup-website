"use client";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { type WishlistConfig } from "@/lib/wishlist";

// 찜(피팅 리스트) 페이지 화면. 문구·CTA는 관리자(피킹리스트 관리)에서 설정한 config로 채운다.
export default function CartView({ config: c }: { config: WishlistConfig }) {
  const { items, removeItem, clearCart } = useCart();

  return (
    <main>
      <div className="bg-[#1A2B4A] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">{c.heroEyebrow}</p>
          <h1 className="text-4xl font-bold text-white mb-2">{c.heroTitle}</h1>
          <p className="text-gray-300 text-sm">{c.heroDesc}</p>
        </div>
      </div>

      <section className="bg-[#F5F2ED] py-16 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-6">

          {items.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-bold text-[#1A2B4A] mb-3">{c.emptyTitle}</p>
              <p className="text-sm text-gray-500 mb-8">{c.emptyDesc}</p>
              <Link
                href={c.emptyCtaHref}
                className="inline-block bg-[#1A2B4A] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#ff550c] transition-colors"
              >
                {c.emptyCtaLabel}
              </Link>
            </div>
          ) : (
            <>
              {/* 매장 방문 안내 배너 */}
              <div className="bg-[#ff550c] text-white px-6 py-5 mb-8">
                <p className="font-bold mb-1">{c.noticeTitle}</p>
                <p className="text-sm text-orange-100 leading-relaxed">{c.noticeDesc}</p>
                <Link
                  href={c.noticeCtaHref}
                  className="inline-block mt-3 text-xs border border-white text-white px-4 py-2 hover:bg-white hover:text-[#ff550c] transition-colors"
                >
                  {c.noticeCtaLabel}
                </Link>
              </div>

              {/* 아이템 목록 */}
              <div className="space-y-3 mb-8">
                {items.map((item) => (
                  <div key={item.cartId} className="bg-white border border-gray-200 flex items-center gap-4 px-5 py-4">
                    {/* 컬러 칩 */}
                    <div
                      className="w-10 h-10 flex-shrink-0 border border-gray-200"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#ff550c] tracking-widest uppercase mb-0.5">WORKUP {item.line}</p>
                      <p className="text-sm font-bold text-[#1A2B4A] truncate">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">사이즈 <strong>{item.size}</strong></span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500">컬러 <strong>{item.color}</strong></span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#1A2B4A] mb-2">{item.price}</p>
                      <button
                        onClick={() => removeItem(item.cartId)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 액션 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={c.primaryHref}
                  className="flex-1 text-center bg-[#ff550c] text-white text-sm font-bold tracking-widest py-4 hover:bg-[#d05518] transition-colors"
                >
                  {c.primaryLabel}
                </Link>
                <Link
                  href={c.secondaryHref}
                  className="flex-1 text-center border border-[#1A2B4A] text-[#1A2B4A] text-sm py-4 hover:bg-[#1A2B4A] hover:text-white transition-colors"
                >
                  {c.secondaryLabel}
                </Link>
              </div>

              <button
                onClick={clearCart}
                className="mt-4 w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-2"
              >
                전체 비우기
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
