"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    // 모바일: #scroll-root 내부 컨테이너 스크롤 / 데스크탑: window 스크롤
    document.getElementById("scroll-root")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
