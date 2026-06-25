"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";

const TABS = ["상세 정보", "사이즈 및 소재", "상품문의"] as const;
type Tab = typeof TABS[number];

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

  // 사이즈 가이드 / 상세 정보 — 관리자 등록 데이터
  const sizeGuide = product.sizeGuide;
  const sgCols = sizeGuide?.columns ?? [];
  const sgRows = sizeGuide?.rows ?? [];
  const hasSizeTable = sizeGuide?.mode === "table" && sgRows.length > 0 && sgCols.length > 0;
  const hasSizeImage = sizeGuide?.mode === "image" && !!sizeGuide.image;
  const detailInfo = (product.detailInfo ?? []).filter((d) => d.value?.trim());

  const tabClass = (t: Tab) =>
    `flex-1 py-4 text-[15px] md:text-[17px] transition-colors relative ${
      active === t ? "text-[#1A2B4A]" : "text-gray-400 hover:text-[#1A2B4A]"
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
          {/* 필드 테스트 */}
          {product.fieldTest && (
            <div className="flex items-start gap-2.5 bg-amber-50 px-4 py-3 border-l-2 border-[#ff550c] mb-8">
              <span className="text-[#ff550c] text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
              <p className="text-xs text-gray-600 leading-relaxed">{product.fieldTest}</p>
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

          {/* 상세 이미지 (detail_blocks) — 상세 영역 전용 (갤러리 썸네일엔 안 뜸) */}
          {(product.detailBlocks ?? []).some((b) => b.imageUrl) && (
            <div className="space-y-3 max-w-3xl mx-auto mb-10">
              {product.detailBlocks!.filter((b) => b.imageUrl).map((b, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={b.id ?? i} src={b.imageUrl} alt={`${product.name} 상세 ${i + 1}`} className="block w-full h-auto bg-[#f4f4f4]" loading="lazy" />
              ))}
            </div>
          )}

          {/* 상세 이미지 — 원본 비율 그대로 (긴 상세페이지 이미지도 잘리지 않음) */}
          {(product.subImages ?? []).length > 0 && (
            <div className="space-y-3 max-w-3xl mx-auto mb-10">
              {product.subImages!.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${product.name} 상세 ${i + 1}`} className="block w-full h-auto bg-[#f4f4f4]" loading="lazy" />
              ))}
            </div>
          )}

          {/* 제품 정보 — 관리자 등록 텍스트 (값 있는 항목만) */}
          {detailInfo.length > 0 && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {detailInfo.map((it, i) => (
                <div key={`${it.label}-${i}`}>
                  <p className="text-sm font-bold text-[#1A2B4A] mb-1">{it.label}</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{it.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 사이즈 및 소재 ── */}
        <div ref={sizeRef} data-tab="사이즈 및 소재" className={`${sectionClass} border-t border-gray-100`}>
          <p className="text-base md:text-lg font-bold text-[#1A2B4A] mb-5">사이즈 가이드</p>

          {hasSizeImage ? (
            // 이미지로 등록한 경우
            <div className="max-w-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sizeGuide!.image} alt={`${product.name} 사이즈 가이드`} className="block w-full h-auto" loading="lazy" />
              {sizeGuide!.note && <p className="text-xs text-gray-400 mt-4">{sizeGuide!.note}</p>}
            </div>
          ) : hasSizeTable ? (
            // 행·열 표로 등록한 경우
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[320px] max-w-3xl border border-gray-100">
                  <thead>
                    <tr className="bg-[#1A2B4A] text-white">
                      {sgCols.map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sgRows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {sgCols.map((_, ci) => (
                          <td key={ci} className={`px-4 py-3 text-xs ${ci === 0 ? "font-bold text-[#1A2B4A]" : "text-gray-500"}`}>
                            {row.cells[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sizeGuide!.note && <p className="text-xs text-gray-400 mt-4">{sizeGuide!.note}</p>}
            </div>
          ) : (
            // 미등록 — 매장 문의 유도
            <div className="text-sm text-gray-500">
              {(product.sizes ?? []).length > 0 && (
                <p className="mb-2"><span className="font-semibold text-[#1A2B4A]">사이즈</span> · {product.sizes!.join(", ")}</p>
              )}
              <p className="text-gray-400">정확한 치수는 매장에서 직접 확인하거나 문의해 주세요.</p>
            </div>
          )}
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
