"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IHModal from "./IHModal";
import type { IHBranchOption } from "@/lib/ih/collabs";

const inputCls = "w-full rounded-md border border-slate-200 px-3 py-2 text-[13.5px] outline-none focus:border-slate-400";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/** "+ 지점 활동 등록" — 일반 지점 마케팅(activity_type=GENERAL). influencer_id는 현재 상세 페이지 것을 자동 사용한다. */
export default function IHBranchActivityRegisterModal({ influencerId, onClose }: { influencerId: number; onClose: () => void }) {
  const router = useRouter();
  const [branches, setBranches] = useState<IHBranchOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    branch_id: "",
    marketing_date: "",
    round: "",
    cost: "",
    support_content: "",
    support_date: "",
    region: "",
    follower_display: "",
    views: "",
    reactions: "",
    content_url: "",
    status: "IN_PROGRESS",
    memo: "",
  });

  useEffect(() => {
    fetch("/api/admin/ih/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBranches(data.branches))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencerId}/branch-activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          activity_type: "GENERAL",
          branch_id: form.branch_id ? Number(form.branch_id) : null,
          round: form.round ? Number(form.round) : null,
          cost: form.cost ? Number(form.cost) : null,
          views: form.views ? Number(form.views) : null,
          reactions: form.reactions ? Number(form.reactions) : null,
          marketing_date: form.marketing_date || null,
          support_date: form.support_date || null,
        }),
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
    <IHModal title="지점 활동 등록" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
        <Field label="지점 *">
          <select required className={inputCls} value={form.branch_id} onChange={(e) => setForm((p) => ({ ...p, branch_id: e.target.value }))}>
            <option value="">선택해주세요</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="진행일">
            <input type="date" className={inputCls} value={form.marketing_date} onChange={(e) => setForm((p) => ({ ...p, marketing_date: e.target.value }))} />
          </Field>
          <Field label="회차">
            <input type="number" className={inputCls} value={form.round} onChange={(e) => setForm((p) => ({ ...p, round: e.target.value }))} />
          </Field>
          <Field label="상태">
            <select className={inputCls} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="IN_PROGRESS">진행 중</option>
              <option value="COMPLETED">완료</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="협업 비용(원)">
            <input type="number" className={inputCls} value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} />
          </Field>
          <Field label="지원일">
            <input type="date" className={inputCls} value={form.support_date} onChange={(e) => setForm((p) => ({ ...p, support_date: e.target.value }))} />
          </Field>
        </div>
        <Field label="지원 내용">
          <input className={inputCls} value={form.support_content} onChange={(e) => setForm((p) => ({ ...p, support_content: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="활동지역">
            <input className={inputCls} value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
          </Field>
          <Field label="팔로워">
            <input className={inputCls} placeholder="예: 5.6만" value={form.follower_display} onChange={(e) => setForm((p) => ({ ...p, follower_display: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="조회수">
            <input type="number" className={inputCls} value={form.views} onChange={(e) => setForm((p) => ({ ...p, views: e.target.value }))} />
          </Field>
          <Field label="반응수">
            <input type="number" className={inputCls} value={form.reactions} onChange={(e) => setForm((p) => ({ ...p, reactions: e.target.value }))} />
          </Field>
        </div>
        <Field label="콘텐츠 링크">
          <input className={inputCls} value={form.content_url} onChange={(e) => setForm((p) => ({ ...p, content_url: e.target.value }))} />
        </Field>
        <Field label="메모">
          <textarea className={`${inputCls} min-h-[70px]`} value={form.memo} onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} />
        </Field>
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50">
          등록
        </button>
      </form>
    </IHModal>
  );
}
