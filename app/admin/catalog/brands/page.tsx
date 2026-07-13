"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { PDFDocument } from "pdf-lib";
import { EMPTY_BRAND_CATALOG, type BrandCatalog } from "@/data/brandCatalogs";

export default function AdminBrandCatalogsPage() {
  const [items, setItems] = useState<BrandCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [fetchErrMsg, setFetchErrMsg] = useState("");
  const [editing, setEditing] = useState<BrandCatalog | null>(null);
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
      const res = await fetch("/api/admin/brand-catalogs");
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setFetchErrMsg(`${e.error ?? `HTTP ${res.status}`}${e.project ? ` · 연결된 프로젝트: ${e.project}` : ""}`);
        setFetchError(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchErrMsg(err instanceof Error ? err.message : String(err));
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (text: string, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3500); };

  const openNew = () => {
    setEditing({ id: "", ...EMPTY_BRAND_CATALOG, sort_order: items.length });
    setIsNew(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const openEdit = (b: BrandCatalog) => {
    setEditing({ ...b });
    setIsNew(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const set = (key: keyof BrandCatalog, value: string | number | boolean) =>
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));

  // 대용량 우회: 브라우저 → R2 직접 업로드(presigned URL). 페이지 수는 브라우저에서 직접 센다.
  // 표지 자동 생성 기능 없음 — 카탈로그 뷰어 기능 자체를 아직 오픈하지 않아 당장은 필요 없음.
  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const [sig, pageCount] = await Promise.all([
        fetch("/api/admin/r2-upload-url", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "workup/brands", fileName: file.name, contentType: "application/pdf" }),
        }).then((r) => r.json()),
        PDFDocument.load(await file.arrayBuffer()).then((doc) => doc.getPageCount()).catch(() => 1),
      ]);
      if (!sig?.uploadUrl) { flash("업로드 URL 발급 실패 (로그인 확인)", "err"); return; }
      const up = await fetch(sig.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
      if (!up.ok) { flash(`업로드 실패: ${up.status}`, "err"); return; }
      setEditing((prev) => prev ? {
        ...prev,
        pdf_public_id: sig.key,
        pdf_file_id: sig.key,
        pdf_url: sig.publicUrl,
        page_count: pageCount,
      } : prev);
      flash(`업로드 완료 · ${pageCount}페이지`);
    } catch {
      flash("업로드 실패 (네트워크/용량 확인)", "err");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.brand_name.trim()) { flash("브랜드명을 입력하세요.", "err"); return; }
    if (!editing.pdf_public_id || editing.page_count < 1) { flash("PDF를 업로드하세요.", "err"); return; }
    setSaving(true);
    const id = isNew ? crypto.randomUUID() : editing.id;
    const payload: Record<string, unknown> = { ...editing, id };
    delete payload.created_at; delete payload.updated_at;
    const url = isNew ? "/api/admin/brand-catalogs" : `/api/admin/brand-catalogs/${editing.id}`;
    const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { flash("저장됐습니다."); setEditing(null); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "저장 실패", "err"); }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`"${label || id}" 브랜드 카탈로그를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/brand-catalogs/${id}`, { method: "DELETE" });
    if (res.ok) { flash("삭제됐습니다."); if (editing?.id === id) setEditing(null); load(); }
  };

  const toggleVisible = async (b: BrandCatalog) => {
    const next = !b.is_visible;
    setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_visible: next } : x)));
    await fetch(`/api/admin/brand-catalogs/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_visible: next }) });
  };

  const handleDrop = async (target: number) => {
    if (dragIndex === null || dragIndex === target) { setDragIndex(null); setDragOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    const updated = next.map((b, i) => ({ ...b, sort_order: i }));
    setItems(updated);
    setDragIndex(null); setDragOver(null);
    await Promise.all(updated.map((b) => fetch(`/api/admin/brand-catalogs/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: b.sort_order }) })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">브랜드 카탈로그 관리</h1>
          <p className="text-base text-gray-400 mt-1">타사 브랜드 PDF 카탈로그 <span className="font-semibold text-gray-600">({items.length}개)</span></p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/brands" target="_blank" className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">뷰어 미리보기 ↗</a>
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            브랜드 추가
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-slate-600 leading-relaxed">
        브랜드명 + PDF를 업로드하면 <span className="font-semibold text-slate-800">/brands</span> 뷰어에 책장 넘김(플립북)으로 노출됩니다. PDF는 브라우저에서 ImageKit으로 직접 업로드돼 대용량도 가능합니다.
      </div>

      {msg.text && <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>{msg.text}</div>}

      {!loading && fetchError && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ brand_catalogs 테이블을 읽지 못했습니다.</p>
          {fetchErrMsg && <div className="mb-3 px-3 py-2 bg-white border border-red-200 rounded text-xs text-red-600 font-mono break-all">실제 에러: {fetchErrMsg}</div>}
          <p className="text-xs text-amber-700 mb-3">위 “연결된 프로젝트”에 아래 SQL을 1회 실행하세요. (파일: supabase/migrate_add_brand_catalogs.sql, supabase/migrate_imagekit_brand_catalogs.sql)</p>
          <pre className="text-xs bg-white p-3 border border-amber-200 rounded overflow-x-auto text-gray-700 whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS brand_catalogs (
  id TEXT PRIMARY KEY, brand_name TEXT NOT NULL DEFAULT '',
  pdf_public_id TEXT, pdf_file_id TEXT, pdf_url TEXT, page_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE brand_catalogs TO anon, authenticated, service_role;
ALTER TABLE brand_catalogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON brand_catalogs;
CREATE POLICY "public_read" ON brand_catalogs FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`}</pre>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* 목록 */}
        <div className="w-[320px] flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">브랜드 목록</h2>
              <span className="text-xs text-slate-400">드래그로 순서 변경</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-slate-400 text-sm"><span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />불러오는 중...</div>
            ) : items.length === 0 && !editing ? (
              <div className="py-12 text-center text-slate-400 text-sm">등록된 브랜드가 없습니다.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((b, i) => (
                  <li key={b.id} draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${editing?.id === b.id ? "bg-blue-50" : "hover:bg-slate-50"} ${dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <div className="w-10 h-[56px] bg-slate-100 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                      {b.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white/30 text-[8px]">PDF</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">{b.brand_name || "(브랜드명 없음)"}</p>
                        <button onClick={() => toggleVisible(b)} title={b.is_visible ? "노출 중" : "숨김"}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${b.is_visible ? "bg-blue-500" : "bg-slate-200"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${b.is_visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{b.page_count}페이지</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button onClick={() => openEdit(b)} className="text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-0.5 hover:bg-slate-100 rounded">수정</button>
                        <button onClick={() => handleDelete(b.id, b.brand_name)} className="text-[11px] font-medium text-red-400 border border-red-200 px-2 py-0.5 hover:bg-red-50 rounded">삭제</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 편집 폼 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div ref={formRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{isNew ? "새 브랜드 추가" : "브랜드 수정"}</h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
              <div className="p-6 flex gap-6">
                <div className="flex-1 min-w-0 space-y-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="w-4 h-4 accent-[#303236]" />
                    <span className="text-sm text-gray-700">뷰어에 노출</span>
                  </label>
                  <Field label="브랜드명">
                    <input type="text" value={editing.brand_name} onChange={(e) => set("brand_name", e.target.value)} placeholder="예: 무지 / 칼하트 / ○○ 워크웨어" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#303236] rounded" />
                  </Field>
                  <Field label="PDF 파일" hint="브라우저에서 R2로 직접 업로드 — 대용량 가능">
                    <div className="space-y-2">
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">
                        {uploading ? "업로드 중..." : editing.pdf_public_id ? "다른 PDF로 교체" : "PDF 선택"}
                      </button>
                      <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }} />
                      {editing.pdf_public_id && <p className="text-xs text-green-600">✓ 업로드됨 · {editing.page_count}페이지</p>}
                    </div>
                  </Field>
                </div>

                {/* 표지 미리보기 */}
                <div className="w-[180px] flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">표지 미리보기</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100" style={{ aspectRatio: "5 / 7" }}>
                    {editing.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editing.thumbnail_url} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center px-2">PDF 업로드 시<br />표지가 표시됩니다</div>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">표지 자동 생성 기능은 아직 준비 중입니다 (카탈로그 뷰어 오픈 전).</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-3">
              <p>목록에서 브랜드를 선택하거나 “브랜드 추가”로 새로 등록하세요.</p>
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
