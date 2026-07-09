"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product, MainExpose } from "@/data/products";
import { mainCategories, subCategoriesByMain } from "@/data/products";
import CatalogManagerModal from "@/components/admin/CatalogManagerModal";
import FilterManagerModal from "@/components/admin/FilterManagerModal";

// 수정 페이지 왕복 시 목록 뷰(페이지/필터/스크롤)를 복원하기 위한 세션 키
const VIEW_KEY = "admin-products-view";
const SORTABLE_STATUSES = ["판매중", "예약판매", "품절", "판매중지", "진열대기"];

// ── 상수 ──────────────────────────────────────────────────────────────────────
type SearchType = "상품명" | "상품코드" | "브랜드" | "제조사";
type DisplayFilter = "전체" | "진열함" | "진열안함";
type DatePreset = "전체" | "오늘" | "3일" | "7일" | "1개월" | "3개월" | "1년";
type SortBy = "최종수정순" | "최신순" | "진열순" | "이름순";

const DISPLAY_ON = ["판매중", "예약판매", "품절"];
const DISPLAY_OFF = ["판매중지", "진열대기"];

const STATUS_COLOR: Record<string, string> = {
  판매중:   "bg-emerald-100 text-emerald-700",
  품절:     "bg-red-100 text-red-600",
  판매중지: "bg-gray-100 text-gray-500",
  예약판매: "bg-blue-100 text-blue-600",
  진열대기: "bg-amber-100 text-amber-600",
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
  const parts = iso.slice(0, 10).split("-"); // ["2026","06","15"]
  if (parts.length !== 3) return iso.slice(0, 10);
  return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`; // "26.06.15"
}

const DATE_PRESETS: DatePreset[] = ["오늘", "3일", "7일", "1개월", "3개월", "1년", "전체"];
const STATUS_OPTIONS = ["전체", "판매중", "품절", "판매중지", "예약판매", "진열대기"];
const EXPOSE_OPTIONS: MainExpose[] = ["신상품", "추천상품", "베스트", "기획전"];
// 제품목록 테이블에서 표시/숨김 토글 가능한 컬럼 (상품명·관리는 항상 표시)
const TOGGLE_COLS = ["카테고리", "가격", "판매 상태", "최종수정"];
const COL_KEY = "wu-admin-product-cols";
const SEARCH_TYPES: SearchType[] = ["상품명", "상품코드", "브랜드", "제조사"];

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  // ─ 데이터 ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  // 인라인 수정 시 최신 products 스냅샷을 PUT 하기 위한 ref (경합으로 인한 필드 손실 완화)
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [apiErrMsg, setApiErrMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);

  // ─ 목록 뷰 상태 복원 (수정 후 돌아왔을 때 같은 페이지/필터/스크롤 유지) ─
  const savedView = useRef<Record<string, unknown> | undefined>(undefined);
  if (savedView.current === undefined) {
    try { savedView.current = JSON.parse((typeof window !== "undefined" ? sessionStorage.getItem(VIEW_KEY) : null) || "{}"); }
    catch { savedView.current = {}; }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const V = savedView.current as Record<string, any>;
  const pendingScroll = useRef<number | null>(typeof V.scrollTop === "number" ? V.scrollTop : null);

  // ─ 검색 & 필터 ─────────────────────────────────────────────────────────
  // 검색어는 재진입(페이지 재방문) 시 항상 초기화한다 — V에서 복원하지 않음.
  // (필터·정렬·스크롤은 기존대로 복원해 "수정 후 복귀" 위치 유지)
  const [searchType, setSearchType]   = useState<SearchType>("상품명");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [applied, setApplied]         = useState<{ type: SearchType; query: string }>({ type: "상품명", query: "" });
  const [datePreset, setDatePreset]   = useState<DatePreset>(V.datePreset ?? "전체");
  const [dateStart, setDateStart]     = useState<string>(V.dateStart ?? "");
  const [dateEnd, setDateEnd]         = useState<string>(V.dateEnd ?? "");
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>(V.displayFilter ?? "전체");
  const [statusFilter, setStatusFilter]   = useState<string>(V.statusFilter ?? "전체");

  // ─ 선택 & 정렬 ─────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy]     = useState<SortBy>(V.sortBy ?? "최종수정순");
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);   // 브랜드/제조사 관리 팝업
  const [filterModalOpen, setFilterModalOpen]   = useState(false);   // 필터 관리 팝업
  const [perPage, setPerPage]   = useState<number>(V.perPage ?? 20);
  const [page, setPage]         = useState<number>(Math.max(1, Math.floor(Number(V.page)) || 1));
  const [colMenuOpen, setColMenuOpen] = useState(false); // 컬럼 표시/숨김 드롭다운
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLE_COLS.map(c => [c, true]))
  );

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

  // ─ 리스트 내 인라인 카테고리 추가 (행별 피커) ───────────────────────────
  const [catRowId, setCatRowId] = useState<string | null>(null);
  const [rowMain, setRowMain]   = useState("");
  const [rowSub, setRowSub]     = useState("");

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
      // 응답은 config 객체 = { categories: [{name, subs}] } 형태. (구버전 대비 배열도 허용)
      .then(d => {
        const cats = Array.isArray(d?.categories) ? d.categories : Array.isArray(d) ? d : null;
        if (cats && cats.length) setCatList(cats);
      })
      .catch(() => {});
  }, []);

  // 컬럼 표시/숨김 설정 로드 (localStorage) — 새로고침해도 유지
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(COL_KEY) || "null");
      if (s && typeof s === "object") setVisibleCols(prev => ({ ...prev, ...s }));
    } catch { /* noop */ }
  }, []);

  const toggleCol = (c: string) =>
    setVisibleCols(prev => {
      const next = { ...prev, [c]: !prev[c] };
      try { localStorage.setItem(COL_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });

  // 뷰 상태를 세션에 저장 (수정 페이지에서 돌아오면 같은 페이지/필터로 복원)
  useEffect(() => {
    try {
      const prev = JSON.parse(sessionStorage.getItem(VIEW_KEY) || "{}");
      sessionStorage.setItem(VIEW_KEY, JSON.stringify({
        ...prev, searchType, searchQuery, applied, datePreset, dateStart, dateEnd,
        displayFilter, statusFilter, sortBy, perPage, page,
      }));
    } catch { /* noop */ }
  }, [searchType, searchQuery, applied, datePreset, dateStart, dateEnd, displayFilter, statusFilter, sortBy, perPage, page]);

  // 로드 완료 후 저장된 스크롤 위치 복원 (1회)
  useEffect(() => {
    if (loading || pendingScroll.current == null) return;
    const sc = document.querySelector("main");
    if (sc) sc.scrollTop = pendingScroll.current;
    pendingScroll.current = null;
  }, [loading]);

  // 인라인 수정 — 전체 제품을 PUT (기존 일괄작업과 동일 방식), 낙관적 갱신.
  const updateProduct = async (id: string, patch: Partial<Product>) => {
    const target = productsRef.current.find(p => p.id === id);
    if (!target) return;
    const updated = { ...target, ...patch };
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showMsg(`저장 실패: ${e.error ?? res.status}`); load(); }
      else showMsg("저장됐습니다.");
    } catch { showMsg("저장 실패: 네트워크 오류"); load(); }
  };

  const getProductCats = (p: Product): CatEntry[] => {
    const raw = (p as Record<string, unknown>).categories as CatEntry[] | undefined;
    if (raw?.length) return raw;
    return p.category ? [{ main: p.category, sub: p.subCategory ?? "" }] : [];
  };

  // 리스트에서 카테고리 직접 저장 (낙관적 갱신 + 전체 PUT). 대표 카테고리는 첫 항목.
  const saveProductCats = async (p: Product, cats: CatEntry[]) => {
    const primary = cats[0];
    const updated = {
      ...p,
      category: primary?.main ?? "",
      subCategory: primary?.sub ?? "",
      categories: cats,
    };
    setProducts(prev => prev.map(x => x.id === p.id ? (updated as unknown as Product) : x));
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showMsg(`저장 실패: ${e.error ?? res.status}`); load(); }
      else showMsg("저장됐습니다.");
    } catch { showMsg("저장 실패: 네트워크 오류"); load(); }
  };

  const removeProductCat = (p: Product, idx: number) =>
    saveProductCats(p, getProductCats(p).filter((_, i) => i !== idx));

  const openRowCat = (p: Product) => {
    setCatRowId(p.id);
    setRowMain(catList[0]?.name ?? "");
    setRowSub("");
  };

  const addRowCat = (p: Product) => {
    if (rowMain) {
      const cats = getProductCats(p);
      if (!cats.some(c => c.main === rowMain && c.sub === rowSub)) {
        saveProductCats(p, [...cats, { main: rowMain, sub: rowSub }]);
      }
    }
    setCatRowId(null);
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
    const results = await Promise.all(
      products.filter(p => selected.has(p.id)).map(async p => {
        // 기존 카테고리에 추가(병합) — 중복 제외, 대표 카테고리는 기존 유지
        const merged = [...getProductCats(p)];
        for (const nc of catModalCats) {
          if (!merged.some(c => c.main === nc.main && c.sub === nc.sub)) merged.push(nc);
        }
        const primary = merged[0];
        const res = await fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...p,
            category: primary.main,
            subCategory: primary.sub,
            categories: merged,
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
      showMsg(`${selected.size}개 상품 카테고리 추가 완료`);
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
      if (sortBy === "최종수정순") return (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "");
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

  // 복원된 page가 범위를 벗어나면 보정
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

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

  const handleDuplicate = async (p: Product) => {
    const suffix = Date.now().toString(36).slice(-4);
    const payload = { ...p, id: `${p.id}-copy-${suffix}`, name: `${p.name} (복사본)`, isNew: false };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { showMsg(`"${p.name}" 복제 완료`); load(); }
    else { const err = await res.json().catch(() => ({})); showMsg(err.error ?? "복제 실패"); }
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
        <div className="flex flex-wrap items-center justify-end gap-3">
          {products.length === 0 && !loading && !tableError && (
            <button onClick={handleSeed} disabled={seeding}
              className="px-5 py-2.5 text-base bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 rounded font-medium">
              {seeding ? "추가 중..." : "샘플 10개 추가"}
            </button>
          )}
          <button onClick={() => setCatalogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            브랜드 / 제조사
          </button>
          <button onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            필터 관리
          </button>
          <Link href="/admin/products/import"
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

          {/* ── 일괄 작업 바 (액션 버튼 + 컬럼표시/정렬/페이지수 한 줄) ──────────── */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
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
                카테고리 추가
              </button>
              <button onClick={() => selected.size && setExposeModal(true)} disabled={!selected.size}
                className="px-3 py-1.5 text-[14px] border border-[#1A2B4A] bg-white text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded">
                메인진열수정
              </button>
              <Link href="/admin/products/main-expose"
                className="px-3 py-1.5 text-[14px] border border-purple-300 bg-white text-purple-600 hover:bg-purple-50 rounded">
                메인진열관리
              </Link>

              {/* 우측: 컬럼 표시/숨김 + 정렬 + 페이지수 */}
              <div className="flex items-center gap-2 ml-auto">
                {/* 컬럼 표시/숨김 드롭다운 */}
                <div className="relative">
                  <button onClick={() => setColMenuOpen(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    컬럼
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${colMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {colMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setColMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 shadow-lg rounded min-w-[160px] py-2">
                        <p className="px-3 pb-1.5 mb-1 text-[12px] text-gray-400 border-b border-gray-100">표시할 컬럼</p>
                        {TOGGLE_COLS.map(c => (
                          <label key={c} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" checked={visibleCols[c] ?? true} onChange={() => toggleCol(c)}
                              className="w-3.5 h-3.5 accent-[#1A2B4A]" />
                            <span className="text-[13px] text-gray-700">{c}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value as SortBy); setPage(1); }}
                  className="border border-gray-200 px-3 py-1.5 text-[14px] bg-white rounded focus:outline-none">
                  <option>최종수정순</option><option>최신순</option><option>진열순</option><option>이름순</option>
                </select>
                <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
                  className="border border-gray-200 px-3 py-1.5 text-[14px] bg-white rounded focus:outline-none">
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                  <option value={100}>100개씩</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── 테이블 (자체 스크롤 영역 + 열 헤더 sticky 고정) ── */}
          <div className="overflow-auto max-h-[58vh]" style={{ scrollbarGutter: "stable" }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input type="checkbox" checked={allSel} onChange={toggleAll}
                      className="w-[18px] h-[18px] accent-[#1A2B4A] cursor-pointer" />
                  </th>
                  {["상품명", "카테고리", "가격", "판매 상태", "최종수정", "관리"]
                    .filter(h => !TOGGLE_COLS.includes(h) || visibleCols[h])
                    .map(h => (
                      <th key={h} className={`px-5 py-4 text-[13px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "관리" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3 + TOGGLE_COLS.filter(c => visibleCols[c]).length} className="py-20 text-center text-[15px] text-gray-400">
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

                    {/* 상품명 (인라인 수정 · 한 줄) */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[44px] h-[44px] flex-shrink-0 rounded-lg overflow-hidden border border-gray-100">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="44px" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-300 text-[10px]">없음</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 w-[230px]">
                          <InlineText
                            value={p.name}
                            onSave={(v) => v && updateProduct(p.id, { name: v })}
                            display={<span className="block truncate font-semibold text-[14px] text-gray-900 leading-tight">{p.name}</span>}
                            inputClassName="w-full border border-blue-300 rounded px-1.5 py-1 text-[14px] font-semibold text-gray-900 focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            {p.brand && <span className="text-[12px] text-[#1A2B4A] font-semibold truncate flex-shrink-0">{p.brand}</span>}
                            <span className="text-[12px] text-gray-400 font-mono truncate">{p.sku || p.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 카테고리 (인라인 추가/삭제) — 컬럼 표시 토글 */}
                    {visibleCols["카테고리"] && (
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1 min-w-[150px]">
                        {getProductCats(p).map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[12px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                            {c.main}{c.sub ? ` / ${c.sub}` : ""}
                            <button onClick={() => removeProductCat(p, i)} title="삭제"
                              className="text-gray-400 hover:text-red-500 leading-none text-[13px]">×</button>
                          </span>
                        ))}
                        {catRowId === p.id ? (
                          <span className="inline-flex items-center gap-1">
                            <select value={rowMain} onChange={e => { setRowMain(e.target.value); setRowSub(""); }}
                              className="border border-gray-200 rounded px-1.5 py-0.5 text-[12px] bg-white focus:outline-none focus:border-[#1A2B4A]">
                              {catList.map(c => <option key={c.name}>{c.name}</option>)}
                            </select>
                            <select value={rowSub} onChange={e => setRowSub(e.target.value)}
                              className="border border-gray-200 rounded px-1.5 py-0.5 text-[12px] bg-white focus:outline-none focus:border-[#1A2B4A]">
                              <option value="">서브 없음</option>
                              {(catList.find(c => c.name === rowMain)?.subs ?? []).map(s => <option key={s}>{s}</option>)}
                            </select>
                            <button onClick={() => addRowCat(p)} className="text-[12px] font-bold text-[#1A2B4A] px-1 hover:text-[#ff550c]">추가</button>
                            <button onClick={() => setCatRowId(null)} className="text-[12px] text-gray-400 px-0.5 hover:text-gray-600">취소</button>
                          </span>
                        ) : (
                          <button onClick={() => openRowCat(p)} title="카테고리 추가"
                            className="inline-flex items-center justify-center w-5 h-5 text-[14px] leading-none text-gray-400 border border-dashed border-gray-300 rounded hover:border-[#1A2B4A] hover:text-[#1A2B4A]">+</button>
                        )}
                      </div>
                    </td>
                    )}

                    {/* 가격 (인라인 수정) — 컬럼 표시 토글 */}
                    {visibleCols["가격"] && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <InlineText
                        value={p.price ?? ""}
                        onSave={(v) => updateProduct(p.id, { price: v })}
                        display={<span className="block text-[14px] font-bold text-gray-800">{p.price || <span className="text-gray-300 font-normal">가격 입력</span>}</span>}
                        inputClassName="w-[110px] border border-blue-300 rounded px-1.5 py-1 text-[14px] font-bold text-gray-800 focus:outline-none"
                      />
                      {p.consumerPrice && (
                        <p className="text-[12px] text-gray-400 line-through">{p.consumerPrice}</p>
                      )}
                    </td>
                    )}

                    {/* 판매 상태 (인라인 수정) — 컬럼 표시 토글 */}
                    {visibleCols["판매 상태"] && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <select
                        value={p.status ?? "판매중"}
                        onChange={(e) => updateProduct(p.id, { status: e.target.value as Product["status"] })}
                        title="클릭하여 상태 변경"
                        className={`text-[12px] font-bold rounded-full pl-2.5 pr-6 py-1 border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${STATUS_COLOR[p.status ?? "판매중"] ?? "bg-gray-100 text-gray-500"}`}
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23444' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center" }}
                      >
                        {SORTABLE_STATUSES.map((s) => <option key={s} value={s} className="bg-white text-gray-700">{s}</option>)}
                      </select>
                    </td>
                    )}

                    {/* 최종수정 — 컬럼 표시 토글 */}
                    {visibleCols["최종수정"] && (
                    <td className="px-5 py-4 whitespace-nowrap text-[13px] text-gray-400">
                      {fmtDate(p.updatedAt ?? p.createdAt)}
                    </td>
                    )}

                    {/* 관리 */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/products/${p.id}/edit`}
                          onClick={() => { try { const prev = JSON.parse(sessionStorage.getItem(VIEW_KEY) || "{}"); const sc = document.querySelector("main"); sessionStorage.setItem(VIEW_KEY, JSON.stringify({ ...prev, scrollTop: sc ? sc.scrollTop : 0 })); } catch { /* noop */ } }}
                          className="text-[14px] font-semibold text-[#1A2B4A] border border-[#1A2B4A] px-3.5 py-1.5 hover:bg-[#1A2B4A] hover:text-white rounded whitespace-nowrap">
                          수정
                        </Link>
                        <button onClick={() => handleDuplicate(p)} title="복제"
                          className="text-[14px] font-semibold text-blue-600 border border-blue-200 px-3.5 py-1.5 hover:bg-blue-50 rounded whitespace-nowrap">
                          복제
                        </button>
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

      {/* ── 카테고리 추가 모달 ────────────────────────────────────────────── */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-7 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">카테고리 추가</h2>
              <p className="text-[15px] text-gray-400 mt-0.5">선택된 <span className="font-bold text-[#ff550c]">{selected.size}개</span> 상품의 기존 카테고리에 추가됩니다.</p>
            </div>
            <div className="px-7 py-6 space-y-5">
              {/* 현재 설정된 카테고리 태그 */}
              <div>
                <p className="text-[15px] font-semibold text-gray-600 mb-2.5">추가할 카테고리</p>
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
              <p className="text-[13px] text-gray-400">* 각 상품의 기존 카테고리에 추가되며, 중복은 자동 제외됩니다.</p>
            </div>
            <div className="px-7 py-5 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => { setCatModal(false); setCatModalCats([]); }}
                className="px-6 py-2.5 border border-gray-200 text-[15px] text-gray-600 hover:border-gray-400 rounded">취소</button>
              <button onClick={bulkApplyCat} disabled={catModalCats.length === 0 || catSaving}
                className="px-6 py-2.5 bg-[#ff550c] text-white text-[15px] font-bold hover:bg-[#e04500] disabled:opacity-50 rounded">
                {catSaving ? "추가 중..." : `${selected.size}개에 추가`}
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

      {/* 브랜드/제조사 관리 · 필터 관리 팝업 */}
      <CatalogManagerModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} />
      <FilterManagerModal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </div>
  );
}

// ── 인라인 텍스트 편집 (클릭 → 입력, Enter/포커스 해제 시 저장, Esc 취소) ──
function InlineText({ value, onSave, display, inputClassName }: {
  value: string;
  onSave: (v: string) => void;
  display: React.ReactNode;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const skip = useRef(false);
  useEffect(() => { setV(value); }, [value]);

  if (!editing) {
    return (
      <span onClick={() => { setV(value); setEditing(true); }} title="클릭하여 수정"
        className="cursor-text hover:bg-yellow-50 rounded block w-full">
        {display}
      </span>
    );
  }
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => { setEditing(false); if (!skip.current && v.trim() !== (value ?? "").trim()) onSave(v.trim()); skip.current = false; }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        else if (e.key === "Escape") { skip.current = true; setV(value); e.currentTarget.blur(); }
      }}
      className={inputClassName}
    />
  );
}
