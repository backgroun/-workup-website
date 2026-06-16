"use client";
import { useState, useEffect } from "react";

type PopupConfig = {
  is_active: boolean;
  subtitle: string;
  title: string;
  link: string;
  link_text: string;
  bg: string;
};

const DEFAULT: PopupConfig = {
  is_active: true,
  subtitle: "안는 순간, 시원해지는",
  title: "여름을 위한\n냉감 멀티쿠션",
  link: "/products",
  link_text: "상품 보러가기",
  bg: "linear-gradient(135deg, #7eb8d4 0%, #a8d8b8 50%, #d4c5a9 100%)",
};

export default function PopupManagePage() {
  const [cfg, setCfg] = useState<PopupConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/popup_banner")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setCfg({ ...DEFAULT, ...data });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof PopupConfig>(key: K, val: PopupConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/popup_banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (r.ok) {
        setToast("저장됐습니다.");
        setTimeout(() => setToast(""), 2500);
      } else {
        setToast("저장에 실패했습니다.");
        setTimeout(() => setToast(""), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">팝업 배너 관리</h1>
          <p className="mt-1 text-sm text-gray-500">메인 페이지에 표시되는 팝업 배너를 설정합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && (
            <span className={`text-sm font-medium ${toast.includes("실패") ? "text-red-500" : "text-green-600"}`}>
              {toast}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 활성화 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">팝업 설정</h2>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cfg.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">팝업 활성화</span>
          <span className="text-xs text-gray-400">비활성화 시 팝업이 표시되지 않습니다</span>
        </label>
      </div>

      {/* 콘텐츠 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900">팝업 콘텐츠</h2>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            서브 문구
          </label>
          <input
            type="text"
            value={cfg.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="예: 안는 순간, 시원해지는"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            메인 제목 <span className="text-gray-400 font-normal normal-case">(줄바꿈: \n 입력)</span>
          </label>
          <textarea
            value={cfg.title}
            onChange={(e) => set("title", e.target.value)}
            rows={3}
            placeholder="예: 여름을 위한\n냉감 멀티쿠션"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              링크 URL
            </label>
            <input
              type="text"
              value={cfg.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="/products"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              링크 텍스트
            </label>
            <input
              type="text"
              value={cfg.link_text}
              onChange={(e) => set("link_text", e.target.value)}
              placeholder="상품 보러가기"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* 배경 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">배경 설정</h2>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            배경값 (CSS background)
          </label>
          <input
            type="text"
            value={cfg.bg}
            onChange={(e) => set("bg", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            예시: <code className="bg-gray-100 px-1 rounded">#1A2B4A</code> ·{" "}
            <code className="bg-gray-100 px-1 rounded">linear-gradient(135deg, #7eb8d4 0%, #a8d8b8 100%)</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl border border-gray-200 flex-shrink-0"
            style={{ background: cfg.bg }}
          />
          <span className="text-xs text-gray-400">배경 미리보기</span>
        </div>
      </div>

      {/* 팝업 미리보기 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">팝업 미리보기</h2>

        <div className="flex flex-wrap gap-10 items-start">
          {/* PC 팝업 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">PC 팝업</p>
            <div className="shadow-xl overflow-hidden" style={{ width: 280 }}>
              <div
                className="relative flex flex-col justify-between p-5"
                style={{ height: 200, background: cfg.bg }}
              >
                <div>
                  <p className="text-xs text-white/80 leading-snug">{cfg.subtitle}</p>
                  <p className="mt-1 text-lg font-bold text-white leading-tight whitespace-pre-line">
                    {cfg.title}
                  </p>
                </div>
                <p className="text-xs text-white/90">{cfg.link_text} &gt;</p>
              </div>
              <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">오늘 하루 보지않기</span>
                <button className="text-xs font-medium text-gray-700">닫기</button>
              </div>
            </div>
          </div>

          {/* 모바일 바텀시트 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">모바일 바텀시트</p>
            <div className="bg-white rounded-t-3xl shadow-xl overflow-hidden" style={{ width: 270 }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="px-3 pt-1">
                <div
                  className="relative flex flex-col justify-between p-4 rounded-xl overflow-hidden"
                  style={{ height: 160, background: cfg.bg }}
                >
                  <div>
                    <p className="text-xs text-white/80 leading-snug">{cfg.subtitle}</p>
                    <p className="mt-1 text-base font-bold text-white leading-tight whitespace-pre-line">
                      {cfg.title}
                    </p>
                  </div>
                  <p className="text-xs text-white/90">{cfg.link_text} &gt;</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 mt-1">
                <span className="text-xs text-gray-500">오늘 하루 보지않기</span>
                <button className="text-xs font-medium text-gray-700">닫기</button>
              </div>
              <div className="h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
