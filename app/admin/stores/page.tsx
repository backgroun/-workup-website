"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type StoreRow = {
  id: number;
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: string;
  store_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const TYPE_COLOR: Record<string, string> = {
  직영점: "bg-blue-100 text-blue-700",
  대리점: "bg-green-100 text-green-700",
  아울렛: "bg-purple-100 text-purple-700",
  "복합쇼핑몰": "bg-orange-100 text-orange-700",
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [activeFilter, setActiveFilter] = useState<"전체" | "활성" | "비활성">("전체");
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stores");
    if (res.ok) setStores(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const regions = useMemo(() => {
    const set = new Set(stores.map((s) => s.region).filter(Boolean));
    return ["전체", ...Array.from(set).sort()];
  }, [stores]);

  const types = useMemo(() => {
    const set = new Set(stores.map((s) => s.store_type).filter(Boolean));
    return ["전체", ...Array.from(set).sort()];
  }, [stores]);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (search && !s.name.includes(search) && !s.address.includes(search)) return false;
      if (regionFilter !== "전체" && s.region !== regionFilter) return false;
      if (typeFilter !== "전체" && s.store_type !== typeFilter) return false;
      if (activeFilter === "활성" && !s.is_active) return false;
      if (activeFilter === "비활성" && s.is_active) return false;
      return true;
    });
  }, [stores, search, regionFilter, typeFilter, activeFilter]);

  const handleSeed = async () => {
    if (!confirm(`data/stores.ts의 ${stores.length > 0 ? "추가" : "전체"} 데이터를 DB에 삽입합니다. 계속할까요?`)) return;
    setSeeding(true);
    setMsg("");
    const res = await fetch("/api/admin/stores/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✓ ${data.count}개 매장이 등록됐습니다.`);
      await load();
    } else {
      setMsg(`✗ 오류: ${data.error}`);
    }
    setSeeding(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}"을(를) 삭제합니다. 채용공고도 함께 삭제됩니다.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStores((prev) => prev.filter((s) => s.id !== id));
    } else {
      const d = await res.json();
      alert("삭제 실패: " + d.error);
    }
    setDeleting(null);
  };

  const toggleActive = async (store: StoreRow) => {
    const res = await fetch(`/api/admin/stores/${store.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...store, is_active: !store.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStores((prev) => prev.map((s) => (s.id === store.id ? updated : s)));
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">스토어 관리</h1>
          <p className="text-base text-gray-400 mt-1">전국 매장 정보를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stores/import"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Excel 업로드
          </Link>
          {stores.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-amber-300 text-sm font-semibold text-amber-700 hover:border-amber-500 hover:text-amber-800 transition-colors rounded"
            >
              {seeding ? "처리 중..." : "기본 데이터 삽입"}
            </button>
          )}
          <Link
            href="/admin/stores/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A2B4A] text-white text-sm font-semibold hover:bg-[#243a63] transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            매장 추가
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 px-6 py-4 rounded-xl text-sm font-medium ${msg.startsWith("✓") ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg}
        </div>
      )}

      {/* 채용공고 바로가기 */}
      <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold text-blue-800">채용공고 관리</span>
          <span className="text-sm text-blue-600">전 지점 채용공고를 등록하고 관리합니다.</span>
        </div>
        <Link
          href="/admin/stores/jobs"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
        >
          채용공고 관리 →
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="매장명 또는 주소 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
        >
          {regions.map((r) => <option key={r} value={r}>{r === "전체" ? "지역 전체" : r}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
        >
          {types.map((t) => <option key={t} value={t}>{t === "전체" ? "유형 전체" : t}</option>)}
        </select>
        <div className="flex gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {(["전체", "활성", "비활성"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setActiveFilter(opt)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === opt ? "bg-[#1A2B4A] text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400 ml-auto">
          {filtered.length} / {stores.length}개 매장
        </p>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">ID</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">매장명</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">지역</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">유형</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">전화</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">상태</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">상세보기</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
                      불러오는 중...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                    {stores.length === 0
                      ? <div>
                          <p className="text-base font-medium mb-2">등록된 매장이 없습니다.</p>
                          <p className="text-sm">상단의 "기본 데이터 삽입" 버튼으로 기존 매장 데이터를 가져오세요.</p>
                        </div>
                      : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : (
                filtered.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">{store.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">{store.name}</span>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">{store.address}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{store.region || "-"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${TYPE_COLOR[store.store_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {store.store_type || "직영점"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{store.phone || "-"}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(store)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${store.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {store.is_active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/store/${store.id}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        공개 페이지 ↗
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/stores/${store.id}/edit`}
                          className="px-3 py-1.5 text-xs font-semibold text-[#1A2B4A] border border-[#1A2B4A] rounded hover:bg-[#1A2B4A] hover:text-white transition-colors"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(store.id, store.name)}
                          disabled={deleting === store.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
