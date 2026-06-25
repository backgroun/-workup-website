"use client";

import { useEffect } from "react";

// 워크업 공식 인스타그램 프로필
const IG_PROFILE = "https://www.instagram.com/workup_official_kr/";

// Behold.so 피드 ID — 위젯에 공개적으로 노출되는 공개 식별자(비밀값 아님).
// 환경변수 NEXT_PUBLIC_BEHOLD_FEED_ID 로 덮어쓸 수 있고, 없으면 이 값을 사용한다.
const DEFAULT_BEHOLD_FEED_ID = "ZNUmKPgmgkl9x5xyKChS";

// Behold 미설정 시 보여줄 폴백 타일 (정사각형 1:1, 텍스트 없는 순수 비주얼).
// Behold feed ID가 설정되면 이 그리드 대신 실시간 인스타 피드가 자동 렌더링됩니다.
const FALLBACK_POSTS: { image?: string }[] = [
  { image: "/images/people-construction.jpg" },
  {},
  {},
  {},
  {},
  {},
];

const InstagramGlyph = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default function HomeInstagramFeed() {
  // 실시간 인스타 피드가 자동으로 채워지고, 새 게시물도 자동 반영된다.
  // (환경변수로 덮어쓰지 않으면 DEFAULT_BEHOLD_FEED_ID 사용)
  const feedId = process.env.NEXT_PUBLIC_BEHOLD_FEED_ID || DEFAULT_BEHOLD_FEED_ID;

  useEffect(() => {
    if (!feedId) return;
    if (document.querySelector('script[src*="behold.so"]')) return;
    const script = document.createElement("script");
    script.src = "https://w.behold.so/widget.js";
    script.type = "module";
    document.head.appendChild(script);
  }, [feedId]);

  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="px-[15px] md:px-[70px]">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-2">Instagram</p>
            <h2 className="text-2xl font-bold text-[#1A2B4A]">@workup_official_kr</h2>
          </div>
          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#1A2B4A] tracking-wide transition-colors hidden sm:flex items-center gap-1"
          >
            <InstagramGlyph className="w-3.5 h-3.5" />
            인스타그램 바로가기 →
          </a>
        </div>

        {feedId ? (
          /* 실시간 인스타 피드 (Behold.so 위젯 — 새 게시물 자동 반영) */
          /* @ts-expect-error — Behold 커스텀 웹 컴포넌트 */
          <behold-widget feed-id={feedId} />
        ) : (
          /* Behold 미설정 시 폴백 — 섹션이 비지 않도록 브랜드 그리드 + 팔로우 유도 */
          <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
            {FALLBACK_POSTS.map((post, i) => (
              <a
                key={i}
                href={IG_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-gray-100"
                aria-label="워크업 인스타그램에서 보기"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt="워크업 작업복 현장 이야기"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl font-black select-none">
                    WU
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-[#1A2B4A]/0 opacity-0 transition-all duration-300 group-hover:bg-[#1A2B4A]/35 group-hover:opacity-100">
                  <InstagramGlyph className="w-7 h-7 text-white" />
                </span>
              </a>
            ))}
          </div>
        )}

        {/* 모바일 팔로우 CTA */}
        <div className="mt-8 text-center sm:hidden">
          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-xs tracking-widest px-8 py-3"
          >
            <InstagramGlyph className="w-4 h-4" />
            인스타그램 팔로우 →
          </a>
        </div>
      </div>
    </section>
  );
}
