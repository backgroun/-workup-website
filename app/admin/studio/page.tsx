"use client";
import { useState, useEffect, useRef } from "react";
import { SHIRT_COLORS } from "@/components/studio/assets";
import type { StudioSettings, DesignAsset } from "@/lib/studio-server";

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);

const DEFAULT: StudioSettings = {
  enabled: true,
  heading: "나만의 티셔츠 꾸미기",
  subheading: "사진·이미지를 올리고 텍스트를 더해 디자인하고, 매장에서 제작 상담받아 보세요.",
  shirtImageUrl: "",
  defaultColor: "teal",
  enabledColors: [],
  designs: [],
};

// ── 섹션 래퍼 ──────────────────────────────────────────────
function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400";

export default function AdminStudioPage() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", ok: true });
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [uploadingShirt, setUploadingShirt] = useState(false);
  const designFileRef = useRef<HTMLInputElement>(null);
  const shirtFileRef = useRef<HTMLInputElement>(null);

  // ── 로드 ──
  useEffect(() => {
    fetch("/api/admin/site-settings/studio_settings")
      .then((r) => r.json())
      .then((data: StudioSettings | null) => {
        if (data && typeof data === "object") {
          setSettings({
            enabled: data.enabled ?? true,
            heading: data.heading ?? DEFAULT.heading,
            subheading: data.subheading ?? DEFAULT.subheading,
            shirtImageUrl: data.shirtImageUrl ?? "",
            defaultColor: data.defaultColor ?? "teal",
            enabledColors: Array.isArray(data.enabledColors) ? data.enabledColors : [],
            designs: Array.isArray(data.designs) ? data.designs : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast({ text: "", ok: true }), 2500);
  };

  const set = <K extends keyof StudioSettings>(k: K, v: StudioSettings[K]) =>
    setSettings((p) => ({ ...p, [k]: v }));

  // ── 저장 ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/studio_settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.", r.ok);
    } finally {
      setSaving(false);
    }
  };

  // ── 색상 팔레트 토글 ──
  const toggleColor = (id: string) => {
    setSettings((prev) => {
      const all = SHIRT_COLORS.map((c) => c.id);
      const base = prev.enabledColors.length === 0 ? all : prev.enabledColors;
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      return { ...prev, enabledColors: next.length === all.length ? [] : next };
    });
  };
  const isColorEnabled = (id: string) =>
    settings.enabledColors.length === 0 || settings.enabledColors.includes(id);

  // ── 티셔츠 배경 이미지 업로드 ──
  const handleShirtUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return flash("이미지 파일만 업로드할 수 있어요.", false);
    setUploadingShirt(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) return flash("업로드에 실패했습니다.", false);
      const { url } = await res.json();
      setSettings((p) => ({ ...p, shirtImageUrl: url }));
    } finally {
      setUploadingShirt(false);
    }
  };

  // ── 디자인 업로드 ──
  const handleDesignUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return flash("이미지 파일만 업로드할 수 있어요.", false);
    setUploadingDesign(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) return flash("업로드에 실패했습니다.", false);
      const { url } = await res.json();
      const newDesign: DesignAsset = { id: uid(), url, label: file.name.replace(/\.[^.]+$/, "") };
      setSettings((p) => ({ ...p, designs: [...p.designs, newDesign] }));
    } finally {
      setUploadingDesign(false);
    }
  };

  const updateDesignLabel = (id: string, label: string) =>
    setSettings((p) => ({ ...p, designs: p.designs.map((d) => (d.id === id ? { ...d, label } : d)) }));

  const removeDesign = (id: string) =>
    setSettings((p) => ({ ...p, designs: p.designs.filter((d) => d.id !== id) }));

  const moveDesign = (id: string, dir: -1 | 1) =>
    setSettings((p) => {
      const arr = [...p.designs];
      const i = arr.findIndex((d) => d.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, designs: arr };
    });

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      {/* ── 페이지 헤더 ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">스튜디오 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            티셔츠 꾸미기 스튜디오(/studio) 페이지 전체를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {toast.text && (
            <span className={`text-sm font-medium ${toast.ok ? "text-green-600" : "text-red-500"}`}>
              {toast.text}
            </span>
          )}
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
            ) : "저장"}
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── 1. 기본 설정 ── */}
        <Card title="기본 설정">
          <div className="space-y-5">
            {/* 활성화 토글 */}
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                onClick={() => set("enabled", !settings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                <p className="text-sm font-semibold text-gray-800">스튜디오 활성화</p>
                <p className="text-xs text-gray-400">비활성화 시 헤더·모바일 메뉴의 STUDIO 버튼이 사라집니다.</p>
              </div>
            </label>

            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="페이지 헤드라인">
                <input
                  type="text"
                  value={settings.heading}
                  onChange={(e) => set("heading", e.target.value)}
                  className={INPUT}
                  placeholder="나만의 티셔츠 꾸미기"
                />
              </Field>
              <Field label="페이지 서브텍스트">
                <input
                  type="text"
                  value={settings.subheading}
                  onChange={(e) => set("subheading", e.target.value)}
                  className={INPUT}
                  placeholder="사진·이미지를 올리고 텍스트를 더해 디자인하고..."
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* ── 2. 티셔츠 배경 이미지 ── */}
        <Card
          title="티셔츠 배경 이미지"
          sub="업로드한 이미지가 기본 SVG 티셔츠 대신 배경으로 사용됩니다. 배경 투명 PNG를 권장합니다."
        >
          <input
            ref={shirtFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleShirtUpload(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* 미리보기 */}
            <div className="flex-shrink-0">
              <div className="w-40 h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                {settings.shirtImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.shirtImageUrl}
                    alt="티셔츠 배경"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-slate-300">
                    <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 2H8.5C7.4 2 6.5 2.9 6.5 4v16c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V7.5L14.5 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v5.5h5.5M8 12h8M8 16h5" />
                    </svg>
                    <span className="text-[11px]">미리보기</span>
                  </div>
                )}
              </div>
            </div>
            {/* 설명 + 버튼 */}
            <div className="flex-1 space-y-3">
              <div className="text-sm text-gray-600 space-y-1.5">
                <p>• <strong>배경 없는 PNG</strong>를 업로드하면 자연스럽게 합성됩니다.</p>
                <p>• 이미지가 설정되면 기본 SVG 티셔츠와 색상 선택이 <strong>숨겨집니다.</strong></p>
                <p>• 이미지 위에 사용자가 디자인 요소를 올릴 수 있습니다.</p>
                {settings.shirtImageUrl && (
                  <p className="text-green-600 font-semibold">✓ 커스텀 이미지가 설정되어 있습니다.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => shirtFileRef.current?.click()}
                  disabled={uploadingShirt}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {uploadingShirt ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      {settings.shirtImageUrl ? "이미지 교체" : "이미지 업로드"}
                    </>
                  )}
                </button>
                {settings.shirtImageUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, shirtImageUrl: "" }))}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    이미지 제거 (SVG로 복원)
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ── 3. 워크업 디자인 소스 ── */}
        <Card
          title="워크업 디자인 소스"
          sub="관리자가 올린 이미지가 스튜디오 '디자인' 탭에 프리셋으로 표시됩니다. 배경 없는 PNG를 권장합니다."
        >
          {/* 업로드 버튼 */}
          <div className="mb-5">
            <input
              ref={designFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                files.forEach((f) => handleDesignUpload(f));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => designFileRef.current?.click()}
              disabled={uploadingDesign}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {uploadingDesign ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  디자인 이미지 업로드
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-400">PNG (배경 투명 권장) · 여러 파일 동시 선택 가능</p>
          </div>

          {/* 디자인 그리드 */}
          {settings.designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm">등록된 디자인 소스가 없습니다.</p>
              <p className="text-xs mt-1">위 버튼으로 이미지를 업로드하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {settings.designs.map((d, i) => (
                <div key={d.id} className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-blue-300 transition-colors">
                  {/* 이미지 */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.url} alt={d.label} className="max-w-full max-h-full object-contain p-1" />
                    {/* 순서 변경 버튼 */}
                    <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveDesign(d.id, -1)}
                        disabled={i === 0}
                        className="w-5 h-5 flex items-center justify-center bg-white rounded shadow text-slate-400 hover:text-slate-700 disabled:opacity-30 text-[10px]"
                        title="앞으로"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDesign(d.id, 1)}
                        disabled={i === settings.designs.length - 1}
                        className="w-5 h-5 flex items-center justify-center bg-white rounded shadow text-slate-400 hover:text-slate-700 disabled:opacity-30 text-[10px]"
                        title="뒤로"
                      >
                        ›
                      </button>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => removeDesign(d.id)}
                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                  {/* 라벨 */}
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => updateDesignLabel(d.id, e.target.value)}
                    placeholder="이름 (선택)"
                    className="w-full text-[11px] border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-400 bg-white text-center"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── 4. 기본 셔츠 색상 ── */}
        <Card title="기본 셔츠 색상" sub="스튜디오 첫 진입 시 선택되는 색상입니다.">
          <div className="flex flex-wrap gap-3">
            {SHIRT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => set("defaultColor", c.id)}
                className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
              >
                <span
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    settings.defaultColor === c.id
                      ? "border-blue-500 scale-110 shadow-md"
                      : "border-white shadow"
                  }`}
                  style={{ backgroundColor: c.value, outline: "1px solid #e2e8f0" }}
                />
                <span className={`text-[9px] leading-none font-medium ${settings.defaultColor === c.id ? "text-blue-600" : "text-gray-400"}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* ── 5. 색상 팔레트 ── */}
        <Card
          title="사용 가능한 색상"
          sub={`체크 해제된 색상은 스튜디오에 표시되지 않습니다.`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-semibold ${settings.enabledColors.length === 0 ? "text-blue-600" : "text-slate-700"}`}>
              {settings.enabledColors.length === 0
                ? `전체 ${SHIRT_COLORS.length}색 활성`
                : `${settings.enabledColors.length}/${SHIRT_COLORS.length}색 활성`}
            </span>
            <button
              type="button"
              onClick={() => set("enabledColors", [])}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              전체 선택
            </button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-3">
            {SHIRT_COLORS.map((c) => {
              const enabled = isColorEnabled(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => toggleColor(c.id)}
                  className={`flex flex-col items-center gap-1.5 transition-opacity ${enabled ? "opacity-100" : "opacity-30"}`}
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
        </Card>

        {/* ── 하단 저장 버튼 ── */}
        <div className="flex justify-end pt-2 pb-4">
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
