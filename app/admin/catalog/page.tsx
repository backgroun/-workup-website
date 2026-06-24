"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  EMPTY_CATALOG_PAGE, emptyDataFor, CATALOG_TYPE_LABEL,
  type CatalogPage, type CatalogPageType, type CatalogPageData, type ContentsItem,
} from "@/data/catalog";
import CatalogPageView from "@/components/CatalogPageView";

const PAGE_TYPES: CatalogPageType[] = ["image", "cover", "contents", "divider"];
const INPUT = "w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded";

export default function AdminCatalogPage() {
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [fetchErrMsg, setFetchErrMsg] = useState("");
  const [editing, setEditing] = useState<CatalogPage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  // 종류 전환 시 종류별 입력 내용 보관 → 왕복해도 복원(데이터 유실 방지)
  const dataCacheRef = useRef<Partial<Record<CatalogPageType, CatalogPageData>>>({});

  const load = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/catalog");
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setFetchErrMsg(`${e.error ?? `HTTP ${res.status}`}${e.project ? ` · 연결된 프로젝트: ${e.project}` : ""}`);
        setFetchError(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchErrMsg(err instanceof Error ? err.message : String(err));
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
    dataCacheRef.current = {};
    setEditing({ id: "", ...EMPTY_CATALOG_PAGE, sort_order: pages.length });
    setIsNew(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (page: CatalogPage) => {
    dataCacheRef.current = {};
    // 구버전 행 방어: page_type/data 누락 시 기본값
    setEditing({ ...page, page_type: page.page_type ?? "image", data: page.data ?? {} });
    setIsNew(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const set = (key: keyof CatalogPage, value: string | boolean | number | null) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };
  const setType = (type: CatalogPageType) =>
    setEditing((prev) => {
      if (!prev || prev.page_type === type) return prev;
      dataCacheRef.current[prev.page_type] = prev.data; // 현재 종류 내용 보관
      return { ...prev, page_type: type, data: dataCacheRef.current[type] ?? emptyDataFor(type) };
    });
  const setData = (patch: Partial<CatalogPageData>) =>
    setEditing((prev) => (prev ? { ...prev, data: { ...(prev.data ?? {}), ...patch } } : prev));
  const updItems = (fn: (a: ContentsItem[]) => ContentsItem[]) =>
    setEditing((prev) => (prev ? { ...prev, data: { ...(prev.data ?? {}), items: fn(prev.data?.items ?? []) } } : prev));

  // 현재 divider 페이지 목록에서 목차 항목 자동 생성
  const autoFillToc = () => {
    const visible = pages.filter((p) => p.is_visible);
    const items: ContentsItem[] = [];
    visible.forEach((p, i) => {
      if (p.page_type !== "divider") return;
      const nextDivIdx = visible.findIndex((q, qi) => qi > i && q.page_type === "divider");
      const contentStart = i + 2; // divider 다음 페이지
      const contentEnd = nextDivIdx !== -1 ? nextDivIdx : visible.length;
      const pageStr = contentStart <= contentEnd
        ? `P.${contentStart} – ${contentEnd}`
        : `P.${contentStart}`;
      items.push({ name: p.data?.title ?? "", count: p.data?.count ?? "", page: pageStr });
    });
    if (items.length === 0) {
      flash("노출 중인 구분(divider) 페이지가 없어 자동 생성할 항목이 없습니다.", "err");
      return;
    }
    updItems(() => items);
    flash(`${items.length}개 항목을 자동으로 채웠습니다.`);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.page_type === "image" && !editing.image_url) { flash("페이지 이미지를 등록하세요.", "err"); return; }
    if (editing.page_type === "cover" && !editing.data?.brand?.trim()) { flash("표지 브랜드명을 입력하세요.", "err"); return; }
    if (editing.page_type === "divider" && !editing.data?.title?.trim()) { flash("구분 페이지 제목을 입력하세요.", "err"); return; }
    if (editing.page_type === "contents" && !(editing.data?.items ?? []).some((it) => it.name.trim())) { flash("목차 항목을 1개 이상 입력하세요.", "err"); return; }
    setSaving(true);

    const id = isNew ? crypto.randomUUID() : editing.id;
    const payload: Record<string, unknown> = { ...editing, id, image_url: editing.image_url || null };
    delete payload.created_at; delete payload.updated_at; // 서버 관리 컬럼 제외

    const url = isNew ? "/api/admin/catalog" : `/api/admin/catalog/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { flash("저장됐습니다."); setEditing(null); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "저장 실패", "err"); }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`"${label || id}" 페이지를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/catalog/${id}`, { method: "DELETE" });
    if (res.ok) { flash("삭제됐습니다."); if (editing?.id === id) setEditing(null); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "삭제 실패", "err"); }
  };

  const handleDuplicate = async (page: CatalogPage) => {
    const payload: Record<string, unknown> = {
      ...page,
      id: crypto.randomUUID(),
      admin_title: `${page.admin_title || page.title || "페이지"} (복사본)`,
      sort_order: pages.length,
      image_url: page.image_url || null,
    };
    delete payload.created_at; delete payload.updated_at;
    const res = await fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { flash("복제됐습니다."); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "복제 실패", "err"); }
  };

  const toggleVisible = async (page: CatalogPage) => {
    const next = !page.is_visible;
    const snapshot = pages;   // 실패 시 되돌릴 스냅샷
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, is_visible: next } : p)));
    try {
      const res = await fetch(`/api/admin/catalog/${page.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_visible: next }) });
      if (!res.ok) throw new Error();
    } catch {
      setPages(snapshot);
      flash("노출 설정 변경에 실패했습니다.", "err");
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) { const { url } = await res.json(); set("image_url", url); }
    else { const err = await res.json().catch(() => ({})); flash(`업로드 실패: ${err.error ?? res.status}`, "err"); }
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) { setDragIndex(null); setDragOver(null); return; }
    const next = [...pages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const updated = next.map((p, i) => ({ ...p, sort_order: i }));
    const snapshot = pages;   // 실패 시 되돌릴 스냅샷
    setPages(updated);
    setDragIndex(null); setDragOver(null);
    const results = await Promise.allSettled(updated.map((p) =>
      fetch(`/api/admin/catalog/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: p.sort_order }) })
        .then((r) => { if (!r.ok) throw new Error(); })
    ));
    if (results.some((r) => r.status === "rejected")) {
      setPages(snapshot);
      flash("순서 저장에 실패했습니다.", "err");
    }
  };

  const d = editing?.data ?? {};

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">카탈로그 관리</h1>
          <p className="text-base text-gray-400 mt-1">
            디지털 카탈로그(플립북) 페이지 관리 <span className="font-semibold text-gray-600">({pages.length}페이지)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/catalog" target="_blank" className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">카탈로그 미리보기 ↗</a>
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            페이지 추가
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-slate-600 leading-relaxed">
        페이지 종류: <b>표지</b>·<b>목차</b>·<b>구분</b>은 디자인이 자동 적용되고 글자만 수정합니다. <b>이미지</b>는 직접 디자인한 페이지를 업로드합니다.
        등록한 순서대로 <span className="font-semibold text-slate-800">/catalog 플립북</span>에 노출됩니다.
        <span className="block mt-1 text-xs text-slate-400">이미지 권장 비율 5:7 세로형 (예: 1000 × 1400px) · JPG/PNG · 10MB 이하</span>
      </div>

      {/* 피드백 */}
      {msg.text && (
        <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>{msg.text}</div>
      )}

      {/* Supabase 미설정 안내 */}
      {!loading && fetchError && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ catalog_pages 테이블을 읽지 못했습니다.</p>
          {fetchErrMsg && (
            <div className="mb-3 px-3 py-2 bg-white border border-red-200 rounded text-xs text-red-600 font-mono break-all">실제 에러: {fetchErrMsg}</div>
          )}
          <p className="text-xs text-amber-700 mb-3">위 “연결된 프로젝트”에 아래 SQL을 1회 실행하세요.</p>
          <pre className="text-xs bg-white p-3 border border-amber-200 rounded overflow-x-auto text-gray-700 whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS catalog_pages (
  id          TEXT PRIMARY KEY,
  page_type   TEXT NOT NULL DEFAULT 'image',
  admin_title TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  link_label  TEXT NOT NULL DEFAULT '',
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE catalog_pages TO anon, authenticated, service_role;
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON catalog_pages;
CREATE POLICY "public_read" ON catalog_pages FOR SELECT USING (true);
-- 기존 테이블에 컬럼 추가 (이미 있을 때)
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
NOTIFY pgrst, 'reload schema';`}</pre>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* ── 왼쪽: 페이지 목록 ── */}
        <div className="w-[340px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">페이지 목록</h2>
              <span className="text-xs text-slate-400">드래그로 순서 변경</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-slate-400 text-sm">
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />불러오는 중...
              </div>
            ) : pages.length === 0 && !editing ? (
              <div className="py-14 text-center text-slate-400 text-sm">등록된 페이지가 없습니다.</div>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
                {pages.map((page, i) => (
                  <li key={page.id} draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`flex items-start gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${editing?.id === page.id ? "bg-blue-50" : "hover:bg-slate-50"} ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <svg className="w-3 h-3 text-slate-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>

                    {/* 번호 + 썸네일 */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-12 h-[68px] overflow-hidden rounded border border-slate-200 bg-slate-100">
                        {(page.page_type ?? "image") !== "image" ? (
                          <div className="w-full h-full" style={{ transform: "scale(0.99)" }}>
                            <CatalogPageView page={page} />
                          </div>
                        ) : page.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={page.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center"><span className="text-white/30 text-[9px] font-bold">WU</span></div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">P.{i + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">{CATALOG_TYPE_LABEL[page.page_type ?? "image"]}</span>
                        <p className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">{page.admin_title || page.title || page.data?.brand || page.data?.title || "(제목 없음)"}</p>
                        <button onClick={() => toggleVisible(page)} title={page.is_visible ? "노출 중" : "숨김"}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${page.is_visible ? "bg-blue-500" : "bg-slate-200"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${page.is_visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      {page.link_url && <p className="text-[10px] text-[#ff550c] mt-0.5 truncate">↗ {page.link_label || page.link_url}</p>}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => openEdit(page)} className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2.5 py-1 hover:bg-slate-100 transition-colors rounded">수정</button>
                        <button onClick={() => handleDuplicate(page)} title="복제" className="text-[11px] font-medium text-blue-500 border border-blue-200 px-2.5 py-1 hover:bg-blue-50 transition-colors rounded">복제</button>
                        <button onClick={() => handleDelete(page.id, page.admin_title || page.title)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2.5 py-1 hover:bg-red-50 transition-colors rounded">삭제</button>
                      </div>
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
                <h2 className="text-base font-semibold text-white">{isNew ? "새 페이지 추가" : "페이지 수정"} <span className="text-slate-400 text-sm font-normal">· {CATALOG_TYPE_LABEL[editing.page_type]}</span></h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving ? (<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>) : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 flex gap-6">
                <div className="flex-1 min-w-0 space-y-5">
                  {/* 종류 선택 */}
                  <Field label="페이지 종류">
                    <div className="flex gap-1.5">
                      {PAGE_TYPES.map((t) => (
                        <button key={t} onClick={() => setType(t)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${editing.page_type === t ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                          {CATALOG_TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* 노출 + 관리용 제목 */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editing.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="w-4 h-4 accent-[#1A2B4A]" />
                      <span className="text-sm text-gray-700">카탈로그에 노출</span>
                    </label>
                  </div>
                  <Field label="관리용 제목" hint="목록 식별용. 화면에 표시되지 않음.">
                    <input type="text" value={editing.admin_title} onChange={(e) => set("admin_title", e.target.value)} placeholder="예: 표지 / 목차 / 작업복 구분" className={INPUT} />
                  </Field>

                  {/* ── 종류별 필드 ── */}
                  {editing.page_type === "image" && (
                    <>
                      <Field label="페이지 이미지" hint="권장 5:7 세로형 (예: 1000×1400px) · 10MB 이하">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://example.com/page.jpg" className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </Field>
                      <Field label="제목 (선택)" hint="이미지 하단 캡션. 비우면 이미지만."><input type="text" value={editing.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 2026 SS 작업복 라인" className={INPUT} /></Field>
                      <Field label="설명 (선택)"><textarea value={editing.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="예: 현장에서 검증된 내구성과 활동성" className={`${INPUT} resize-none`} /></Field>
                      <div className="pt-2 border-t border-gray-100 space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">링크 버튼 (선택)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="이동 주소"><input type="text" value={editing.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="/products/... 또는 /store" className={INPUT} /></Field>
                          <Field label="버튼 문구"><input type="text" value={editing.link_label} onChange={(e) => set("link_label", e.target.value)} placeholder="매장에서 보기 / 제품 보기" className={INPUT} /></Field>
                        </div>
                        <p className="text-[11px] text-slate-400">두 칸을 모두 채워야 버튼이 표시됩니다.</p>
                      </div>
                    </>
                  )}

                  {editing.page_type === "cover" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Product Catalog" className={INPUT} /></Field>
                        <Field label="시즌 문구"><input type="text" value={d.season ?? ""} onChange={(e) => setData({ season: e.target.value })} placeholder="2026 Spring / Summer" className={INPUT} /></Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="브랜드명 (큰 글자)"><input type="text" value={d.brand ?? ""} onChange={(e) => setData({ brand: e.target.value })} placeholder="WORKUP" className={INPUT} /></Field>
                        <Field label="뱃지"><input type="text" value={d.badge ?? ""} onChange={(e) => setData({ badge: e.target.value })} placeholder="2026 SS" className={INPUT} /></Field>
                      </div>
                      <Field label="메모 (선택)"><input type="text" value={d.note ?? ""} onChange={(e) => setData({ note: e.target.value })} placeholder="예: 12 PRODUCTS" className={INPUT} /></Field>
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <Field label="하단 코드"><input type="text" value={d.code ?? ""} onChange={(e) => setData({ code: e.target.value })} placeholder="Cat. WU-2026-SS-001" className={INPUT} /></Field>
                        <ColorField label="배경색" value={d.bg ?? "#1A2B4A"} onChange={(v) => setData({ bg: v })} />
                      </div>
                      <Field label="배경 이미지 (선택)" hint="표지 전체에 이미지가 깔리고 그 위에 글자가 표시됩니다. 비우면 배경색만.">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://... (URL 직접 입력)" className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </Field>
                    </>
                  )}

                  {editing.page_type === "contents" && (
                    <>
                      <Field label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Contents" className={INPUT} /></Field>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-500">목차 항목</label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={autoFillToc}
                              className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium transition-colors">
                              ↻ 현재 페이지 목록으로 자동 채우기
                            </button>
                            <button type="button" onClick={() => updItems((a) => [...a, { name: "", count: "", page: "" }])} className="text-xs text-blue-600 hover:text-blue-800">+ 항목 추가</button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">구분(divider) 페이지 기준으로 자동 채워집니다. 생성 후 페이지 범위를 확인·수정하세요.</p>
                        <div className="space-y-2">
                          {(d.items ?? []).map((it, i) => (
                            <div key={i} className="grid grid-cols-[1fr_90px_110px_auto] gap-2 items-center">
                              <input type="text" value={it.name} onChange={(e) => updItems((a) => a.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="작업복" className={INPUT} />
                              <input type="text" value={it.count} onChange={(e) => updItems((a) => a.map((x, idx) => idx === i ? { ...x, count: e.target.value } : x))} placeholder="5개" className={INPUT} />
                              <input type="text" value={it.page} onChange={(e) => updItems((a) => a.map((x, idx) => idx === i ? { ...x, page: e.target.value } : x))} placeholder="P.3 – 7" className={INPUT} />
                              <button type="button" onClick={() => updItems((a) => a.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Field label="하단 문구"><input type="text" value={d.footer ?? ""} onChange={(e) => setData({ footer: e.target.value })} placeholder="WORKUP 2026 SS CATALOG" className={INPUT} /></Field>
                    </>
                  )}

                  {editing.page_type === "divider" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Category 01" className={INPUT} /></Field>
                        <Field label="번호 (큰 숫자)"><input type="text" value={d.no ?? ""} onChange={(e) => setData({ no: e.target.value })} placeholder="01" className={INPUT} /></Field>
                      </div>
                      <Field label="제목"><input type="text" value={d.title ?? ""} onChange={(e) => setData({ title: e.target.value })} placeholder="현장" className={INPUT} /></Field>
                      <Field label="설명 (줄바꿈 Enter)"><textarea value={d.desc ?? ""} onChange={(e) => setData({ desc: e.target.value })} rows={2} placeholder="현장에서 검증된 퍼포먼스." className={`${INPUT} resize-none`} /></Field>
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <Field label="개수 문구"><input type="text" value={d.count ?? ""} onChange={(e) => setData({ count: e.target.value })} placeholder="5개 제품" className={INPUT} /></Field>
                        <ColorField label="배경색" value={d.bg ?? "#1A2B4A"} onChange={(v) => setData({ bg: v })} />
                      </div>
                      <Field label="배경 이미지 (선택)" hint="구분 페이지 전체에 이미지가 깔립니다. 비우면 배경색만.">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://... (URL 직접 입력)" className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </Field>
                    </>
                  )}
                </div>

                {/* 실시간 미리보기 */}
                <div className="w-[220px] flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">미리보기</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm" style={{ aspectRatio: "5 / 7" }}>
                    <CatalogPageView page={editing} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">실제 카탈로그(플립북)에 표시되는 모습입니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <p>목록에서 페이지를 선택하거나 “페이지 추가”로 새 페이지를 만드세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 border border-gray-200 rounded px-2 py-2 text-sm font-mono focus:outline-none focus:border-[#1A2B4A]" />
      </div>
    </div>
  );
}
