"use client";
import { useState } from "react";
import { SUPPORT_CATEGORIES } from "@/lib/site-content";
import { useStores } from "@/lib/useStores";
import type { Store } from "@/data/stores";

type FormState = { subject: string; name: string; phone: string; message: string; storeId: string; storeName: string };

// 매장 선택이 의미 있는 문의 구분(매장 방문 관련 문의는 담당 매장을 알아야 안내가 정확함).
const STORE_RELATED_CATEGORIES = new Set(["매장·방문", "교환·반품·AS"]);

const INPUT_CLS = "w-full border border-gray-200 px-4 py-2.5 text-sm text-[#303236] placeholder-gray-300 focus:outline-none focus:border-[#303236] transition-colors bg-white";

// 매장명/지역 검색으로 매장을 찾아 선택 — 매장 수가 많아 드롭다운 대신 검색형 입력 사용
function StoreSearchInput({
  value,
  stores,
  onChange,
}: {
  value: string;
  stores: Store[];
  onChange: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = stores.find((s) => String(s.id) === value);
  const suggestions = query.trim()
    ? stores.filter((s) => s.name.includes(query.trim()) || s.address.includes(query.trim())).slice(0, 8)
    : [];

  if (selected) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 border border-gray-200 bg-gray-50">
        <div className="min-w-0">
          <p className="text-sm text-[#303236] truncate">{selected.name}</p>
          <p className="text-xs text-gray-400 truncate">{selected.address}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange("", "")}
          className="text-gray-400 hover:text-red-500 text-xs ml-2 flex-shrink-0"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="매장명 또는 지역으로 검색"
        className={INPUT_CLS}
      />
      {open && query.trim() && (
        <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(String(s.id), s.name); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="block text-[#303236] font-medium">{s.name}</span>
                  <span className="block text-xs text-gray-400 truncate">{s.address}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-400">검색 결과가 없습니다.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function SupportForm() {
  const stores = useStores();
  const init: FormState = { subject: SUPPORT_CATEGORIES[0], name: "", phone: "", message: "", storeId: "", storeName: "" };
  const [form, setForm] = useState<FormState>(init);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cls = "w-full border border-gray-200 px-4 py-2.5 text-sm text-[#303236] placeholder-gray-300 focus:outline-none focus:border-[#303236] transition-colors bg-white";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "support", payload: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "접수에 실패했습니다.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 bg-[#ff550c] flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-bold text-[#303236] mb-6">문의가 접수되었습니다</p>
        <button
          onClick={() => { setForm(init); setSubmitted(false); }}
          className="text-xs text-gray-400 underline hover:text-[#303236] transition-colors"
        >
          다시 문의하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 문의 구분 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">문의 구분<span className="text-[#ff550c] ml-0.5">*</span></label>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm((f) => ({
                ...f,
                subject: cat,
                ...(STORE_RELATED_CATEGORIES.has(cat) ? {} : { storeId: "", storeName: "" }),
              }))}
              className={`px-3.5 py-2 text-sm border transition-colors ${
                form.subject === cat
                  ? "bg-[#303236] text-white border-[#303236] font-semibold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#303236]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {STORE_RELATED_CATEGORIES.has(form.subject) && (
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">문의 매장 <span className="text-gray-400">(선택)</span></label>
          <StoreSearchInput
            value={form.storeId}
            stores={stores}
            onChange={(id, name) => setForm((f) => ({ ...f, storeId: id, storeName: name }))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="support-name" className="block text-xs text-gray-500 mb-1.5">이름<span className="text-[#ff550c] ml-0.5">*</span></label>
          <input id="support-name" type="text" required placeholder="홍길동" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={cls} />
        </div>
        <div>
          <label htmlFor="support-phone" className="block text-xs text-gray-500 mb-1.5">연락처<span className="text-[#ff550c] ml-0.5">*</span></label>
          <input id="support-phone" type="tel" required placeholder="010-0000-0000" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={cls} />
        </div>
      </div>

      <div>
        <label htmlFor="support-message" className="block text-xs text-gray-500 mb-1.5">문의 내용<span className="text-[#ff550c] ml-0.5">*</span></label>
        <textarea id="support-message" required rows={5} placeholder="궁금하신 내용을 자유롭게 적어주세요."
          value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={cls + " resize-none"} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#303236] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors disabled:opacity-50"
      >
        {submitting ? "접수 중..." : "1:1 문의 접수하기 →"}
      </button>
    </form>
  );
}
