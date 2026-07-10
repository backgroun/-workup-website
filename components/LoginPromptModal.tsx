"use client";

import { useEffect } from "react";

// 비로그인 사용자에게 로그인 유도를 띄우는 공용 모달.
// 찜(카드 하트) · 피팅 리스트 담기 등 로그인이 필요한 동작에서 공통 사용.
export default function LoginPromptModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Esc 닫기 + 열려 있는 동안 배경 스크롤 잠금 (훅은 early-return 위에 위치해야 함)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl px-9 py-9 flex flex-col items-center gap-7 min-w-[360px] max-w-[90vw]">
        <p className="text-[16px] text-[#303236] font-medium text-center leading-relaxed">
          로그인이 필요한 서비스 입니다.<br />로그인 하시겠습니까?
        </p>
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-lg border border-gray-300 text-[14px] text-gray-600 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-lg bg-[#303236] text-white text-[14px] font-medium hover:bg-[#15223b] transition-colors whitespace-nowrap"
          >
            로그인 바로가기
          </button>
        </div>
      </div>
    </div>
  );
}
