"use client";
import { useState, useEffect, useRef } from "react";
import { EMPTY_CATALOG_PAGE, type CatalogPage } from "@/data/catalog";
import CatalogPageView from "@/components/CatalogPageView";

export default function AdminCatalogPage() {
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editing, setEditing] = useState<CatalogPage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/catalog");
      if (!res.ok) { setFetchError(true); setLoading(false); return; }
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
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
    setEditing({ id: "", ...EMPTY_CATALOG_PAGE, sort_order: pages.length });
    setIsNew(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (page: CatalogPage) => {
    setEditing({ ...page });
    setIsNew(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const set = (key: keyof CatalogPage, value: string | boolean | number | null) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.image_url) { flash("페이지 이미지를 등록하세요.", "err"); return; }
    setSaving(true);

    const id = isNew ? crypto.randomUUID() : editing.id;
    const payload = { ...editing, id, image_url: editing.image_url || null };

    const url = isNew ? "/api/admin/catalog" : `/api/admin/catalog/${editing.id}`;
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
    if (!confirm(`"${label || id}" 페이지를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/catalog/${id}`, { method: "DELETE" });
    if (res.ok) {
      flash("삭제됐습니다.");
      if (editing?.id === id) setEditing(null);
      load();
    }
  };

  const handleDuplicate = async (page: CatalogPage) => {
    const payload = {
      ...page,
      id: crypto.randomUUID(),
      admin_title: `${page.admin_title || page.title || "페이지"} (복사본)`,
      sort_order: pages.length,
      image_url: page.image_url || null,
    };
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { flash("복제됐습니다."); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "복제 실패", "err"); }
  };

  const toggleVisible = async (page: CatalogPage) => {
    const next = !page.is_visible;
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, is_visible: next } : p)));
    await fetch(`/api/admin/catalog/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: next }),
    });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      set("image_url", url);
    } else {
      const err = await res.json().catch(() => ({}));
      flash(`업로드 실패: ${err.error ?? res.status}`, "err");
    }
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) { setDragIndex(null); setDragOver(null); return; }
    const next = [...pages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const updated = next.map((p, i) => ({ ...p, sort_order: i }));
    setPages(updated);
    setDragIndex(null); setDragOver(null);
    await Promise.all(updated.map((p) =>
      fetch(`/api/admin/catalog/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: p.sort_order }),
      })
    ));
  };

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
          <a
            href="/catalog"
            target="_blank"
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            카탈로그 미리보기 ↗
          </a>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            페이지 추가
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-slate-600 leading-relaxed">
        직접 디자인한 페이지 이미지를 업로드하면 <span className="font-semibold text-slate-800">/catalog 플립북</span>에 순서대로 노출됩니다.
        제목·설명·링크는 선택 사항이며, 링크를 넣으면 페이지에 <span className="font-semibold text-[#ff550c]">CTA 버튼</span>(예: “매장에서 보기”)이 표시됩니다.
        <span className="block mt-1 text-xs text-slate-400">권장 이미지 비율 5:7 세로형 (예: 1000 × 1400px) · JPG/PNG · 10MB 이하</span>
      </div>

      {/* 피드백 */}
      {msg.text && (
        <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Supabase 미설정 안내 */}
      {!loading && fetchError && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ catalog_pages 테이블이 설정되지 않았습니다.</p>
          <p className="text-xs text-amber-700 mb-3">Supabase SQL Editor에서 아래 SQL을 1회 실행하세요. (파일: supabase/migrate_add_catalog_pages.sql)</p>
          <pre className="text-xs bg-white p-3 border border-amber-200 rounded overflow-x-auto text-gray-700 whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS catalog_pages (
  id          TEXT PRIMARY KEY,
  admin_title TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  link_label  TEXT NOT NULL DEFAULT '',
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON catalog_pages;
CREATE POLICY "public_read" ON catalog_pages FOR SELECT USING (true);`}</pre>
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
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                불러오는 중...
              </div>
            ) : pages.length === 0 && !editing ? (
              <div className="py-14 text-center text-slate-400 text-sm">
                <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                등록된 페이지가 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pages.map((page, i) => (
                  <li
                    key={page.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`flex items-start gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${
                      editing?.id === page.id ? "bg-blue-50" : "hover:bg-slate-50"
                    } ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}
                  >
                    <svg className="w-3 h-3 text-slate-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6a1 1 0 100-2 1 1 0 000 2zM16 6a1 1 0 100-2 1 1 0 000 2zM8 12a1 1 0 100-2 1 1 0 000 2zM16 12a1 1 0 100-2 1 1 0 000 2zM8 18a1 1 0 100-2 1 1 0 000 2zM16 18a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>

                    {/* 번호 + 썸네일 (세로형) */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-12 h-[68px] bg-slate-100 overflow-hidden rounded border border-slate-200">
                        {page.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={page.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                            <span className="text-white/30 text-[9px] font-bold">WU</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">P.{i + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">
                          {page.admin_title || page.title || "(제목 없음)"}
                        </p>
                        <button
                          onClick={() => toggleVisible(page)}
                          title={page.is_visible ? "노출 중" : "숨김"}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${page.is_visible ? "bg-blue-500" : "bg-slate-200"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${page.is_visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      {page.link_url && (
                        <p className="text-[10px] text-[#ff550c] mt-0.5 truncate">↗ {page.link_label || page.link_url}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => openEdit(page)}
                          className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2.5 py-1 hover:bg-slate-100 transition-colors rounded">
                          수정
                        </button>
                        <button onClick={() => handleDuplicate(page)} title="복제"
                          className="text-[11px] font-medium text-blue-500 border border-blue-200 px-2.5 py-1 hover:bg-blue-50 transition-colors rounded">
                          복제
                        </button>
                        <button onClick={() => handleDelete(page.id, page.admin_title || page.title)}
                          className="text-[11px] font-medium text-red-400 border border-red-200 px-2.5 py-1 hover:bg-red-50 transition-colors rounded">
                          삭제
                        </button>
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
                <h2 className="text-base font-semibold text-white">{isNew ? "새 페이지 추가" : "페이지 수정"}</h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving ? (<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>) : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 flex gap-6">
                {/* 입력 영역 */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* 노출 */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.is_visible}
                      onChange={(e) => set("is_visible", e.target.checked)}
                      className="w-4 h-4 accent-[#1A2B4A]" />
                    <span className="text-sm text-gray-700">카탈로그에 노출</span>
                  </label>

                  {/* 관리용 제목 */}
                  <Field label="관리용 제목" hint="목록에서 식별용. 실제 화면에는 표시되지 않습니다.">
                    <input type="text" value={editing.admin_title}
                      onChange={(e) => set("admin_title", e.target.value)}
                      placeholder="예: 표지 / 작업복 라인 소개 / 신상 셋업"
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                  </Field>

                  {/* 페이지 이미지 */}
                  <Field label="페이지 이미지" hint="권장 5:7 세로형 (예: 1000×1400px) · 10MB 이하">
                    <div className="space-y-2">
                      <input type="text" value={editing.image_url ?? ""}
                        onChange={(e) => set("image_url", e.target.value)}
                        placeholder="https://example.com/page.jpg (URL 직접 입력)"
                        className="w-full border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 rounded-lg" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">또는 파일 업로드</span>
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">
                          {uploading ? "업로드 중..." : "파일 선택"}
                        </button>
                        {editing.image_url && (
                          <button type="button" onClick={() => set("image_url", "")}
                            className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">
                            제거
                          </button>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                    </div>
                  </Field>

                  {/* 제목 / 설명 (선택) */}
                  <Field label="제목 (선택)" hint="이미지 하단에 캡션으로 표시됩니다. 비워두면 이미지만 노출.">
                    <input type="text" value={editing.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="예: 2026 SS 작업복 라인"
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                  </Field>
                  <Field label="설명 (선택)">
                    <textarea value={editing.description}
                      onChange={(e) => set("description", e.target.value)} rows={2}
                      placeholder="예: 현장에서 검증된 내구성과 활동성"
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded resize-none" />
                  </Field>

                  {/* 링크 (선택) — 오프라인 전환 CTA */}
                  <div className="pt-2 border-t border-gray-100 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">링크 버튼 (선택)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="이동 주소">
                        <input type="text" value={editing.link_url}
                          onChange={(e) => set("link_url", e.target.value)}
                          placeholder="/products/스트레치-카고팬츠 또는 /store"
                          className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                      </Field>
                      <Field label="버튼 문구">
                        <input type="text" value={editing.link_label}
                          onChange={(e) => set("link_label", e.target.value)}
                          placeholder="매장에서 보기 / 제품 보기"
                          className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] rounded" />
                      </Field>
                    </div>
                    <p className="text-[11px] text-slate-400">두 칸을 모두 채워야 버튼이 표시됩니다. 매장 찾기·제품 상세로 연결해 방문/문의를 유도하세요.</p>
                  </div>
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
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p>목록에서 페이지를 선택하거나 새 페이지를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
