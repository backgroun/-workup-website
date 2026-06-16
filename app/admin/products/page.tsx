"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product, MainExpose } from "@/data/products";
import { mainCategories, subCategoriesByMain } from "@/data/products";

// ── 상수 ──────────────────────────────────────────────────────────────────────
type SearchType = "상품명" | "상품코드" | "브랜드" | "제조사";
type DisplayFilter = "전체" | "진열함" | "진열안함";
type DatePreset = "전체" | "오늘" | "3일" | "7일" | "1개월" | "3개월" | "1년";
type SortBy = "최신순" | "진열순" | "이름순";

const DISPLAY_ON = ["판매중", "예약판매", "품절"];
const DISPLAY_OFF = ["판매중지", "진열대기"];

const STATUS_COLOR: Record<string, string> = {
  판매중:   "bg-emerald-100 text-emerald-700",
  품절:     "bg-red-100 text-red-600",
  판매중지: "bg-gray-100 text-gray-500",
  예약판매: "bg-blue-100 text-blue-600",
  진열대기: "bg-amber-100 text-amber-600",
};

const EXPOSE_COLOR: Record<string, string> = {
  신상품:  "bg-[#ff550c] text-white",
  추천상품: "bg-purple-100 text-purple-700",
  베스트:  "bg-amber-100 text-amber-700",
  기획전:  "bg-blue-100 text-blue-700",
};

function getDateCutoff(preset: DatePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "오늘":   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "3일":   return new Date(now.getTime() - 3 * 86400000);
    case "7일":   return new Date(now.getTime() - 7 * 86400000);
    case "1개월": return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3개월": return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "1년":   return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default: return null;
  }
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return iso.slice(0, 10);
}

