"use client";
import { useState, useEffect, useRef } from "react";

// ── 타입 ────────────────────────────────────────────────────────────────────

type BgType = "solid" | "gradient" | "image";
type LinkType = "url" | "product";

type AiInput = {
  productName: string;
  season: string;
  features: string;
  mood: string;
  target: string;
  style: string;
};

type AiResult = {
  imagePrompt: string;
  subtitle: string;
  title: string;
  ctaText: string;
};

type PopupItem = {
  id: string;
  is_active: boolean;
  admin_title: string;
  subtitle: string;
  title: string;
  link_type: LinkType;
  link: string;
  link_text: string;
  bg_type: BgType;
  bg_solid: string;
  bg_gradient_from: string;
  bg_gradient_to: string;
  bg_gradient_angle: number;
  bg_image_url: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  sort_order: number;
};

// ── 상수 ────────────────────────────────────────────────────────────────────

const ANGLE_ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
const ANGLE_DEGS   = [0, 45, 90, 135, 180, 225, 270, 315];

const GRADIENT_PRESETS = [
  { label: "여름 바다",      from: "#7eb8d4", to: "#a8d8b8", angle: 135 },
  { label: "새벽 노을",      from: "#ff9a44", to: "#fc6076", angle: 135 },
  { label: "딥 네이비",      from: "#1A2B4A", to: "#2d4a7a", angle: 135 },
  { label: "민트 그린",      from: "#43b89c", to: "#2b6cb0", angle: 135 },
  { label: "핑크 드림",      from: "#f093fb", to: "#f5576c", angle: 135 },
  { label: "워크업 오렌지",  from: "#ff550c", to: "#ff9a44", angle: 135 },
];

const EMPTY: Omit<PopupItem, "id"> = {
  is_active: true,
  admin_title: "",
  subtitle: "",
  title: "",
  link_type: "url",
  link: "/products",
  link_text: "상품 보러가기",
  bg_type: "gradient",
  bg_solid: "#1A2B4A",
  bg_gradient_from: "#7eb8d4",
  bg_gradient_to: "#a8d8b8",
  bg_gradient_angle: 135,
  bg_image_url: "",
  scheduled_start: null,
  scheduled_end: null,
  sort_order: 0,
};

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

function computeBg(item: Omit<PopupItem, "id"> | PopupItem): string {
  if (item.bg_type === "solid")    return item.bg_solid || "#1A2B4A";
  if (item.bg_type === "gradient")
    return `linear-gradient(${item.bg_gradient_angle}deg, ${item.bg_gradient_from}, ${item.bg_gradient_to})`;
  if (item.bg_type === "image" && item.bg_image_url)
    return `url('${item.bg_image_url}') center/cover no-repeat`;
  return item.bg_solid || "#1A2B4A";
}

function getStatusBadge(item: PopupItem): { label: string; cls: string } {
  if (!item.is_active) return { label: "비활성", cls: "bg-gray-100 text-gray-500" };
  const now = new Date().toISOString();
  if (item.scheduled_start && item.scheduled_start > now)
    return { label: "예약중", cls: "bg-blue-100 text-blue-600" };
  if (item.scheduled_end && item.scheduled_end < now)
    return { label: "종료됨", cls: "bg-orange-100 text-orange-600" };
  return { label: "노출중", cls: "bg-green-100 text-green-600" };
}

function toIsoOrNull(v: string): string | null {
  if (!v) return null;
  try { return new Date(v).toISOString(); } catch { return null; }
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

const DEFAULT_AI_INPUT: AiInput = {
  productName: "",
  season: "여름",
  features: "",
  mood: "시원한",
  target: "",
  style: "미니멀",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0"
    >
      {copied ? "복사됨!" : "복사"}
    </button>
  );
}

