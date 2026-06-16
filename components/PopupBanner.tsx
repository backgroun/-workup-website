"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "popup_hidden_until";

export default function PopupBanner() {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (hiddenUntil && new Date().getTime() < Number(hiddenUntil)) return;
    setMounted(true);
    // 렌더 후 50ms 뒤 슬라이드 인 시작
    const t = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(t);
  }, []);

  // 모바일에서 시트 열릴 때 스크롤 잠금
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile && shown) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [shown]);

  function handleClose() {
    if (hideToday) {
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      localStorage.setItem(STORAGE_KEY, String(midnight.getTime()));
    }
    setShown(false);
    // 애니메이션(300ms) 끝난 뒤 DOM에서 제거
    setTimeout(() => setMounted(false), 350);
  }

  if (!mounted) return null;

  /* ── 공통 콘텐츠 ── */
  const banner = (
    <div
      className="relative flex flex-col justify-between p-6"
      style={{
        height: 280,
        background: "linear-gradient(135deg, #7eb8d4 0%, #a8d8b8 50%, #d4c5a9 100%)",
      }}
    >
      <div>
        <p className="text-sm font-normal text-white/80 leading-snug">
          안는 순간, 시원해지는
        </p>
        <p className="mt-1 text-2xl font-bold text-white leading-tight">
          여름을 위한<br />냉감 멀티쿠션
        </p>
      </div>
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
        onClick={handleClose}
      >
        상품 보러가기 &gt;
      </Link>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between bg-white px-5 py-3.5 border-t border-gray-100">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 select-none">
        <input
          type="checkbox"
          checked={hideToday}
          onChange={(e) => setHideToday(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-gray-600"
        />
        오늘 하루 보지않기
      </label>
      <button
        onClick={handleClose}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        닫기
      </button>
    </div>
  );

  return (
    <>
      {/* ── PC 팝업 (md+) ── */}
      <div
        className={`hidden md:block fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300 ${
          shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        style={{ width: 380 }}
      >
        {banner}
        {footer}
      </div>

      {/* ── 모바일 바텀시트 (< md) ── */}

      {/* 백드롭 */}
      <div
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-[64] bg-black/50 transition-opacity duration-300 ${
          shown ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* 시트 본체 */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-[65] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out"
        style={{ transform: shown ? "translateY(0)" : "translateY(110%)" }}
        role="dialog"
        aria-modal="true"
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 이미지 배너 */}
        <div className="px-4 pt-2 pb-0">
          <div
            className="relative flex flex-col justify-between p-5 rounded-2xl overflow-hidden"
            style={{
              height: 220,
              background: "linear-gradient(135deg, #7eb8d4 0%, #a8d8b8 50%, #d4c5a9 100%)",
            }}
          >
            <div>
              <p className="text-xs font-normal text-white/80 leading-snug">
                안는 순간, 시원해지는
              </p>
              <p className="mt-1 text-xl font-bold text-white leading-tight">
                여름을 위한<br />냉감 멀티쿠션
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-white/90"
              onClick={handleClose}
            >
              상품 보러가기 &gt;
            </Link>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="flex items-center justify-between px-5 py-4 mt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 select-none">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-gray-600"
            />
            오늘 하루 보지않기
          </label>
          <button
            onClick={handleClose}
            className="text-sm font-medium text-gray-700"
          >
            닫기
          </button>
        </div>

        {/* 홈 인디케이터 여백 */}
        <div className="h-5" />
      </div>
    </>
  );
}
