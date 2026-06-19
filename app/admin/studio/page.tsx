"use client";
import { useState, useEffect } from "react";
import { SHIRT_COLORS } from "@/components/studio/assets";
import type { StudioSettings } from "@/lib/studio-server";

const DEFAULT: StudioSettings = {
  enabled: true,
  defaultColor: "teal",
  enabledColors: [],
};

export default function AdminStudioPage() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/studio_settings")
      .then((r) => r.json())
      .then((data: StudioSettings | null) => {
        if (data && typeof data === "object") {
          setSettings({
            enabled: data.enabled ?? true,
            defaultColor: data.defaultColor ?? "teal",
            enabledColors: Array.isArray(data.enabledColors) ? data.enabledColors : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/studio_settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleColor = (id: string) => {
    setSettings((prev) => {
      const all = SHIRT_COLORS.map((c) => c.id);
      // enabledColors가 비어 있으면 전체 활성 상태 → 클릭한 색상 하나만 비활성으로 전환
      const base = prev.enabledColors.length === 0 ? all : prev.enabledColors;
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      // 전체 선택이면 빈 배열로 압축(= 전체 활성)
      return { ...prev, enabledColors: next.length === all.length ? [] : next };
    });
  };

  const isColorEnabled = (id: string) =>
    settings.enabledColors.length === 0 || settings.enabledColors.includes(id);

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">스튜디오 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            티셔츠 꾸미기 스튜디오(/studio)의 노출 여부와 색상 팔레트를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <a
            href="/studio"
            target="_blank"
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            스튜디오 미리보기 ↗
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 섹션 1: 기본 설정 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">기본 설정</h2>
          </div>
          <div className="p-6">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                onClick={() => setSettings((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.enabled ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    settings.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  스튜디오 활성화
                </p>
                <p className="text-xs text-gray-400">
                  비활성화 시 헤더·모바일 메뉴의 STUDIO 버튼이 사라집니다.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 섹션 2: 기본 셔츠 색상 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">기본 셔츠 색상</h2>
            <p className="text-xs text-gray-400 mt-0.5">스튜디오 첫 진입 시 선택되는 색상입니다.</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setSettings((p) => ({ ...p, defaultColor: c.id }))}
                  className={`flex flex-col items-center gap-1.5 transition-transform hover:scale-105`}
                >
                  <span
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      settings.defaultColor === c.id
                        ? "border-blue-500 scale-110 shadow-md"
                        : "border-white shadow"
                    }`}
                    style={{ backgroundColor: c.value, outline: "1px solid #e2e8f0" }}
                  />
                  <span
                    className={`text-[9px] leading-none font-medium ${
                      settings.defaultColor === c.id ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 섹션 3: 색상 팔레트 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">사용 가능한 색상</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                체크 해제된 색상은 스튜디오에 표시되지 않습니다.{" "}
                <span className="font-medium text-blue-600">
                  {settings.enabledColors.length === 0
                    ? `전체 ${SHIRT_COLORS.length}색 활성`
                    : `${settings.enabledColors.length}/${SHIRT_COLORS.length}색 활성`}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, enabledColors: [] }))}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              전체 선택
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-3">
              {SHIRT_COLORS.map((c) => {
                const enabled = isColorEnabled(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => toggleColor(c.id)}
                    className={`flex flex-col items-center gap-1.5 transition-opacity ${
                      enabled ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <span className="relative">
                      <span
                        className="block w-9 h-9 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: c.value }}
                      />
                      {enabled && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] leading-none text-gray-400 text-center">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 저장 버튼 (하단) */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? "저장 중..." : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
