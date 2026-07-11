"use client";
import Link from "next/link";
import type { CatalogPage } from "@/data/catalog";
import { ikResize } from "@/lib/image-url";

// 카탈로그 한 페이지의 시각 표현 — 플립북과 관리자 미리보기에서 공용으로 사용한다(DRY).
// 종류(page_type): cover/contents/divider 는 옛 플립북 디자인을 그대로 재현(고정 px),
//                  image 는 업로드 이미지 + 캡션(cqw 비례).
export default function CatalogPageView({ page }: { page: CatalogPage }) {
  const type = page.page_type ?? "image";
  const d = page.data ?? {};

  // ── 표지 ──
  if (type === "cover") {
    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden" style={{ padding: "8% 9%", backgroundColor: d.bg || "#303236" }}>
        {page.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ikResize(page.image_url, 1200)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}
        <div className="relative">
          {d.eyebrow && <p className="text-[9px] tracking-[0.2em] text-[#E5541B] uppercase">{d.eyebrow}</p>}
          {d.season && <p className="text-[8px] tracking-[0.15em] text-gray-300 uppercase mt-0.5">{d.season}</p>}
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">{d.brand || "WORKUP"}</h1>
          {d.badge && <p className="text-lg font-bold text-[#E5541B] tracking-widest mt-1">{d.badge}</p>}
          {d.note && <p className="text-[9px] text-gray-300 mt-2 tracking-widest">{d.note}</p>}
        </div>
        <div className="relative">
          {d.code && <p className="text-[7px] text-gray-400 tracking-widest">{d.code}</p>}
        </div>
      </div>
    );
  }

  // ── 목차 ──
  if (type === "contents") {
    const items = d.items ?? [];
    return (
      <div className="w-full h-full bg-white flex flex-col" style={{ padding: "8% 9%" }}>
        {d.eyebrow && <p className="text-[8px] tracking-[0.2em] text-[#E5541B] uppercase mb-3">{d.eyebrow}</p>}
        <div className="flex-1 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#303236]">{item.name}</span>
                {item.count && <span className="text-[8px] text-gray-400">{item.count}</span>}
              </div>
              {item.page && <span className="text-[8px] text-gray-400">{item.page}</span>}
            </div>
          ))}
        </div>
        {d.footer && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[7px] text-gray-300 tracking-widest">{d.footer}</p>
          </div>
        )}
      </div>
    );
  }

  // ── 카테고리 구분 ──
  if (type === "divider") {
    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden" style={{ padding: "8% 9%", backgroundColor: d.bg || "#303236" }}>
        {page.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ikResize(page.image_url, 1200)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}
        {d.eyebrow && <p className="relative text-[8px] tracking-[0.15em] text-white/50 uppercase">{d.eyebrow}</p>}
        <div className="relative">
          {d.no && <div className="text-6xl font-black text-white/10 leading-none select-none mb-2">{d.no}</div>}
          <h2 className="text-3xl font-bold text-white">{d.title}</h2>
          {d.desc && <p className="text-[10px] text-gray-300 mt-2 leading-relaxed whitespace-pre-line">{d.desc}</p>}
          {d.count && <p className="text-[9px] text-[#E5541B] mt-3">{d.count}</p>}
        </div>
        <div className="relative" />
      </div>
    );
  }

  // ── 이미지 페이지 (기본) ──
  const hasCaption = !!(page.title || page.description || (page.link_url && page.link_label));
  return (
    <div className="relative w-full h-full bg-[#0d1826] overflow-hidden" style={{ containerType: "inline-size" }}>
      {page.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ikResize(page.image_url, 1200)} alt={page.title || page.admin_title || "카탈로그 페이지"} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/25" style={{ fontSize: "4cqw" }}>이미지 없음</div>
      )}

      {hasCaption && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ padding: "6%", paddingTop: "16%", background: "linear-gradient(to top, rgba(0,0,0,0.74), rgba(0,0,0,0.28) 55%, transparent)" }}
        >
          {page.title && <h2 className="text-white font-bold leading-tight" style={{ fontSize: "6cqw" }}>{page.title}</h2>}
          {page.description && <p className="text-white/85 leading-snug" style={{ fontSize: "3.4cqw", marginTop: "1.6cqw" }}>{page.description}</p>}
          {page.link_url && page.link_label && (
            <Link
              href={page.link_url}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="inline-block bg-[#E5541B] text-white font-semibold rounded"
              style={{ fontSize: "3.4cqw", marginTop: "3.2cqw", padding: "1.8cqw 3.4cqw" }}
            >
              {page.link_label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
