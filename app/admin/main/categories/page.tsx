"use client";

import { useEffect, useRef, useState } from "react";

type QuickCategoryItem = {
  id: string;
  name: string;
  emoji: string;
  icon_url: string;
  bg_color: string;
  link: string;
  open_in_new_tab: boolean;
  is_visible: boolean;
};

type QuickCategoriesConfig = {
  is_section_visible: boolean;
  display_count: number;
  items: QuickCategoryItem[];
};

const DEFAULT_ITEMS: QuickCategoryItem[] = [
  { id: "1", name: "공용", emoji: "👥", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  { id: "2", name: "남성", emoji: "👔", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  { id: "3", name: "여성", emoji: "👗", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  { id: "4", name: "소품", emoji: "🎒", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  { id: "5", name: "현장", emoji: "⛏️", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
  { id: "6", name: "일상", emoji: "👕", icon_url: "", bg_color: "#f0f0f0", link: "/products", open_in_new_tab: false, is_visible: true },
];

const DEFAULT_CONFIG: QuickCategoriesConfig = {
  is_section_visible: true,
  display_count: 6,
  items: DEFAULT_ITEMS,
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AdminMainCategoriesPage() {
  const [config, setConfig] = useState<QuickCategoriesConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"ok" | "err" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/site-settings/quick_categories")
      .then((r) => {
        if (!r.ok) { setDbError(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data && data.items) setConfig(data as QuickCategoriesConfig);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(cfg: QuickCategoriesConfig) {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/admin/site-settings/quick_categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "ok" : "err");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  function updateItem(id: string, patch: Partial<QuickCategoryItem>) {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const next = [...config.items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setConfig((prev) => ({ ...prev, items: next }));
  }

  function addItem() {
    const newItem: QuickCategoryItem = {
      id: newId(),
      name: "새 카테고리",
      emoji: "📦",
      icon_url: "",
      bg_color: "#f0f0f0",
      link: "/products",
      open_in_new_tab: false,
      is_visible: true,
    };
    setConfig((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setEditingId(newItem.id);
  }

  function deleteItem(id: string) {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    setConfig((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
    if (editingId === id) setEditingId(null);
  }

  async function handleIconFile(id: string, file: File) {
    setUploadingId(id);
    setUploadErr((prev) => ({ ...prev, [id]: "" }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "업로드 실패");
      updateItem(id, { icon_url: json.url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "업로드 실패";
      setUploadErr((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setUploadingId(null);
    }
  }

  const visibleCount = config.items.filter((it) => it.is_visible).length;
  const editingItem = config.items.find((it) => it.id === editingId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">퀵 카테고리</h1>
          <p className="text-base text-gray-400 mt-1">메인 퀵 카테고리 그리드를 관리합니다.</p>
        </div>
        <button
          onClick={() => save(config)}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded hover:bg-[#243d6a] disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {saveMsg === "ok" && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          저장되었습니다.
        </div>
      )}
      {saveMsg === "err" && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          저장에 실패했습니다. 다시 시도해 주세요.
        </div>
      )}

      {/* 전체 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">전체 설정</h2>
        <div className="flex flex-col gap-4">

          {/* 섹션 노출 여부 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">섹션 노출</p>
              <p className="text-xs text-gray-400 mt-0.5">메인 페이지에서 퀵 카테고리 섹션 전체를 보이거나 숨깁니다.</p>
            </div>
            <button
              onClick={() => setConfig((p) => ({ ...p, is_section_visible: !p.is_section_visible }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.is_section_visible ? "bg-[#1A2B4A]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  config.is_section_visible ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 노출 개수 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">최대 노출 수</p>
              <p className="text-xs text-gray-400 mt-0.5">
                노출 여부가 켜진 항목 중 상위 N개만 표시합니다. (현재 노출 가능 항목: {visibleCount}개)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={config.display_count}
                onChange={(e) => setConfig((p) => ({ ...p, display_count: Number(e.target.value) }))}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
              >
                {[4, 5, 6, 7, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 카테고리 목록 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">카테고리 목록</h2>
          <span className="text-xs text-gray-400">총 {config.items.length}개</span>
        </div>

        {config.items.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            등록된 카테고리가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {config.items.map((item, index) => (
              <li key={item.id} className={`transition-colors ${editingId === item.id ? "bg-[#f8f9ff]" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  {/* 아이콘 미리보기 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ backgroundColor: item.bg_color }}
                  >
                    {item.icon_url ? (
                      <img src={item.icon_url} alt={item.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="leading-none select-none">{item.emoji}</span>
                    )}
                  </div>

                  {/* 이름 + 링크 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.link}</p>
                  </div>

                  {/* 노출 여부 뱃지 */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.is_visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_visible ? "노출" : "숨김"}
                  </span>

                  {/* 순서 이동 */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-xs"
                      title="위로"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === config.items.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-xs"
                      title="아래로"
                    >
                      ▼
                    </button>
                  </div>

                  {/* 편집 / 삭제 */}
                  <button
                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    {editingId === item.id ? "닫기" : "편집"}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex-shrink-0"
                  >
                    삭제
                  </button>
                </div>

                {/* 편집 패널 */}
                {editingId === item.id && (
                  <div className="mx-5 mb-4 p-4 bg-white border border-[#d0d8f0] rounded-xl">
                    <div className="grid grid-cols-2 gap-4">

                      {/* 카테고리명 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">카테고리명</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                          placeholder="예: 남성"
                        />
                      </div>

                      {/* 이모지 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">이모지 (이미지 없을 때 표시)</label>
                        <input
                          type="text"
                          value={item.emoji}
                          onChange={(e) => updateItem(item.id, { emoji: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                          placeholder="예: 👔"
                        />
                      </div>

                      {/* 연결 링크 */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">연결 링크</label>
                        <input
                          type="text"
                          value={item.link}
                          onChange={(e) => updateItem(item.id, { link: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                          placeholder="예: /products?category=남성"
                        />
                      </div>

                      {/* 아이콘 이미지 */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-2">아이콘 이미지</label>
                        <div className="flex items-center gap-4">

                          {/* 미리보기 원형 — 실제 노출 비율로 */}
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl overflow-hidden"
                            style={{ backgroundColor: item.bg_color }}
                          >
                            {item.icon_url && !item.icon_url.startsWith("data:") ? (
                              <img src={item.icon_url} alt="" className="w-10 h-10 object-contain" />
                            ) : (
                              <span className="leading-none select-none">{item.emoji}</span>
                            )}
                          </div>

                          {/* 버튼 + 안내 */}
                          <div className="flex-1 min-w-0">
                            <input
                              ref={(el) => { fileInputRefs.current[item.id] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleIconFile(item.id, file);
                                e.target.value = "";
                              }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                disabled={uploadingId === item.id}
                                className="px-4 py-2 bg-[#1A2B4A] text-white text-xs rounded-lg hover:bg-[#243d6a] disabled:opacity-50 transition-colors flex-shrink-0"
                              >
                                {uploadingId === item.id ? "업로드 중..." : "이미지 업로드"}
                              </button>
                              {item.icon_url && (
                                <button
                                  onClick={() => updateItem(item.id, { icon_url: "" })}
                                  className="px-3 py-2 border border-red-200 text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                                >
                                  이미지 제거
                                </button>
                              )}
                            </div>
                            {uploadErr[item.id] && (
                              <p className="text-[11px] text-red-500 mb-1">{uploadErr[item.id]}</p>
                            )}
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              권장: <span className="font-medium text-gray-500">200 × 200px</span> · PNG (투명 배경 권장) · 500KB 이하 ·
                              노출 크기 PC 90px / 모바일 68px
                            </p>
                          </div>
                        </div>
                        {/* 이전에 base64로 저장된 경우 경고 */}
                        {item.icon_url?.startsWith("data:") && (
                          <p className="mt-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            ⚠️ 이전에 저장된 이미지가 올바르지 않습니다. 이미지를 다시 업로드해 주세요.
                          </p>
                        )}
                      </div>

                      {/* 배경색 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">아이콘 배경색</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={item.bg_color}
                            onChange={(e) => updateItem(item.id, { bg_color: e.target.value })}
                            className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={item.bg_color}
                            onChange={(e) => updateItem(item.id, { bg_color: e.target.value })}
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/30"
                            placeholder="#f0f0f0"
                          />
                          <button
                            onClick={() => updateItem(item.id, { bg_color: "#f0f0f0" })}
                            className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                          >
                            초기화
                          </button>
                        </div>
                      </div>

                      {/* 새탭 열기 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">링크 설정</label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.open_in_new_tab}
                            onChange={(e) => updateItem(item.id, { open_in_new_tab: e.target.checked })}
                            className="w-4 h-4 accent-[#1A2B4A]"
                          />
                          <span className="text-sm text-gray-700">새 탭에서 열기</span>
                        </label>
                      </div>

                      {/* 노출 여부 */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-2">노출 여부</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateItem(item.id, { is_visible: !item.is_visible })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              item.is_visible ? "bg-[#1A2B4A]" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                item.is_visible ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-600">
                            {item.is_visible ? "노출됨" : "숨겨짐"}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 항목 추가 버튼 */}
      <button
        onClick={addItem}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors"
      >
        + 카테고리 추가
      </button>

      {/* Supabase 테이블 오류 시에만 표시 */}
      {dbError && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ Supabase 설정 필요</p>
          <p className="text-xs text-amber-700 mb-3">
            저장 기능을 사용하려면 Supabase에 <code className="bg-amber-100 px-1 rounded">site_settings</code> 테이블이 필요합니다.
          </p>
          <pre className="text-xs bg-amber-100 rounded-lg p-3 text-amber-900 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS site_settings (
  section TEXT PRIMARY KEY,
  config  JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);`}</pre>
        </div>
      )}
    </div>
  );
}
