"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { bgColorWithAlpha } from "@/lib/color";

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
  pc_video_url: string;
  mobile_video_url: string;
  video_duration: number | null;       // 동영상 노출 시간(초). null이면 영상 재생 종료 시 자동 전환
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
  btn1_visible: false,
  btn2_text: "",
  btn2_link: "/",
  btn2_visible: false,
  pc_image_url: "",
  mobile_image_url: "",
  pc_video_url: "",
  mobile_video_url: "",
  video_duration: null,
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
  const [mediaTab, setMediaTab] = useState<"image" | "video">("image"); // 슬라이드 미디어 모드(이미지/동영상)
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
    setMediaTab("image");
    setPromptOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing({ ...slide });
    setIsNew(false);
    setUseSchedule(!!(slide.scheduled_start || slide.scheduled_end));
    setSameImage(!!(slide.pc_image_url && slide.pc_image_url === slide.mobile_image_url));
    setMediaTab(slide.pc_video_url ? "video" : "image");
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
      // 미디어 모드에 따라 한쪽만 저장 (이미지 모드면 동영상 null, 동영상 모드면 이미지 null)
      pc_image_url: mediaTab === "video" ? null : (editing.pc_image_url || null),
      mobile_image_url: mediaTab === "video" ? null : (sameImage ? (editing.pc_image_url || null) : (editing.mobile_image_url || null)),
      pc_video_url: mediaTab === "video" ? (editing.pc_video_url || null) : null,
      mobile_video_url: mediaTab === "video" ? (editing.mobile_video_url || null) : null,
      video_duration: mediaTab === "video" ? (editing.video_duration || null) : null,
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

  const handleDuplicate = async (slide: HeroSlide) => {
    const payload = {
      ...slide,
      id: crypto.randomUUID(),
      admin_title: `${slide.admin_title || slide.title || "슬라이드"} (복사본)`,
      sort_order: slides.length,
      pc_image_url: slide.pc_image_url || null,
      mobile_image_url: slide.mobile_image_url || null,
      scheduled_start: slide.scheduled_start || null,
      scheduled_end: slide.scheduled_end || null,
    };
    const res = await fetch("/api/admin/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { flash("복제됐습니다."); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "복제 실패", "err"); }
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

  // 동영상 직접 업로드(브라우저 → Cloudinary, resource_type video) — 대용량 우회
  const uploadVideo = async (file: File, field: "pc" | "mobile") => {
    if (file.size > 100 * 1024 * 1024) { flash("동영상이 너무 큽니다 (100MB 이하 · 짧고 압축된 영상 권장)", "err"); return; }
    setUploading(field);
    try {
      const sig = await fetch("/api/admin/cloudinary-sign", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "workup/videos" }),
      }).then((r) => r.json());
      if (!sig?.signature) { flash("서명 발급 실패 (로그인 확인)", "err"); setUploading(null); return; }
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("folder", sig.folder);
      form.append("signature", sig.signature);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`, { method: "POST", body: form }).then((r) => r.json());
      if (up.error) { flash(`업로드 실패: ${up.error.message ?? ""}`, "err"); return; }
      setEditing((prev) => prev ? { ...prev, [field === "pc" ? "pc_video_url" : "mobile_video_url"]: up.secure_url } : prev);
    } catch {
      flash("업로드 실패 (네트워크/용량 확인)", "err");
    } finally {
      setUploading(null);
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
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">슬라이딩 메뉴</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              홈·상품 상단에 노출되는 히어로 배너를 관리합니다.
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{slides.length} / 10</span>
            </p>
          </div>
          <button
            onClick={openNew}
            disabled={slides.length >= 10}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-blue-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            슬라이드 추가
          </button>
        </div>

        {/* 슬라이딩 메뉴 타입 탭 */}
        <div className="flex gap-1 mt-5 bg-slate-100 rounded-xl p-1 w-fit">
          {(Object.entries(SLIDE_TYPE_LABELS) as [SlideType, string][]).map(([type, label]) => (
            <button
              key={type}
              onClick={() => { router.push(`/admin/main/visual${type === "main" ? "" : `?type=${type}`}`); }}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                slideType === type
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
      <div className="w-[360px] flex-shrink-0 sticky top-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">슬라이드 목록</h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" /></svg>
            드래그로 순서 변경
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            불러오는 중...
          </div>
        ) : slides.length === 0 && !editing ? (
          <div className="py-16 text-center text-slate-400 text-sm">
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
                className={`group px-3 py-3 cursor-grab active:cursor-grabbing transition-colors ${
                  editing?.id === slide.id ? "bg-blue-50/70" : "hover:bg-slate-50"
                } ${dragOver === i && dragIndex !== i ? "ring-2 ring-inset ring-orange-300 bg-orange-50/60" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  {/* 드래그 핸들 */}
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 flex-shrink-0 mt-2.5 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>

                  {/* 썸네일 */}
                  <div className="w-[72px] h-11 flex-shrink-0 bg-slate-100 overflow-hidden rounded-lg ring-1 ring-slate-200">
                    {slide.pc_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slide.pc_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <span className="text-white/40 text-[9px] font-bold tracking-wider">WU</span>
                      </div>
                    )}
                  </div>

                  {/* 제목 + 노출 토글 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 min-w-0 text-[13px] font-semibold text-slate-800 truncate">
                        {slide.admin_title || slide.title || "(제목 없음)"}
                      </p>
                      <button
                        onClick={() => toggleVisible(slide)}
                        title={slide.is_visible ? "노출 중 — 클릭하면 숨김" : "숨김 — 클릭하면 노출"}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${slide.is_visible ? "bg-emerald-500" : "bg-slate-200"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${slide.is_visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${slide.is_visible ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="text-[11px] font-medium text-slate-400">{slide.is_visible ? "노출 중" : "숨김"}</span>
                      {(slide.scheduled_start || slide.scheduled_end) && (
                        <span className="text-[11px] text-slate-400 truncate">
                          · {fmtDate(slide.scheduled_start) ?? "∞"} ~ {fmtDate(slide.scheduled_end) ?? "∞"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 수정 · 복제 · 삭제 */}
                <div className="flex items-center gap-1.5 mt-2.5 pl-[26px]">
                  <button onClick={() => openEdit(slide)}
                    className="flex-1 text-[11px] font-semibold text-slate-700 border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-100 hover:border-slate-300 transition-colors rounded-lg">
                    수정
                  </button>
                  <button onClick={() => handleDuplicate(slide)} title="복제"
                    className="text-[11px] font-semibold text-blue-600 border border-blue-200 bg-white px-2.5 py-1.5 hover:bg-blue-50 transition-colors rounded-lg">
                    복제
                  </button>
                  <button onClick={() => handleDelete(slide.id, slide.admin_title || slide.title)}
                    className="text-[11px] font-semibold text-red-500 border border-red-200 bg-white px-2.5 py-1.5 hover:bg-red-50 transition-colors rounded-lg">
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
        <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="sticky top-0 z-20 px-5 py-3.5 bg-slate-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
              {(["image", "video"] as const).map((m) => (
                <button key={m} onClick={() => setMediaTab(m)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                    mediaTab === m
                      ? (m === "video" ? "bg-[#ff550c] text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : "text-white/55 hover:text-white"
                  }`}>
                  {m === "image" ? "이미지 슬라이드" : "동영상 슬라이드"}{isNew ? " 추가" : ""}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-500 hover:bg-blue-400 active:scale-[0.98] text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm">
                {saving ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
                ) : "저장"}
              </button>
              <button onClick={() => setEditing(null)} title="닫기"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6 md:p-7 space-y-7">

          {/* 노출 설정 (최상단) */}
          <div className="pb-7 border-b border-slate-100 space-y-4">
            <SectionTitle title="노출 설정" accent="bg-emerald-500" desc="사이트에 보일지, 특정 기간에만 보일지 설정합니다." />
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={editing.is_visible}
                  onChange={(e) => set("is_visible", e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm font-semibold text-slate-700">노출 여부</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 hover:border-slate-300 transition-colors">
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
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700">예약 노출</span>
                <span className="text-xs text-slate-400">설정 기간에만 자동 노출/숨김</span>
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

          {/* 관리용 타이틀 (기획 컨셉) + AI 자동 생성 */}
          <div className="pb-7 border-b border-slate-100 space-y-4">
            <Field label="관리용 타이틀 (기획 컨셉)" hint="목록 식별용 + AI 생성의 기준. 실제 화면에 표시되지 않음.">
              <input
                type="text"
                value={editing.admin_title}
                onChange={(e) => set("admin_title", e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded"
                placeholder="예: 2026 여름 — 그늘에서 쉬는 현장 작업자"
              />
            </Field>

            <VisualConceptGenerator
              concept={editing.admin_title}
              currentLayers={editing.text_layers ?? []}
              onChangeLayers={(next) => set("text_layers", next)}
            />
          </div>

          {/* 동영상 (동영상 슬라이드 전용) */}
          {mediaTab === "video" && (
            <div className="pb-7 border-b border-slate-100 space-y-4">
              <SectionTitle title="동영상 (PC · 모바일)" accent="bg-[#ff550c]" desc="권장: 짧은 루프 · MP4 · 압축본(수 MB). 모바일 미입력 시 PC 동영상으로 대체됩니다." />
              <VideoField label="PC 동영상" value={editing.pc_video_url} uploading={uploading === "pc"} onUpload={(f) => uploadVideo(f, "pc")} onClear={() => set("pc_video_url", "")} />
              <VideoField label="모바일 동영상 (선택)" value={editing.mobile_video_url} uploading={uploading === "mobile"} onUpload={(f) => uploadVideo(f, "mobile")} onClear={() => set("mobile_video_url", "")} />
              {(editing.pc_video_url || editing.mobile_video_url) && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <VideoPositionPicker label="PC 위치·크기" videoUrl={editing.pc_video_url || editing.mobile_video_url} value={editing.pc_image_position || "50% 50%"} onChange={(v) => set("pc_image_position", v)} scale={editing.pc_image_scale ?? 1} onScaleChange={(v) => set("pc_image_scale", v)} aspect="pc" />
                  <VideoPositionPicker label="모바일 위치·크기" videoUrl={editing.mobile_video_url || editing.pc_video_url} value={editing.mobile_image_position || "50% 50%"} onChange={(v) => set("mobile_image_position", v)} scale={editing.mobile_image_scale ?? 1} onScaleChange={(v) => set("mobile_image_scale", v)} aspect="mobile" />
                </div>
              )}
            </div>
          )}

          {/* AI 이미지 프롬프트 (이미지 슬라이드 전용) */}
          {mediaTab !== "video" && (
          <div className="pb-7 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setPromptOpen((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-indigo-500" />
                <span className="text-[15px] font-bold text-slate-800 tracking-tight">AI 이미지 프롬프트</span>
                <span className="text-xs font-medium text-slate-400">— 생략 가능</span>
              </span>
              <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 group-hover:bg-slate-100 transition-all text-xs ${promptOpen ? "rotate-180" : ""}`}>▼</span>
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
          )}

          {/* 2. 이미지 (이미지 슬라이드 전용) */}
          {mediaTab !== "video" && (
          <div className="pb-7 border-b border-slate-100 space-y-5">
            <SectionTitle
              title="이미지"
              accent="bg-blue-500"
              desc="PC·모바일에 노출할 배경 이미지를 등록하고 위치를 잡습니다."
              right={
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 hover:border-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={sameImage}
                    onChange={(e) => {
                      setSameImage(e.target.checked);
                      if (e.target.checked) set("mobile_image_url", "");
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs font-semibold text-slate-600">PC · 모바일 동일 이미지</span>
                </label>
              }
            />

            <ImageField
              label={sameImage ? "PC · 모바일 공통 이미지" : "PC 메인 이미지"}
              hint={sameImage ? "권장: 1920 × 695px · JPG/PNG · 2MB 이하" : "권장: 1920 × 680px · JPG/PNG · 2MB 이하"}
              value={editing.pc_image_url}
              onChange={(v) => {
                set("pc_image_url", v);
                // PC(메인) 이미지를 제거하면 모바일 이미지도 함께 제거 — 한쪽만 남는 것 방지
                if (!v) set("mobile_image_url", "");
              }}
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
          )}

          {/* 자유 배치 텍스트 캔버스 */}
          <div className="pb-7 border-b border-slate-100">
            <SectionTitle title="텍스트 캔버스" accent="bg-violet-500" desc="여러 텍스트를 드래그로 자유 배치 · 폰트·색·자간·장평을 조절합니다." />
            <TextCanvasEditor
              layers={editing.text_layers ?? []}
              onChange={(next) => set("text_layers", next)}
              pcImage={editing.pc_image_url}
              mobileImage={editing.mobile_image_url || editing.pc_image_url}
              pcVideo={editing.pc_video_url}
              mobileVideo={editing.mobile_video_url || editing.pc_video_url}
              pcPos={editing.pc_image_position || "50% 50%"}
              mobilePos={editing.mobile_image_position || "50% 50%"}
              pcScale={editing.pc_image_scale ?? 1}
              mobileScale={editing.mobile_image_scale ?? 1}
            />
          </div>

          {/* 저장/취소 */}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm shadow-blue-600/20">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
              ) : "저장하기"}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-6 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              취소
            </button>
          </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <p className="font-medium text-slate-500">목록에서 슬라이드를 선택하거나 새 슬라이드를 추가하세요.</p>
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
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {optional && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">생략가능</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

// ── 공통 섹션 헤더 (컬러 액센트 바 + 제목 + 보조설명) ──
function SectionTitle({ title, desc, accent = "bg-blue-500", right }: {
  title: string; desc?: string; accent?: string; right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className={`w-1 h-4 rounded-full ${accent}`} />
          <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        {desc && <p className="text-xs text-slate-400 mt-1.5 ml-3">{desc}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

function ImageField({ label, hint, value, onChange, uploading, onUpload, inputRef }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; uploading: boolean;
  onUpload: (file: File) => void; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>

      <div className="flex items-stretch gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap rounded-lg">
          {uploading ? (
            <><span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />업로드 중</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>파일 선택</>
          )}
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="또는 이미지 URL 직접 입력 (https://...)"
          className="flex-1 min-w-0 border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 rounded-lg transition-colors"
        />
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="flex-shrink-0 px-3 py-2.5 text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">
            제거
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 object-cover border border-slate-200 rounded-lg" />
      )}
    </div>
  );
}

// ── 동영상 업로드 필드 (직접 Cloudinary 업로드) ──

function VideoField({ label, value, uploading, onUpload, onClear }: {
  label: string; value: string; uploading: boolean; onUpload: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">
          {uploading ? "업로드 중..." : value ? "동영상 교체" : "동영상 선택"}
        </button>
        {value && <button type="button" onClick={onClear} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 rounded-lg">제거</button>}
      </div>
      <input ref={ref} type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      {value && (
        <video src={value} muted loop autoPlay playsInline className="w-48 rounded border border-gray-100" />
      )}
    </div>
  );
}

// ── 동영상 위치 조절 (모바일 노출 뷰에 맞게 위치·크기 드래그) ──

function VideoPositionPicker({ label, videoUrl, value, onChange, scale, onScaleChange, aspect }: {
  label: string; videoUrl: string; value: string;
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
      <div
        ref={boxRef}
        className="relative w-full rounded overflow-hidden border border-slate-200 bg-slate-800 cursor-move select-none"
        style={{ paddingBottom: aspectPad }}
        onMouseDown={(e) => { dragging.current = true; setFromEvent(e); }}
        onMouseMove={(e) => { if (dragging.current) setFromEvent(e); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
      >
        <video
          src={videoUrl}
          muted loop autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: value, transform: `scale(${s})`, transformOrigin: value }}
        />
        <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">드래그로 위치 이동</div>
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">크기 {pct}% · {x}/{y}</div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold text-slate-600">영상 크기</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min={0.5} max={3} step={0.01} value={s}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))} className="flex-1 accent-blue-600 h-1.5" />
          <button type="button" onClick={() => onScaleChange(1)} className="text-[10px] text-slate-400 hover:text-slate-600 whitespace-nowrap">초기화</button>
        </div>
      </div>
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

function TextCanvasEditor({ layers, onChange, pcImage, mobileImage, pcVideo, mobileVideo, pcPos, mobilePos, pcScale, mobileScale }: {
  layers: TextLayer[];
  onChange: (next: TextLayer[]) => void;
  pcImage: string; mobileImage: string;
  pcVideo: string; mobileVideo: string;
  pcPos: string; mobilePos: string;
  pcScale: number; mobileScale: number;
}) {
  const [mode, setMode] = useState<"pc" | "mobile">("pc");
  const [selIds, setSelIds] = useState<Set<string>>(() => new Set(layers[0]?.id ? [layers[0].id] : []));
  const [editId, setEditId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const containerRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{
    primaryId: string;
    dx: number; dy: number;
    origins: Record<string, { x: number; y: number }>;
  } | null>(null);

  // 가용 영역(넘김 영역 제외) — PC는 좌우 9%씩 제외, 모바일은 전체
  const CANVAS_X = mode === "pc" ? { min: 9, max: 89 } : { min: 0, max: 98 };
  const CANVAS_Y = { min: 0, max: 96 };
  const SNAP_THRESHOLD = 1.5; // % 단위
  const GRID_STEP = 10; // %

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
  const aspectRatio = mode === "pc" ? "1920 / 680" : "750 / 695";
  const bg = mode === "pc" ? pcImage : (mobileImage || pcImage);
  const bgVideo = mode === "pc" ? pcVideo : (mobileVideo || pcVideo);
  const bgPos = mode === "pc" ? pcPos : mobilePos;
  const bgScale = mode === "pc" ? pcScale : mobileScale;

  const getXY = (l: TextLayer) =>
    mode === "pc" ? { x: l.pc_x, y: l.pc_y, size: l.pc_size } : { x: l.mobile_x, y: l.mobile_y, size: l.mobile_size };

  const patch = (id: string, p: Partial<TextLayer>) =>
    onChange(layers.map((l) => (l.id === id ? { ...l, ...p } : l)));
  // 선택된 모든 레이어에 일괄 적용
  const patchAll = (p: Partial<TextLayer>) =>
    onChange(layers.map((l) => (selIds.has(l.id) ? { ...l, ...p } : l)));
  const patchSize = (id: string, size: number) =>
    patch(id, mode === "pc" ? { pc_size: size } : { mobile_size: size });

  // 단일 선택 시 편집 패널용
  const selId = selIds.size === 1 ? [...selIds][0] : null;
  const sel = selId ? (layers.find((l) => l.id === selId) ?? null) : null;

  const addLayer = () => {
    const l = newTextLayer();
    onChange([...layers, l]);
    setSelIds(new Set([l.id]));
    setEditId(l.id);
  };
  const removeLayer = (id: string) => {
    onChange(layers.filter((l) => l.id !== id));
    setSelIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const onLayerMouseDown = (e: React.MouseEvent, l: TextLayer) => {
    e.preventDefault(); e.stopPropagation();
    const isMulti = e.ctrlKey || e.metaKey;
    // 선택 세트를 동기적으로 계산 (drag origins에 바로 사용)
    let nextSelIds: Set<string>;
    if (isMulti) {
      nextSelIds = new Set(selIds);
      nextSelIds.has(l.id) ? nextSelIds.delete(l.id) : nextSelIds.add(l.id);
      setEditId(null);
    } else {
      nextSelIds = new Set([l.id]);
    }
    setSelIds(nextSelIds);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    const { x, y } = getXY(l);
    // 드래그 시작: 선택된 모든 항목의 원래 위치를 저장
    const origins: Record<string, { x: number; y: number }> = {};
    nextSelIds.forEach((id) => {
      const layer = layers.find((ll) => ll.id === id);
      if (layer) { const { x: lx, y: ly } = getXY(layer); origins[id] = { x: lx, y: ly }; }
    });
    drag.current = { primaryId: l.id, dx: curX - x, dy: curY - y, origins };
  };

  // 스냅 대상 좌표(그리드선 + 중앙 + 드래그 중이 아닌 다른 레이어) 중 임계값 이내 가장 가까운 값 찾기
  const findSnap = (value: number, others: number[]): number | null => {
    const candidates = [50, ...Array.from({ length: 11 }, (_, i) => i * GRID_STEP), ...others];
    let best: number | null = null;
    let bestDist = SNAP_THRESHOLD;
    for (const c of candidates) {
      const d = Math.abs(value - c);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPX = Math.max(0, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100 - drag.current.dx));
    const newPY = Math.max(0, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100 - drag.current.dy));
    const origin = drag.current.origins[drag.current.primaryId];
    if (!origin) return;
    let dX = newPX - origin.x;
    let dY = newPY - origin.y;

    let snapX: number | null = null;
    let snapY: number | null = null;
    if (snapEnabled) {
      const primaryNx = origin.x + dX;
      const primaryNy = origin.y + dY;
      const otherXs = layers.filter((l) => !drag.current!.origins[l.id]).map((l) => getXY(l).x);
      const otherYs = layers.filter((l) => !drag.current!.origins[l.id]).map((l) => getXY(l).y);
      snapX = findSnap(primaryNx, otherXs);
      snapY = findSnap(primaryNy, otherYs);
      if (snapX !== null) dX = snapX - origin.x;
      if (snapY !== null) dY = snapY - origin.y;
    }
    setSnapLines({ x: snapX, y: snapY });

    // 선택된 모든 레이어를 같은 델타로 이동
    onChange(layers.map((layer) => {
      const o = drag.current!.origins[layer.id];
      if (!o) return layer;
      const nx = Math.max(0, Math.min(98, Math.round((o.x + dX) * 10) / 10));
      const ny = Math.max(0, Math.min(96, Math.round((o.y + dY) * 10) / 10));
      return mode === "pc" ? { ...layer, pc_x: nx, pc_y: ny } : { ...layer, mobile_x: nx, mobile_y: ny };
    }));
  };

  // ── 위치 정렬 ──
  type AlignType = "left" | "center-h" | "right" | "top" | "middle-v" | "bottom" | "dist-h" | "dist-v";
  const alignSelected = (type: AlignType) => {
    const selected = layers.filter((l) => selIds.has(l.id));
    if (selected.length < 2) return;
    const pos = selected.map((l) => ({ id: l.id, ...getXY(l) }));
    const updates: Record<string, { x?: number; y?: number }> = {};
    switch (type) {
      case "left":     { const v = Math.min(...pos.map((p) => p.x)); pos.forEach((p) => { updates[p.id] = { x: v }; }); break; }
      case "right":    { const v = Math.max(...pos.map((p) => p.x)); pos.forEach((p) => { updates[p.id] = { x: v }; }); break; }
      case "center-h": { const v = Math.round(((Math.min(...pos.map((p) => p.x)) + Math.max(...pos.map((p) => p.x))) / 2) * 10) / 10; pos.forEach((p) => { updates[p.id] = { x: v }; }); break; }
      case "top":      { const v = Math.min(...pos.map((p) => p.y)); pos.forEach((p) => { updates[p.id] = { y: v }; }); break; }
      case "bottom":   { const v = Math.max(...pos.map((p) => p.y)); pos.forEach((p) => { updates[p.id] = { y: v }; }); break; }
      case "middle-v": { const v = Math.round(((Math.min(...pos.map((p) => p.y)) + Math.max(...pos.map((p) => p.y))) / 2) * 10) / 10; pos.forEach((p) => { updates[p.id] = { y: v }; }); break; }
      case "dist-h": {
        if (selected.length < 3) break;
        const sorted = [...pos].sort((a, b) => a.x - b.x);
        const step = (sorted[sorted.length - 1].x - sorted[0].x) / (sorted.length - 1);
        sorted.forEach((p, i) => { updates[p.id] = { x: Math.round((sorted[0].x + step * i) * 10) / 10 }; });
        break;
      }
      case "dist-v": {
        if (selected.length < 3) break;
        const sorted = [...pos].sort((a, b) => a.y - b.y);
        const step = (sorted[sorted.length - 1].y - sorted[0].y) / (sorted.length - 1);
        sorted.forEach((p, i) => { updates[p.id] = { y: Math.round((sorted[0].y + step * i) * 10) / 10 }; });
        break;
      }
    }
    onChange(layers.map((layer) => {
      const u = updates[layer.id];
      if (!u) return layer;
      const p = mode === "pc"
        ? { ...(u.x !== undefined ? { pc_x: u.x } : {}), ...(u.y !== undefined ? { pc_y: u.y } : {}) }
        : { ...(u.x !== undefined ? { mobile_x: u.x } : {}), ...(u.y !== undefined ? { mobile_y: u.y } : {}) };
      return { ...layer, ...p };
    }));
  };

  const ALIGN_BTNS: { type: AlignType; icon: string; label: string; min?: number }[] = [
    { type: "left",     icon: "⇤",  label: "왼쪽 맞춤" },
    { type: "center-h", icon: "↔",  label: "가로 가운데" },
    { type: "right",    icon: "⇥",  label: "오른쪽 맞춤" },
    { type: "top",      icon: "⇡",  label: "위쪽 맞춤" },
    { type: "middle-v", icon: "↕",  label: "세로 가운데" },
    { type: "bottom",   icon: "⇣",  label: "아래쪽 맞춤" },
    { type: "dist-h",   icon: "⇹",  label: "가로 등간격", min: 3 },
    { type: "dist-v",   icon: "⇵",  label: "세로 등간격", min: 3 },
  ];

  // ── 전체 영역(가용 영역) 기준 정렬 — 1개만 선택해도 사용 가능 ──
  type CanvasAlignType = "left" | "center-h" | "right" | "top" | "middle-v" | "bottom";
  const alignToCanvas = (type: CanvasAlignType) => {
    const selected = layers.filter((l) => selIds.has(l.id));
    if (selected.length === 0) return;
    let x: number | undefined; let y: number | undefined;
    switch (type) {
      case "left":     x = CANVAS_X.min; break;
      case "center-h": x = Math.round(((CANVAS_X.min + CANVAS_X.max) / 2) * 10) / 10; break;
      case "right":    x = CANVAS_X.max; break;
      case "top":      y = CANVAS_Y.min; break;
      case "middle-v": y = Math.round(((CANVAS_Y.min + CANVAS_Y.max) / 2) * 10) / 10; break;
      case "bottom":   y = CANVAS_Y.max; break;
    }
    onChange(layers.map((layer) => {
      if (!selIds.has(layer.id)) return layer;
      const p = mode === "pc"
        ? { ...(x !== undefined ? { pc_x: x } : {}), ...(y !== undefined ? { pc_y: y } : {}) }
        : { ...(x !== undefined ? { mobile_x: x } : {}), ...(y !== undefined ? { mobile_y: y } : {}) };
      return { ...layer, ...p };
    }));
  };

  const CANVAS_ALIGN_BTNS: { type: CanvasAlignType; icon: string; label: string }[] = [
    { type: "left",     icon: "⇤",  label: "왼쪽" },
    { type: "center-h", icon: "↔",  label: "가로 중앙" },
    { type: "right",    icon: "⇥",  label: "오른쪽" },
    { type: "top",      icon: "⇡",  label: "위" },
    { type: "middle-v", icon: "↕",  label: "세로 중앙" },
    { type: "bottom",   icon: "⇣",  label: "아래" },
  ];

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
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowGrid((v) => !v)}
            className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${showGrid ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}>
            격자 {showGrid ? "끄기" : "보기"}
          </button>
          <button type="button" onClick={() => setSnapEnabled((v) => !v)}
            className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${snapEnabled ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}>
            스냅 {snapEnabled ? "ON" : "OFF"}
          </button>
          {layers.length >= 2 && (
            <button type="button" onClick={() => setSelIds(new Set(layers.map((l) => l.id)))}
              className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-slate-400 transition-colors">
              전체 선택
            </button>
          )}
          <button type="button" onClick={addLayer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            + 텍스트 추가
          </button>
        </div>
      </div>

      {/* 캔버스 미리보기 */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-slate-900 select-none"
        style={{
          aspectRatio,
          width: "100%",
          maxWidth: mode === "mobile" ? 300 : 720,
          marginInline: mode === "mobile" ? "auto" : undefined,
          containerType: "inline-size",
        }}
        onMouseMove={onMouseMove}
        onMouseUp={() => { drag.current = null; setSnapLines({ x: null, y: null }); }}
        onMouseLeave={() => { drag.current = null; setSnapLines({ x: null, y: null }); }}
      >
        <div className="absolute inset-0" onMouseDown={() => { setSelIds(new Set()); setEditId(null); }}>
          {bg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: bgPos, transform: `scale(${bgScale || 1})`, transformOrigin: bgPos }} />
          ) : bgVideo ? (
            <video src={bgVideo} muted loop autoPlay playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: bgPos, transform: `scale(${bgScale || 1})`, transformOrigin: bgPos }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">이미지 또는 동영상을 먼저 등록하세요</div>
          )}
          {layers.map((l) => {
            const { x, y, size } = getXY(l);
            const isEditing = editId === l.id;
            const isSelected = selIds.has(l.id);
            return (
              <div
                key={l.id}
                ref={isEditing ? editRef : undefined}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onMouseDown={(e) => { if (isEditing) { e.stopPropagation(); return; } onLayerMouseDown(e, l); }}
                onDoubleClick={(e) => { e.stopPropagation(); setSelIds(new Set([l.id])); setEditId(l.id); }}
                onBlur={(e) => { patch(l.id, { text: e.currentTarget.textContent ?? "" }); setEditId((cur) => (cur === l.id ? null : cur)); }}
                onKeyDown={(e) => { if (isEditing && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
                className={`absolute outline-offset-2 ${isEditing ? "cursor-text outline-dashed outline-2 outline-blue-300" : "cursor-move"} ${isSelected && !isEditing ? "outline outline-2 outline-blue-400" : ""}`}
                style={{
                  left: `${x}%`, top: `${y}%`,
                  fontFamily: l.font_family || undefined,
                  color: l.color,
                  fontWeight: l.weight,
                  textAlign: l.align,
                  letterSpacing: `${l.letter_spacing}px`,
                  lineHeight: l.line_height,
                  fontSize: `${(size / designW * 100).toFixed(2)}cqw`,
                  transform: `scaleX(${l.scale_x})`,
                  transformOrigin: "left top",
                  whiteSpace: "pre-wrap",
                  textShadow: "0 1px 8px rgba(0,0,0,0.25)",
                  ...(l.bg_color ? { backgroundColor: bgColorWithAlpha(l.bg_color, l.opacity ?? 1), padding: "0.08em 0.35em" } : {}),
                }}
              >
                {isEditing ? l.text : (l.text || "텍스트")}
              </div>
            );
          })}

          {/* 가이드 격자 (10% 간격 + 중앙선 강조) */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-[1]">
              {Array.from({ length: 9 }, (_, i) => (i + 1) * GRID_STEP).map((p) => (
                <div key={`gx${p}`} className={`absolute inset-y-0 ${p === 50 ? "bg-orange-400/50" : "bg-white/15"}`} style={{ left: `${p}%`, width: 1 }} />
              ))}
              {Array.from({ length: 9 }, (_, i) => (i + 1) * GRID_STEP).map((p) => (
                <div key={`gy${p}`} className={`absolute inset-x-0 ${p === 50 ? "bg-orange-400/50" : "bg-white/15"}`} style={{ top: `${p}%`, height: 1 }} />
              ))}
            </div>
          )}

          {/* 드래그 중 스냅 가이드선 */}
          {snapLines.x !== null && (
            <div className="absolute inset-y-0 bg-pink-500 pointer-events-none z-[1]" style={{ left: `${snapLines.x}%`, width: 1.5 }} />
          )}
          {snapLines.y !== null && (
            <div className="absolute inset-x-0 bg-pink-500 pointer-events-none z-[1]" style={{ top: `${snapLines.y}%`, height: 1.5 }} />
          )}

          {/* 페이지 넘김(좌우 화살표) 영역 — PC 전용 */}
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
            더블클릭 입력 · 드래그 이동 · Ctrl+클릭 다중 선택
          </div>
        </div>
      </div>

      {/* 레이어 목록 */}
      <div className="flex gap-1.5 flex-wrap">
        {layers.length === 0 && <p className="text-xs text-slate-400">텍스트 개체가 없습니다. "+ 텍스트 추가"를 눌러보세요.</p>}
        {layers.map((l, i) => (
          <button key={l.id} type="button"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                setSelIds((prev) => { const next = new Set(prev); next.has(l.id) ? next.delete(l.id) : next.add(l.id); return next; });
              } else {
                setSelIds(new Set([l.id]));
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border max-w-[160px] transition-colors ${selIds.has(l.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            <span className="truncate">{i + 1}. {l.text || "(빈 텍스트)"}</span>
            <span onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
              className={`flex-shrink-0 leading-none ${selIds.has(l.id) ? "text-white/70 hover:text-white" : "text-slate-300 hover:text-red-500"}`}>×</span>
          </button>
        ))}
      </div>

      {/* ── 전체 영역(가용 영역) 정렬 — 1개 이상 선택 시 사용 가능 ── */}
      {selIds.size >= 1 && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">전체 영역 정렬 · 캔버스 가용 영역 기준</p>
          <div className="flex flex-wrap gap-1">
            {CANVAS_ALIGN_BTNS.map(({ type, icon, label }) => (
              <button key={type} type="button" onClick={() => alignToCanvas(type)}
                title={label}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] border rounded transition-colors min-w-[46px] bg-white text-slate-600 border-slate-200 hover:border-slate-500 hover:text-slate-800 cursor-pointer">
                <span className="text-[14px] leading-none">{icon}</span>
                <span className="whitespace-nowrap leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 다중 선택 툴바 (2개 이상 선택 시) ── */}
      {selIds.size >= 2 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-700">{selIds.size}개 선택 · Ctrl+클릭으로 추가/해제</p>
            <button type="button" onClick={() => setSelIds(new Set())}
              className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors">선택 해제</button>
          </div>

          {/* 위치 정렬 */}
          <div>
            <p className="text-[10px] font-semibold text-blue-600 mb-2 uppercase tracking-wide">위치 정렬</p>
            <div className="flex flex-wrap gap-1">
              {ALIGN_BTNS.map(({ type, icon, label, min }) => {
                const disabled = min !== undefined && selIds.size < min;
                return (
                  <button key={type} type="button"
                    onClick={() => !disabled && alignSelected(type)}
                    title={disabled ? `${min}개 이상 선택 시 사용 가능` : label}
                    className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] border rounded transition-colors min-w-[46px] ${disabled ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 cursor-pointer"}`}>
                    <span className="text-[14px] leading-none">{icon}</span>
                    <span className="whitespace-nowrap leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 일괄 스타일 변경 */}
          <div>
            <p className="text-[10px] font-semibold text-blue-600 mb-2 uppercase tracking-wide">일괄 스타일 변경</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">글자색</span>
                <input type="color" defaultValue="#ffffff"
                  onChange={(e) => patchAll({ color: e.target.value })}
                  className="w-8 h-7 border border-gray-200 rounded cursor-pointer p-0.5" />
              </div>
              <div className="flex gap-1">
                {[400, 700, 900].map((w) => (
                  <button key={w} type="button" onClick={() => patchAll({ weight: w })}
                    className="px-2 py-1 text-[11px] rounded border bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    style={{ fontWeight: w }}>{w === 400 ? "보통" : w === 700 ? "굵게" : "더굵게"}</button>
                ))}
              </div>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((a) => (
                  <button key={a} type="button" onClick={() => patchAll({ align: a })}
                    title={a === "left" ? "텍스트 왼쪽 정렬" : a === "center" ? "텍스트 가운데 정렬" : "텍스트 오른쪽 정렬"}
                    className="w-7 py-1 text-[11px] rounded border bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    {a === "left" ? "↤" : a === "center" ? "↔" : "↦"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 단일 선택 편집 패널 ── */}
      {sel && selIds.size === 1 && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-600">선택한 텍스트</p>
            <button type="button" onClick={() => { setSelIds(new Set([sel.id])); setEditId(sel.id); }}
              className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100">이미지에서 직접 편집 ✎</button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">텍스트 내용 (줄바꿈: Enter)</label>
            <textarea
              value={sel.text}
              onChange={(e) => patch(sel.id, { text: e.target.value })}
              rows={2}
              placeholder="여기에 문구를 입력하세요"
              className="w-full border border-gray-200 px-2.5 py-2 text-sm rounded bg-white focus:outline-none focus:border-[#1A2B4A] resize-none"
            />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">배경 투명도 · {Math.round((sel.opacity ?? 1) * 100)}%</label>
              <input type="range" min={0} max={1} step={0.01} value={sel.opacity ?? 1}
                onChange={(e) => patch(sel.id, { opacity: Number(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 mt-2" />
              {!sel.bg_color && <p className="text-[10px] text-slate-400 mt-1">배경색을 지정하면 적용됩니다</p>}
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

// ── 컨셉 생성기 (템플릿 기반 — API 불필요, 무료) ──

function detectSeason(text: string): string {
  if (/봄|spring/i.test(text)) return "봄";
  if (/여름|summer|냉감|쿨|시원/i.test(text)) return "여름";
  if (/가을|autumn|fall/i.test(text)) return "가을";
  if (/겨울|winter|보온|방한|기모/i.test(text)) return "겨울";
  return "";
}

function buildTitleCandidates(season: string, concept: string): string[] {
  const s = season;
  const c = concept.trim();
  const list: string[] = [];
  if (c && c.length <= 16) list.push(c);   // 컨셉이 짧으면 그대로 후보에 (컨셉 변경 시 반영)
  list.push(
    s ? `${s}, 더 가볍게` : "더 가볍게, 더 자유롭게",
    "현장의 기준이 되다",
    s ? `일하는 사람의 ${s}` : "일하는 사람이 제일 멋있다",
    "오늘도, 버티는 옷",
    s ? `${s}을 제대로 입다` : "제대로 입는다는 것",
  );
  return list;
}

function buildSubtitleCandidates(season: string, concept: string): string[] {
  const s = season;
  const base = [
    "일하는 사람 편에서 만든 옷",
    s ? `${s} 현장을 위한 워크웨어` : "현장을 위한 워크웨어",
    "현장부터 일상까지, 버티는 옷",
    "워크업이 제안하는 새로운 기준",
  ];
  const trimmed = concept.trim();
  if (trimmed && trimmed.length <= 22 && !base.includes(trimmed)) base.unshift(trimmed);
  return base;
}

function VisualConceptGenerator({ concept, currentLayers, onChangeLayers }: {
  concept: string;
  currentLayers: TextLayer[];
  onChangeLayers: (next: TextLayer[]) => void;
}) {
  const [season, setSeason] = useState("");   // "" = 컨셉에서 자동 감지
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ titles: string[]; subtitles: string[] } | null>(null);
  const [addedKey, setAddedKey] = useState("");

  const generate = () => {
    if (!concept.trim()) { setError("먼저 위의 '관리용 타이틀(기획 컨셉)'을 입력하세요."); return; }
    setError("");
    const s = season || detectSeason(concept);
    setResult({
      titles: buildTitleCandidates(s, concept),
      subtitles: buildSubtitleCandidates(s, concept),
    });
  };

  const addLayer = (text: string, kind: "title" | "sub", key: string) => {
    const layer: TextLayer = kind === "title"
      ? { ...newTextLayer(), text, weight: 900, pc_x: 8, pc_y: 32, pc_size: 80, mobile_x: 8, mobile_y: 30, mobile_size: 46 }
      : { ...newTextLayer(), text, weight: 400, pc_x: 8, pc_y: 62, pc_size: 32, mobile_x: 8, mobile_y: 56, mobile_size: 22 };
    onChangeLayers([...currentLayers, layer]);
    setAddedKey(key);
    setTimeout(() => setAddedKey(""), 1500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl p-4 border border-indigo-100 space-y-3">
      <p className="text-xs font-bold text-indigo-700">✨ 컨셉으로 타이틀·서브타이틀 만들기 <span className="font-normal text-indigo-400">(무료 · API 불필요)</span></p>

      {/* 옵션 */}
      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">계절</span>
          <select value={season} onChange={(e) => setSeason(e.target.value)}
            className="border border-slate-200 rounded-md px-1.5 py-0.5 bg-white focus:outline-none">
            <option value="">자동 (컨셉에서 감지)</option>
            {["봄", "여름", "가을", "겨울"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <button type="button" onClick={generate}
        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
        타이틀 · 서브타이틀 생성
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500">타이틀 후보 — 클릭하면 캔버스에 추가됩니다</p>
            <div className="grid grid-cols-3 gap-2">
              {result.titles.map((t, i) => (
                <button key={`t${i}`} type="button" onClick={() => addLayer(t, "title", `t${i}`)}
                  className="text-sm text-slate-800 bg-white rounded-lg border border-slate-200 px-2.5 py-2 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center leading-tight">
                  {addedKey === `t${i}` ? "추가됨 ✓" : t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500">서브타이틀 후보 — 클릭하면 캔버스에 추가됩니다</p>
            <div className="grid grid-cols-3 gap-2">
              {result.subtitles.map((t, i) => (
                <button key={`s${i}`} type="button" onClick={() => addLayer(t, "sub", `s${i}`)}
                  className="text-sm text-slate-800 bg-white rounded-lg border border-slate-200 px-2.5 py-2 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center leading-tight">
                  {addedKey === `s${i}` ? "추가됨 ✓" : t}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            정형 템플릿 문구입니다. 추가한 뒤 아래 텍스트 캔버스에서 자유롭게 수정하세요.
          </p>
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
  target: "pc" | "mobile",
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
  // 실제 노출 비율 반영 (PC 1920×680 ≈ 2.8:1 / 모바일 750×695 ≈ 1:1)
  const formatCtx = target === "pc"
    ? `Ultra-wide horizontal hero banner, exact aspect ratio 1920:680 (about 2.8:1), cinematic wide composition with the model placed to one side and open negative space on the other for text overlay. Target resolution 1920×680px.`
    : `Near-square vertical mobile hero banner, exact aspect ratio 750:695 (about 1:1), centered composition with clear negative space at top or bottom for text overlay. Target resolution 750×695px.`;
  return [
    `A professional fashion photograph for a Korean apparel brand hero banner.`,
    formatCtx,
    descCtx && `Scene: ${descCtx}.`,
    `${VISUAL_SHOT_TYPES[shotType].en} shot of a model wearing high-quality ${clothingEng}.`,
    seasonCtx && `${seasonCtx}.`,
    allExtras && `${allExtras}.`,
    textCtx && `Brand message: "${textCtx}".`,
    `Editorial fashion photography style, clean modern composition, high resolution.`,
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function VisualPromptBuilder({ title, subtitle, pcImageUrl }: {
  title: string; subtitle: string; pcImageUrl?: string;
}) {
  const [target, setTarget] = useState<"pc" | "mobile">("pc");
  const [shotType, setShotType] = useState<VisualShotKey>("full");
  const [clothingType, setClothingType] = useState<"작업복" | "일상복">("작업복");
  const [season, setSeason] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setPrompt(buildVisualPrompt(target, clothingType, season, extras, shotType, customInput, description, title, subtitle));
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
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">생성 대상 (비율이 프롬프트에 반영됩니다)</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setTarget("pc")}
                className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${target === "pc" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                PC 1920×680 (2.8:1)
              </button>
              <button type="button" onClick={() => setTarget("mobile")}
                className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${target === "mobile" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                모바일 750×695 (1:1)
              </button>
            </div>
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
              왼쪽 옵션을 고르고 위의<br />'이미지 프롬프트 생성'을 누르면<br />여기에 프롬프트가 표시됩니다.
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
