"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IHModal from "./IHModal";
import type { IHBranchOption } from "@/lib/ih/collabs";
import { TAX_TYPE_OPTIONS } from "@/lib/ih/influencer-shared";

const SPONSOR_STATUS_OPTIONS = [
  { value: "PLANNED", label: "협찬 예정" },
  { value: "SENT", label: "발송" },
  { value: "RECEIVED", label: "수령" },
  { value: "PRODUCING", label: "제작 중" },
  { value: "UPLOAD_SCHEDULED", label: "업로드 예정" },
  { value: "UPLOADED", label: "업로드 완료" },
  { value: "ENDED", label: "종료" },
];
const VISIT_STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "COMPLETED", label: "완료" },
];

const inputCls = "w-full rounded-md border border-slate-200 px-3 py-2 text-[13.5px] outline-none focus:border-slate-400";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

type CollabType = "SPONSOR" | "VISIT" | null;

/**
 * "+ 협찬 등록" — 협업 유형(제품 협찬 메이트 / 방문 인플루언서) 선택 후 해당 Form을 보여준다.
 * 제품 협찬 메이트 → POST .../sponsors (ih_sponsors)
 * 방문 인플루언서   → POST .../branch-activities { activity_type: 'INFLUENCER_VISIT' } (ih_branch_marketing)
 */
