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
      <section className="bg-[#FAFAF8] py-14 md:py-20 min-h-[70vh]">
        <div className="px-[15px] md:px-[70px]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#303236] tracking-wide mb-10 md:mb-14">피팅 리스트</h1>

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
            <div className="max-w-5xl">
              {/* 매장 방문 안내 배너 */}
              <div className="bg-[#F5F2ED] border border-[#E9E4DA] px-6 md:px-8 py-6 mb-10 flex gap-4 items-start">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#8F8B81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-[#303236] mb-1.5">{c.noticeTitle}</p>
                  <p className="text-sm text-[#6B6660] leading-relaxed">{c.noticeDesc}</p>
                </div>
              </div>

              {/* 아이템 목록 */}
              <div className="divide-y divide-gray-200 mb-12">
                {items.map((item) => (
                  <div key={item.cartId} className="flex items-start gap-5 md:gap-6 py-7 group">
                    <Link href={`/products/${item.productId}`} className="flex items-center gap-5 md:gap-6 flex-1 min-w-0">
                      {/* 제품 이미지 */}
                      <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden relative bg-[#f0f0f0]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                            sizes="112px"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-[#303236] leading-snug group-hover:underline underline-offset-4 decoration-1">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-[#8F8B81] mt-1">품번 {item.sku}</p>
                        )}
                        {item.allSizes && item.allSizes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
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
                        <p className="text-base font-bold text-[#303236] mt-3">{item.price}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeItem(item.cartId)}
                      className="flex-shrink-0 text-xs text-[#8F8B81] hover:text-red-500 transition-colors mt-1"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              {/* 하단 액션 */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <Link
                  href={c.primaryHref}
                  className="store-cta flex-1 text-center text-sm font-bold tracking-widest px-8 py-4 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {c.primaryLabel}
                </Link>
                <Link
                  href={c.secondaryHref}
                  className="flex-1 text-center border border-[#303236] text-[#303236] text-sm py-4 hover:bg-[#303236] hover:text-white transition-colors"
                >
                  {c.secondaryLabel}
                </Link>
              </div>

              <button
                onClick={clearCart}
                className="mt-5 text-xs text-[#8F8B81] hover:text-red-500 transition-colors"
              >
                전체 비우기
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
