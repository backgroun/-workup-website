"use client";
import { useEffect, useState } from "react";
import FranchiseGuide from "./FranchiseGuide";

// 문의 페이지에서 '창업안내'를 페이지 이동 없이 팝업(모달)으로 띄우는 버튼.
export default function FranchiseGuideModal({ label = "창업안내 보기" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full bg-[#111] text-white text-sm font-bold py-3.5 hover:bg-[#ff550c] transition-colors"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        {label}
        <span aria-hidden>→</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/70 overflow-y-auto" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="워크업 창업안내">
          <div className="min-h-full flex items-start justify-center p-0 sm:p-6">
            <div className="relative bg-[#0d0d0d] w-full max-w-3xl sm:rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* 스크롤해도 항상 보이는 닫기 버튼 */}
              <div className="sticky top-0 z-10 h-0">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#ff550c] transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FranchiseGuide embedded />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