export default function IHCollabRegisterModal({ influencerId, onClose }: { influencerId: number; onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<CollabType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<IHBranchOption[]>([]);

  useEffect(() => {
    if (type !== "VISIT") return;
    fetch("/api/admin/ih/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBranches(data.branches))
      .catch(() => {});
  }, [type]);

  // ── 제품 협찬 메이트 ──
  const [sponsorForm, setSponsorForm] = useState({
    product: "",
    round: "",
    support_type: "",
    send_date: "",
    upload_due_date: "",
    upload_date: "",
    content_url: "",
    cost: "",
    status: "PLANNED",
    memo: "",
  });
  const submitSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencerId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sponsorForm,
          round: sponsorForm.round ? Number(sponsorForm.round) : null,
          cost: sponsorForm.cost ? Number(sponsorForm.cost) : null,
          send_date: sponsorForm.send_date || null,
          upload_due_date: sponsorForm.upload_due_date || null,
          upload_date: sponsorForm.upload_date || null,
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

  // ── 방문 인플루언서 ──
  const [visitForm, setVisitForm] = useState({
    branch_id: "",
    marketing_date: "",
    cost: "",
    tax_type: "",
    support_content: "",
    content_url: "",
    views: "",
    reactions: "",
    status: "IN_PROGRESS",
    memo: "",
  });
  const submitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencerId}/branch-activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...visitForm,
          activity_type: "INFLUENCER_VISIT",
          branch_id: visitForm.branch_id ? Number(visitForm.branch_id) : null,
          cost: visitForm.cost ? Number(visitForm.cost) : null,
          views: visitForm.views ? Number(visitForm.views) : null,
          reactions: visitForm.reactions ? Number(visitForm.reactions) : null,
          marketing_date: visitForm.marketing_date || null,
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
    <IHModal title="협찬 등록" onClose={onClose}>
      {type === null && (
        <div className="space-y-2">
          <p className="text-[12.5px] text-slate-500 mb-3">협업 유형을 선택해주세요.</p>
          <button
            type="button"
            onClick={() => setType("SPONSOR")}
            className="w-full text-left rounded-md border border-slate-200 px-4 py-3 hover:border-slate-400"
          >
            <p className="text-[13.5px] font-semibold text-slate-800">제품 협찬 메이트</p>
            <p className="text-[12px] text-slate-400">제품을 보내고 콘텐츠를 받는 협찬</p>
          </button>
          <button
            type="button"
            onClick={() => setType("VISIT")}
            className="w-full text-left rounded-md border border-slate-200 px-4 py-3 hover:border-slate-400"
          >
            <p className="text-[13.5px] font-semibold text-slate-800">방문 인플루언서</p>
            <p className="text-[12px] text-slate-400">지점을 직접 방문해 콘텐츠를 제작하는 협업</p>
          </button>
        </div>
      )}

      {type === "SPONSOR" && (
        <form onSubmit={submitSponsor} className="space-y-3">
          {error && <p className="text-[12.5px] text-red-500">{error}</p>}
          <Field label="제품 *">
            <input required className={inputCls} value={sponsorForm.product} onChange={(e) => setSponsorForm((p) => ({ ...p, product: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="회차">
              <input type="number" className={inputCls} value={sponsorForm.round} onChange={(e) => setSponsorForm((p) => ({ ...p, round: e.target.value }))} />
            </Field>
            <Field label="지원 유형">
              <input className={inputCls} value={sponsorForm.support_type} onChange={(e) => setSponsorForm((p) => ({ ...p, support_type: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="발송일">
              <input type="date" className={inputCls} value={sponsorForm.send_date} onChange={(e) => setSponsorForm((p) => ({ ...p, send_date: e.target.value }))} />
            </Field>
            <Field label="업로드 예정일">
              <input type="date" className={inputCls} value={sponsorForm.upload_due_date} onChange={(e) => setSponsorForm((p) => ({ ...p, upload_due_date: e.target.value }))} />
            </Field>
            <Field label="업로드일">
              <input type="date" className={inputCls} value={sponsorForm.upload_date} onChange={(e) => setSponsorForm((p) => ({ ...p, upload_date: e.target.value }))} />
            </Field>
          </div>
          <Field label="콘텐츠 링크">
            <input className={inputCls} value={sponsorForm.content_url} onChange={(e) => setSponsorForm((p) => ({ ...p, content_url: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="비용(원)">
              <input type="number" className={inputCls} value={sponsorForm.cost} onChange={(e) => setSponsorForm((p) => ({ ...p, cost: e.target.value }))} />
            </Field>
            <Field label="상태">
              <select className={inputCls} value={sponsorForm.status} onChange={(e) => setSponsorForm((p) => ({ ...p, status: e.target.value }))}>
                {SPONSOR_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="지원 내용 / 메모">
            <textarea className={`${inputCls} min-h-[70px]`} value={sponsorForm.memo} onChange={(e) => setSponsorForm((p) => ({ ...p, memo: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50">
              등록
            </button>
            <button type="button" onClick={() => setType(null)} className="rounded-md border border-slate-300 text-slate-600 text-[13px] font-semibold px-4 py-2">
              이전
            </button>
          </div>
        </form>
      )}

      {type === "VISIT" && (
        <form onSubmit={submitVisit} className="space-y-3">
          {error && <p className="text-[12.5px] text-red-500">{error}</p>}
          <Field label="방문 지점 *">
            <select required className={inputCls} value={visitForm.branch_id} onChange={(e) => setVisitForm((p) => ({ ...p, branch_id: e.target.value }))}>
              <option value="">선택해주세요</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="방문일">
              <input type="date" className={inputCls} value={visitForm.marketing_date} onChange={(e) => setVisitForm((p) => ({ ...p, marketing_date: e.target.value }))} />
            </Field>
            <Field label="상태">
              <select className={inputCls} value={visitForm.status} onChange={(e) => setVisitForm((p) => ({ ...p, status: e.target.value }))}>
                {VISIT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="단가(원)">
              <input type="number" className={inputCls} value={visitForm.cost} onChange={(e) => setVisitForm((p) => ({ ...p, cost: e.target.value }))} />
            </Field>
            <Field label="세금">
              <select className={inputCls} value={visitForm.tax_type} onChange={(e) => setVisitForm((p) => ({ ...p, tax_type: e.target.value }))}>
                <option value="">선택해주세요</option>
                {TAX_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="콘텐츠">
            <input className={inputCls} placeholder="콘텐츠 형태/내용" value={visitForm.support_content} onChange={(e) => setVisitForm((p) => ({ ...p, support_content: e.target.value }))} />
          </Field>
          <Field label="콘텐츠 링크">
            <input className={inputCls} value={visitForm.content_url} onChange={(e) => setVisitForm((p) => ({ ...p, content_url: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="조회수(성과)">
              <input type="number" className={inputCls} value={visitForm.views} onChange={(e) => setVisitForm((p) => ({ ...p, views: e.target.value }))} />
            </Field>
            <Field label="반응수(성과)">
              <input type="number" className={inputCls} value={visitForm.reactions} onChange={(e) => setVisitForm((p) => ({ ...p, reactions: e.target.value }))} />
            </Field>
          </div>
          <Field label="메모">
            <textarea className={`${inputCls} min-h-[70px]`} value={visitForm.memo} onChange={(e) => setVisitForm((p) => ({ ...p, memo: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50">
              등록
            </button>
            <button type="button" onClick={() => setType(null)} className="rounded-md border border-slate-300 text-slate-600 text-[13px] font-semibold px-4 py-2">
              이전
            </button>
          </div>
        </form>
      )}
    </IHModal>
  );
}
