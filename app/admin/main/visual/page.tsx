"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type TextLayer = {
  id: string;
  text: string;
  font_family: string;
  color: string;
  weight: number;                       // 400 | 700 | 900
  align: "left" | "center" | "right";
  letter_spacing: number;               // 자간 (px)
  scale_x: number;                      // 장평 (가로 비율, 1 = 기본)
  line_height: number;
  opacity: number;                      // 투명도 (0~1)
  bg_color: string;                     // 텍스트 배경색 ("" = 없음)
  pc_x: number; pc_y: number; pc_size: number;          // PC 좌표·크기
  mobile_x: number; mobile_y: number; mobile_size: number; // 모바일 좌표·크기
};

type HeroSlide = {
  id: string;
  admin_title: string;
  season_text: string;
  title: string;
  subtitle: string;
  btn1_text: string;
  btn1_link: string;
  btn1_visible: boolean;
  btn2_text: string;
  btn2_link: string;
  btn2_visible: boolean;
  pc_image_url: string;
  mobile_image_url: string;
  pc_image_position: string;
  mobile_image_position: string;
  pc_image_scale: number;
  mobile_image_scale: number;
  content_x: number;
  content_y: number;
  title_size: number;
  subtitle_size: number;
  season_text_size: number;
  font_family: string;
  text_layers: TextLayer[];
  is_visible: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  slide_type: string;
  sort_order: number;
};

type SlideType = "main" | "product";

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  main: "메인 비주얼",
  product: "상품 비주얼",
};

const EMPTY: Omit<HeroSlide, "id"> = {
  admin_title: "",
  season_text: "",
  title: "",
  subtitle: "",
  btn1_text: "",
  btn1_link: "/",
  btn1_visible: true,
  btn2_text: "",
  btn2_link: "/",
  btn2_visible: false,
  pc_image_url: "",
  mobile_image_url: "",
  pc_image_position: "50% 50%",
  mobile_image_position: "50% 50%",
  pc_image_scale: 1,
  mobile_image_scale: 1,
  content_x: 5,
  content_y: 35,
  title_size: 28,
  subtitle_size: 14,
  season_text_size: 11,
  font_family: "",
  text_layers: [],
  slide_type: "main",
  is_visible: true,
  scheduled_start: null,
  scheduled_end: null,
  sort_order: 0,
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  return iso.slice(0, 10).replace(/-/g, ".");
}

function toIsoOrNull(val: string): string | null {
  if (!val) return null;
  try { return new Date(val).toISOString(); } catch { return null; }
}

