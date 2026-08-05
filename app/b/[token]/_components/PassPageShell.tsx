"use client";
import type { ReactNode } from "react";
import { playClickSound } from "@/lib/sound";

// 지점 출고 패스 화면(매장 직원용)에서만 모든 버튼 클릭 시 짧은 클릭음을 재생한다.
// stopPropagation을 쓰는 버튼(개별 카드 등)도 놓치지 않도록 캡처 단계에서 감지한다.
export default function PassPageShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen bg-[#f7f7f5] flex items-start justify-center py-10 px-4"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement)?.closest("button")) playClickSound();
      }}
    >
      {children}
    </main>
  );
}
