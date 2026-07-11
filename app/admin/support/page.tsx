"use client";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_SUPPORT, normalizeSupport, type SupportConfig } from "@/lib/site-content";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label, hint, value, textarea, placeholder, onChange,
}: {
  label: string; hint?: string; value: string; textarea?: boolean; placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 block">{label}</label>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      )}
    </div>
  );
}

// 안내 이미지 필드 (파일 업로드 + URL 직접 입력)
function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-gray-700 block">좌측 안내 이미지 (비우면 소개 문구가 대신 표시됩니다)</label>
      <div className="flex items-stretch gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap rounded-lg">
          {uploading ? "업로드 중..." : "파일 선택"}
        </button>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="또는 이미지 URL 직접 입력 (https://...)"
          className="flex-1 min-w-0 border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 rounded-lg transition-colors" />
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="flex-shrink-0 px-3 py-2.5 text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">
            제거
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 object-cover border border-slate-200 rounded-lg" />
      )}
    </div>
  );
}

export default function SupportEditPage() {
  const [cfg, setCfg] = useState<SupportConfig>(DEFAULT_SUPPORT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/support_page")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Partial<SupportConfig> | null) => setCfg(normalizeSupport(d)))
      .catch(() => setCfg(DEFAULT_SUPPORT))
      .finally(() => setLoading(false));
  }, []);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };
  const patch = (p: Partial<SupportConfig>) => setCfg((prev) => ({ ...prev, ...p }));

  const reset = () => {
    if (!confirm("고객센터 페이지를 기본값으로 되돌릴까요? (저장 전까지 실제 반영 안 됨)")) return;
    setCfg(DEFAULT_SUPPORT);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/support_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      flash(r.ok ? "저장됐습니다. 사이트에 바로 반영됩니다." : "저장에 실패했습니다.");
    } catch {
      flash("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">고객센터 페이지 편집</h1>
          <p className="mt-1 text-sm text-gray-500">고객센터(1:1 문의) 페이지의 히어로 문구·안내 이미지·소개 문구를 편집합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          <a href="/support" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            실제 페이지 ↗
          </a>
          <button onClick={reset}
            className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            기본값
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* 왼쪽: 편집 */}
        <div className="space-y-6">
          <Card title="히어로">
            <Field label="소제목 (eyebrow)" value={cfg.hero_eyebrow} placeholder="CUSTOMER CENTER"
              onChange={(v) => patch({ hero_eyebrow: v })} />
            <Field label="제목" value={cfg.hero_title} onChange={(v) => patch({ hero_title: v })} />
            <Field label="설명 (줄바꿈 가능)" value={cfg.hero_desc} textarea onChange={(v) => patch({ hero_desc: v })} />
          </Card>

          <Card title="좌측 안내 영역">
            <ImageField value={cfg.guide_image_url} onChange={(v) => patch({ guide_image_url: v })} />
            <Field label="소개 제목 (안내 이미지 없을 때만 표시)" value={cfg.intro_title}
              onChange={(v) => patch({ intro_title: v })} />
            <Field label="소개 설명 (줄바꿈 가능)" value={cfg.intro_desc} textarea
              hint="안내 이미지가 있으면 이미지 아래에, 없으면 이미지 자리에 표시됩니다."
              onChange={(v) => patch({ intro_desc: v })} />
          </Card>
        </div>

        {/* 오른쪽: 실시간 미리보기 */}
        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">실시간 미리보기</p>
          <div className="border border-gray-200 bg-[#FAFAF8] overflow-hidden rounded-lg shadow-sm">
            <div className="px-6 pt-8 pb-2">
              {cfg.hero_eyebrow && <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-2">{cfg.hero_eyebrow}</p>}
              {cfg.hero_title && <h2 className="text-2xl font-bold text-[#303236] leading-tight mb-2">{cfg.hero_title}</h2>}
              {cfg.hero_desc && <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{cfg.hero_desc}</p>}
            </div>
            <div className="p-6">
              <div className="border border-gray-200 bg-white overflow-hidden max-w-sm">
                {cfg.guide_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cfg.guide_image_url} alt="" className="w-full object-cover" />
                ) : (
                  <div className="bg-[#303236] px-6 py-8">
                    <h3 className="text-lg font-bold text-white mb-2 whitespace-pre-line">{cfg.intro_title}</h3>
                    <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{cfg.intro_desc}</p>
                  </div>
                )}
                {cfg.guide_image_url && (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line p-4">{cfg.intro_desc}</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">실제 화면에는 고객센터 전화번호·운영시간(푸터 설정 연동)과 1:1 문의 폼이 함께 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
