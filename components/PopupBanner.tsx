"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "popup_hidden_until";

type PopupConfig = {
  is_active: boolean;
  subtitle: string;
  title: string;
  link: string;
  link_text: string;
  bg: string;
};

export default function PopupBanner() {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [hideToday, setHideToday] = useState(false);
  const [cfg, setCfg] = useState<PopupConfig | null>(null);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (hiddenUntil && new Date().getTime() < Number(hiddenUntil)) return;

    fetch("/api/admin/site-settings/popup_banner")
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.is_active === false) return;
        setCfg(data);
        setMounted(true);
        setTimeout(() => setShown(true), 50);
      })
      .catch(() => {});
  }, []);

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
    setTimeout(() => setMounted(false), 350);
  }

  if (!mounted || !cfg) return null;

  const banner = (
    <div
      className="relative flex flex-col justify-between p-6"
      style={{ height: 280, background: cfg.bg }}
    >
      <div>
        <p className="text-sm font-normal text-white/80 leading-snug">{cfg.subtitle}</p>
        <p className="mt-1 text-2xl font-bold text-white leading-tight whitespace-pre-line">
          {cfg.title}
        </p>
      </div>
      <Link
        href={cfg.link}
        className="inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
        onClick={handleClose}
      >
        {cfg.link_text} &gt;
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
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pt-2 pb-0">
          <div
            className="relative flex flex-col justify-between p-5 rounded-2xl overflow-hidden"
            style={{ height: 220, background: cfg.bg }}
          >
            <div>
              <p className="text-xs font-normal text-white/80 leading-snug">{cfg.subtitle}</p>
              <p className="mt-1 text-xl font-bold text-white leading-tight whitespace-pre-line">
                {cfg.title}
              </p>
            </div>
            <Link
              href={cfg.link}
              className="inline-flex items-center gap-1 text-sm font-medium text-white/90"
              onClick={handleClose}
            >
              {cfg.link_text} &gt;
            </Link>
          </div>
        </div>

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
          <button onClick={handleClose} className="text-sm font-medium text-gray-700">
            닫기
          </button>
        </div>

        <div className="h-5" />
      </div>
    </>
  );
}