export default function PopupManagePage() {
  const [tab, setTab] = useState<"manage" | "ai">("manage");
  const [popups, setPopups]     = useState<PopupItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [editing, setEditing]   = useState<PopupItem | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver,  setDragOver]  = useState<number | null>(null);

  // AI 상태
  const [aiInput, setAiInput]   = useState<AiInput>(DEFAULT_AI_INPUT);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState("");

  // 로드
  useEffect(() => {
    fetch("/api/admin/site-settings/popup_banner")
      .then(r => r.json())
      .then((data: { popups?: PopupItem[] } | Record<string, unknown> | null) => {
        if (data && "popups" in data && Array.isArray(data.popups)) {
          setPopups(data.popups as PopupItem[]);
        } else if (data && typeof data === "object" && ("title" in data || "subtitle" in data)) {
          // 이전 단일 팝업 포맷 → 마이그레이션
          const d = data as Record<string, unknown>;
          setPopups([{
            id: crypto.randomUUID(),
            is_active: (d.is_active as boolean) ?? true,
            admin_title: "기존 팝업",
            subtitle: (d.subtitle as string) || "",
            title: (d.title as string) || "",
            link_type: "url",
            link: (d.link as string) || "/products",
            link_text: (d.link_text as string) || "상품 보러가기",
            bg_type: "gradient",
            bg_solid: "#1A2B4A",
            bg_gradient_from: "#7eb8d4",
            bg_gradient_to: "#a8d8b8",
            bg_gradient_angle: 135,
            bg_image_url: "",
            scheduled_start: null,
            scheduled_end: null,
            sort_order: 0,
          }]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (text: string) => { setToast(text); setTimeout(() => setToast(""), 2500); };

  const handleAiGenerate = async () => {
    if (!aiInput.productName.trim()) { setAiError("제품명을 입력해주세요."); return; }
    setAiError(""); setAiLoading(true); setAiResult(null);
    try {
      const res = await fetch("/api/admin/popup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiInput),
      });
      const data = await res.json();
      if (data.error) setAiError(data.error);
      else setAiResult(data);
    } catch { setAiError("생성 중 오류가 발생했습니다."); }
    finally { setAiLoading(false); }
  };

  const applyAiToNewPopup = () => {
    if (!aiResult) return;
    setEditing({
      id: crypto.randomUUID(),
      ...EMPTY,
      sort_order: popups.length,
      subtitle: aiResult.subtitle,
      title: aiResult.title,
      link_text: aiResult.ctaText,
    });
    setIsNew(true);
    setTab("manage");
  };

  const saveAll = async (list: PopupItem[]) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/site-settings/popup_banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popups: list }),
      });
      if (r.ok) flash("저장됐습니다.");
      else flash("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditing({ id: crypto.randomUUID(), ...EMPTY, sort_order: popups.length });
    setIsNew(true);
  };

  const openEdit = (item: PopupItem) => { setEditing({ ...item }); setIsNew(false); };

  const handleSave = async () => {
    if (!editing) return;
    const updated = isNew
      ? [...popups, editing].map((p, i) => ({ ...p, sort_order: i }))
      : popups.map(p => p.id === editing.id ? editing : p);
    setPopups(updated);
    setEditing(null);
    await saveAll(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 팝업을 삭제할까요?")) return;
    const updated = popups.filter(p => p.id !== id).map((p, i) => ({ ...p, sort_order: i }));
    setPopups(updated);
    await saveAll(updated);
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null); setDragOver(null); return;
    }
    const next = [...popups];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const updated = next.map((p, i) => ({ ...p, sort_order: i }));
    setPopups(updated);
    setDragIndex(null); setDragOver(null);
    await saveAll(updated);
  };

  const set = <K extends keyof PopupItem,>(key: K, val: PopupItem[K]) =>
    setEditing(prev => prev ? { ...prev, [key]: val } : prev);

  const uploadBgImage = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      set("bg_image_url", url);
    } else {
      flash("이미지 업로드 실패");
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">팝업 배너 관리</h1>
          <p className="mt-1 text-sm text-gray-500">메인 페이지에 표시되는 팝업 배너를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
          {tab === "manage" && (
            <button onClick={openNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              팝업 추가
            </button>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([["manage", "팝업 관리"], ["ai", "✨ AI 생성기"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-slate-800 text-slate-900" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── AI 생성기 탭 ── */}
      {tab === "ai" && (
        <div className="max-w-2xl space-y-6">
          <p className="text-sm text-gray-500">제품 정보를 입력하면 Claude AI가 이미지 프롬프트와 팝업 문구를 생성합니다.</p>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">제품 정보 입력</h2>

            <div>
              <label className="text-xs text-gray-500 block mb-1">제품명 / 종류 *</label>
              <input type="text" value={aiInput.productName}
                onChange={e => setAiInput(a => ({ ...a, productName: e.target.value }))}
                placeholder="예: 냉감 멀티쿠션, 방수 작업복, 리플렉티브 재킷"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">계절 / 테마</label>
                <select value={aiInput.season} onChange={e => setAiInput(a => ({ ...a, season: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white">
                  {["봄", "여름", "가을", "겨울", "사계절"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">분위기</label>
                <select value={aiInput.mood} onChange={e => setAiInput(a => ({ ...a, mood: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white">
                  {["시원한", "따뜻한", "세련된", "활동적인", "고급스러운", "편안한"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">핵심 특징</label>
              <textarea value={aiInput.features}
                onChange={e => setAiInput(a => ({ ...a, features: e.target.value }))}
                placeholder="예: 냉감 소재, 빠른 건조, 신축성 좋음, 현장 착용 가능"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">타겟 고객</label>
                <input type="text" value={aiInput.target}
                  onChange={e => setAiInput(a => ({ ...a, target: e.target.value }))}
                  placeholder="예: 현장 작업자, 30-40대 남성"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">스타일 방향</label>
                <select value={aiInput.style} onChange={e => setAiInput(a => ({ ...a, style: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white">
                  {["미니멀", "자연적", "도시적", "아웃도어", "스포티", "클래식"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {aiError && <p className="text-xs text-red-500">{aiError}</p>}

            <button onClick={handleAiGenerate} disabled={aiLoading}
              className="w-full py-3 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {aiLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />생성 중...</>
                : "✨ AI로 생성하기"}
            </button>
          </div>

          {aiResult && (
            <div className="space-y-4">
              {/* 이미지 프롬프트 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">이미지 프롬프트</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Midjourney / DALL-E</span>
                </div>
                <div className="relative bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed pr-16">{aiResult.imagePrompt}</p>
                  <div className="absolute top-3 right-3"><CopyBtn text={aiResult.imagePrompt} /></div>
                </div>
              </div>

              {/* 팝업 문구 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <h2 className="font-semibold text-gray-800">팝업 문구</h2>
                <div className="space-y-2">
                  {[
                    { label: "소제목", value: aiResult.subtitle },
                    { label: "타이틀", value: aiResult.title },
                    { label: "버튼",   value: aiResult.ctaText },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-400 w-12 shrink-0 pt-0.5">{label}</span>
                      <span className="text-sm text-gray-800 flex-1 whitespace-pre-line">{value}</span>
                      <CopyBtn text={value} />
                    </div>
                  ))}
                </div>
                <button onClick={applyAiToNewPopup}
                  className="w-full py-2.5 rounded-xl border-2 border-slate-800 text-slate-800 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
                  이 문구로 새 팝업 만들기 →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 팝업 관리 탭 ── */}
      {tab === "manage" && <div className="flex gap-6 items-start">

        {/* ── 왼쪽: 팝업 목록 ── */}
        <div className="w-[280px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">팝업 목록 ({popups.length})</h2>
              <span className="text-xs text-slate-400">드래그로 순서 변경</span>
            </div>

            {popups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <svg className="w-9 h-9 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M3 9h18" />
                </svg>
                등록된 팝업이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {popups.map((item, i) => {
                  const { label, cls } = getStatusBadge(item);
                  return (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${
                        editing?.id === item.id ? "bg-blue-50" : "hover:bg-slate-50"
                      } ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}
                    >
                      <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>

                      {/* 배경 미리보기 */}
                      <div className="w-11 h-7 rounded flex-shrink-0 border border-gray-100"
                        style={{ background: computeBg(item) }} />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                          {item.admin_title || item.title || "(제목 없음)"}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(item)}
                          className="text-[11px] font-medium text-slate-600 border border-slate-200 px-1.5 py-0.5 hover:bg-slate-100 transition-colors rounded">
                          수정
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="text-[11px] font-medium text-red-400 border border-red-200 px-1.5 py-0.5 hover:bg-red-50 transition-colors rounded">
                          삭제
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {popups.length > 1 && (
            <p className="mt-2.5 text-xs text-slate-400 px-1 leading-relaxed">
              여러 팝업이 활성화된 경우 순서대로 슬라이드로 표시됩니다.
            </p>
          )}
        </div>

        {/* ── 오른쪽: 편집 폼 ── */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* 폼 헤더 */}
              <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  {isNew ? "새 팝업 추가" : "팝업 수정"}
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving
                      ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
                      : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* 1. 기본 설정 */}
                <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">관리 제목</label>
                    <input type="text" value={editing.admin_title}
                      onChange={e => set("admin_title", e.target.value)}
                      placeholder="예: 여름 프로모션"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={editing.is_active}
                        onChange={e => set("is_active", e.target.checked)}
                        className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm font-medium text-gray-700">팝업 활성화</span>
                    </label>
                  </div>
                </div>

                {/* 2. 배경 설정 */}
                <div className="pb-5 border-b border-slate-100 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">배경 설정</p>

                  {/* 배경 타입 탭 */}
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {(["solid", "gradient", "image"] as BgType[]).map(type => (
                      <button key={type} type="button" onClick={() => set("bg_type", type)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          editing.bg_type === type
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}>
                        {type === "solid" ? "단색" : type === "gradient" ? "그라디언트" : "이미지"}
                      </button>
                    ))}
                  </div>

                  {/* 단색 */}
                  {editing.bg_type === "solid" && (
                    <div className="flex items-center gap-3">
                      <input type="color" value={editing.bg_solid}
                        onChange={e => set("bg_solid", e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                      <input type="text" value={editing.bg_solid}
                        onChange={e => set("bg_solid", e.target.value)}
                        placeholder="#1A2B4A"
                        className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                      <div className="w-20 h-10 rounded-lg border border-gray-100 flex-shrink-0"
                        style={{ background: editing.bg_solid }} />
                    </div>
                  )}

                  {/* 그라디언트 */}
                  {editing.bg_type === "gradient" && (
                    <div className="space-y-4">
                      {/* 프리셋 */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">빠른 선택</p>
                        <div className="flex flex-wrap gap-2">
                          {GRADIENT_PRESETS.map(preset => (
                            <button key={preset.label} type="button"
                              onClick={() => {
                                set("bg_gradient_from",  preset.from);
                                set("bg_gradient_to",    preset.to);
                                set("bg_gradient_angle", preset.angle);
                              }}
                              className="group relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-lg border-2 border-transparent group-hover:border-blue-400 transition-colors"
                                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }} />
                              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 색상 피커 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">시작 색상</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={editing.bg_gradient_from}
                              onChange={e => set("bg_gradient_from", e.target.value)}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                            <input type="text" value={editing.bg_gradient_from}
                              onChange={e => set("bg_gradient_from", e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">끝 색상</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={editing.bg_gradient_to}
                              onChange={e => set("bg_gradient_to", e.target.value)}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                            <input type="text" value={editing.bg_gradient_to}
                              onChange={e => set("bg_gradient_to", e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                          </div>
                        </div>
                      </div>

                      {/* 방향 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-500">방향 ({editing.bg_gradient_angle}°)</label>
                          <div className="flex gap-1">
                            {ANGLE_DEGS.map((deg, idx) => (
                              <button key={deg} type="button"
                                onClick={() => set("bg_gradient_angle", deg)}
                                title={`${deg}°`}
                                className={`w-7 h-7 text-xs flex items-center justify-center rounded border transition-colors ${
                                  editing.bg_gradient_angle === deg
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "border-slate-200 text-slate-500 hover:border-slate-400 bg-white"
                                }`}>
                                {ANGLE_ARROWS[idx]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input type="range" min={0} max={360} value={editing.bg_gradient_angle}
                          onChange={e => set("bg_gradient_angle", Number(e.target.value))}
                          className="w-full accent-slate-700 h-1.5" />
                      </div>

                      {/* 그라디언트 미리보기 */}
                      <div className="h-10 rounded-lg border border-gray-100"
                        style={{ background: `linear-gradient(${editing.bg_gradient_angle}deg, ${editing.bg_gradient_from}, ${editing.bg_gradient_to})` }} />
                    </div>
                  )}

                  {/* 이미지 */}
                  {editing.bg_type === "image" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">이미지 URL</label>
                        <input type="text" value={editing.bg_image_url}
                          onChange={e => set("bg_image_url", e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                          className="px-4 py-2 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors rounded-lg disabled:opacity-50">
                          {uploading ? "업로드 중..." : "파일 업로드"}
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadBgImage(f); e.target.value = ""; }} />
                        <span className="text-xs text-gray-400">JPG · PNG · WebP · 2MB 이하</span>
                      </div>
                      {editing.bg_image_url && (
                        <div className="h-24 rounded-lg overflow-hidden border border-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editing.bg_image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. 팝업 콘텐츠 */}
                <div className="pb-5 border-b border-slate-100 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">팝업 콘텐츠</p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">서브 문구</label>
                    <input type="text" value={editing.subtitle}
                      onChange={e => set("subtitle", e.target.value)}
                      placeholder="예: 안는 순간, 시원해지는"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">메인 제목</label>
                    <textarea value={editing.title}
                      onChange={e => set("title", e.target.value)}
                      rows={2}
                      placeholder={"여름을 위한\n냉감 멀티쿠션"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                    <p className="text-[11px] text-gray-400 mt-0.5">줄바꿈: 엔터 키</p>
                  </div>
                </div>

                {/* 4. 링크 설정 */}
                <div className="pb-5 border-b border-slate-100 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">링크 설정</p>
                  <div className="flex gap-5">
                    {(["url", "product"] as LinkType[]).map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={editing.link_type === t}
                          onChange={() => set("link_type", t)}
                          className="accent-blue-600" />
                        <span className="text-sm text-gray-700">{t === "url" ? "URL 직접 입력" : "제품 선택"}</span>
                      </label>
                    ))}
                  </div>

                  {editing.link_type === "url" ? (
                    <input type="text" value={editing.link}
                      onChange={e => set("link", e.target.value)}
                      placeholder="/products"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  ) : (
                    <ProductSearch
                      currentLink={editing.link}
                      onSelect={(id, name) => {
                        set("link", `/products/${id}`);
                        if (!editing.link_text || editing.link_text === "상품 보러가기")
                          set("link_text", name);
                      }}
                    />
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">버튼 텍스트</label>
                    <input type="text" value={editing.link_text}
                      onChange={e => set("link_text", e.target.value)}
                      placeholder="상품 보러가기"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                {/* 5. 노출 기간 */}
                <div className="pb-5 border-b border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">노출 기간</p>
                    {(editing.scheduled_start || editing.scheduled_end) && (
                      <button type="button"
                        onClick={() => { set("scheduled_start", null); set("scheduled_end", null); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        기간 초기화
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 -mt-2">미설정 시 활성화 상태에서 항상 노출됩니다.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">시작 일시</label>
                      <input type="datetime-local"
                        value={editing.scheduled_start ? editing.scheduled_start.slice(0, 16) : ""}
                        onChange={e => set("scheduled_start", toIsoOrNull(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">종료 일시</label>
                      <input type="datetime-local"
                        value={editing.scheduled_end ? editing.scheduled_end.slice(0, 16) : ""}
                        onChange={e => set("scheduled_end", toIsoOrNull(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                </div>

                {/* 6. 미리보기 */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">미리보기</p>
                  <div className="flex flex-wrap gap-8 items-start">
                    {/* PC */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2">PC 팝업</p>
                      <div className="shadow-xl overflow-hidden" style={{ width: 280 }}>
                        <div className="relative flex flex-col justify-between p-5"
                          style={{ height: 200, background: computeBg(editing) }}>
                          <div>
                            <p className="text-xs text-white/80 leading-snug">{editing.subtitle || "서브 문구"}</p>
                            <p className="mt-1 text-lg font-bold text-white leading-tight whitespace-pre-line">
                              {editing.title || "메인 제목"}
                            </p>
                          </div>
                          <p className="text-xs text-white/90">{editing.link_text || "링크 텍스트"} &gt;</p>
                        </div>
                        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">오늘 하루 보지않기</span>
                          <button className="text-xs font-medium text-gray-700">닫기</button>
                        </div>
                      </div>
                    </div>

                    {/* 모바일 */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2">모바일 바텀시트</p>
                      <div className="bg-white rounded-t-3xl shadow-xl overflow-hidden" style={{ width: 260 }}>
                        <div className="flex justify-center pt-3 pb-1">
                          <div className="w-8 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <div className="px-3 pt-1">
                          <div className="relative flex flex-col justify-between p-4 rounded-xl overflow-hidden"
                            style={{ height: 150, background: computeBg(editing) }}>
                            <div>
                              <p className="text-xs text-white/80 leading-snug">{editing.subtitle || "서브 문구"}</p>
                              <p className="mt-1 text-base font-bold text-white leading-tight whitespace-pre-line">
                                {editing.title || "메인 제목"}
                              </p>
                            </div>
                            <p className="text-xs text-white/90">{editing.link_text || "링크 텍스트"} &gt;</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 mt-1">
                          <span className="text-xs text-gray-500">오늘 하루 보지않기</span>
                          <button className="text-xs font-medium text-gray-700">닫기</button>
                        </div>
                        <div className="h-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 저장/취소 */}
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M3 9h18" />
              </svg>
              <p>목록에서 팝업을 선택하거나 새 팝업을 추가하세요.</p>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

// ── 제품 검색 컴포넌트 ────────────────────────────────────────────────────────

type ProductRow = { id: string; name: string };

function ProductSearch({ currentLink, onSelect }: {
  currentLink: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [all, setAll]         = useState<ProductRow[]>([]);
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [fetched, setFetched] = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const currentId = currentLink.startsWith("/products/")
    ? currentLink.replace("/products/", "")
    : "";

  const fetchProducts = async () => {
    if (fetched) return;
    try {
      const r = await fetch("/api/admin/products");
      const data = await r.json();
      const items = Array.isArray(data) ? data : (data.items ?? []);
      setAll(items.map((p: ProductRow) => ({ id: p.id, name: p.name })));
      setFetched(true);
    } catch { /* ignore */ }
  };

  const filtered = query.trim()
    ? all.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()))
    : all.slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { fetchProducts(); setOpen(true); }}
        placeholder="제품명 검색..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
      />
      {currentId && (
        <p className="text-xs text-gray-500 mt-1">
          선택됨: <span className="font-medium text-blue-600">{currentLink}</span>
        </p>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
          {!fetched ? (
            <div className="p-3 text-xs text-gray-400 text-center">로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-xs text-gray-400 text-center">검색 결과 없음</div>
          ) : (
            filtered.map(p => (
              <button key={p.id} type="button"
                onClick={() => { onSelect(p.id, p.name); setQuery(p.name); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                  currentId === p.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}>
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-gray-400 ml-2">{p.id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
