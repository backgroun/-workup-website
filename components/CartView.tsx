"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { type WishlistConfig } from "@/lib/wishlist";

// 찜(피팅 리스트) 페이지 화면. 문구·CTA는 관리자(피킹리스트 관리)에서 설정한 config로 채운다.
export default function CartView({ config: c }: { config: WishlistConfig }) {
  const { items, removeItem, clearCart } = useCart();

  return (
    <main>
      {/* 상단 히어로 — 매장 찾기 페이지와 동일한 스타일(굵은 타이틀 + 설명) + 액션 버튼 */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="px-[15px] md:px-[70px]">
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#303236] leading-tight mb-4">피팅 리스트</h1>
          {items.length > 0 && (
            <>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">{c.noticeDesc}</p>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={c.primaryHref}
                  className="store-cta-outline text-xs font-bold tracking-wide px-5 py-2.5 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {c.primaryLabel}
                </Link>
                <Link
                  href={c.secondaryHref}
                  className="border border-[#303236] text-[#303236] text-xs px-5 py-2.5 hover:bg-[#303236] hover:text-white transition-colors flex items-center"
                >
                  {c.secondaryLabel}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="bg-[#FAFAF8] py-14 md:py-20 min-h-[50vh]">
        <div className="px-[15px] md:px-[70px]">

          {items.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <p className="text-2xl md:text-3xl font-bold text-[#303236] mb-3">{c.emptyTitle}</p>
              <p className="text-sm md:text-base text-[#8F8B81] mb-9">{c.emptyDesc}</p>
              <Link
                href={c.emptyCtaHref}
                className="inline-block bg-[#303236] text-white text-sm tracking-widest px-9 py-3.5 hover:bg-[#E5541B] transition-colors"
              >
                {c.emptyCtaLabel}
              </Link>
            </div>
          ) : (
            <>
              {/* 아이템 그리드 — 화면 폭을 그대로 활용, PC에서 썸네일이 커지도록 열 수를 제한 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16 mb-16">
                {items.map((item) => (
                  <div key={item.cartId} className="group">
                    <Link href={`/products/${item.productId}`} className="block">
                      {/* 제품 이미지 */}
                      <div className="relative aspect-square overflow-hidden bg-[#f0f0f0]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); removeItem(item.cartId); }}
                          aria-label="삭제"
                          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#303236]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="pt-3.5">
                        <p className="text-[15px] font-bold text-[#303236] leading-snug group-hover:underline underline-offset-4 decoration-1">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-[#8F8B81] mt-1">품번 {item.sku}</p>
                        )}
                        {item.allSizes && item.allSizes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {item.allSizes.map((s) => (
                              <span key={s} className="text-[11px] border border-gray-300 text-gray-600 px-2 py-0.5 leading-none">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.allColors && item.allColors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {item.allColors.map((col) => (
                              <span key={col.name} className="flex items-center gap-1.5">
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span className="text-[11px] text-[#8F8B81]">{col.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[15px] font-bold text-[#303236] mt-2.5">{item.price}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              <button
                onClick={clearCart}
                className="text-xs text-[#8F8B81] hover:text-red-500 transition-colors"
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
