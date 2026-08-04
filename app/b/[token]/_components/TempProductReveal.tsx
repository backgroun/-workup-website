"use client";
import { useState } from "react";
import VerticalImageStack from "./VerticalImageStack";

// 임시등록 상품 — 평소엔 대표 사진 한 장만 정식등록과 같은 정사각형으로 보여주다가,
// "펼쳐보기"를 누르면 모달이 뜨면서 나머지 사진들이 원본 비율 그대로 세로로 길게 이어져
// 스크롤로 볼 수 있다 (실제 페이지 이동 없음).
export default function TempProductReveal({
  images,
  name,
  tagline,
}: {
  images: string[];
  name: string;
  tagline?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cover = images[0];

  return (
    <div>
      <div className="mb-3">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">이미지 없음</div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-[15.5px] text-gray-900">{name}</h2>
          {tagline}
        </div>
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-[#303236] border border-gray-200 rounded-lg hover:border-[#303236] transition-colors"
          >
            펼쳐보기
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10 rounded-t-2xl">
              <span className="font-semibold text-[14px] text-gray-900 truncate pr-3">{name}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="p-3">
              <VerticalImageStack images={images} alt={name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
