"use client";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart();

  return (
    <main>
      <div className="bg-[#1A2B4A] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">FITTING LIST</p>
          <h1 className="text-4xl font-bold text-white mb-2">피팅 리스트</h1>
          <p className="text-gray-300 text-sm">매장 방문 시 이 목록을 직원에게 보여주세요.</p>
        </div>
      </div>

      <section className="bg-[#F5F2ED] py-16 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-6">

          {items.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-bold text-[#1A2B4A] mb-3">담은 제품이 없습니다.</p>
              <p className="text-sm text-gray-500 mb-8">
                마음에 드는 제품을 골라 피팅 리스트에 담아보세요.
              </p>
              <Link
                href="/products"
                className="inline-block bg-[#1A2B4A] text-white text-sm tracking-widest px-8 py-3 hover:bg-[#ff550c] transition-colors"
              >
                제품 보러가기 →
              </Link>
            </div>
          ) : (
            <>
              {/* 매장 방문 안내 배너 */}
              <div className="bg-[#ff550c] text-white px-6 py-5 mb-8">
                <p className="font-bold mb-1">매장 방문 안내</p>
                <p className="text-sm text-orange-100 leading-relaxed">
                  아래 목록을 매장 직원에게 보여주시면 더 빠르게 원하는 제품을 입어볼 수 있습니다.
                  재고 및 사이즈는 매장에서 바로 확인해 드립니다.
                </p>
                <Link
                  href="/store"
                  className="inline-block mt-3 text-xs border border-white text-white px-4 py-2 hover:bg-white hover:text-[#ff550c] transition-colors"
                >
                  가까운 매장 찾기 →
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
                  href="/store"
                  className="flex-1 text-center bg-[#ff550c] text-white text-sm font-bold tracking-widest py-4 hover:bg-[#d05518] transition-colors"
                >
                  매장 찾아서 입어보기 →
                </Link>
                <Link
                  href="/products"
                  className="flex-1 text-center border border-[#1A2B4A] text-[#1A2B4A] text-sm py-4 hover:bg-[#1A2B4A] hover:text-white transition-colors"
                >
                  제품 더 보기
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
