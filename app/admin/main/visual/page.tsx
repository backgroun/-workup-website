"use client";
import { useState, useEffect, useRef } from "react";

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
  content_x: number;
  content_y: number;
  is_visible: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  sort_order: number;
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
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [useSchedule, setUseSchedule] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [btnOpen, setBtnOpen] = useState(false);
  const [sameImage, setSameImage] = useState(false);
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
      const res = await fetch("/api/admin/hero-slides");
      if (!res.ok) { setFetchError(true); setLoading(false); return; }
      const data = await res.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (text: string, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const openNew = () => {
    setEditing({ id: "", ...EMPTY, sort_order: slides.length });
    setIsNew(true);
    setUseSchedule(false);
    setTextOpen(false);
    setBtnOpen(false);
    setSameImage(false);
    setPromptOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing({ ...slide });
    setIsNew(false);
    setUseSchedule(!!(slide.scheduled_start || slide.scheduled_end));
    setTextOpen(!!(slide.season_text || slide.title || slide.subtitle));
    setBtnOpen(!!(slide.btn1_text || slide.btn2_text));
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

  const set = (key: keyof HeroSlide, value: string | boolean | number | null) => {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">메인 비주얼</h1>
          <p className="text-base text-gray-400 mt-1">메인 페이지 히어로 슬라이드 관리 <span className="font-semibold text-gray-600">({slides.length} / 10개)</span></p>
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
          <pre className="text-xs bg-white p-3 border border-amber-200 rounded overflow-x-auto text-gray-700 whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS hero_slides (
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
-- 기존 테이블 업데이트
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS admin_title TEXT NOT NULL DEFAULT '';`}</pre>
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
                className={`flex items-center gap-4 px-5 py-3.5 cursor-grab active:cursor-grabbing transition-colors ${
                  editing?.id === slide.id ? "bg-blue-50" : "hover:bg-slate-50"
                } ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}
              >
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                </svg>

                <span className="text-xs font-medium text-slate-400 w-5 text-center flex-shrink-0">{i + 1}</span>

                <div className="w-28 h-16 flex-shrink-0 bg-slate-100 overflow-hidden rounded-lg">
                  {slide.pc_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.pc_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <span className="text-white/30 text-xs font-bold">WU</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {slide.admin_title || slide.title || "(제목 없음)"}
                  </p>
                  {(slide.scheduled_start || slide.scheduled_end) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      예약: {fmtDate(slide.scheduled_start) ?? "∞"} ~ {fmtDate(slide.scheduled_end) ?? "∞"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => toggleVisible(slide)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${slide.is_visible ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slide.is_visible ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={`text-xs w-8 flex-shrink-0 font-medium ${slide.is_visible ? "text-blue-600" : "text-slate-400"}`}>
                  {slide.is_visible ? "ON" : "OFF"}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(slide)}
                    className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 hover:bg-slate-100 transition-colors rounded-md">
                    수정
                  </button>
                  <button onClick={() => handleDelete(slide.id, slide.admin_title || slide.title)}
                    className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors rounded-md">
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>{/* end slide list card */}
      </div>{/* end left col */}

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
            {editing.pc_image_url && (
              <ImagePositionPicker
                label="PC 이미지 위치"
                imageUrl={editing.pc_image_url}
                value={editing.pc_image_position || "50% 50%"}
                onChange={(v) => set("pc_image_position", v)}
              />
            )}

            {!sameImage && (
              <>
                <ImageField
                  label="모바일 이미지"
                  hint="권장: 750 × 695px · JPG/PNG · 1MB 이하 · 미입력 시 PC 이미지로 대체"
                  value={editing.mobile_image_url}
                  onChange={(v) => set("mobile_image_url", v)}
                  uploading={uploading === "mobile"}
                  onUpload={(file) => uploadImage(file, "mobile")}
                  inputRef={mobileRef}
                />
                {(editing.mobile_image_url || editing.pc_image_url) && (
                  <ImagePositionPicker
                    label="모바일 이미지 위치"
                    imageUrl={editing.mobile_image_url || editing.pc_image_url}
                    value={editing.mobile_image_position || "50% 50%"}
                    onChange={(v) => set("mobile_image_position", v)}
                  />
                )}
              </>
            )}

            {sameImage && editing.pc_image_url && (
              <ImagePositionPicker
                label="모바일 표시 위치 (PC와 별도 조정)"
                imageUrl={editing.pc_image_url}
                value={editing.mobile_image_position || "50% 50%"}
                onChange={(v) => set("mobile_image_position", v)}
              />
            )}
          </div>

          {/* 3. 노출 설정 */}
          <div className="pb-6 border-b border-gray-100 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">노출 설정</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.is_visible}
                onChange={(e) => set("is_visible", e.target.checked)}
                className="w-4 h-4 accent-[#1A2B4A]"
              />
              <span className="text-sm text-gray-700">노출 여부</span>
            </label>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
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
                <span className="text-xs text-gray-400">설정한 기간에만 자동 노출/숨김</span>
              </label>
              {useSchedule && (
                <div className="grid grid-cols-2 gap-4 pl-6">
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
          </div>

          {/* 4. 텍스트 (접기/펼치기) */}
          <div className="pb-6 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setTextOpen((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                텍스트
                <span className="normal-case font-normal text-gray-400 tracking-normal ml-2">— 생략 가능</span>
              </span>
              <span className={`text-gray-400 transition-transform text-sm ${textOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {textOpen && (
              <div className="space-y-4 mt-4">
                <Field label="시즌 문구" optional>
                  <input type="text" value={editing.season_text} onChange={(e) => set("season_text", e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                    placeholder="2026 Summer Collection" />
                </Field>
                <Field label="메인 타이틀" optional>
                  <input type="text" value={editing.title} onChange={(e) => set("title", e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                    placeholder="일하는 사람이 제일 멋있다." />
                </Field>
                <Field label="서브 문구" optional>
                  <textarea value={editing.subtitle} onChange={(e) => set("subtitle", e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] resize-none rounded"
                    placeholder="워크업은 일하는 사람 편에서 만든 옷입니다." />
                </Field>
              </div>
            )}
          </div>

          {/* 5. 버튼 (접기/펼치기) */}
          <div className="pb-6 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setBtnOpen((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                버튼
                <span className="normal-case font-normal text-gray-400 tracking-normal ml-2">— 생략 가능</span>
              </span>
              <span className={`text-gray-400 transition-transform text-sm ${btnOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {btnOpen && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <Field label="버튼1 텍스트" optional>
                    <input type="text" value={editing.btn1_text} onChange={(e) => set("btn1_text", e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="컬렉션 보기" />
                  </Field>
                  <Field label="버튼1 링크">
                    <input type="text" value={editing.btn1_link} onChange={(e) => set("btn1_link", e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="/products" />
                  </Field>
                  <label className="flex items-center gap-1.5 pb-2 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={editing.btn1_visible} onChange={(e) => set("btn1_visible", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
                    <span className="text-xs text-gray-600">노출</span>
                  </label>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <Field label="버튼2 텍스트" optional>
                    <input type="text" value={editing.btn2_text} onChange={(e) => set("btn2_text", e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="브랜드 스토리" />
                  </Field>
                  <Field label="버튼2 링크">
                    <input type="text" value={editing.btn2_link} onChange={(e) => set("btn2_link", e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" placeholder="/story" />
                  </Field>
                  <label className="flex items-center gap-1.5 pb-2 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={editing.btn2_visible} onChange={(e) => set("btn2_visible", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
                    <span className="text-xs text-gray-600">노출</span>
                  </label>
                </div>
              </div>
            )}
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
      </div>{/* end right col */}
      </div>{/* end flex container */}
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

// ── 이미지 위치 조절 ──

function ImagePositionPicker({ label, imageUrl, value, onChange }: {
  label: string; imageUrl: string; value: string;
  onChange: (v: string) => void;
}) {
  const parts = value.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  const x = parts ? Math.round(parseFloat(parts[1])) : 50;
  const y = parts ? Math.round(parseFloat(parts[2])) : 50;

  const update = (nx: number, ny: number) => onChange(`${nx}% ${ny}%`);

  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <div className="relative w-full h-28 rounded overflow-hidden border border-slate-200 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="w-full h-full object-cover"
          style={{ objectPosition: value }} />
        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
          {x}% / {y}%
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>가로 위치</span><span className="font-medium">{x}%</span>
          </div>
          <input type="range" min={0} max={100} value={x}
            onChange={(e) => update(parseInt(e.target.value), y)}
            className="w-full accent-slate-700 h-1.5" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>왼쪽</span><span>오른쪽</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>세로 위치</span><span className="font-medium">{y}%</span>
          </div>
          <input type="range" min={0} max={100} value={y}
            onChange={(e) => update(x, parseInt(e.target.value))}
            className="w-full accent-slate-700 h-1.5" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>위</span><span>아래</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI 이미지 프롬프트 빌더 ──

const VISUAL_SHOT_TYPES = {
  full: "전신 (Full Body)",
  half: "반신 (Half Body)",
  bust: "흉상 (Bust Shot)",
  detail: "디테일 (Detail Shot)",
  group: "그룹 (Group Shot)",
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
  title?: string,
  subtitle?: string
): string {
  const clothingEng = clothingType === "작업복" ? "professional workwear, functional clothing" : "casual everyday wear";
  const seasonCtx = VISUAL_SEASON_ENG[season] || "";
  const allExtras = [...extras, customInput].filter(Boolean).join(", ");
  const textCtx = [title, subtitle].filter(Boolean).join(" – ");
  return [
    `A professional fashion photograph for a Korean apparel brand hero banner, ultra-wide 16:9 format.`,
    `${VISUAL_SHOT_TYPES[shotType]} shot of a model wearing high-quality ${clothingEng}.`,
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
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setPrompt(buildVisualPrompt(clothingType, season, extras, shotType, customInput, title, subtitle));
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
    <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">PC: 1920 × 680px</span>
        <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">모바일: 750 × 695px</span>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">의류 유형</p>
        <div className="flex gap-2">
          {(["작업복", "일상복"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setClothingType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${clothingType === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">시즌</p>
        <div className="flex gap-2 flex-wrap">
          {["봄", "여름", "가을", "겨울", "전천후"].map((s) => (
            <button key={s} type="button" onClick={() => setSeason(season === s ? "" : s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${season === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">추가 옵션</p>
        <div className="flex gap-2 flex-wrap mb-2">
          {VISUAL_EXTRA_PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => toggleExtra(p)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${extras.includes(p) ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {p}
            </button>
          ))}
        </div>
        <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
          placeholder="직접 입력 후 Enter"
          className="w-full border border-slate-200 px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-blue-400"
          onKeyDown={(e) => {
            if (e.key === "Enter" && customInput.trim()) {
              e.preventDefault();
              toggleExtra(customInput.trim());
              setCustomInput("");
            }
          }}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">촬영 구도</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(VISUAL_SHOT_TYPES) as VisualShotKey[]).map((k) => (
            <button key={k} type="button" onClick={() => setShotType(k)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${shotType === k ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {VISUAL_SHOT_TYPES[k]}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={generate}
        className="w-full py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
        이미지 프롬프트 생성
      </button>

      {prompt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">생성된 프롬프트</p>
            <button type="button" onClick={copy}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${copied ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
            className="w-full border border-slate-200 px-3 py-2.5 text-xs text-slate-700 rounded-lg focus:outline-none focus:border-blue-400 resize-none bg-white" />
          {pcImageUrl && (
            <p className="text-xs text-slate-400">* 생성된 프롬프트와 함께 현재 PC 이미지를 참고 이미지로 활용하세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
