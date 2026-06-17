"use client";
import Link from "next/link";
import type { CatalogPage } from "@/data/catalog";

// 카탈로그 한 페이지의 시각 표현 — 플립북과 관리자 미리보기에서 공용으로 사용한다(DRY).
// 글자 크기는 cqw(컨테이너 너비 비율)로 잡아, 모바일·PC 어느 페이지 크기에서도 비율이 유지된다.
export default function CatalogPageView({ page }: { page: CatalogPage }) {
  const hasCaption = !!(page.title || page.description || (page.link_url && page.link_label));

  return (
    <div
      className="relative w-full h-full bg-[#0d1826] overflow-hidden"
      style={{ containerType: "inline-size" }}
    >
      {page.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.image_url}
          alt={page.title || page.admin_title || "카탈로그 페이지"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white/25"
          style={{ fontSize: "4cqw" }}
        >
          이미지 없음
        </div>
      )}

      {hasCaption && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            padding: "6%",
            paddingTop: "16%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.74), rgba(0,0,0,0.28) 55%, transparent)",
          }}
        >
          {page.title && (
            <h2
              className="text-white font-bold leading-tight"
              style={{ fontSize: "6cqw" }}
            >
              {page.title}
            </h2>
          )}
          {page.description && (
            <p
              className="text-white/85 leading-snug"
              style={{ fontSize: "3.4cqw", marginTop: "1.6cqw" }}
            >
              {page.description}
            </p>
          )}
          {page.link_url && page.link_label && (
            <Link
              href={page.link_url}
              // 플립 제스처로 흡수되지 않도록 이벤트 전파 차단
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="inline-block bg-[#ff550c] text-white font-semibold rounded"
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
