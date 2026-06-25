"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

const TABS = ["상세 정보", "사이즈 및 소재", "상품문의"] as const;
type Tab = typeof TABS[number];

const SIZE_GUIDE = [
  { size: "S",   chest: "88-92",   waist: "72-76", hip: "90-94" },
  { size: "M",   chest: "92-96",   waist: "76-80", hip: "94-98" },
  { size: "L",   chest: "96-100",  waist: "80-84", hip: "98-102" },
  { size: "XL",  chest: "100-104", waist: "84-88", hip: "102-106" },
  { size: "2XL", chest: "104-108", waist: "88-92", hip: "106-110" },
];

// 한 페이지에 3개 섹션을 쌓고, 상단 sticky 탭바 클릭 시 해당 섹션으로 스크롤 이동.
export default function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<Tab>("상세 정보");
  const detailRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const qnaRef = useRef<HTMLDivElement>(null);
  const refOf = (t: Tab) => (t === "상세 정보" ? detailRef : t === "사이즈 및 소재" ? sizeRef : qnaRef);

  const goTo = (t: Tab) => {
    setActive(t);
    refOf(t).current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 스크롤 위치에 따라 활성 탭 자동 표시
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.getAttribute("data-tab") as Tab);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    [detailRef.current, sizeRef.current, qnaRef.current].forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // 스펙 표 — 제품 데이터 기반 (값 없으면 행 생략)
  const specs: { label: string; value: string }[] = [
    { label: "소재", value: (product.materialSpecs ?? []).map((m) => `${m.label} ${m.value}`).join(" · ") },
    { label: "색상", value: product.colors.map((c) => c.name).join(", ") },
    { label: "사이즈", value: (product.sizes ?? []).join(", ") },
    { label: "제조국", value: product.origin ?? "" },
    { label: "제조사", value: product.manufacturer ?? "" },
    { label: "제조연월", value: product.createdAt ? product.createdAt.slice(0, 7) : "" },
  ].filter((s) => s.value);

  const tabClass = (t: Tab) =>
    `flex-1 py-4 text-[12px] md:text-sm font-medium transition-colors relative ${
      active === t ? "text-[#1A2B4A] font-bold" : "text-gray-400 hover:text-[#1A2B4A]"
    }`;
  const sectionClass = "scroll-mt-[108px] md:scroll-mt-[150px] px-5 md:px-12 py-10 md:py-14";

  return (
    <div className="border-t border-gray-100">
      {/* 탭 바 (sticky) — 모바일: 상단바(h-12) 아래 / 데스크탑: 헤더 아래 */}
      <div className="sticky z-30 bg-white border-b border-gray-200 top-12 md:top-[92px]">
        <div className="flex max-w-screen-xl mx-auto">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => goTo(t)} className={tabClass(t)}>
              {t}
              {active === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A2B4A]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto">
        {/* ── 상세 정보 ── */}
        <div ref={detailRef} data-tab="상세 정보" className={sectionClass}>
          <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-6">상세 정보</p>

          {/* 핵심 기능 */}
          <ul className="space-y-3 mb-8">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#1A2B4A]">
                <span className="w-5 h-5 bg-[#ff550c] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* 필드 테스트 */}
          {product.fieldTest && (
            <div className="flex items-start gap-2.5 bg-amber-50 px-4 py-3 border-l-2 border-[#ff550c] mb-8">
              <span className="text-[#ff550c] text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
              <p className="text-xs text-gray-600 leading-relaxed">{product.fieldTest}</p>
            </div>
          )}

          {/* 제품 정보 표 */}
          {specs.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mb-8">
              <p className="text-sm font-bold text-[#1A2B4A] mb-3">제품 정보</p>
              <dl className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {specs.map((s) => (
                  <div key={s.label} className="flex text-sm">
                    <dt className="w-28 flex-shrink-0 bg-gray-50 px-4 py-3 text-gray-500 font-medium">{s.label}</dt>
                    <dd className="flex-1 px-4 py-3 text-gray-700">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 착용자 후기 */}
          {product.wearerQuote && (
            <div className="bg-gray-50 px-5 md:px-8 py-6 md:py-8 mb-8">
              <p className="text-[10px] tracking-[0.2em] text-[#ff550c] uppercase mb-4">실제 착용자 이야기</p>
              <blockquote className="text-base md:text-xl font-bold text-[#1A2B4A] leading-snug mb-4">
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

          {/* 서브 이미지 */}
          {(product.subImages ?? []).length > 0 && (
            <div className="space-y-3">
              {product.subImages!.map((src, i) => (
                <div key={i} className="relative w-full aspect-[4/5] md:aspect-[16/10] bg-[#f4f4f4]">
                  <Image src={src} alt={`${product.name} 상세 ${i + 1}`} fill className="object-cover" sizes="(min-width:768px) 70vw, 100vw" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 사이즈 및 소재 ── */}
        <div ref={sizeRef} data-tab="사이즈 및 소재" className={`${sectionClass} border-t border-gray-100`}>
          <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-2">사이즈 가이드</p>
          <p className="text-xs text-gray-400 mb-4">단위: cm</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[320px] max-w-2xl">
              <thead>
                <tr className="bg-[#1A2B4A] text-white">
                  {["사이즈", "가슴둘레", "허리둘레", "엉덩이둘레"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-bold text-[#1A2B4A] text-xs">{row.size}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.chest}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.waist}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4">* 사이즈가 고민된다면 매장에서 직접 입어보세요.</p>
        </div>

        {/* ── 상품문의 ── */}
        <div ref={qnaRef} data-tab="상품문의" className={`${sectionClass} border-t border-gray-100 text-center`}>
          <p className="text-[11px] tracking-[0.2em] text-[#ff550c] uppercase mb-4">상품문의</p>
          <p className="text-sm text-gray-500 mb-5">상품에 대한 궁금한 점이 있으신가요?</p>
          <Link href="/partnership"
            className="inline-block text-sm text-[#1A2B4A] border border-[#1A2B4A] px-8 py-3 hover:bg-[#1A2B4A] hover:text-white transition-colors rounded">
            문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
