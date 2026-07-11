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
      <section className="bg-[#FAFAF8] py-12 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-xl font-bold text-[#303236] mb-8">피팅 리스트</h1>

          {items.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-bold text-[#303236] mb-3">{c.emptyTitle}</p>
              <p className="text-sm text-gray-500 mb-8">{c.emptyDesc}</p>
              <Link
                href={c.emptyCtaHref}
                className="inline-block bg-[#303236] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#E5541B] transition-colors"
              >
                {c.emptyCtaLabel}
              </Link>
            </div>
          ) : (
            <>
              {/* 매장 방문 안내 배너 */}
              <div className="bg-gray-100 border border-gray-200 px-6 py-5 mb-8">
                <p className="font-bold text-gray-800 mb-1">{c.noticeTitle}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{c.noticeDesc}</p>
              </div>

              {/* 아이템 목록 */}
              <div className="space-y-3 mb-8">
                {items.map((item) => (
                  <div key={item.cartId} className="bg-white border border-gray-200 flex items-center gap-4 px-5 py-4">
                    <Link href={`/products/${item.productId}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                      {/* 제품 이미지 */}
                      <div className="w-16 h-16 flex-shrink-0 border border-gray-100 overflow-hidden relative bg-gray-50">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-200"
                            sizes="64px"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#303236] leading-tight group-hover:text-[#E5541B] transition-colors">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-400 mt-0.5">품번 {item.sku}</p>
                        )}
                        {item.allSizes && item.allSizes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.allSizes.map((s) => (
                              <span key={s} className="text-[10px] border border-gray-300 text-gray-600 px-1.5 py-0.5 leading-none">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.allColors && item.allColors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                            {item.allColors.map((c) => (
                              <span key={c.name} className="flex items-center gap-1">
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[10px] text-gray-500">{c.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#303236] mb-2">{item.price}</p>
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
                  className="flex-1 text-center bg-[#E5541B] text-white text-sm font-bold tracking-widest py-4 hover:bg-[#d05518] transition-colors"
                >
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
