"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import IHModal from "./IHModal";
import { TAX_TYPE_OPTIONS } from "@/lib/ih/influencer-shared";
import IHNumberInput from "../IHNumberInput";

const inputCls = "w-full rounded-md border border-slate-200 px-3 py-2 text-[14.5px] outline-none focus:border-slate-400";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

/** "+ 단가 등록" — 항상 새 이력을 추가한다(기존 단가를 덮어쓰지 않음, Phase 1 결정사항). */
export default function IHRateRegisterModal({ influencerId, onClose }: { influencerId: number; onClose: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ content_type: "", price: "", tax_type: "VAT 별도", effective_date: today(), memo: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencerId}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fieldErrors ? Object.values(data.fieldErrors).join(" / ") : data.error ?? "저장 실패");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IHModal title="단가 등록" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <p className="text-[13.5px] text-red-500">{error}</p>}
        <Field label="콘텐츠 유형">
          <input className={inputCls} placeholder="예: 릴스, 피드, 스토리" value={form.content_type} onChange={(e) => setForm((p) => ({ ...p, content_type: e.target.value }))} />
        </Field>
        <Field label="단가(원)">
          <IHNumberInput className={inputCls} value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="세금 유형">
            <select className={inputCls} value={form.tax_type} onChange={(e) => setForm((p) => ({ ...p, tax_type: e.target.value }))}>
              {TAX_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="적용일 *">
            <input required type="date" className={inputCls} value={form.effective_date} onChange={(e) => setForm((p) => ({ ...p, effective_date: e.target.value }))} />
          </Field>
        </div>
        <Field label="메모">
          <textarea className={`${inputCls} min-h-[70px]`} value={form.memo} onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} />
        </Field>
        <p className="text-[12.5px] text-slate-500">기존 단가는 수정되지 않고, 이 단가가 새 이력으로 추가됩니다.</p>
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 disabled:opacity-50">
          등록
        </button>
      </form>
    </IHModal>
  );
}