const DATE_PRESETS: DatePreset[] = ["오늘", "3일", "7일", "1개월", "3개월", "1년", "전체"];
const STATUS_OPTIONS = ["전체", "판매중", "품절", "판매중지", "예약판매", "진열대기"];
const EXPOSE_OPTIONS: MainExpose[] = ["신상품", "추천상품", "베스트", "기획전"];
const SEARCH_TYPES: SearchType[] = ["상품명", "상품코드", "브랜드", "제조사"];

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  // ─ 데이터 ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [apiErrMsg, setApiErrMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);

  // ─ 검색 & 필터 ─────────────────────────────────────────────────────────
  const [searchType, setSearchType]   = useState<SearchType>("상품명");
  const [searchQuery, setSearchQuery] = useState("");
  const [applied, setApplied]         = useState({ type: "상품명" as SearchType, query: "" });
  const [datePreset, setDatePreset]   = useState<DatePreset>("전체");
  const [dateStart, setDateStart]     = useState("");
  const [dateEnd, setDateEnd]         = useState("");
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>("전체");
  const [statusFilter, setStatusFilter]   = useState("전체");

  // ─ 선택 & 정렬 ─────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy]     = useState<SortBy>("최신순");
  const [perPage, setPerPage]   = useState(20);
  const [page, setPage]         = useState(1);

  // ─ 메인진열 수정 모달 ──────────────────────────────────────────────────
  const [exposeModal, setExposeModal]     = useState(false);
  const [exposeMode, setExposeMode]       = useState<"추가" | "교체" | "제거">("추가");
  const [exposeTarget, setExposeTarget]   = useState<Set<MainExpose>>(new Set());
  const [exposeSaving, setExposeSaving]   = useState(false);

  // ─ 카테고리 일괄 변경 모달 ─────────────────────────────────────────
  type CatEntry = { main: string; sub: string };
  const [catModal, setCatModal]       = useState(false);
  const [catModalCats, setCatModalCats] = useState<CatEntry[]>([]);
  const [catAddMain, setCatAddMain]   = useState("");
  const [catAddSub, setCatAddSub]     = useState("");
  const [catSaving, setCatSaving]     = useState(false);
  const [catList, setCatList] = useState<{ name: string; subs: string[] }[]>(
    mainCategories.map(n => ({ name: n, subs: subCategoriesByMain[n as keyof typeof subCategoriesByMain] ?? [] }))
  );

  // ─ 로드 ────────────────────────────────────────────────────────────────
  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true); setTableError(false); setApiErrMsg("");
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        let e = `HTTP ${res.status}`;
        try { const j = await res.json(); e = j.error ?? JSON.stringify(j); } catch { /* noop */ }
        setTableError(true); setApiErrMsg(e); setProducts([]);
      } else {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) { setTableError(true); setApiErrMsg(String(e)); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin/site-settings/categories")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length) setCatList(d); })
      .catch(() => {});
  }, []);

  const getProductCats = (p: Product): CatEntry[] => {
    const raw = (p as Record<string, unknown>).categories as CatEntry[] | undefined;
    if (raw?.length) return raw;
    return p.category ? [{ main: p.category, sub: p.subCategory ?? "" }] : [];
  };

  const openCatModal = () => {
    setCatModalCats([]);
    setCatAddMain(catList[0]?.name ?? "");
    setCatAddSub("");
    setCatModal(true);
  };

  const addModalCat = () => {
    if (!catAddMain) return;
    const already = catModalCats.some(c => c.main === catAddMain && c.sub === catAddSub);
    if (!already) setCatModalCats(prev => [...prev, { main: catAddMain, sub: catAddSub }]);
  };

  const removeModalCat = (idx: number) => setCatModalCats(prev => prev.filter((_, i) => i !== idx));

  const bulkApplyCat = async () => {
    if (!selected.size || catModalCats.length === 0) return;
    setCatSaving(true);
    const primary = catModalCats[0];
    const results = await Promise.all(
      products.filter(p => selected.has(p.id)).map(async p => {
        const res = await fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...p,
            category: primary.main,
            subCategory: primary.sub,
            categories: catModalCats,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { ok: false, id: p.id, msg: err.error ?? `HTTP ${res.status}` };
        }
        return { ok: true, id: p.id };
      })
    );
    setCatSaving(false);
    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      showMsg(`오류: ${failed[0].msg}`);
    } else {
      setCatModal(false);
      setCatModalCats([]);
      showMsg(`${selected.size}개 상품 카테고리 변경 완료`);
      setSelected(new Set());
      load();
    }
  };

  // ─ 필터링 & 정렬 ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...products];

    // 검색
    if (applied.query) {
      const q = applied.query.toLowerCase();
      list = list.filter((p) => {
        if (applied.type === "상품명")   return p.name.toLowerCase().includes(q);
        if (applied.type === "상품코드") return (p.sku ?? "").toLowerCase().includes(q);
        if (applied.type === "브랜드")   return (p.brand ?? "").toLowerCase().includes(q);
        if (applied.type === "제조사")   return (p.manufacturer ?? "").toLowerCase().includes(q);
        return true;
      });
    }

    // 날짜
    if (datePreset !== "전체") {
      const cutoff = getDateCutoff(datePreset);
      if (cutoff) list = list.filter(p => !p.createdAt || new Date(p.createdAt) >= cutoff);
    } else if (dateStart || dateEnd) {
      list = list.filter(p => {
        if (!p.createdAt) return true;
        const d = new Date(p.createdAt);
        if (dateStart && d < new Date(dateStart)) return false;
        if (dateEnd && d > new Date(dateEnd + "T23:59:59")) return false;
        return true;
      });
    }

    // 진열 상태
    if (displayFilter === "진열함")   list = list.filter(p => DISPLAY_ON.includes(p.status ?? "판매중"));
    if (displayFilter === "진열안함") list = list.filter(p => DISPLAY_OFF.includes(p.status ?? "판매중"));

    // 판매 상태
    if (statusFilter !== "전체") list = list.filter(p => (p.status ?? "판매중") === statusFilter);

    // 정렬
    list.sort((a, b) => {
      if (sortBy === "이름순") return a.name.localeCompare(b.name);
      if (sortBy === "최신순") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      return 0;
    });

    return list;
  }, [products, applied, datePreset, dateStart, dateEnd, displayFilter, statusFilter, sortBy]);

  const stats = useMemo(() => ({
    total:    filtered.length,
    판매중:   filtered.filter(p => (p.status ?? "판매중") === "판매중").length,
    품절:     filtered.filter(p => p.status === "품절").length,
    판매중지: filtered.filter(p => p.status === "판매중지").length,
    진열대기: filtered.filter(p => p.status === "진열대기").length,
    예약판매: filtered.filter(p => p.status === "예약판매").length,
  }), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSearch = () => {
    setApplied({ type: searchType, query: searchQuery });
    setPage(1); setSelected(new Set());
  };
  const handleReset = () => {
    setSearchQuery("");
    setSearchType("상품명");
    setApplied({ type: "상품명", query: "" });
    setDisplayFilter("전체"); setStatusFilter("전체");
    setDatePreset("전체"); setDateStart(""); setDateEnd("");
    setPage(1); setSelected(new Set());
  };

  // ─ 체크박스 ────────────────────────────────────────────────────────────
  const allSel = paginated.length > 0 && paginated.every(p => selected.has(p.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSel) paginated.forEach(p => next.delete(p.id));
      else paginated.forEach(p => next.add(p.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ─ 일괄 작업 ────────────────────────────────────────────────────────────
  const bulkStatus = async (status: string) => {
    if (!selected.size) return;
    await Promise.all(
      products.filter(p => selected.has(p.id)).map(p =>
        fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, status }),
        })
      )
    );
    showMsg(`${selected.size}개 상품 상태 → "${status}"`);
    setSelected(new Set()); load();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`선택된 ${selected.size}개 제품을 삭제하시겠습니까?`)) return;
    await Promise.all([...selected].map(id => fetch(`/api/admin/products/${id}`, { method: "DELETE" })));
    showMsg(`${selected.size}개 삭제 완료`);
    setSelected(new Set()); load();
  };

  const applyMainExpose = async () => {
    if (!selected.size || !exposeTarget.size) return;
    setExposeSaving(true);
    const targets = [...exposeTarget] as MainExpose[];
    await Promise.all(
      products.filter(p => selected.has(p.id)).map(p => {
        const curr = (p.mainExpose ?? []) as MainExpose[];
        const next: MainExpose[] =
          exposeMode === "교체" ? targets :
          exposeMode === "추가" ? [...new Set([...curr, ...targets])] :
          curr.filter(e => !targets.includes(e));
        return fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, mainExpose: next, isNew: next.includes("신상품") }),
        });
      })
    );
    setExposeSaving(false); setExposeModal(false); setExposeTarget(new Set());
    showMsg(`${selected.size}개 상품 메인 진열 업데이트 완료`);
    setSelected(new Set()); load();
  };

  const handleSeed = async () => {
    if (!confirm("샘플 10개를 Supabase에 추가합니다. 계속할까요?")) return;
    setSeeding(true);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const d = await res.json();
    setSeeding(false);
    if (d.ok) { showMsg(`${d.count}개 추가됐습니다.`); load(); }
    else showMsg(`오류: ${d.error}`);
  };

  const isFiltered = applied.query || displayFilter !== "전체" || statusFilter !== "전체" || datePreset !== "전체" || dateStart || dateEnd;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">제품 관리</h1>
          <p className="text-base text-gray-400 mt-1">
            총 <span className="font-bold text-gray-700">{products.length}</span>개 등록
          </p>
        </div>
        <div className="flex gap-3">
          {products.length === 0 && !loading && !tableError && (
            <button onClick={handleSeed} disabled={seeding}
              className="px-5 py-2.5 text-base bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 rounded font-medium">
              {seeding ? "추가 중..." : "샘플 10개 추가"}
            </button>
          )}
          <Link href="/admin/products/import"
            className="px-5 py-2.5 text-base border border-gray-300 text-gray-700 hover:border-gray-500 rounded font-medium">
            Excel 업로드
          </Link>
          <Link href="/admin/products/new"
            className="px-6 py-2.5 text-base bg-[#ff550c] text-white hover:bg-[#e04500] rounded font-bold">
            + 새 제품 추가
          </Link>
        </div>
      </div>

      {msg && <div className="px-5 py-3.5 bg-green-50 border border-green-200 text-green-700 text-base rounded-lg">{msg}</div>}

      {!loading && tableError && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-base font-semibold text-amber-800 mb-1">⚠ Supabase 테이블 설정이 필요합니다.</p>
          {apiErrMsg && <p className="text-sm font-mono text-red-600 bg-red-50 px-3 py-2 border border-red-200 rounded mt-2">에러: {apiErrMsg}</p>}
        </div>
      )}

      {/* ── 검색 & 필터 ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* 검색 분류 */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <span className="text-[15px] font-semibold text-gray-600 w-24 shrink-0">검색 분류</span>
          <div className="flex gap-2 flex-1">
            <select value={searchType} onChange={e => setSearchType(e.target.value as SearchType)}
              className="border border-gray-200 px-3 py-2 text-[15px] bg-white rounded w-32 focus:outline-none focus:border-[#1A2B4A]">
              {SEARCH_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={`${searchType}으로 검색...`}
              className="flex-1 border border-gray-200 px-4 py-2 text-[15px] focus:outline-none focus:border-[#1A2B4A] rounded"
            />
            <button onClick={handleSearch}
              className="px-6 py-2 bg-[#1A2B4A] text-white text-[15px] font-semibold hover:bg-[#243d5e] rounded">검색</button>
            <button onClick={handleReset}
              className={`px-4 py-2 border text-[15px] rounded transition-colors ${
                isFiltered
                  ? "border-[#ff550c] text-[#ff550c] hover:bg-orange-50 font-semibold"
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}>초기화</button>
          </div>
        </div>

        {/* 상품 등록일 */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 flex-wrap">
          <span className="text-[15px] font-semibold text-gray-600 w-24 shrink-0">상품 등록일</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DATE_PRESETS.map(preset => (
              <button key={preset} type="button"
                onClick={() => { setDatePreset(preset); if (preset !== "전체") { setDateStart(""); setDateEnd(""); } setPage(1); }}
                className={`px-3.5 py-1.5 text-sm border rounded transition-colors ${
                  datePreset === preset
                    ? "bg-[#1A2B4A] text-white border-[#1A2B4A]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1A2B4A]"
                }`}>{preset}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-1">
            <input type="date" value={dateStart}
              onChange={e => { setDateStart(e.target.value); setDatePreset("전체"); setPage(1); }}
              className="border border-gray-200 px-2.5 py-1.5 text-[14px] rounded focus:outline-none focus:border-[#1A2B4A]" />
            <span className="text-gray-400 text-sm">~</span>
            <input type="date" value={dateEnd}
              onChange={e => { setDateEnd(e.target.value); setDatePreset("전체"); setPage(1); }}
              className="border border-gray-200 px-2.5 py-1.5 text-[14px] rounded focus:outline-none focus:border-[#1A2B4A]" />
          </div>
        </div>

        {/* 진열 상태 + 판매 상태 */}
        <div className="flex items-center gap-8 px-6 py-3.5 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-semibold text-gray-600 w-24 shrink-0">진열 상태</span>
            {(["전체", "진열함", "진열안함"] as DisplayFilter[]).map(f => (
              <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="disp" checked={displayFilter === f}
                  onChange={() => { setDisplayFilter(f); setPage(1); }}
                  className="accent-[#1A2B4A] w-4 h-4" />
                <span className="text-[15px] text-gray-700">{f}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-gray-600">판매 상태</span>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 px-3 py-1.5 text-[15px] bg-white rounded focus:outline-none focus:border-[#1A2B4A]">
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── 결과 요약 ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap text-[15px] text-gray-600">
        <span className="font-bold text-[#1A2B4A] text-lg">{stats.total}</span><span>건</span>
        {stats.판매중 > 0 && <><span className="mx-2 text-gray-300">|</span><span className="text-emerald-600">판매중 <b>{stats.판매중}</b></span></>}
        {stats.품절 > 0 && <><span className="mx-2 text-gray-300">|</span><span className="text-red-500">품절 <b>{stats.품절}</b></span></>}
        {stats.예약판매 > 0 && <><span className="mx-2 text-gray-300">|</span><span className="text-blue-500">예약판매 <b>{stats.예약판매}</b></span></>}
        {stats.판매중지 > 0 && <><span className="mx-2 text-gray-300">|</span><span className="text-gray-400">판매중지 <b>{stats.판매중지}</b></span></>}
        {stats.진열대기 > 0 && <><span className="mx-2 text-gray-300">|</span><span className="text-amber-500">진열대기 <b>{stats.진열대기}</b></span></>}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-20 text-base text-gray-400">
          <span className="w-6 h-6 border-2 border-[#ff550c] border-t-transparent rounded-full animate-spin" />
          불러오는 중...
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* ── 일괄 작업 바 ────────────────────────────────────────────── */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 space-y-2">
            {/* 1행: 일괄 액션 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              {selected.size > 0 && (
                <span className="text-[15px] font-bold text-[#1A2B4A] mr-1">{selected.size}개 선택</span>
              )}
              {[
                { label: "진열함",   action: () => bulkStatus("판매중") },
                { label: "진열안함", action: () => bulkStatus("판매중지") },
                { label: "판매함",   action: () => bulkStatus("판매중") },
                { label: "판매안함", action: () => bulkStatus("판매중지") },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} disabled={!selected.size}
                  className="px-3 py-1.5 text-[14px] border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded">
                  {btn.label}
                </button>
              ))}
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button onClick={bulkDelete} disabled={!selected.size}
                className="px-3 py-1.5 text-[14px] border border-red-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed rounded">
                삭제
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button onClick={() => selected.size && openCatModal()} disabled={!selected.size}
                className="px-3 py-1.5 text-[14px] border border-[#ff550c] bg-white text-[#ff550c] hover:bg-[#ff550c] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded font-semibold">
                카테고리 변경
              </button>
              <button onClick={() => selected.size && setExposeModal(true)} disabled={!selected.size}
                className="px-3 py-1.5 text-[14px] border border-[#1A2B4A] bg-white text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded">
                메인진열수정
              </button>
              <Link href="/admin/products/main-expose"
                className="px-3 py-1.5 text-[14px] border border-purple-300 bg-white text-purple-600 hover:bg-purple-50 rounded">
                메인진열관리
              </Link>
            </div>
            {/* 2행: 정렬 / 페이지수 */}
            <div className="flex items-center justify-end gap-2">
              <select value={sortBy} onChange={e => { setSortBy(e.target.value as SortBy); setPage(1); }}
                className="border border-gray-200 px-3 py-1.5 text-[14px] bg-white rounded focus:outline-none">
                <option>최신순</option><option>진열순</option><option>이름순</option>
              </select>
              <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
                className="border border-gray-200 px-3 py-1.5 text-[14px] bg-white rounded focus:outline-none">
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
                <option value={100}>100개씩</option>
              </select>
            </div>
          </div>

          {/* ── 테이블 ────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input type="checkbox" checked={allSel} onChange={toggleAll}
                      className="w-[18px] h-[18px] accent-[#1A2B4A] cursor-pointer" />
                  </th>
                  {["상품명", "카테고리", "가격", "판매 상태", "메인 노출", "기능 태그", "등록일", "관리"].map(h => (
                    <th key={h} className={`px-5 py-4 text-[13px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "관리" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center text-[15px] text-gray-400">
                      {products.length === 0 ? "등록된 제품이 없습니다. 상단의 '샘플 10개 추가' 또는 '+ 새 제품 추가'로 시작하세요." : "검색 조건에 맞는 제품이 없습니다."}
                    </td>
                  </tr>
                ) : paginated.map(p => (
                  <tr key={p.id} className={`transition-colors ${selected.has(p.id) ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                    {/* 체크박스 */}
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                        className="w-[18px] h-[18px] accent-[#1A2B4A] cursor-pointer" />
                    </td>

                    {/* 상품명 */}
                    <td className="px-5 py-4 min-w-[300px]">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-lg overflow-hidden border border-gray-100">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="52px" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-300 text-[10px]">없음</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[16px] text-gray-900 leading-tight">{p.name}</p>
                          {p.brand && <p className="text-[13px] text-[#1A2B4A] font-semibold mt-0.5">{p.brand}</p>}
                          <p className="text-[13px] text-gray-400 font-mono mt-0.5">{p.sku || p.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* 카테고리 */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getProductCats(p).length === 0 ? (
                          <span className="text-[14px] text-gray-300">-</span>
                        ) : getProductCats(p).map((c, i) => (
                          <span key={i} className="inline-block text-[12px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                            {c.main}{c.sub ? ` / ${c.sub}` : ""}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 가격 */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-[15px] font-bold text-gray-800">{p.price}</p>
                      {p.consumerPrice && (
                        <p className="text-[13px] text-gray-400 line-through">{p.consumerPrice}</p>
                      )}
                    </td>

                    {/* 판매 상태 */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[13px] font-bold rounded-full ${STATUS_COLOR[p.status ?? "판매중"] ?? "bg-gray-100 text-gray-500"}`}>
                        {p.status ?? "판매중"}
                      </span>
                    </td>

                    {/* 메인 노출 */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 min-w-[100px]">
                        {(p.mainExpose ?? []).length === 0
                          ? <span className="text-[13px] text-gray-300">-</span>
                          : (p.mainExpose ?? []).map(e => (
                              <span key={e} className={`px-2 py-0.5 text-[12px] font-bold rounded ${EXPOSE_COLOR[e] ?? "bg-gray-100 text-gray-600"}`}>{e}</span>
                            ))
                        }
                      </div>
                    </td>

                    {/* 기능 태그 */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {(p.featureTags ?? []).slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.5 text-[12px] bg-gray-100 text-gray-600 rounded">{t}</span>
                        ))}
                        {(p.featureTags ?? []).length > 3 && (
                          <span className="text-[12px] text-gray-400 self-center">+{(p.featureTags ?? []).length - 3}</span>
                        )}
                        {(p.featureTags ?? []).length === 0 && <span className="text-[13px] text-gray-300">-</span>}
                      </div>
                    </td>

                    {/* 등록일 */}
                    <td className="px-5 py-4 whitespace-nowrap text-[13px] text-gray-400">
                      {fmtDate(p.createdAt)}
                    </td>

                    {/* 관리 */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/products/${p.id}/edit`}
                          className="text-[14px] font-semibold text-[#1A2B4A] border border-[#1A2B4A] px-3.5 py-1.5 hover:bg-[#1A2B4A] hover:text-white rounded whitespace-nowrap">
                          수정
                        </Link>
                        <button onClick={() => {
                          if (!confirm(`"${p.name}"을 삭제하시겠습니까?`)) return;
                          fetch(`/api/admin/products/${p.id}`, { method: "DELETE" }).then(() => { load(); showMsg("삭제됐습니다."); });
                        }}
                          className="text-[14px] font-semibold text-red-500 border border-red-200 px-3.5 py-1.5 hover:bg-red-50 rounded whitespace-nowrap">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 페이지네이션 ────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2.5 py-1.5 text-[14px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-[14px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded">‹</button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
                return n <= totalPages ? (
                  <button key={n} onClick={() => setPage(n)}
                    className={`px-3 py-1.5 text-[14px] border rounded ${page === n ? "bg-[#1A2B4A] text-white border-[#1A2B4A]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {n}
                  </button>
                ) : null;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-[14px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2.5 py-1.5 text-[14px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded">»</button>
              <span className="ml-3 text-[14px] text-gray-400">{page} / {totalPages} 페이지</span>
            </div>
          )}
        </div>
      )}

      {/* ── 카테고리 변경 모달 ────────────────────────────────────────────── */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-7 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">카테고리 변경</h2>
              <p className="text-[15px] text-gray-400 mt-0.5">선택된 <span className="font-bold text-[#ff550c]">{selected.size}개</span> 상품에 일괄 적용됩니다.</p>
            </div>
            <div className="px-7 py-6 space-y-5">
              {/* 현재 설정된 카테고리 태그 */}
              <div>
                <p className="text-[15px] font-semibold text-gray-600 mb-2.5">적용할 카테고리</p>
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-3 border border-gray-200 rounded bg-gray-50">
                  {catModalCats.length === 0 && (
                    <span className="text-[13px] text-gray-300 self-center">카테고리를 추가해 주세요</span>
                  )}
                  {catModalCats.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[13px] bg-[#1A2B4A] text-white px-2.5 py-1 rounded">
                      {c.main}{c.sub ? ` / ${c.sub}` : ""}
                      <button onClick={() => removeModalCat(i)} className="text-white/60 hover:text-white ml-0.5 leading-none text-base">×</button>
                    </span>
                  ))}
                </div>
              </div>
              {/* 추가 피커 */}
              <div>
                <p className="text-[15px] font-semibold text-gray-600 mb-2.5">카테고리 추가</p>
                <div className="flex gap-2">
                  <select value={catAddMain}
                    onChange={e => { setCatAddMain(e.target.value); setCatAddSub(""); }}
                    className="flex-1 border border-gray-200 px-3 py-2 text-[14px] bg-white rounded focus:outline-none focus:border-[#1A2B4A]">
                    {catList.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                  <select value={catAddSub} onChange={e => setCatAddSub(e.target.value)}
                    className="flex-1 border border-gray-200 px-3 py-2 text-[14px] bg-white rounded focus:outline-none focus:border-[#1A2B4A]">
                    <option value="">서브 없음</option>
                    {(catList.find(c => c.name === catAddMain)?.subs ?? []).map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={addModalCat}
                    className="px-4 py-2 text-[14px] border border-[#1A2B4A] text-[#1A2B4A] rounded hover:bg-[#1A2B4A] hover:text-white font-bold transition-colors">
                    + 추가
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-gray-400">* 첫 번째 카테고리가 대표 카테고리로 설정됩니다.</p>
            </div>
            <div className="px-7 py-5 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => { setCatModal(false); setCatModalCats([]); }}
                className="px-6 py-2.5 border border-gray-200 text-[15px] text-gray-600 hover:border-gray-400 rounded">취소</button>
              <button onClick={bulkApplyCat} disabled={catModalCats.length === 0 || catSaving}
                className="px-6 py-2.5 bg-[#ff550c] text-white text-[15px] font-bold hover:bg-[#e04500] disabled:opacity-50 rounded">
                {catSaving ? "적용 중..." : `${selected.size}개에 적용`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메인진열 수정 모달 ────────────────────────────────────────────── */}
      {exposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-7 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">메인 진열 수정</h2>
              <p className="text-[15px] text-gray-400 mt-0.5">선택된 <span className="font-bold text-[#1A2B4A]">{selected.size}개</span> 상품에 일괄 적용됩니다.</p>
            </div>
            <div className="px-7 py-6 space-y-5">
              <div>
                <p className="text-[15px] font-semibold text-gray-600 mb-2.5">적용 방식</p>
                <div className="flex gap-4">
                  {(["추가", "교체", "제거"] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="em" checked={exposeMode === m} onChange={() => setExposeMode(m)}
                        className="accent-[#1A2B4A] w-4 h-4" />
                      <span className="text-[16px] text-gray-700">{m}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[13px] text-gray-400 mt-1.5">
                  {exposeMode === "추가" ? "기존 설정을 유지하면서 선택한 영역을 추가합니다." :
                   exposeMode === "교체" ? "기존 설정을 모두 지우고 선택한 영역으로 교체합니다." :
                   "기존 설정에서 선택한 영역만 제거합니다."}
                </p>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-gray-600 mb-2.5">노출 영역</p>
                <div className="flex flex-wrap gap-2">
                  {EXPOSE_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setExposeTarget(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; })}
                      className={`px-4 py-2 text-[15px] border rounded font-medium transition-colors ${
                        exposeTarget.has(opt) ? "bg-[#ff550c] text-white border-[#ff550c]" : "bg-white text-gray-600 border-gray-200 hover:border-[#ff550c]"
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-7 py-5 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => { setExposeModal(false); setExposeTarget(new Set()); }}
                className="px-6 py-2.5 border border-gray-200 text-[15px] text-gray-600 hover:border-gray-400 rounded">취소</button>
              <button onClick={applyMainExpose} disabled={!exposeTarget.size || exposeSaving}
                className="px-6 py-2.5 bg-[#ff550c] text-white text-[15px] font-bold hover:bg-[#e04500] disabled:opacity-50 rounded">
                {exposeSaving ? "적용 중..." : `${selected.size}개에 적용`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
