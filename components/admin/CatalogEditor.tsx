"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  EMPTY_CATALOG_PAGE, emptyDataFor, CATALOG_TYPE_LABEL, CATALOG_SPLIT_LAYOUT_LABEL,
  type CatalogPage, type CatalogPageType, type CatalogPageData, type ContentsItem, type CatalogHotspot, type CatalogTile,
} from "@/data/catalog";
import CatalogPageView from "@/components/CatalogPageView";

const PAGE_TYPES: CatalogPageType[] = ["image", "split", "cover", "contents", "divider"];
const INPUT = "w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#303236] rounded";

export default function CatalogEditor({ brandId }: { brandId: string }) {
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
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [focusedTocItemIdx, setFocusedTocItemIdx] = useState<number | null>(null);
  const [checkedPageIds, setCheckedPageIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const dataCacheRef = useRef<Partial<Record<CatalogPageType, CatalogPageData>>>({});

  const load = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/admin/catalog${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [brandId]);

  const flash = (text: string, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const openNew = () => {
    dataCacheRef.current = {};
    setSelectedHotspot(null);
    setFocusedTocItemIdx(null);
    setEditing({ id: "", ...EMPTY_CATALOG_PAGE, brand_id: brandId, sort_order: pages.length });
    setIsNew(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (page: CatalogPage) => {
    dataCacheRef.current = {};
    setSelectedHotspot(null);
    setFocusedTocItemIdx(null);
    setEditing({ ...page, page_type: page.page_type ?? "image", data: page.data ?? {} });
    setIsNew(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const set = (key: keyof CatalogPage, value: string | boolean | number | null) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };
  const setType = (type: CatalogPageType) => {
    setSelectedHotspot(null);
    setFocusedTocItemIdx(null);
    setEditing((prev) => {
      if (!prev || prev.page_type === type) return prev;
      dataCacheRef.current[prev.page_type] = prev.data;
      return { ...prev, page_type: type, data: dataCacheRef.current[type] ?? emptyDataFor(type) };
    });
  };
  const setData = (patch: Partial<CatalogPageData>) =>
    setEditing((prev) => (prev ? { ...prev, data: { ...(prev.data ?? {}), ...patch } } : prev));
  const updItems = (fn: (a: ContentsItem[]) => ContentsItem[]) =>
    setEditing((prev) => (prev ? { ...prev, data: { ...(prev.data ?? {}), items: fn(prev.data?.items ?? []) } } : prev));

  const mergeDuplicateTocItems = () => {
    const items: ContentsItem[] = d.items ?? [];
    const seen = new Map<string, ContentsItem>();
    const order: string[] = [];
    const empties: ContentsItem[] = [];
    for (const item of items) {
      const key = item.name.trim();
      if (!key) { empties.push(item); continue; }
      if (seen.has(key)) {
        const ex = seen.get(key)!;
        // 페이지 합치고 중복 제거 후 오름차순 정렬
        const allPages = [
          ...ex.page.split("·").map((s) => s.trim()).filter(Boolean),
          ...item.page.split("·").map((s) => s.trim()).filter(Boolean),
        ];
        const uniquePages = [...new Set(allPages)].sort((a, b) => parseInt(a.replace("P.", "")) - parseInt(b.replace("P.", "")));
        // 수량 합산 (숫자면 더하기, 아니면 이어쓰기)
        const ca = ex.count.trim(), cb = item.count.trim();
        const na = parseInt(ca), nb = parseInt(cb);
        const count = ca && cb ? (!isNaN(na) && !isNaN(nb) ? String(na + nb) : `${ca} + ${cb}`) : (ca || cb);
        seen.set(key, { ...ex, page: uniquePages.join(" · "), count });
      } else {
        seen.set(key, { ...item });
        order.push(key);
      }
    }
    const merged = [...order.map((k) => seen.get(k)!), ...empties];
    const removed = items.length - merged.length;
    if (removed === 0) { flash("중복된 항목이 없습니다."); return; }
    // 첫 번째 페이지 번호 기준 정렬
    merged.sort((a, b) => {
      const fa = parseInt((a.page.split("·")[0] ?? "").trim().replace("P.", ""));
      const fb = parseInt((b.page.split("·")[0] ?? "").trim().replace("P.", ""));
      if (isNaN(fa) || isNaN(fb)) return 0;
      return fa - fb;
    });
    updItems(() => merged);
    flash(`${removed}개 중복 항목을 병합·정렬했습니다.`);
  };

  const autoFillToc = () => {
    const visible = pages.filter((p) => p.is_visible);
    const items: ContentsItem[] = [];
    visible.forEach((p, i) => {
      if (p.page_type !== "divider") return;
      const nextDivIdx = visible.findIndex((q, qi) => qi > i && q.page_type === "divider");
      const contentStart = i + 2;
      const contentEnd = nextDivIdx !== -1 ? nextDivIdx : visible.length;
      const pageStr = contentStart <= contentEnd ? `P.${contentStart} – ${contentEnd}` : `P.${contentStart}`;
      items.push({ name: p.data?.title ?? "", count: p.data?.count ?? "", page: pageStr });
    });
    if (items.length === 0) { flash("노출 중인 구분(divider) 페이지가 없어 자동 생성할 항목이 없습니다.", "err"); return; }
    updItems(() => items);
    flash(`${items.length}개 항목을 자동으로 채웠습니다.`);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.page_type === "image" && !editing.image_url) { flash("페이지 이미지를 등록하세요.", "err"); return; }
    if (editing.page_type === "cover" && !editing.data?.brand?.trim()) { flash("표지 브랜드명을 입력하세요.", "err"); return; }
    if (editing.page_type === "divider" && !editing.data?.title?.trim()) { flash("구분 페이지 제목을 입력하세요.", "err"); return; }
    if (editing.page_type === "contents" && !(editing.data?.items ?? []).some((it) => it.name.trim())) { flash("목차 항목을 1개 이상 입력하세요.", "err"); return; }
    if (editing.page_type === "split" && ((editing.data?.tiles ?? []) as CatalogTile[]).every((t) => !t.image_url)) { flash("분할 페이지에 이미지를 1개 이상 넣으세요.", "err"); return; }
    setSaving(true);

    const id = isNew ? crypto.randomUUID() : editing.id;
    const payload: Record<string, unknown> = { ...editing, id, brand_id: editing.brand_id ?? brandId, image_url: editing.image_url || null };
    // 제목을 관리용 제목으로도 사용 (별도 필드 폐지)
    payload.admin_title = editing.title || editing.admin_title || "";
    delete payload.created_at; delete payload.updated_at;

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

  const togglePageCheck = (id: string) => {
    setCheckedPageIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleBulkDelete = async () => {
    const ids = [...checkedPageIds];
    if (ids.length === 0) return;
    if (!confirm(`선택된 ${ids.length}개 페이지를 삭제할까요?`)) return;
    await Promise.all(ids.map((id) => fetch(`/api/admin/catalog/${id}`, { method: "DELETE" })));
    setCheckedPageIds(new Set());
    if (editing && ids.includes(editing.id)) setEditing(null);
    flash(`${ids.length}개 페이지를 삭제했습니다.`);
    load();
  };

  const handleBulkDuplicate = async () => {
    const ids = [...checkedPageIds];
    if (ids.length === 0) return;
    const targets = pages.filter((p) => ids.includes(p.id));
    await Promise.all(targets.map((page, offset) => {
      const payload = {
        ...page, id: crypto.randomUUID(), brand_id: page.brand_id ?? brandId,
        admin_title: `${page.title || page.admin_title || "페이지"} (복사본)`,
        sort_order: pages.length + offset, image_url: page.image_url || null,
      };
      return fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }));
    setCheckedPageIds(new Set());
    flash(`${targets.length}개 페이지를 복제했습니다.`);
    load();
  };

  const handleDuplicate = async (page: CatalogPage) => {
    const payload: Record<string, unknown> = {
      ...page, id: crypto.randomUUID(), brand_id: page.brand_id ?? brandId,
      admin_title: `${page.title || page.admin_title || "페이지"} (복사본)`,
      sort_order: pages.length, image_url: page.image_url || null,
    };
    delete payload.created_at; delete payload.updated_at;
    const res = await fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { flash("복제됐습니다."); load(); }
    else { const err = await res.json().catch(() => ({})); flash(err.error ?? "복제 실패", "err"); }
  };

  const toggleVisible = async (page: CatalogPage) => {
    const next = !page.is_visible;
    const snapshot = pages;
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

  const sortPagesByTitle = async () => {
    const getLabel = (p: CatalogPage) =>
      (p.title || p.admin_title || p.data?.brand || p.data?.title || "").trim().toLowerCase();
    const sorted = [...pages].sort((a, b) => getLabel(a).localeCompare(getLabel(b), "ko"));
    const updated = sorted.map((p, i) => ({ ...p, sort_order: i }));
    const snapshot = pages;
    setPages(updated);
    const results = await Promise.allSettled(updated.map((p) =>
      fetch(`/api/admin/catalog/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: p.sort_order }) })
        .then((r) => { if (!r.ok) throw new Error(); })
    ));
    if (results.some((r) => r.status === "rejected")) { setPages(snapshot); flash("정렬 저장에 실패했습니다.", "err"); }
    else flash(`${updated.length}개 페이지를 제목순으로 정렬했습니다.`);
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) { setDragIndex(null); setDragOver(null); return; }
    const next = [...pages];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const updated = next.map((p, i) => ({ ...p, sort_order: i }));
    const snapshot = pages;
    setPages(updated);
    setDragIndex(null); setDragOver(null);
    const results = await Promise.allSettled(updated.map((p) =>
      fetch(`/api/admin/catalog/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: p.sort_order }) })
        .then((r) => { if (!r.ok) throw new Error(); })
    ));
    if (results.some((r) => r.status === "rejected")) { setPages(snapshot); flash("순서 저장에 실패했습니다.", "err"); }
  };

  const d = editing?.data ?? {};
  const hotspots: CatalogHotspot[] = (d.hotspots ?? []) as CatalogHotspot[];
  const setHotspot = (i: number, patch: Partial<CatalogHotspot>) =>
    setData({ hotspots: hotspots.map((h, idx) => idx === i ? { ...h, ...patch } : h) });
  const addHotspot = () => { setData({ hotspots: [...hotspots, { x: 50, y: 50, name: "" }] }); setSelectedHotspot(hotspots.length); };
  const removeHotspot = (i: number) => { setData({ hotspots: hotspots.filter((_, idx) => idx !== i) }); setSelectedHotspot(null); };

  const tiles = (d.tiles ?? []) as CatalogTile[];
  const setTiles = (fn: (t: CatalogTile[]) => CatalogTile[]) => setData({ tiles: fn(tiles) });
  const uploadTileImage = async (i: number, file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) { const { url } = await res.json(); setTiles((t) => t.map((x, idx) => idx === i ? { ...x, image_url: url } : x)); }
    else { const err = await res.json().catch(() => ({})); flash(`업로드 실패: ${err.error ?? res.status}`, "err"); }
  };

  const deriveCode = (season: string, existingCode?: string): string => {
    const year = season.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
    const s = season.toUpperCase();
    const sc = /F\/W|FW|FALL|AUTUMN|A\/W/.test(s) ? "FW" : "SS";
    const rand = existingCode?.match(/(\d{3})$/)?.[1]
      ?? String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `Cat. WU-${year}-${sc}-${rand}`;
  };

  const regenCode = () => {
    const season = d.season ?? "";
    const year = season.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
    const s = season.toUpperCase();
    const sc = /F\/W|FW|FALL|AUTUMN|A\/W/.test(s) ? "FW" : "SS";
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    setData({ code: `Cat. WU-${year}-${sc}-${rand}` });
  };

  const togglePageInItem = (itemIdx: number, pageNum: number) => {
    const pageTag = `P.${pageNum}`;
    updItems((a) => a.map((x, idx) => {
      if (idx !== itemIdx) return x;
      const parts = x.page.split("·").map((s) => s.trim()).filter(Boolean);
      const pi = parts.indexOf(pageTag);
      if (pi >= 0) parts.splice(pi, 1);
      else parts.push(pageTag);
      parts.sort((a, b) => (parseInt(a.replace("P.", "")) || 0) - (parseInt(b.replace("P.", "")) || 0));
      return { ...x, page: parts.join(" · ") };
    }));
  };


  return (
    <div className="space-y-4">
      {/* 툴바 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          디지털 카탈로그(플립북) 페이지 관리 <span className="font-semibold text-slate-700">({pages.length}페이지)</span>
        </p>
        <div className="flex items-center gap-2">
          <a href={`/admin/catalog/import?brand=${encodeURIComponent(brandId)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            엑셀 업로드
          </a>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            페이지 추가
          </button>
        </div>
      </div>

      {/* 피드백 */}
      {msg.text && (
        <div className={`px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>{msg.text}</div>
      )}

      {/* Supabase 미설정 안내 */}
      {!loading && fetchError && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ catalog_pages 테이블을 읽지 못했습니다.</p>
          {fetchErrMsg && <div className="mb-3 px-3 py-2 bg-white border border-red-200 rounded text-xs text-red-600 font-mono break-all">실제 에러: {fetchErrMsg}</div>}
          <p className="text-xs text-amber-700">위 "연결된 프로젝트"에 SQL을 1회 실행하세요. 전체 SQL은 <a href={`/admin/catalog?brand=${encodeURIComponent(brandId)}`} className="underline text-blue-600">카탈로그 관리 페이지</a>에서 확인할 수 있습니다.</p>
        </div>
      )}

      <div className="flex gap-4 items-start">
        {/* 페이지 목록 */}
        <div className="w-[300px] flex-shrink-0">
          <div className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${editing?.page_type === "contents" && focusedTocItemIdx !== null ? "border-2 border-blue-400" : "border border-slate-200"}`}>
            <div className="px-3 py-2 border-b border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none"
                  onClick={() => { if (checkedPageIds.size === pages.length) setCheckedPageIds(new Set()); else setCheckedPageIds(new Set(pages.map((p) => p.id))); }}>
                  <input type="checkbox" readOnly className="w-3.5 h-3.5 accent-blue-600 pointer-events-none"
                    checked={pages.length > 0 && checkedPageIds.size === pages.length} />
                  <span className="text-[10px] text-slate-500">전체 선택</span>
                </label>
                {checkedPageIds.size > 0 && (
                  <span className="text-[10px] text-blue-600 font-semibold">{checkedPageIds.size}개 선택됨</span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <button onClick={sortPagesByTitle} title="제목 가나다순 정렬 후 저장"
                    className="text-[10px] text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-2 py-0.5 rounded font-medium transition-colors">
                    가나다순
                  </button>
                  <span className="text-[10px] text-slate-400">드래그 순서변경</span>
                </div>
              </div>
              {checkedPageIds.size > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={checkedPageIds.size !== 1}
                    onClick={() => { const p = pages.find((p) => checkedPageIds.has(p.id)); if (p) { openEdit(p); setCheckedPageIds(new Set()); } }}
                    className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    수정
                  </button>
                  <button onClick={handleBulkDuplicate}
                    className="px-2.5 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                    복제
                  </button>
                  <button onClick={handleBulkDelete}
                    className="px-2.5 py-1 text-[10px] font-semibold text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
                    삭제
                  </button>
                </div>
              )}
            </div>
            {editing?.page_type === "contents" && focusedTocItemIdx !== null && (
              <div className="px-3 py-2 bg-blue-600 text-white flex items-center justify-between">
                <span className="text-[10px] font-semibold">항목 {focusedTocItemIdx + 1} 선택 중 · 페이지를 클릭해 추가/제거</span>
                <button onClick={() => setFocusedTocItemIdx(null)} className="text-white/70 hover:text-white text-xs px-1.5 rounded">완료</button>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs">
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />불러오는 중...
              </div>
            ) : pages.length === 0 && !editing ? (
              <div className="py-10 text-center text-slate-400 text-xs">등록된 페이지가 없습니다.</div>
            ) : (() => {
              const isTocPickMode = editing?.page_type === "contents" && focusedTocItemIdx !== null;
              const focusedPageStr = isTocPickMode ? ((d.items ?? [])[focusedTocItemIdx!]?.page ?? "") : "";
              const focusedPageSet = new Set(focusedPageStr.split("·").map((s) => s.trim()).filter(Boolean));
              return (
              <ul className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {pages.map((page, i) => {
                  const pageTag = `P.${i + 1}`;
                  const isSelected = isTocPickMode && focusedPageSet.has(pageTag);
                  return (
                  <li key={page.id}
                    draggable={!isTocPickMode && checkedPageIds.size === 0}
                    onDragStart={!isTocPickMode && checkedPageIds.size === 0 ? () => setDragIndex(i) : undefined}
                    onDragOver={!isTocPickMode ? (e) => { e.preventDefault(); setDragOver(i); } : undefined}
                    onDrop={!isTocPickMode ? () => handleDrop(i) : undefined}
                    onDragEnd={!isTocPickMode ? () => { setDragIndex(null); setDragOver(null); } : undefined}
                    onClick={isTocPickMode ? () => togglePageInItem(focusedTocItemIdx!, i + 1) : () => openEdit(page)}
                    className={`flex items-start gap-2 px-3 py-2.5 transition-colors cursor-pointer
                      ${isTocPickMode
                        ? isSelected ? "bg-blue-100 border-l-2 border-blue-500" : "hover:bg-blue-50"
                        : editing?.id === page.id ? "bg-blue-50 border-l-2 border-blue-400" : "hover:bg-slate-50"}
                      ${!isTocPickMode && dragOver === i && dragIndex !== i ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    {isTocPickMode ? (
                      <div className={`w-2 flex-shrink-0 self-stretch rounded-sm mr-1 ${isSelected ? "bg-blue-400" : "bg-slate-200"}`} />
                    ) : (
                      <input type="checkbox" readOnly
                        checked={checkedPageIds.has(page.id)}
                        onClick={(e) => { e.stopPropagation(); togglePageCheck(page.id); }}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0 mt-1 cursor-pointer" />
                    )}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-10 h-[57px] overflow-hidden rounded border border-slate-200 bg-slate-100">
                        {(page.page_type ?? "image") !== "image" ? (
                          <div className="w-full h-full" style={{ transform: "scale(0.99)" }}>
                            <CatalogPageView page={page} />
                          </div>
                        ) : page.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={page.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center"><span className="text-white/30 text-[8px] font-bold">WU</span></div>
                        )}
                      </div>
                      <span className={`text-[9px] mt-0.5 font-mono ${isSelected ? "text-blue-600 font-bold" : "text-slate-400"}`}>P.{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded flex-shrink-0">{CATALOG_TYPE_LABEL[page.page_type ?? "image"]}</span>
                        <p className="flex-1 min-w-0 text-[11px] font-semibold text-slate-800 truncate">{page.admin_title || page.title || page.data?.brand || page.data?.title || "(제목 없음)"}</p>
                        {!isTocPickMode && (
                          <button onClick={(e) => { e.stopPropagation(); toggleVisible(page); }} title={page.is_visible ? "노출 중" : "숨김"}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${page.is_visible ? "bg-blue-500" : "bg-slate-200"}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${page.is_visible ? "translate-x-[14px]" : "translate-x-0.5"}`} />
                          </button>
                        )}
                        {isTocPickMode && isSelected && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">✓ 선택됨</span>
                        )}
                      </div>
                      {!isTocPickMode && (page.data?.hotspots?.length ?? 0) > 0 && <p className="text-[9px] text-[#E5541B] mt-0.5">📍 핫스팟 {page.data!.hotspots!.length}개</p>}
                    </div>
                  </li>
                  );
                })}
              </ul>
              );
            })()}
          </div>
        </div>

        {/* 편집 폼 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div ref={formRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{isNew ? "새 페이지 추가" : "페이지 수정"} <span className="text-slate-400 text-xs font-normal">· {CATALOG_TYPE_LABEL[editing.page_type]}</span></h3>
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {saving ? (<><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>) : "저장"}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-5 flex gap-5">
                <div className="flex-1 min-w-0 space-y-4">
                  {/* 종류 선택 */}
                  <CField label="페이지 종류">
                    <div className="flex gap-1.5 flex-wrap">
                      {PAGE_TYPES.map((t) => (
                        <button key={t} onClick={() => setType(t)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${editing.page_type === t ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                          {CATALOG_TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  </CField>

                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editing.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="w-4 h-4 accent-[#303236]" />
                      <span className="text-sm text-gray-700">카탈로그에 노출</span>
                    </label>
                  </div>

                  {editing.page_type === "image" && (
                    <>
                      <CField label="페이지 이미지" hint="권장 5:7 세로형 (예: 1000×1400px) · 10MB 이하">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://example.com/page.jpg" className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </CField>
                      <CField label="제목 (선택)" hint="이미지 하단 캡션. 비우면 이미지만."><input type="text" value={editing.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 2026 SS 작업복 라인" className={INPUT} /></CField>
                      <CField label="설명 (선택)"><textarea value={editing.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="예: 현장에서 검증된 내구성과 활동성" className={`${INPUT} resize-none`} /></CField>
                      <div className="pt-2 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">제품 핫스팟</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{selectedHotspot !== null ? "→ 오른쪽 미리보기 이미지를 클릭해 위치 설정" : "핫스팟 번호를 클릭해 선택 후 이미지 클릭으로 위치 지정"}</p>
                          </div>
                          <button type="button" onClick={addHotspot} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-[#E5541B] border border-orange-200 hover:bg-orange-100 transition-colors rounded-lg flex-shrink-0">+ 추가</button>
                        </div>
                        {hotspots.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-1 leading-relaxed">등록된 핫스팟이 없습니다.</p>
                        ) : (
                          <div className="space-y-2">
                            {hotspots.map((hs, i) => (
                              <div key={i} className={`p-3 rounded-lg border transition-colors ${selectedHotspot === i ? "border-[#E5541B] bg-orange-50/40" : "border-slate-200 bg-slate-50"}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <button type="button" onClick={() => setSelectedHotspot(selectedHotspot === i ? null : i)}
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${selectedHotspot === i ? "bg-[#E5541B] text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>
                                    {i + 1}번 핫스팟{selectedHotspot === i ? " · 선택됨" : ""}
                                  </button>
                                  <button type="button" onClick={() => removeHotspot(i)} className="text-red-400 hover:text-red-600 text-xs px-1.5 py-0.5 hover:bg-red-50 rounded transition-colors">삭제</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">X 위치 %</label><input type="number" min={0} max={100} value={hs.x} onChange={(e) => setHotspot(i, { x: Number(e.target.value) })} className={INPUT} /></div>
                                  <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Y 위치 %</label><input type="number" min={0} max={100} value={hs.y} onChange={(e) => setHotspot(i, { y: Number(e.target.value) })} className={INPUT} /></div>
                                </div>
                                <div className="space-y-1.5">
                                  <input type="text" value={hs.name} onChange={(e) => setHotspot(i, { name: e.target.value })} placeholder="제품명 (필수)" className={INPUT} />
                                  <input type="text" value={hs.desc ?? ""} onChange={(e) => setHotspot(i, { desc: e.target.value || undefined })} placeholder="간단 설명 (선택)" className={INPUT} />
                                  <input type="text" value={hs.price ?? ""} onChange={(e) => setHotspot(i, { price: e.target.value || undefined })} placeholder="가격 예: 89,000원" className={INPUT} />
                                  {/* 핫스팟 제품 이미지 업로드 */}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {hs.image_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={hs.image_url} alt="핫스팟 이미지" className="w-12 h-12 object-cover rounded border border-slate-200 flex-shrink-0" />
                                      )}
                                      <label className={`flex-1 flex items-center gap-1.5 px-3 py-2 border rounded text-xs cursor-pointer transition-colors ${hs.image_url ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" : "border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"}`}>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {hs.image_url ? "이미지 교체" : "제품 이미지 업로드"}
                                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                          const file = e.target.files?.[0]; if (!file) return;
                                          setUploading(true);
                                          const form = new FormData(); form.append("file", file);
                                          const res = await fetch("/api/admin/upload", { method: "POST", body: form });
                                          setUploading(false);
                                          if (res.ok) { const { url } = await res.json(); setHotspot(i, { image_url: url }); }
                                          else { const err = await res.json().catch(() => ({})); flash(`업로드 실패: ${err.error ?? res.status}`, "err"); }
                                          e.target.value = "";
                                        }} />
                                      </label>
                                      {hs.image_url && (
                                        <button type="button" onClick={() => setHotspot(i, { image_url: undefined })} className="text-slate-400 hover:text-red-500 text-xs px-1.5 py-1 rounded border border-slate-200 hover:border-red-200 transition-colors flex-shrink-0">✕</button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">이미지 등록 시 팝업에 사진이 먼저 표시됩니다. (JPG/PNG · 5MB 이하)</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {editing.page_type === "split" && (
                    <>
                      <CField label="분할 레이아웃">
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(CATALOG_SPLIT_LAYOUT_LABEL) as (keyof typeof CATALOG_SPLIT_LAYOUT_LABEL)[]).map((key) => (
                            <button key={key} type="button" onClick={() => setData({ layout: key })}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${(d.layout ?? "2col") === key ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                              {CATALOG_SPLIT_LAYOUT_LABEL[key]}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                          {(d.layout ?? "2col") === "2col" && "각 칸 권장: 500 × 1400px (세로형 5:14)"}
                          {(d.layout ?? "2col") === "2row" && "각 칸 권장: 1000 × 700px (가로형 10:7)"}
                          {(d.layout ?? "2col") === "3col" && "각 칸 권장: 333 × 1400px (세로형 1:4.2)"}
                          {(d.layout ?? "2col") === "grid4" && "각 칸 권장: 500 × 700px (세로형 5:7)"}
                        </p>
                      </CField>
                      <CField label="목차 표시 제목 (선택)"><input type="text" value={editing.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 피그먼트 워시드 티셔츠" className={INPUT} /></CField>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">칸 목록 ({tiles.length})</p>
                          <button type="button" onClick={() => setTiles((t) => [...t, { image_url: "", title: "" }])} className="px-3 py-1.5 text-xs font-semibold bg-orange-50 text-[#E5541B] border border-orange-200 hover:bg-orange-100 transition-colors rounded-lg">+ 칸 추가</button>
                        </div>
                        {tiles.map((tile, i) => (
                          <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-500">{i + 1}번 칸</span>
                              <button type="button" onClick={() => setTiles((t) => t.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs px-1.5 py-0.5 hover:bg-red-50 rounded transition-colors">삭제</button>
                            </div>
                            <input type="text" value={tile.image_url} onChange={(e) => setTiles((t) => t.map((x, idx) => idx === i ? { ...x, image_url: e.target.value } : x))} placeholder="이미지 URL" className={INPUT} />
                            <label className="inline-block px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer">
                              {uploading ? "업로드 중..." : "파일 업로드"}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTileImage(i, f); e.target.value = ""; }} />
                            </label>
                            <input type="text" value={tile.title ?? ""} onChange={(e) => setTiles((t) => t.map((x, idx) => idx === i ? { ...x, title: e.target.value || undefined } : x))} placeholder="작은 제목 (선택)" className={INPUT} />
                            <input type="text" value={tile.href ?? ""} onChange={(e) => setTiles((t) => t.map((x, idx) => idx === i ? { ...x, href: e.target.value || undefined } : x))} placeholder="링크 (선택)" className={INPUT} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {editing.page_type === "cover" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <CField label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Product Catalog" className={INPUT} /></CField>
                        <CField label="시즌 문구">
                          <div className="flex items-center gap-2">
                            <input type="text" value={d.season ?? ""} onChange={(e) => {
                              const s = e.target.value;
                              setData({ season: s, code: s.trim() ? deriveCode(s, d.code ?? "") : (d.code ?? "") });
                            }} placeholder="2026 F/W" className={`${INPUT} flex-1`} />
                          </div>
                        </CField>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <CField label="브랜드명 (큰 글자)"><input type="text" value={d.brand ?? ""} onChange={(e) => setData({ brand: e.target.value })} placeholder="WORKUP" className={INPUT} /></CField>
                        <CField label="뱃지"><input type="text" value={d.badge ?? ""} onChange={(e) => setData({ badge: e.target.value })} placeholder="2026 SS" className={INPUT} /></CField>
                      </div>
                      <CField label="메모 (선택)"><input type="text" value={d.note ?? ""} onChange={(e) => setData({ note: e.target.value })} placeholder="예: 12 PRODUCTS" className={INPUT} /></CField>
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <CField label="하단 코드">
                          <div className="flex items-center gap-2">
                            <input type="text" readOnly value={d.code ?? ""} placeholder="Cat. WU-2026-FW-001" className={`${INPUT} flex-1 bg-slate-50 text-slate-500 cursor-default`} />
                            <button type="button" onClick={regenCode} title="새 번호 생성" className="flex-shrink-0 px-2.5 py-2 text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap">🔄 재생성</button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">시즌 문구에서 자동 생성 · 직접 수정 불가</p>
                        </CField>
                        <CColorField label="배경색" value={d.bg ?? "#303236"} onChange={(v) => setData({ bg: v })} />
                      </div>
                      <CField label="배경 이미지 (선택)" hint="표지 전체에 이미지가 깔립니다. 비우면 배경색만. 권장: 1000×1400px (5:7 세로형) · 10MB 이하">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </CField>
                    </>
                  )}

                  {editing.page_type === "contents" && (
                    <>
                      <CField label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Contents" className={INPUT} /></CField>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-500">목차 항목</label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={autoFillToc} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium transition-colors">↻ 자동 채우기</button>
                            <button type="button" onClick={mergeDuplicateTocItems} title="같은 이름의 항목 병합 + 페이지 오름차순 정렬" className="text-xs text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-2.5 py-1 rounded-lg font-medium transition-colors">⇌ 중복 병합·정렬</button>
                            <button type="button" onClick={() => updItems((a) => [...a, { name: "", count: "", page: "" }])} className="text-xs text-blue-600 hover:text-blue-800">+ 항목 추가</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(d.items ?? []).map((it, i, arr) => {
                            const isFocused = focusedTocItemIdx === i;
                            const pageParts = it.page.split("·").map((s) => s.trim()).filter(Boolean);
                            return (
                              <div key={i} className={`rounded-lg border transition-colors ${isFocused ? "border-blue-400 bg-blue-50/40" : "border-slate-200 bg-white"}`}>
                                <div className="grid grid-cols-[auto_1fr_auto_56px_auto] gap-2 items-center p-2">
                                  <div className="flex flex-col">
                                    <button type="button" aria-label="위로 이동" disabled={i === 0} onClick={() => updItems((a) => { if (i === 0) return a; const n = [...a]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="text-slate-400 hover:text-slate-700 disabled:opacity-25 text-[11px] leading-none px-1">▲</button>
                                    <button type="button" aria-label="아래로 이동" disabled={i === arr.length - 1} onClick={() => updItems((a) => { if (i === a.length - 1) return a; const n = [...a]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="text-slate-400 hover:text-slate-700 disabled:opacity-25 text-[11px] leading-none px-1">▼</button>
                                  </div>
                                  <input type="text" value={it.name} onChange={(e) => updItems((a) => a.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="항목명 (예: 작업복)" className={INPUT} />
                                  {/* 페이지 chips + 선택 버튼 — 인라인 */}
                                  <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                                    {pageParts.length > 0 ? pageParts.map((pt) => (
                                      <span key={pt} className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-mono whitespace-nowrap">
                                        {pt}
                                        <button type="button" onClick={() => {
                                          updItems((a) => a.map((x, idx) => {
                                            if (idx !== i) return x;
                                            const ps = x.page.split("·").map((s) => s.trim()).filter((s) => s !== pt);
                                            return { ...x, page: ps.join(" · ") };
                                          }));
                                        }} className="text-blue-400 hover:text-red-500 leading-none ml-0.5">×</button>
                                      </span>
                                    )) : null}
                                    <button type="button"
                                      onClick={() => setFocusedTocItemIdx(isFocused ? null : i)}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors whitespace-nowrap ${isFocused ? "bg-blue-500 text-white border-blue-500 font-semibold" : "border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400"}`}>
                                      {isFocused ? "← 왼쪽" : "+ 페이지"}
                                    </button>
                                  </div>
                                  <input type="text" value={it.count} onChange={(e) => updItems((a) => a.map((x, idx) => idx === i ? { ...x, count: e.target.value } : x))} placeholder="수량" className={INPUT} />
                                  <button type="button" onClick={() => { updItems((a) => a.filter((_, idx) => idx !== i)); if (focusedTocItemIdx === i) setFocusedTocItemIdx(null); }} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <CField label="하단 문구"><input type="text" value={d.footer ?? ""} onChange={(e) => setData({ footer: e.target.value })} placeholder="WORKUP 2026 SS CATALOG" className={INPUT} /></CField>
                    </>
                  )}

                  {editing.page_type === "divider" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <CField label="상단 영문 (eyebrow)"><input type="text" value={d.eyebrow ?? ""} onChange={(e) => setData({ eyebrow: e.target.value })} placeholder="Category 01" className={INPUT} /></CField>
                        <CField label="번호 (큰 숫자)"><input type="text" value={d.no ?? ""} onChange={(e) => setData({ no: e.target.value })} placeholder="01" className={INPUT} /></CField>
                      </div>
                      <CField label="제목"><input type="text" value={d.title ?? ""} onChange={(e) => setData({ title: e.target.value })} placeholder="현장" className={INPUT} /></CField>
                      <CField label="설명 (줄바꿈 Enter)"><textarea value={d.desc ?? ""} onChange={(e) => setData({ desc: e.target.value })} rows={2} placeholder="현장에서 검증된 퍼포먼스." className={`${INPUT} resize-none`} /></CField>
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <CField label="개수 문구"><input type="text" value={d.count ?? ""} onChange={(e) => setData({ count: e.target.value })} placeholder="5개 제품" className={INPUT} /></CField>
                        <CColorField label="배경색" value={d.bg ?? "#303236"} onChange={(v) => setData({ bg: v })} />
                      </div>
                      <CField label="배경 이미지 (선택)" hint="비우면 배경색만. 권장: 1000×1400px (5:7 세로형) · 10MB 이하">
                        <div className="space-y-2">
                          <input type="text" value={editing.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." className={INPUT} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">또는 파일 업로드</span>
                            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg">{uploading ? "업로드 중..." : "파일 선택"}</button>
                            {editing.image_url && <button type="button" onClick={() => set("image_url", "")} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded-lg">제거</button>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                      </CField>
                    </>
                  )}
                </div>

                {/* 실시간 미리보기 */}
                <div className="w-[260px] flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">미리보기</p>
                  <div
                    className={`rounded-lg overflow-hidden border border-slate-200 shadow-sm relative ${editing.page_type === "image" && selectedHotspot !== null ? "cursor-crosshair" : ""}`}
                    style={{ aspectRatio: "5 / 7" }}
                    onClick={(e) => {
                      if (editing.page_type !== "image" || selectedHotspot === null) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round((e.clientX - rect.left) / rect.width * 100);
                      const y = Math.round((e.clientY - rect.top) / rect.height * 100);
                      setHotspot(selectedHotspot, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                    }}>
                    <CatalogPageView page={editing} />
                    {editing.page_type === "image" && hotspots.map((hs, i) => (
                      <div key={i} style={{ position: "absolute", left: `${hs.x}%`, top: `${hs.y}%`, transform: "translate(-50%,-50%)", zIndex: 20 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedHotspot(selectedHotspot === i ? null : i); }}
                          className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold transition-all ${i === selectedHotspot ? "bg-blue-500 scale-110" : "bg-[#E5541B]"}`}>
                          {i + 1}
                        </button>
                      </div>
                    ))}
                    {editing.page_type === "image" && selectedHotspot !== null && (
                      <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-black/60 text-white text-[9px] tracking-wide text-center pointer-events-none">이미지 클릭 → 위치 설정</div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">실제 카탈로그(플립북)에 표시되는 모습입니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm gap-2">
              <p>목록에서 페이지를 선택하거나 "페이지 추가"를 눌러 시작하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function CColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 border border-gray-200 rounded px-2 py-2 text-sm font-mono focus:outline-none focus:border-[#303236]" />
      </div>
    </div>
  );
}
