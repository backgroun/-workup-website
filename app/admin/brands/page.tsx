"use client";
import { useState, useEffect, useRef } from "react";

type Item = { id: number; name: string; name_ko?: string | null };

function Section({
  title,
  desc,
  apiPath,
  addPlaceholder,
  withAlias,
}: {
  title: string;
  desc: string;
  apiPath: string;
  addPlaceholder: string;
  withAlias?: boolean;
}) {
  const [items, setItems]       = useState<Item[]>([]);
  const [newName, setNewName]   = useState("");
  const [newNameKo, setNewNameKo] = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingNameKo, setEditingNameKo] = useState("");
  const inputRef   = useRef<HTMLInputElement>(null);
  const editRef    = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(apiPath);
    const d = await r.json();
    if (Array.isArray(d)) setItems(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true); setError("");
    const r = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), name_ko: withAlias ? newNameKo.trim() : undefined }),
    });
    if (r.ok) {
      setNewName(""); setNewNameKo("");
      await load();
      inputRef.current?.focus();
    } else {
      const d = await r.json();
      setError(d.error ?? "오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingNameKo(item.name_ko ?? "");
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditingName(""); setEditingNameKo(""); };

  const handleEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setSaving(true);
    const r = await fetch(apiPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingName.trim(), name_ko: withAlias ? editingNameKo.trim() : undefined }),
    });
    if (r.ok) {
      cancelEdit();
      await load();
    } else {
      const d = await r.json();
      setError(d.error ?? "수정 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}"을 삭제하시겠습니까?`)) return;
    await fetch(apiPath, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-[15px] font-bold text-[#303236]">{items.length}개</span>
        </div>
        <p className="text-[14px] text-gray-400 mt-0.5">{desc}</p>
      </div>

      {/* 추가 폼 */}
      <div className="px-6 py-4 border-b border-gray-100">
        {error && <p className="text-[14px] text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={addPlaceholder}
            className="flex-1 border border-gray-200 px-4 py-2.5 text-[15px] rounded focus:outline-none focus:border-[#303236]"
          />
          {withAlias && (
            <input
              value={newNameKo}
              onChange={e => setNewNameKo(e.target.value)}
              placeholder="한글 검색명 (선택, 예: 펜들턴)"
              className="flex-1 border border-gray-200 px-4 py-2.5 text-[15px] rounded focus:outline-none focus:border-[#303236]"
            />
          )}
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="px-5 py-2.5 bg-[#303236] text-white text-[15px] font-semibold hover:bg-[#243d5e] disabled:opacity-50 rounded whitespace-nowrap"
          >
            {saving ? "추가 중..." : "추가"}
          </button>
        </form>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-10 text-center text-[15px] text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <p className="text-[15px]">등록된 항목이 없습니다.</p>
            <p className="text-[14px] mt-1">위 폼에서 추가해보세요.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-2 px-5 py-3 hover:bg-gray-50 group">
                {editingId === item.id ? (
                  <>
                    <input
                      ref={editRef}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleEdit(item.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 border border-blue-400 px-3 py-1.5 text-[14px] rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {withAlias && (
                      <input
                        value={editingNameKo}
                        onChange={e => setEditingNameKo(e.target.value)}
                        placeholder="한글 검색명"
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEdit(item.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="flex-1 border border-blue-400 px-3 py-1.5 text-[14px] rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    )}
                    <button
                      onClick={() => handleEdit(item.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 border border-gray-200 text-gray-500 text-[13px] rounded hover:bg-gray-100 whitespace-nowrap"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[15px] font-medium text-gray-800">
                      {item.name}
                      {withAlias && item.name_ko && (
                        <span className="ml-2 text-[13px] font-normal text-gray-400">{item.name_ko}</span>
                      )}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-[13px] text-blue-500 hover:text-blue-700 font-medium px-2.5 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-[13px] text-red-400 hover:text-red-600 font-medium px-2.5 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FeaturedBrandSelector() {
  const [allBrands, setAllBrands] = useState<Item[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [brandsRes, featuredRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/site-settings/featured-brands"),
      ]);
      const brands = await brandsRes.json();
      const featured = await featuredRes.json();

      if (Array.isArray(brands)) setAllBrands(brands);
      if (featured?.featured_brands && Array.isArray(featured.featured_brands)) {
        setSelectedBrands(featured.featured_brands);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggleBrand = (brandName: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandName)) {
        return prev.filter(b => b !== brandName);
      }
      if (prev.length >= 10) {
        setMessage("최대 10개까지 선택할 수 있습니다.");
        setTimeout(() => setMessage(""), 3000);
        return prev;
      }
      return [...prev, brandName];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/site-settings/featured-brands", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured_brands: selectedBrands }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-gray-900">고객 화면 노출 브랜드</h2>
          <span className="text-[15px] font-bold text-[#303236]">{selectedBrands.length}/10</span>
        </div>
        <p className="text-[14px] text-gray-400 mt-0.5">상품 목록에서 가로로 표시될 브랜드 10개를 선택합니다.</p>
      </div>

      {message && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-[14px] text-blue-700">{message}</p>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-400">불러오는 중...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {allBrands.map(brand => (
                <label key={brand.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.name)}
                    onChange={() => handleToggleBrand(brand.name)}
                    disabled={!selectedBrands.includes(brand.name) && selectedBrands.length >= 10}
                    className="w-4 h-4 accent-[#303236] cursor-pointer"
                  />
                  <span className="text-[14px] text-gray-700 flex-1">{brand.name}</span>
                </label>
              ))}
            </div>

            {selectedBrands.length > 0 && (
              <div className="mb-6">
                <p className="text-[13px] text-gray-500 mb-3">선택된 브랜드 (표시 순서):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => handleToggleBrand(brand)}
                      className="px-3 py-1.5 bg-[#303236] text-white text-[12px] rounded flex items-center gap-2 hover:bg-[#243d5e] transition-colors"
                    >
                      {brand}
                      <span className="text-white/70">✕</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#303236] text-white text-[15px] font-semibold hover:bg-[#243d5e] disabled:opacity-50 rounded"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6 h-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">브랜드 / 제조사 관리</h1>
        <p className="text-base text-gray-400 mt-1">제품 등록 시 선택할 브랜드·제조사 목록을 관리합니다.</p>
      </div>

      <FeaturedBrandSelector />

      <div className="grid grid-cols-2 gap-6" style={{ height: "calc(100vh - 450px)" }}>
        <Section
          title="브랜드 관리"
          desc="제품에 표시되는 브랜드 이름"
          apiPath="/api/admin/brands"
          addPlaceholder="브랜드명 입력 (예: WORKUP)"
          withAlias
        />
        <Section
          title="제조사 관리"
          desc="제품 스펙에 표시되는 제조사"
          apiPath="/api/admin/manufacturers"
          addPlaceholder="제조사명 입력 (예: 워크업코리아)"
        />
      </div>
    </div>
  );
}
