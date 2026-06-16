"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const slides = [
  { id: 1, bg: "#1A2B4A", accent: "#ff550c", tag: "2026 Summer", title: "땀 흘려도\n쾌적한 여름 작업복", desc: "흡한속건 · 항균 · UPF50+ 자외선 차단", cta: "여름 컬렉션 보기", href: "/products" },
  { id: 2, bg: "#2d2d2d", accent: "#ff550c", tag: "SAFETY GEAR", title: "현장을 지키는\n안전용품", desc: "안전화 · 안전모 · 보호구 · 안전조끼", cta: "안전용품 보러가기", href: "/products" },
  { id: 3, bg: "#3d2b1a", accent: "#ff550c", tag: "SET-UP", title: "현장부터 퇴근 후까지\n셋업 컬렉션", desc: "상하의 세트로 스타일과 기능을 동시에", cta: "셋업 보러가기", href: "/products" },
  { id: 4, bg: "#1a3a2b", accent: "#ff550c", tag: "DAILY WEAR", title: "일상에서도\n워크업답게", desc: "작업복의 기능성을 일상복 스타일로", cta: "데일리 보러가기", href: "/products" },
];

export default function HomeRollingBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) next();
    else if (delta > 50) prev();
    touchStartX.current = null;
  };

  const slide = slides[current];

  return (
    <div
      className="relative overflow-hidden w-full select-none"
      style={{ height: "260px", backgroundColor: slide.bg, transition: "background-color 0.5s ease" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((s, i) => (
        <div key={s.id}
          className="absolute inset-0 flex items-center px-[15px] md:px-[70px]"
          style={{ opacity: i === current ? 1 : 0, transition: "opacity 0.6s ease", pointerEvents: i === current ? "auto" : "none" }}
        >
          <div className="absolute right-0 top-0 h-full flex items-center pr-8 opacity-[0.04] select-none pointer-events-none overflow-hidden">
            <span className="text-white font-black leading-none" style={{ fontSize: "200px" }}>WU</span>
          </div>
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-3" style={{ color: s.accent }}>{s.tag}</p>
            <h2 className="text-[26px] md:text-[32px] font-bold text-white leading-tight mb-3 whitespace-pre-line">{s.title}</h2>
            <p className="text-[13px] text-white/60 mb-6">{s.desc}</p>
            <Link href={s.href}
              className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-widest px-6 py-2.5 transition-opacity hover:opacity-80"
              style={{ backgroundColor: s.accent, color: "#fff" }}>
              {s.cta} →
            </Link>
          </div>
        </div>
      ))}

      {/* PC 전용 화살표 */}
      <button onClick={prev}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 items-center justify-center z-20 w-10 h-10 transition-colors"
        aria-label="이전">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 4l-6 6 6 6" />
        </svg>
      </button>
      <button onClick={next}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 items-center justify-center z-20 w-10 h-10 transition-colors"
        aria-label="다음">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4l6 6-6 6" />
        </svg>
      </button>

      {/* 중앙 하단 페이지 pill */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/40 text-white/90 text-[13px] font-medium px-4 py-1.5 rounded-full backdrop-blur-sm tracking-wide">
          {current + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}
