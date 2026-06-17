"use client";
import { useState } from "react";
import { SUPPORT_CATEGORIES } from "@/lib/site-content";

type FormState = { subject: string; name: string; phone: string; message: string };

export default function SupportForm() {
  const init: FormState = { subject: SUPPORT_CATEGORIES[0], name: "", phone: "", message: "" };
  const [form, setForm] = useState<FormState>(init);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cls = "w-full border border-gray-200 px-4 py-2.5 text-sm text-[#1A2B4A] placeholder-gray-300 focus:outline-none focus:border-[#1A2B4A] transition-colors bg-white";

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
        <p className="text-base font-bold text-[#1A2B4A] mb-2">문의가 접수되었습니다</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">영업일 기준 2일 이내에 담당자가 연락드립니다.</p>
        <button
          onClick={() => { setForm(init); setSubmitted(false); }}
          className="text-xs text-gray-400 underline hover:text-[#1A2B4A] transition-colors"
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
              onClick={() => setForm((f) => ({ ...f, subject: cat }))}
              className={`px-3.5 py-2 text-sm border transition-colors ${
                form.subject === cat
                  ? "bg-[#1A2B4A] text-white border-[#1A2B4A] font-semibold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1A2B4A]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">이름<span className="text-[#ff550c] ml-0.5">*</span></label>
          <input type="text" required placeholder="홍길동" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={cls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">연락처<span className="text-[#ff550c] ml-0.5">*</span></label>
          <input type="tel" required placeholder="010-0000-0000" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={cls} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">문의 내용<span className="text-[#ff550c] ml-0.5">*</span></label>
        <textarea required rows={5} placeholder="궁금하신 내용을 자유롭게 적어주세요."
          value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={cls + " resize-none"} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1A2B4A] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors disabled:opacity-50"
      >
        {submitting ? "접수 중..." : "1:1 문의 접수하기 →"}
      </button>
      <p className="text-xs text-gray-400 text-center">영업일 기준 2일 이내 연락드립니다.</p>
    </form>
  );
}
