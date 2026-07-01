"use client";
import { useEffect, useState } from "react";
import {
  DEFAULT_INSTAGRAM_FEED,
  normalizeInstagramFeed,
  instagramEmbedSrc,
  normalizeAccount,
  type InstagramFeedConfig,
} from "@/lib/instagram-feed";

// 상품 상세페이지 하단 인스타그램 피드 — 해당 상품에 등록된 게시물만 노출.
// 게시물(posts)은 상품별로 등록(ProductForm), 섹션 제목·계정·열수 등 표시 설정은
// 전역(/admin/main/instagram)에서 관리. 등록 게시물이 없으면 아무것도 렌더하지 않음.
export default function InstagramFeed({ posts }: { posts?: string[] }) {
  const [cfg, setCfg] = useState<InstagramFeedConfig>({ ...DEFAULT_INSTAGRAM_FEED });

  useEffect(() => {
    fetch("/api/admin/site-settings/instagram_feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCfg(normalizeInstagramFeed(d)); })
      .catch(() => {});
  }, []);

  // 전역 마스터 스위치 off → 어디에도 노출 안 함
  if (!cfg.is_visible) return null;

  const embeds = (posts ?? [])
    .map((url) => instagramEmbedSrc(url))
    .filter((src): src is string => !!src);
  if (embeds.length === 0) return null; // 이 상품에 등록된 게시물 없음 → 숨김

  const acct = normalizeAccount(cfg.account);
  const gridCols = cfg.columns_desktop === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  const followLink = acct && (
    <a
      href={acct.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A2B4A] hover:text-[#ff550c] transition-colors whitespace-nowrap"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      @{acct.handle} 팔로우 →
    </a>
  );

  return (
    <section className="border-t border-gray-100 py-8 md:py-12 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12">
        {acct && <div className="flex justify-end mb-4">{followLink}</div>}

        <div className={`grid grid-cols-2 ${gridCols} gap-4`}>
          {embeds.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative w-full overflow-hidden rounded-lg border border-gray-100 bg-[#fafafa] h-[430px] md:h-[470px]"
            >
              <iframe
                src={src}
                title={`Instagram post ${i + 1}`}
                loading="lazy"
                scrolling="no"
                className="w-full h-full"
                style={{ border: 0 }}
                allow="encrypted-media; clipboard-write"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
