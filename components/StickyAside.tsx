"use client";
import { useRef, useState, useEffect } from "react";

// 우측 정보+배너 컬럼용 sticky 래퍼.
// 컬럼이 화면보다 길면 top 을 음수로 잡아 "끝(마지막 배너)까지 스크롤한 뒤 고정"되게 한다.
// 화면보다 짧으면 헤더 아래에 고정 — 헤더 높이는 Header.tsx가 실측해 공개하는 CSS 변수를 읽는다.
const FALLBACK_HEADER_OFFSET = 64; // CSS 변수를 아직 못 읽었을 때의 폴백

export default function StickyAside({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(FALLBACK_HEADER_OFFSET);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const h = el.offsetHeight;
      const cs = getComputedStyle(document.documentElement);
      const topbarH = parseInt(cs.getPropertyValue("--wu-topbar-h"), 10);
      const headerH = parseInt(cs.getPropertyValue("--wu-header-h"), 10);
      const headerOffset = (Number.isFinite(topbarH) ? topbarH : 0) + (Number.isFinite(headerH) ? headerH : FALLBACK_HEADER_OFFSET);
      // 컬럼이 뷰포트보다 길면: 바닥이 뷰포트 하단에 닿는 시점에 고정 → 그 전까진 함께 스크롤
      setTop(Math.min(headerOffset, window.innerHeight - h - 16));
    };
    compute();
    window.addEventListener("resize", compute);
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => { window.removeEventListener("resize", compute); ro.disconnect(); };
  }, []);

  return (
    <div ref={ref} className={`md:sticky md:self-start ${className}`} style={{ top }}>
      {children}
    </div>
  );
}
