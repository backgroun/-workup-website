"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

const TABS = ["상세 정보", "상품 리뷰", "사이즈 및 소재", "상품문의"] as const;
type Tab = typeof TABS[number];

const SIZE_GUIDE = [
  { size: "S",   chest: "88-92",   waist: "72-76", hip: "90-94" },
  { size: "M",   chest: "92-96",   waist: "76-80", hip: "94-98" },
  { size: "L",   chest: "96-100",  waist: "80-84", hip: "98-102" },
  { size: "XL",  chest: "100-104", waist: "84-88", hip: "102-106" },
  { size: "2XL", chest: "104-108", waist: "88-92", hip: "106-110" },
];

export default function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<Tab>("상세 정보");

  return (
    <div className="md:hidden border-t border-gray-100">

      {/* 탭 바 — MobileProductNav(h-12) 아래에 sticky */}
      <div className="sticky top-12 z-40 bg-white border-b border-gray-200">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-1 py-4 text-[11px] font-medium transition-colors relative ${
                active === tab ? "text-[#1A2B4A]" : "text-gray-400"
              }`}
            >
              {tab}
              {active === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A2B4A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {active === "상세 정보" && (
          <div className="space-y-0">
            {/* 대표 이미지 */}
            {product.imageUrl && (
              <div className="relative w-full aspect-[4/5] bg-[#f4f4f4]">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="100vw" />
              </div>
            )}

            <div className="px-5 py-8 space-y-6">
              {/* 태그라인 */}
              <p className="text-sm text-gray-500 italic leading-relaxed border-l-4 border-[#ff550c] pl-4">
                &ldquo;{product.tagline}&rdquo;
              </p>

              {/* 핵심 기능 */}
              <div>
                <p className="text-[10px] text-[#ff550c] tracking-[0.2em] uppercase mb-4">핵심 기능</p>
                <ul className="space-y-3">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#1A2B4A]">
                      <span className="w-5 h-5 bg-[#ff550c] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 필드 테스트 */}
              {product.fieldTest && (
                <div className="flex items-start gap-2.5 bg-amber-50 px-4 py-3 border-l-2 border-[#ff550c]">
                  <span className="text-[#ff550c] text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{product.fieldTest}</p>
                </div>
              )}

              {/* 착용자 후기 */}
              {product.wearerQuote && (
                <div className="bg-gray-50 px-5 py-6">
                  <p className="text-[10px] tracking-[0.2em] text-[#ff550c] uppercase mb-4">실제 착용자 이야기</p>
                  <blockquote className="text-base font-bold text-[#1A2B4A] leading-snug mb-4">
                    &ldquo;{product.wearerQuote.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1A2B4A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {product.wearerQuote.job[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A2B4A]">{product.wearerQuote.job}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{product.wearerQuote.years}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 서브 이미지들 */}
              {(product.subImages ?? []).length > 0 && (
                <div className="space-y-3">
                  {product.subImages!.map((src, i) => (
                    <div key={i} className="relative w-full aspect-[4/5] bg-[#f4f4f4]">
                      <Image src={src} alt={`${product.name} 상세 ${i + 1}`} fill className="object-cover" sizes="100vw" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {active === "상품 리뷰" && (
          <div className="px-5 py-20 text-center">
            <p className="text-sm text-gray-400">아직 등록된 리뷰가 없습니다.</p>
            <p className="text-xs text-gray-300 mt-1">첫 번째 리뷰를 작성해 주세요.</p>
          </div>
        )}

        {active === "사이즈 및 소재" && (
          <div className="px-5 py-8 space-y-5">
            <p className="text-[10px] text-[#ff550c] tracking-[0.2em] uppercase">사이즈 가이드</p>
            <p className="text-xs text-gray-400">단위: cm</p>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-xs min-w-[280px]">
                <thead>
                  <tr className="bg-[#1A2B4A] text-white">
                    {["사이즈", "가슴둘레", "허리둘레", "엉덩이둘레"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-3 font-bold text-[#1A2B4A]">{row.size}</td>
                      <td className="px-3 py-3 text-gray-500">{row.chest}</td>
                      <td className="px-3 py-3 text-gray-500">{row.waist}</td>
                      <td className="px-3 py-3 text-gray-500">{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400">* 사이즈가 고민된다면 매장에서 직접 입어보세요.</p>
          </div>
        )}

        {active === "상품문의" && (
          <div className="px-5 py-20 text-center space-y-4">
            <p className="text-sm text-gray-500">상품에 대한 궁금한 점이 있으신가요?</p>
            <Link href="/partnership"
              className="inline-block text-xs text-[#1A2B4A] border border-[#1A2B4A] px-6 py-3 hover:bg-[#1A2B4A] hover:text-white transition-colors">
              문의하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
