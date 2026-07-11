"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getSizeGuides, SIZE_NOTE_DEFAULT, type Product, type SizeGuide } from "@/data/products";
import ProductInquiryModal from "./ProductInquiryModal";
import InstagramFeed from "./InstagramFeed";
import SizeGuideLinesOverlay from "./SizeGuideLinesOverlay";
import { ikResize } from "@/lib/image-url";

// 가이드에 실제 내용이 있는지 (도식/이미지/표 중 하나라도)
function hasSizeGuideContent(g: SizeGuide): boolean {
  if (g.guideImage) return true;
  if (g.mode === "image" && g.image) return true;
  if (g.mode === "table" && (g.rows?.length ?? 0) > 0 && (g.columns?.length ?? 0) > 0) return true;
  return false;
}

// 사이즈 가이드 1개 렌더 (측정 도식 → 이미지/표 → 안내문구)
function SizeGuideView({ guide, productName }: { guide: SizeGuide; productName: string }) {
  const cols = guide.columns ?? [];
  const rows = guide.rows ?? [];
  const hasImage = guide.mode === "image" && !!guide.image;
  const hasTable = guide.mode === "table" && rows.length > 0 && cols.length > 0;
  return (
    <>
      {guide.guideImage && (
        <div className="mb-6 flex justify-center">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ikResize(guide.guideImage, 800)} alt={`${productName} 사이즈 측정 위치 안내`} className="block h-auto max-w-full grayscale opacity-40" loading="lazy" />
            {guide.guideLines && guide.guideLines.length > 0 && <SizeGuideLinesOverlay lines={guide.guideLines} />}
          </div>
        </div>
      )}
      {hasImage ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ikResize(guide.image, 1000)} alt={`${productName} 사이즈 가이드`} className="block h-auto max-w-full" loading="lazy" />
          <p className="text-xs text-gray-400 mt-4">{guide.note?.trim() || SIZE_NOTE_DEFAULT}</p>
        </div>
      ) : hasTable ? (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-t border-gray-300">
              <thead>
                <tr className="bg-[#f5f5f5] border-b border-gray-200">
                  {cols.map((h, i) => (
                    <th key={i} className="px-3 py-4 text-center text-[13px] md:text-sm font-bold text-[#303236] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100">
                    {cols.map((_, ci) => (
                      <td key={ci} className={`px-3 py-4 text-center text-[13px] md:text-sm whitespace-nowrap ${ci === 0 ? "font-bold text-[#303236]" : "text-slate-500"}`}>
                        {row.cells[ci] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4">{guide.note?.trim() || SIZE_NOTE_DEFAULT}</p>
        </div>
      ) : null}
    </>
  );
}

const TABS = ["상세 정보", "사이즈 및 소재", "상품문의"] as const;
type Tab = typeof TABS[number];

type ProductInquiry = {
  id: string; createdAt: string; status: string; secret: boolean;
  subject: string; title: string; content: string;
};
const INQ_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "답변대기", cls: "bg-gray-100 text-gray-500" },
  processing: { label: "처리중", cls: "bg-blue-50 text-blue-600" },
  done: { label: "답변완료", cls: "bg-emerald-50 text-emerald-600" },
};
const fmtInqDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch { return ""; }
};

// 한 페이지에 3개 섹션을 쌓고, 상단 sticky 탭바 클릭 시 해당 섹션으로 스크롤 이동.
export default function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<Tab>("상세 정보");
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
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

  // 상품문의 목록 — 해당 상품 문의 조회 (제출 후 갱신용으로 재호출)
  const loadInquiries = useCallback(() => {
    fetch(`/api/inquiries?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setInquiries(Array.isArray(d) ? d : []))
      .catch(() => setInquiries([]));
  }, [product.id]);
  useEffect(() => { loadInquiries(); }, [loadInquiries]);

  // 사이즈 가이드 (여러 개 가능: 상하세트 등) — 내용 있는 것만
  const sizeGuides = getSizeGuides(product).filter(hasSizeGuideContent);
  const detailInfo = (product.detailInfo ?? []).filter((d) => d.value?.trim());

  const tabClass = (t: Tab) =>
    `flex-1 py-4 text-[15px] md:text-[17px] transition-colors relative ${
      active === t ? "text-[#303236]" : "text-gray-400 hover:text-[#303236]"
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
              {active === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#303236]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto">
        {/* ── 상세 정보 ── */}
        <div ref={detailRef} data-tab="상세 정보" className={sectionClass}>
          {/* 인스타 피드 — 이 상품 등록 게시물 (상세 이미지 시작 전, 미등록 시 자동 숨김) */}
          <InstagramFeed posts={product.instagramPosts} />

          {/* 필드 테스트 */}
          {product.fieldTest && (
            <div className="flex items-start gap-2.5 bg-amber-50 px-4 py-3 border-l-2 border-[#E5541B] mb-8">
              <span className="text-[#E5541B] text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
              <p className="text-xs text-gray-600 leading-relaxed">{product.fieldTest}</p>
            </div>
          )}

          {/* 착용자 후기 */}
          {product.wearerQuote && (
            <div className="bg-gray-50 px-5 md:px-8 py-6 md:py-8 mb-8">
              <p className="text-[10px] tracking-[0.2em] text-[#E5541B] uppercase mb-4">실제 착용자 이야기</p>
              <blockquote className="text-base md:text-xl font-bold text-[#303236] leading-snug mb-4">
                &ldquo;{product.wearerQuote.text}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#303236] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {product.wearerQuote.job[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#303236]">{product.wearerQuote.job}</p>
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
                <img key={b.id ?? i} src={ikResize(b.imageUrl, 1000)} alt={`${product.name} 상세 ${i + 1}`} className="block w-full h-auto bg-[#f4f4f4]" loading="lazy" />
              ))}
            </div>
          )}

          {/* 상세 이미지 — 원본 비율 그대로 (긴 상세페이지 이미지도 잘리지 않음) */}
          {(product.subImages ?? []).length > 0 && (
            <div className="space-y-3 max-w-3xl mx-auto mb-10">
              {product.subImages!.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={ikResize(src, 1000)} alt={`${product.name} 상세 ${i + 1}`} className="block w-full h-auto bg-[#f4f4f4]" loading="lazy" />
              ))}
            </div>
          )}

          {/* 제품 정보 — 관리자 등록 텍스트 (값 있는 항목만) */}
          {detailInfo.length > 0 && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {detailInfo.map((it, i) => (
                <div key={`${it.label}-${i}`}>
                  <p className="text-sm font-bold text-[#303236] mb-1">{it.label}</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{it.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 사이즈 및 소재 ── */}
        <div ref={sizeRef} data-tab="사이즈 및 소재" className={`${sectionClass} border-t border-gray-100`}>
          <p className="text-base md:text-lg font-bold text-[#303236] mb-5">사이즈 가이드</p>

          {sizeGuides.length > 0 ? (
            <div className="space-y-10">
              {sizeGuides.map((g, i) => (
                <div key={i}>
                  {/* 여러 개일 때만 라벨(상의/하의 등) 표시 */}
                  {sizeGuides.length > 1 && g.label?.trim() && (
                    <p className="text-sm font-bold text-[#303236] mb-3 pb-2 border-b border-gray-200">{g.label}</p>
                  )}
                  <SizeGuideView guide={g} productName={product.name} />
                </div>
              ))}
            </div>
          ) : (
            // 미등록 — 매장 문의 유도
            <div className="text-sm text-gray-500">
              {(product.sizes ?? []).length > 0 && (
                <p className="mb-2"><span className="font-semibold text-[#303236]">사이즈</span> · {product.sizes!.join(", ")}</p>
              )}
              <p className="text-gray-400">정확한 치수는 매장에서 직접 확인하거나 문의해 주세요.</p>
            </div>
          )}
        </div>

        {/* ── 상품문의 ── */}
        <div ref={qnaRef} data-tab="상품문의" className={`${sectionClass} border-t border-gray-100`}>
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-200">
            <p className="text-[15px] md:text-base font-bold text-[#303236]">
              문의 <span className="text-[#E5541B]">{inquiries.length}</span>건
            </p>
            <button type="button" onClick={() => setInquiryOpen(true)}
              className="text-sm text-[#303236] border border-gray-300 px-6 py-3 rounded hover:border-[#303236] transition-colors">
              상품 문의하기
            </button>
          </div>

          {inquiries.length === 0 ? (
            <p className="text-sm text-gray-400 py-12 text-center">아직 등록된 문의가 없습니다. 궁금한 점을 남겨주세요.</p>
          ) : (
            <ul>
              {inquiries.map((q) => {
                const st = INQ_STATUS[q.status] ?? INQ_STATUS.new;
                return (
                  <li key={q.id} className="py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                      {q.subject && <span className="text-xs text-gray-400">{q.subject}</span>}
                      <span className="text-xs text-gray-300 ml-auto">{fmtInqDate(q.createdAt)}</span>
                    </div>
                    {q.secret ? (
                      <p className="text-sm text-gray-400 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        비밀글입니다.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#303236]">{q.title || "(제목 없음)"}</p>
                        {q.content && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line line-clamp-4">{q.content}</p>}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ProductInquiryModal product={product} open={inquiryOpen} onClose={() => setInquiryOpen(false)} onSubmitted={loadInquiries} />
    </div>
  );
}