export default function AdminMainVisualPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slideType = (searchParams.get("type") ?? "main") as SlideType;

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [useSchedule, setUseSchedule] = useState(false);
  const [sameImage, setSameImage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [promptOpen, setPromptOpen] = useState(false);
  const [uploading, setUploading] = useState<"pc" | "mobile" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const pcRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/admin/hero-slides?type=${slideType}`);
      if (!res.ok) { setFetchError(true); setLoading(false); return; }
      const data = await res.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); setEditing(null); }, [slideType]);

  const flash = (text: string, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const openNew = () => {
    setEditing({ id: "", ...EMPTY, slide_type: slideType, sort_order: slides.length });
    setIsNew(true);
    setUseSchedule(false);
    setSameImage(true);
    setPromptOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing({ ...slide });
    setIsNew(false);
    setUseSchedule(!!(slide.scheduled_start || slide.scheduled_end));
    setSameImage(!!(slide.pc_image_url && slide.pc_image_url === slide.mobile_image_url));
    setPromptOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const id = isNew ? crypto.randomUUID() : editing.id;
    const payload = {
      ...editing,
      id,
      // 빈 문자열 → null 변환 (TIMESTAMPTZ 오류 방지)
      scheduled_start: useSchedule ? (editing.scheduled_start || null) : null,
      scheduled_end: useSchedule ? (editing.scheduled_end || null) : null,
      // 빈 문자열 이미지 URL → null
      pc_image_url: editing.pc_image_url || null,
      mobile_image_url: sameImage ? (editing.pc_image_url || null) : (editing.mobile_image_url || null),
    };

    const url = isNew ? "/api/admin/hero-slides" : `/api/admin/hero-slides/${editing.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      flash("저장됐습니다.");
      setEditing(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      flash(err.error ?? "저장 실패", "err");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`"${label || id}" 슬라이드를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    if (res.ok) { flash("삭제됐습니다."); load(); }
  };

  const toggleVisible = async (slide: HeroSlide) => {
    const next = !slide.is_visible;
    setSlides((prev) => prev.map((s) => s.id === slide.id ? { ...s, is_visible: next } : s));
    await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: next }),
    });
  };

  const uploadImage = async (file: File, field: "pc" | "mobile") => {
    setUploading(field);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(null);
    if (res.ok) {
      const { url } = await res.json();
      setEditing((prev) => prev ? {
        ...prev,
        [field === "pc" ? "pc_image_url" : "mobile_image_url"]: url,
      } : prev);
    } else {
      const err = await res.json().catch(() => ({}));
      flash(`업로드 실패: ${err.error ?? res.status}`, "err");
    }
  };

  const set = (key: keyof HeroSlide, value: string | boolean | number | null | TextLayer[]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null); setDragOver(null); return;
    }
    const next = [...slides];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const updated = next.map((s, i) => ({ ...s, sort_order: i }));
    setSlides(updated);
    setDragIndex(null); setDragOver(null);
    await Promise.all(updated.map((s) =>
      fetch(`/api/admin/hero-slides/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: s.sort_order }),
      })
    ));
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">슬라이딩 메뉴</h1>
          <p className="text-base text-gray-400 mt-1">히어로 슬라이드 관리 <span className="font-semibold text-gray-600">({slides.length} / 10개)</span></p>
        </div>
        <button
          onClick={openNew}
          disabled={slides.length >= 10}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          슬라이드 추가
        </button>
      </div>

      {/* 슬라이딩 메뉴 타입 탭 */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {(Object.entries(SLIDE_TYPE_LABELS) as [SlideType, string][]).map(([type, label]) => (
          <button
            key={type}
            onClick={() => { router.push(`/admin/main/visual${type === "main" ? "" : `?type=${type}`}`); }}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              slideType === type
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 피드백 */}
      {msg.text && (
        <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Supabase 미설정 */}
      {!loading && fetchError && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ hero_slides 테이블이 설정되지 않았습니다.</p>
          <p className="text-xs text-amber-700 mb-3">Supabase SQL Editor에서 실행하세요:</p>
          <pre className="text-xs bg-white p-3 border border-amber-200 rounded overflow-x-auto text-gray-700 whitespace-pre-wrap">{`-- 신규 생성 시
CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  admin_title TEXT NOT NULL DEFAULT '',
  season_text TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  btn1_text TEXT NOT NULL DEFAULT '',
  btn1_link TEXT NOT NULL DEFAULT '/',
  btn1_visible BOOLEAN NOT NULL DEFAULT TRUE,
  btn2_text TEXT NOT NULL DEFAULT '',
  btn2_link TEXT NOT NULL DEFAULT '/',
  btn2_visible BOOLEAN NOT NULL DEFAULT FALSE,
  pc_image_url TEXT,
  mobile_image_url TEXT,
  pc_image_position TEXT DEFAULT '50% 50%',
  mobile_image_position TEXT DEFAULT '50% 50%',
  content_x NUMERIC DEFAULT 5,
  content_y NUMERIC DEFAULT 35,
  slide_type TEXT DEFAULT 'main',
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON hero_slides;
CREATE POLICY "public_read" ON hero_slides FOR SELECT USING (true);

-- 기존 테이블에 컬럼 추가 (이미 테이블이 있는 경우)
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS admin_title TEXT NOT NULL DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS pc_image_position TEXT DEFAULT '50% 50%';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS mobile_image_position TEXT DEFAULT '50% 50%';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS content_x NUMERIC DEFAULT 5;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS content_y NUMERIC DEFAULT 35;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS slide_type TEXT DEFAULT 'main';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title_size INTEGER DEFAULT 28;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS subtitle_size INTEGER DEFAULT 14;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS season_text_size INTEGER DEFAULT 11;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT '';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS pc_image_scale NUMERIC DEFAULT 1;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS mobile_image_scale NUMERIC DEFAULT 1;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS text_layers JSONB DEFAULT '[]'::jsonb;`}</pre>
        </div>
      )}

      <div className="flex gap-6 items-start">
      {/* ── 왼쪽: 슬라이드 목록 ── */}
      <div className="w-[340px] flex-shrink-0 sticky top-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">슬라이드 목록</h2>
          <span className="text-xs text-slate-400">드래그로 순서 변경</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-slate-400 text-sm">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            불러오는 중...
          </div>
        ) : slides.length === 0 && !editing ? (
          <div className="py-14 text-center text-slate-400 text-sm">
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            등록된 슬라이드가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {slides.map((slide, i) => (
              <li
                key={slide.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${
                  editing?.id === slide.id ? "bg-blue-50" : "hover:bg-slate-50"
                } ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}
              >
                {/* 드래그 핸들 */}
                <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                </svg>

                {/* 썸네일 */}
                <div className="w-16 h-10 flex-shrink-0 bg-slate-100 overflow-hidden rounded">
                  {slide.pc_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.pc_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <span className="text-white/30 text-[9px] font-bold">WU</span>
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {slide.admin_title || slide.title || "(제목 없음)"}
                  </p>
                  {(slide.scheduled_start || slide.scheduled_end) && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {fmtDate(slide.scheduled_start) ?? "∞"} ~ {fmtDate(slide.scheduled_end) ?? "∞"}
                    </p>
                  )}
                </div>

                {/* 노출 토글 + 수정/삭제 */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleVisible(slide)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${slide.is_visible ? "bg-blue-500" : "bg-slate-200"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${slide.is_visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                  </button>
                  <button onClick={() => openEdit(slide)}
                    className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-1 hover:bg-slate-100 transition-colors rounded">
                    수정
                  </button>
                  <button onClick={() => handleDelete(slide.id, slide.admin_title || slide.title)}
                    className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-1 hover:bg-red-50 transition-colors rounded">
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      {/* ── 오른쪽: 편집 폼 ── */}
      <div className="flex-1 min-w-0">
      {editing ? (
        <div ref={formRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              {isNew ? "새 슬라이드 추가" : "슬라이드 수정"}
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {saving ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
                ) : "저장"}
              </button>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">

          {/* 1. 관리용 타이틀 */}
          <div className="pb-6 border-b border-slate-100">
            <Field label="관리용 타이틀" hint="목록 식별용. 실제 화면에 표시되지 않음.">
              <input
                type="text"
                value={editing.admin_title}
                onChange={(e) => set("admin_title", e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                placeholder="예: 2026 여름 메인 비주얼"
              />
            </Field>
          </div>

          {/* 노출 설정 (상단) */}
          <div className="pb-6 border-b border-gray-100 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">노출 설정</p>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_visible}
                  onChange={(e) => set("is_visible", e.target.checked)}
                  className="w-4 h-4 accent-[#1A2B4A]"
                />
                <span className="text-sm text-gray-700">노출 여부</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSchedule}
                  onChange={(e) => {
                    setUseSchedule(e.target.checked);
                    if (!e.target.checked) {
                      set("scheduled_start", null);
                      set("scheduled_end", null);
                    }
                  }}
                  className="w-4 h-4 accent-[#1A2B4A]"
                />
                <span className="text-sm text-gray-700">예약 노출</span>
                <span className="text-xs text-gray-400">설정 기간에만 자동 노출/숨김</span>
              </label>
            </div>
            {useSchedule && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="노출 시작일">
                  <input
                    type="datetime-local"
                    value={editing.scheduled_start ? editing.scheduled_start.slice(0, 16) : ""}
                    onChange={(e) => set("scheduled_start", toIsoOrNull(e.target.value))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                  />
                </Field>
                <Field label="노출 종료일">
                  <input
                    type="datetime-local"
                    value={editing.scheduled_end ? editing.scheduled_end.slice(0, 16) : ""}
                    onChange={(e) => set("scheduled_end", toIsoOrNull(e.target.value))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* AI 이미지 프롬프트 */}
          <div className="pb-6 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setPromptOpen((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                AI 이미지 프롬프트
                <span className="normal-case font-normal text-gray-400 tracking-normal ml-2">— 생략 가능</span>
              </span>
              <span className={`text-gray-400 transition-transform text-sm ${promptOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {promptOpen && (
              <div className="mt-4">
                <VisualPromptBuilder
                  title={editing.title}
                  subtitle={editing.subtitle}
                  pcImageUrl={editing.pc_image_url || undefined}
                />
              </div>
            )}
          </div>

          {/* 2. 이미지 */}
          <div className="pb-6 border-b border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">이미지</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameImage}
                  onChange={(e) => {
                    setSameImage(e.target.checked);
                    if (e.target.checked) set("mobile_image_url", "");
                  }}
                  className="w-4 h-4 accent-[#1A2B4A]"
                />
                <span className="text-xs text-gray-600">PC · 모바일 동일 이미지 사용</span>
              </label>
            </div>

            <ImageField
              label={sameImage ? "PC · 모바일 공통 이미지" : "PC 메인 이미지"}
              hint={sameImage ? "권장: 1920 × 695px · JPG/PNG · 2MB 이하" : "권장: 1920 × 680px · JPG/PNG · 2MB 이하"}
              value={editing.pc_image_url}
              onChange={(v) => set("pc_image_url", v)}
              uploading={uploading === "pc"}
              onUpload={(file) => uploadImage(file, "pc")}
              inputRef={pcRef}
            />
            {!sameImage && (
              <ImageField
                label="모바일 이미지"
                hint="권장: 750 × 695px · JPG/PNG · 1MB 이하 · 미입력 시 PC 이미지로 대체"
                value={editing.mobile_image_url}
                onChange={(v) => set("mobile_image_url", v)}
                uploading={uploading === "mobile"}
                onUpload={(file) => uploadImage(file, "mobile")}
                inputRef={mobileRef}
              />
            )}

            {/* 위치·크기 — PC / 모바일 양옆 배치 (드래그로 위치 조정) */}
            {editing.pc_image_url && (
              <div className="grid grid-cols-2 gap-3">
                <ImagePositionPicker
                  label="PC 위치·크기"
                  imageUrl={editing.pc_image_url}
                  value={editing.pc_image_position || "50% 50%"}
                  onChange={(v) => set("pc_image_position", v)}
                  scale={editing.pc_image_scale ?? 1}
                  onScaleChange={(v) => set("pc_image_scale", v)}
                  aspect="pc"
                />
                <ImagePositionPicker
                  label="모바일 위치·크기"
                  imageUrl={editing.mobile_image_url || editing.pc_image_url}
                  value={editing.mobile_image_position || "50% 50%"}
                  onChange={(v) => set("mobile_image_position", v)}
                  scale={editing.mobile_image_scale ?? 1}
                  onScaleChange={(v) => set("mobile_image_scale", v)}
                  aspect="mobile"
                />
              </div>
            )}
          </div>

          {/* 자유 배치 텍스트 캔버스 */}
          <div className="pb-6 border-b border-gray-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              텍스트 캔버스
              <span className="normal-case font-normal text-gray-400 tracking-normal ml-2">— 여러 텍스트를 드래그로 자유 배치 · 폰트·색·자간·장평</span>
            </p>
            <TextCanvasEditor
              layers={editing.text_layers ?? []}
              onChange={(next) => set("text_layers", next)}
              pcImage={editing.pc_image_url}
              mobileImage={editing.mobile_image_url || editing.pc_image_url}
              pcPos={editing.pc_image_position || "50% 50%"}
              mobilePos={editing.mobile_image_position || "50% 50%"}
              pcScale={editing.pc_image_scale ?? 1}
              mobileScale={editing.mobile_image_scale ?? 1}
            />
          </div>

          {/* 5. 버튼 (CTA) */}
          <div className="pb-6 border-b border-gray-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              버튼 (CTA)
              <span className="normal-case font-normal text-gray-400 tracking-normal ml-2">— 배너 하단 버튼 링크 (선택)</span>
            </p>
            <BannerTextEditor editing={editing} set={(k, v) => set(k as keyof HeroSlide, v)} />
          </div>

          {/* 저장/취소 */}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
              ) : "저장"}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          <p>목록에서 슬라이드를 선택하거나 새 슬라이드를 추가하세요.</p>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ──

function Field({ label, hint, optional, children }: {
  label: string; hint?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {optional && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">생략가능</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function ImageField({ label, hint, value, onChange, uploading, onUpload, inputRef }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; uploading: boolean;
  onUpload: (file: File) => void; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      <div>
        <p className="text-xs text-slate-500 font-medium mb-1.5">URL 직접 입력</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 rounded-lg transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs text-slate-400">또는 파일 업로드</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap rounded-lg">
          {uploading ? "업로드 중..." : "파일 선택"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">
            제거
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-20 object-cover border border-gray-100 rounded" />
      )}
    </div>
  );
}

// ── 이미지 위치 조절 (실제 배너 비율 + 줌 확대/축소) ──

function ImagePositionPicker({ label, imageUrl, value, onChange, scale, onScaleChange, aspect }: {
  label: string; imageUrl: string; value: string;
  onChange: (v: string) => void;
  scale: number; onScaleChange: (v: number) => void;
  aspect: "pc" | "mobile";
}) {
  const parts = value.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  const x = parts ? Math.round(parseFloat(parts[1])) : 50;
  const y = parts ? Math.round(parseFloat(parts[2])) : 50;
  const s = scale || 1;
  const pct = Math.round(s * 100);
  const aspectPad = aspect === "pc" ? "35.4%" : "92.7%";

  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const setFromEvent = (e: React.MouseEvent) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const nx = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const ny = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    onChange(`${nx}% ${ny}%`);
  };

  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
      <p className="text-xs font-semibold text-slate-600">{label}</p>

      {/* 드래그로 위치 조정 (가변 폭) */}
      <div
        ref={boxRef}
        className="relative w-full rounded overflow-hidden border border-slate-200 bg-slate-800 cursor-move select-none"
        style={{ paddingBottom: aspectPad }}
        onMouseDown={(e) => { dragging.current = true; setFromEvent(e); }}
        onMouseMove={(e) => { if (dragging.current) setFromEvent(e); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: value, transform: `scale(${s})`, transformOrigin: value }}
        />
        <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
          드래그로 위치 이동
        </div>
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
          크기 {pct}% · {x}/{y}
        </div>
      </div>

      {/* 이미지 크기 (자유 확대/축소) */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold text-slate-600">이미지 크기</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min={0.5} max={3} step={0.01} value={s}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            className="flex-1 accent-blue-600 h-1.5" />
          <button type="button" onClick={() => onScaleChange(1)}
            className="text-[10px] text-slate-400 hover:text-slate-600 whitespace-nowrap">초기화</button>
        </div>
      </div>
    </div>
  );
}

// ── 배너 텍스트·버튼 배치 에디터 ──

// 무료 웹폰트 라이브러리 (한글+영문) — app/layout.tsx 에서 로드됨
const FONT_OPTIONS = [
  { label: "기본 (사이트 기본)", value: "" },
  { label: "Pretendard (프리텐다드)", value: "'Pretendard', sans-serif" },
  { label: "본고딕 Noto Sans KR", value: "'Noto Sans KR', sans-serif" },
  { label: "본명조 Noto Serif KR", value: "'Noto Serif KR', serif" },
  { label: "검은고딕 Black Han Sans", value: "'Black Han Sans', sans-serif" },
  { label: "주아체 Jua", value: "'Jua', sans-serif" },
  { label: "도현체 Do Hyeon", value: "'Do Hyeon', sans-serif" },
  { label: "나눔손글씨 펜 Nanum Pen", value: "'Nanum Pen Script', cursive" },
  { label: "Montserrat (영문)", value: "'Montserrat', sans-serif" },
  { label: "Playfair Display (영문 세리프)", value: "'Playfair Display', serif" },
  { label: "Oswald (영문 콘덴스드)", value: "'Oswald', sans-serif" },
  { label: "Bebas Neue (영문 디스플레이)", value: "'Bebas Neue', sans-serif" },
];

function BannerTextEditor({ editing, set }: {
  editing: {
    btn1_text: string; btn1_link: string; btn1_visible: boolean;
    btn2_text: string; btn2_link: string; btn2_visible: boolean;
  };
  set: (key: string, value: string | boolean | number | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">버튼1 텍스트</label>
          <input type="text" value={editing.btn1_text} onChange={(e) => set("btn1_text", e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="컬렉션 보기" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">링크</label>
          <input type="text" value={editing.btn1_link} onChange={(e) => set("btn1_link", e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="/products" />
        </div>
        <label className="flex items-center gap-1.5 pb-2 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={editing.btn1_visible} onChange={(e) => set("btn1_visible", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
          <span className="text-xs text-gray-600">노출</span>
        </label>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">버튼2 텍스트</label>
          <input type="text" value={editing.btn2_text} onChange={(e) => set("btn2_text", e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="브랜드 스토리" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">링크</label>
          <input type="text" value={editing.btn2_link} onChange={(e) => set("btn2_link", e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="/story" />
        </div>
        <label className="flex items-center gap-1.5 pb-2 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={editing.btn2_visible} onChange={(e) => set("btn2_visible", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
          <span className="text-xs text-gray-600">노출</span>
        </label>
      </div>
    </div>
  );
}

// ── 자유 배치 텍스트 캔버스 (다중 텍스트 개체) ──

function newTextLayer(): TextLayer {
  return {
    id: crypto.randomUUID(),
    text: "새 텍스트",
    font_family: "",
    color: "#ffffff",
    weight: 700,
    align: "left",
    letter_spacing: 0,
    scale_x: 1,
    line_height: 1.2,
    opacity: 1,
    bg_color: "",
    pc_x: 8, pc_y: 40, pc_size: 64,
    mobile_x: 8, mobile_y: 40, mobile_size: 40,
  };
}

function TextCanvasEditor({ layers, onChange, pcImage, mobileImage, pcPos, mobilePos, pcScale, mobileScale }: {
  layers: TextLayer[];
  onChange: (next: TextLayer[]) => void;
  pcImage: string; mobileImage: string;
  pcPos: string; mobilePos: string;
  pcScale: number; mobileScale: number;
}) {
  const [mode, setMode] = useState<"pc" | "mobile">("pc");
  const [selId, setSelId] = useState<string | null>(layers[0]?.id ?? null);
  const [editId, setEditId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // 인라인 편집 시작 시 포커스 + 커서를 끝으로
  useEffect(() => {
    if (editId && editRef.current) {
      const el = editRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selc = window.getSelection();
      selc?.removeAllRanges();
      selc?.addRange(range);
    }
  }, [editId]);

  const designW = mode === "pc" ? 1920 : 750;
  const aspectPad = mode === "pc" ? "35.4%" : "92.7%";
  const bg = mode === "pc" ? pcImage : (mobileImage || pcImage);
  const bgPos = mode === "pc" ? pcPos : mobilePos;
  const bgScale = mode === "pc" ? pcScale : mobileScale;

  const getXY = (l: TextLayer) =>
    mode === "pc" ? { x: l.pc_x, y: l.pc_y, size: l.pc_size } : { x: l.mobile_x, y: l.mobile_y, size: l.mobile_size };

  const patch = (id: string, p: Partial<TextLayer>) =>
    onChange(layers.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const patchPos = (id: string, x: number, y: number) =>
    patch(id, mode === "pc" ? { pc_x: x, pc_y: y } : { mobile_x: x, mobile_y: y });
  const patchSize = (id: string, size: number) =>
    patch(id, mode === "pc" ? { pc_size: size } : { mobile_size: size });

  const sel = layers.find((l) => l.id === selId) ?? null;

  const addLayer = () => {
    const l = newTextLayer();
    onChange([...layers, l]);
    setSelId(l.id);
    setEditId(l.id);
  };
  const removeLayer = (id: string) => {
    onChange(layers.filter((l) => l.id !== id));
    if (selId === id) setSelId(null);
  };

  const onLayerMouseDown = (e: React.MouseEvent, l: TextLayer) => {
    e.preventDefault(); e.stopPropagation();
    setSelId(l.id);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    const { x, y } = getXY(l);
    drag.current = { id: l.id, dx: curX - x, dy: curY - y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100 - drag.current.dx));
    const y = Math.max(0, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100 - drag.current.dy));
    patchPos(drag.current.id, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  return (
    <div className="space-y-4">
      {/* PC / 모바일 전환 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["pc", "mobile"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${mode === m ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
              {m === "pc" ? "PC (1920×680)" : "모바일 (750×695)"}
            </button>
          ))}
        </div>
        <button type="button" onClick={addLayer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          + 텍스트 추가
        </button>
      </div>

      {/* 캔버스 미리보기 (모바일은 50% 폭으로 표시) */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-slate-900 select-none"
        style={{
          paddingBottom: aspectPad,
          width: mode === "mobile" ? "50%" : "100%",
          marginInline: mode === "mobile" ? "auto" : undefined,
          containerType: "inline-size",
        }}
        onMouseMove={onMouseMove}
        onMouseUp={() => { drag.current = null; }}
        onMouseLeave={() => { drag.current = null; }}
      >
        <div className="absolute inset-0" onMouseDown={() => { setSelId(null); setEditId(null); }}>
          {bg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: bgPos, transform: `scale(${bgScale || 1})`, transformOrigin: bgPos }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">이미지를 먼저 등록하세요</div>
          )}
          {layers.map((l) => {
            const { x, y, size } = getXY(l);
            const isEditing = editId === l.id;
            return (
              <div
                key={l.id}
                ref={isEditing ? editRef : undefined}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onMouseDown={(e) => { if (isEditing) { e.stopPropagation(); return; } onLayerMouseDown(e, l); }}
                onDoubleClick={(e) => { e.stopPropagation(); setSelId(l.id); setEditId(l.id); }}
                onBlur={(e) => { if (isEditing) { patch(l.id, { text: e.currentTarget.textContent ?? "" }); setEditId(null); } }}
                onKeyDown={(e) => { if (isEditing && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
                className={`absolute outline-offset-2 ${isEditing ? "cursor-text outline-dashed outline-2 outline-blue-300" : "cursor-move"} ${l.id === selId && !isEditing ? "outline outline-2 outline-blue-400" : ""}`}
                style={{
                  left: `${x}%`, top: `${y}%`,
                  fontFamily: l.font_family || undefined,
                  color: l.color,
                  fontWeight: l.weight,
                  textAlign: l.align,
                  letterSpacing: `${l.letter_spacing}px`,
                  lineHeight: l.line_height,
                  opacity: l.opacity ?? 1,
                  fontSize: `${(size / designW * 100).toFixed(2)}cqw`,
                  transform: `scaleX(${l.scale_x})`,
                  transformOrigin: "left top",
                  whiteSpace: "pre-wrap",
                  textShadow: "0 1px 8px rgba(0,0,0,0.25)",
                  ...(l.bg_color ? { backgroundColor: l.bg_color, padding: "0.08em 0.35em" } : {}),
                }}
              >
                {isEditing ? l.text : (l.text || "텍스트")}
              </div>
            );
          })}

          {/* 페이지 넘김(좌우 화살표) 영역 — PC 전용. 이 안쪽엔 텍스트가 가려지므로 배치 금지 */}
          {mode === "pc" && (
            <>
              <div className="absolute inset-y-0 left-0 w-[9%] bg-black/35 border-r border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                <span className="text-white/70 text-[9px] tracking-wide [writing-mode:vertical-rl] rotate-180">넘김 영역</span>
              </div>
              <div className="absolute inset-y-0 right-0 w-[9%] bg-black/35 border-l border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                <span className="text-white/70 text-[9px] tracking-wide [writing-mode:vertical-rl]">넘김 영역</span>
              </div>
            </>
          )}
          <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
            더블클릭해 바로 입력 · 드래그로 이동
          </div>
        </div>
      </div>

      {/* 레이어 목록 */}
      <div className="flex gap-1.5 flex-wrap">
        {layers.length === 0 && <p className="text-xs text-slate-400">텍스트 개체가 없습니다. “+ 텍스트 추가”를 눌러보세요.</p>}
        {layers.map((l, i) => (
          <button key={l.id} type="button" onClick={() => setSelId(l.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border max-w-[160px] transition-colors ${l.id === selId ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            <span className="truncate">{i + 1}. {l.text || "(빈 텍스트)"}</span>
            <span onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
              className={`flex-shrink-0 leading-none ${l.id === selId ? "text-white/70 hover:text-white" : "text-slate-300 hover:text-red-500"}`}>×</span>
          </button>
        ))}
      </div>

      {/* 선택 개체 편집 패널 */}
      {sel && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-600">선택한 텍스트 스타일</p>
            <button type="button" onClick={() => { setSelId(sel.id); setEditId(sel.id); }}
              className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100">이미지에서 직접 편집 ✎</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">폰트</label>
              <select value={sel.font_family} onChange={(e) => patch(sel.id, { font_family: e.target.value })}
                className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded bg-white focus:outline-none focus:border-[#1A2B4A]">
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">크기 ({mode === "pc" ? "PC" : "모바일"}) · {getXY(sel).size}px</label>
              <input type="range" min={12} max={mode === "pc" ? 240 : 140} value={getXY(sel).size}
                onChange={(e) => patchSize(sel.id, Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">색상</label>
              <div className="flex items-center gap-2">
                <input type="color" value={sel.color} onChange={(e) => patch(sel.id, { color: e.target.value })}
                  className="w-9 h-8 border border-gray-200 rounded cursor-pointer p-0.5" />
                <input type="text" value={sel.color} onChange={(e) => patch(sel.id, { color: e.target.value })}
                  className="flex-1 border border-gray-200 px-2 py-1.5 text-xs rounded font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">굵기 · 정렬</label>
              <div className="flex gap-1">
                {[400, 700, 900].map((w) => (
                  <button key={w} type="button" onClick={() => patch(sel.id, { weight: w })}
                    className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${sel.weight === w ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}
                    style={{ fontWeight: w }}>{w === 400 ? "보통" : w === 700 ? "굵게" : "더굵게"}</button>
                ))}
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} type="button" onClick={() => patch(sel.id, { align: a })}
                    className={`w-7 py-1.5 text-[11px] rounded border transition-colors ${sel.align === a ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
                    {a === "left" ? "↤" : a === "center" ? "↔" : "↦"}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">자간 · {sel.letter_spacing}px</label>
              <input type="range" min={-10} max={30} step={0.5} value={sel.letter_spacing}
                onChange={(e) => patch(sel.id, { letter_spacing: Number(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 mt-2" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">장평 · {Math.round(sel.scale_x * 100)}%</label>
              <input type="range" min={0.5} max={1.5} step={0.01} value={sel.scale_x}
                onChange={(e) => patch(sel.id, { scale_x: Number(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 mt-2" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">줄간격 · {sel.line_height.toFixed(2)}</label>
              <input type="range" min={0.9} max={2} step={0.05} value={sel.line_height}
                onChange={(e) => patch(sel.id, { line_height: Number(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 mt-2" />
            </div>
          </div>

          {/* 투명도 · 배경 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">투명도 · {Math.round((sel.opacity ?? 1) * 100)}%</label>
              <input type="range" min={0.1} max={1} step={0.01} value={sel.opacity ?? 1}
                onChange={(e) => patch(sel.id, { opacity: Number(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 mt-2" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">배경색</label>
              <div className="flex items-center gap-2">
                <input type="color" value={sel.bg_color || "#000000"} onChange={(e) => patch(sel.id, { bg_color: e.target.value })}
                  className="w-9 h-8 border border-gray-200 rounded cursor-pointer p-0.5" />
                <button type="button" onClick={() => patch(sel.id, { bg_color: "" })}
                  className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${!sel.bg_color ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>없음(투명)</button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">크기·위치는 PC/모바일 각각 따로 저장됩니다. 상단 탭으로 전환해 모바일도 배치하세요.</p>
        </div>
      )}
    </div>
  );
}

// ── AI 이미지 프롬프트 빌더 ──

const VISUAL_SHOT_TYPES = {
  full:   { ko: "전신",   en: "full body" },
  half:   { ko: "반신",   en: "half body" },
  bust:   { ko: "흉상",   en: "bust shot" },
  detail: { ko: "디테일", en: "detail shot" },
  group:  { ko: "그룹",   en: "group shot" },
} as const;
type VisualShotKey = keyof typeof VISUAL_SHOT_TYPES;

const VISUAL_SEASON_ENG: Record<string, string> = {
  봄: "spring season, soft natural light, cherry blossoms",
  여름: "summer, bright sunshine, outdoor",
  가을: "autumn, warm golden tones, fall foliage",
  겨울: "winter, cold crisp atmosphere",
  전천후: "",
};

const VISUAL_EXTRA_PRESETS = ["실외 자연광", "실내 스튜디오", "도심 배경", "작업 현장", "캐주얼 분위기", "역동적인 포즈"];

function buildVisualPrompt(
  clothingType: "작업복" | "일상복",
  season: string,
  extras: string[],
  shotType: VisualShotKey,
  customInput: string,
  description: string,
  title?: string,
  subtitle?: string
): string {
  const clothingEng = clothingType === "작업복" ? "professional workwear, functional clothing" : "casual everyday wear";
  const seasonCtx = VISUAL_SEASON_ENG[season] || "";
  const allExtras = [...extras, customInput].filter(Boolean).join(", ");
  const textCtx = [title, subtitle].filter(Boolean).join(" – ");
  const descCtx = description.trim();
  return [
    `A professional fashion photograph for a Korean apparel brand hero banner, ultra-wide 16:9 format.`,
    descCtx && `Scene: ${descCtx}.`,
    `${VISUAL_SHOT_TYPES[shotType].en} shot of a model wearing high-quality ${clothingEng}.`,
    seasonCtx && `${seasonCtx}.`,
    allExtras && `${allExtras}.`,
    textCtx && `Brand message: "${textCtx}".`,
    `Editorial fashion photography style, clean modern composition, high resolution, suitable for website hero banner.`,
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function VisualPromptBuilder({ title, subtitle, pcImageUrl }: {
  title: string; subtitle: string; pcImageUrl?: string;
}) {
  const [shotType, setShotType] = useState<VisualShotKey>("full");
  const [clothingType, setClothingType] = useState<"작업복" | "일상복">("작업복");
  const [season, setSeason] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setPrompt(buildVisualPrompt(clothingType, season, extras, shotType, customInput, description, title, subtitle));
  };

  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleExtra = (v: string) =>
    setExtras((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      {/* 생성 버튼 (상단) */}
      <button type="button" onClick={generate}
        className="w-full py-2.5 mb-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
        ✨ 이미지 프롬프트 생성
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 좌측: 옵션 */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">PC 1920×680</span>
            <span className="text-[11px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">모바일 750×695</span>
          </div>

          {/* 이미지 설명 (한 줄) */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">이미지 설명 <span className="font-normal text-slate-400">— 장면을 간략히</span></p>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 해질녘 도심 옥상, 바람 맞는 모델"
              className="w-full border border-slate-200 px-3 py-2 text-xs text-slate-700 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>

          {/* 의류 유형 + 시즌 (한 줄) */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">의류 유형</p>
              <div className="flex gap-1.5">
                {(["작업복", "일상복"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setClothingType(t)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${clothingType === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">시즌</p>
              <div className="flex gap-1.5 flex-wrap">
                {["봄", "여름", "가을", "겨울", "전천후"].map((s) => (
                  <button key={s} type="button" onClick={() => setSeason(season === s ? "" : s)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${season === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 추가 옵션 */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">추가 옵션</p>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {VISUAL_EXTRA_PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => toggleExtra(p)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${extras.includes(p) ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{p}</button>
              ))}
            </div>
            <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
              placeholder="직접 입력 후 Enter"
              className="w-full border border-slate-200 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-blue-400"
              onKeyDown={(e) => { if (e.key === "Enter" && customInput.trim()) { e.preventDefault(); toggleExtra(customInput.trim()); setCustomInput(""); } }} />
          </div>

          {/* 촬영 구도 (한글) */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">촬영 구도</p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(VISUAL_SHOT_TYPES) as VisualShotKey[]).map((k) => (
                <button key={k} type="button" onClick={() => setShotType(k)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${shotType === k ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{VISUAL_SHOT_TYPES[k].ko}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 생성된 프롬프트 (남는 공간) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-slate-600">생성된 프롬프트</p>
            {prompt && (
              <button type="button" onClick={copy}
                className={`text-[11px] px-3 py-1 rounded-lg border transition-colors ${copied ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                {copied ? "복사됨!" : "복사"}
              </button>
            )}
          </div>
          {prompt ? (
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full flex-1 min-h-[180px] border border-slate-200 px-3 py-2.5 text-xs text-slate-700 rounded-lg focus:outline-none focus:border-blue-400 resize-none bg-white" />
          ) : (
            <div className="w-full flex-1 min-h-[180px] border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-center text-[11px] text-slate-400 px-4 leading-relaxed">
              왼쪽 옵션을 고르고 위의<br />‘이미지 프롬프트 생성’을 누르면<br />여기에 프롬프트가 표시됩니다.
            </div>
          )}
          {prompt && pcImageUrl && (
            <p className="text-[10px] text-slate-400 mt-1.5">* 프롬프트와 함께 현재 PC 이미지를 참고 이미지로 활용하세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
