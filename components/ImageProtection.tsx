"use client";
import { useEffect } from "react";

// 이미지 무단 저장 방지 — 이미지 위에서 우클릭(컨텍스트 메뉴 → "이미지 저장")만 막는다.
// 링크·텍스트 등 다른 요소의 우클릭(새 탭 열기 등)은 그대로 동작해야 하므로 target이 IMG일 때만 차단.
export default function ImageProtection() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);
  return null;
}
