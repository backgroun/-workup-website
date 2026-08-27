"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IHModal from "./IHModal";
import type { IHBranchOption } from "@/lib/ih/collabs";
import { TAX_TYPE_OPTIONS, BRANCH_MKT_STATUS_ORDER, BRANCH_MKT_STATUS_LABEL } from "@/lib/ih/influencer-shared";
import IHNumberInput from "../IHNumberInput";
import IHBranchPicker from "../IHBranchPicker";

const inputCls = "w-full rounded-md border border-slate-200 px-3 py-2 text-[14.5px] outline-none focus:border-slate-400";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

type CollabType = "VISIT" | null;

/**
 * "+ 협찬 등록" — 협업 유형(제품 협찬 메이트 / 방문 인플루언서) 선택.
 * 제품 협찬 메이트 → Phase 5부터 전용 등록 Form(/sponsors/new)으로 이동(인플루언서 검색선택·사이즈/회차
 *   자동제안이 필요해 모달 안에서 처리하지 않는다). 해당 인플루언서가 자동 선택된 채로 열린다.
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
    status: "VISIT_SCHEDULED",
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
          <p className="text-[13.5px] text-slate-600 mb-3">협업 유형을 선택해주세요.</p>
          <button
            type="button"
            onClick={() => router.push(`/admin/influencer-hub/sponsors/new?influencerId=${influencerId}`)}
            className="w-full text-left rounded-md border border-slate-200 px-4 py-3 hover:border-slate-400"
          >
            <p className="text-[14.5px] font-semibold text-slate-800">제품 협찬 메이트</p>
            <p className="text-[13px] text-slate-500">제품을 보내고 콘텐츠를 받는 협찬</p>
          </button>
          <button
            type="button"
            onClick={() => setType("VISIT")}
            className="w-full text-left rounded-md border border-slate-200 px-4 py-3 hover:border-slate-400"
          >
            <p className="text-[14.5px] font-semibold text-slate-800">방문 인플루언서</p>
            <p className="text-[13px] text-slate-500">지점을 직접 방문해 콘텐츠를 제작하는 협업</p>
          </button>
        </div>
      )}

      {type === "VISIT" && (
        <form onSubmit={submitVisit} className="space-y-3">
          {error && <p className="text-[13.5px] text-red-500">{error}</p>}
          <Field label="방문 지점 *">
            <IHBranchPicker required branches={branches} value={visitForm.branch_id} onChange={(id) => setVisitForm((p) => ({ ...p, branch_id: id }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="방문일">
              <input type="date" className={inputCls} value={visitForm.marketing_date} onChange={(e) => setVisitForm((p) => ({ ...p, marketing_date: e.target.value }))} />
            </Field>
            <Field label="상태">
              <select className={inputCls} value={visitForm.status} onChange={(e) => setVisitForm((p) => ({ ...p, status: e.target.value }))}>
                {BRANCH_MKT_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{BRANCH_MKT_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="단가(원)">
              <IHNumberInput className={inputCls} value={visitForm.cost} onChange={(v) => setVisitForm((p) => ({ ...p, cost: v }))} />
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
              <IHNumberInput className={inputCls} value={visitForm.views} onChange={(v) => setVisitForm((p) => ({ ...p, views: v }))} />
            </Field>
            <Field label="반응수(성과)">
              <IHNumberInput className={inputCls} value={visitForm.reactions} onChange={(v) => setVisitForm((p) => ({ ...p, reactions: v }))} />
            </Field>
          </div>
          <Field label="메모">
            <textarea className={`${inputCls} min-h-[70px]`} value={visitForm.memo} onChange={(e) => setVisitForm((p) => ({ ...p, memo: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 disabled:opacity-50">
              등록
            </button>
            <button type="button" onClick={() => setType(null)} className="rounded-md border border-slate-300 text-slate-700 text-[14px] font-semibold px-4 py-2">
              이전
            </button>
          </div>
        </form>
      )}
    </IHModal>
  );
}
