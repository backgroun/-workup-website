"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IHBranchOption, IHBranchMarketingDetail } from "@/lib/ih/collabs";
import { CONTENT_FORMAT_OPTIONS, BRANCH_MKT_STATUS_ORDER, BRANCH_MKT_STATUS_LABEL, BRANCH_MKT_COST_BEARER_OPTIONS } from "@/lib/ih/influencer-shared";
import IHInfluencerPicker, { type IHInfluencerPickerItem } from "../sponsors/IHInfluencerPicker";
import IHNumberInput from "../IHNumberInput";
import IHBranchPicker from "../IHBranchPicker";
import { useIHMobileSelection } from "../IHMobileSelectionContext";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

type FormState = {
  branch_id: string;
  marketing_date: string;
  cost: string;
  cost_bearer: string;
  content_format: string;
  views: string;
  reactions: string;
  comments: string;
  content_url: string;
  status: string;
  status_date: string;
  memo: string;
};

const EMPTY_FORM: FormState = {
  branch_id: "",
  marketing_date: "",
  cost: "",
  cost_bearer: "",
  content_format: "",
  views: "",
  reactions: "",
  comments: "",
  content_url: "",
  status: "VISIT_SCHEDULED",
  status_date: "",
  memo: "",
};

/**
 * 지점 마케팅 등록/수정 공용 Form — Phase 6.
 * 지점 마케팅은 항상 방문(activity_type=INFLUENCER_VISIT)이라 운영구분 선택지를 두지 않는다.
 * 회차는 수동 입력을 받지 않고 등록 시 서버에서 자동 카운팅한다(해당 인플루언서 기존 최댓값+1).
 */
export default function IHBranchMarketingForm({
  mode,
  initialInfluencerId,
  detail,
}: {
  mode: "create" | "edit";
  initialInfluencerId?: number;
  detail?: IHBranchMarketingDetail;
}) {
  const router = useRouter();
  const { setBranchMarketingListState } = useIHMobileSelection();
  const [branches, setBranches] = useState<IHBranchOption[]>([]);
  const [influencer, setInfluencer] = useState<IHInfluencerPickerItem | null>(
    detail?.influencer
      ? {
          id: detail.influencer.id,
          nickname: detail.influencer.nickname,
          channel: detail.influencer.channel,
          follower_display: detail.influencer.followerDisplay,
          content_type: [],
          activity_area: [],
        }
      : null
  );
  const [nextRound, setNextRound] = useState<number | null>(detail?.round ?? null);
  const [form, setForm] = useState<FormState>(
    detail
      ? {
          branch_id: String(detail.branchId),
          marketing_date: detail.marketingDate ?? "",
          cost: detail.cost != null ? String(detail.cost) : "",
          cost_bearer: detail.operationType ?? "",
          content_format: detail.contentFormat ?? "",
          views: detail.views != null ? String(detail.views) : "",
          reactions: detail.reactions != null ? String(detail.reactions) : "",
          comments: detail.comments != null ? String(detail.comments) : "",
          content_url: detail.contentUrl ?? "",
          status: detail.status,
          status_date: detail.supportDate ?? "",
          memo: detail.memo ?? "",
        }
      : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentFormatCustom, setContentFormatCustom] = useState(
    !!form.content_format && !(CONTENT_FORMAT_OPTIONS as readonly string[]).includes(form.content_format)
  );
  // 조회수/반응수는 실제 콘텐츠가 등록된 뒤에나 존재하는 값이라 "등록완료" 상태에서만 기록하게 한다.
  const canRecordResults = form.status === "REGISTRATION_COMPLETED";

  useEffect(() => {
    fetch("/api/admin/ih/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBranches(data.branches))
      .catch(() => {});
  }, []);

  // 등록/수정 폼에서는 무관한 전체 인플루언서 목록 대신, Mobile Viewer가 "등록된 지점 마케팅이 없습니다" 같은
  // 중립적인 빈 화면을 보여주도록 한다(폼과 무관한 인플루언서 리스트가 뜨는 것을 막는다).
  useEffect(() => {
    setBranchMarketingListState([]);
    return () => setBranchMarketingListState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 등록 시 initialInfluencerId(예: 인플루언서 상세의 "+ 지점 활동 등록")가 있으면 자동 선택한다.
  useEffect(() => {
    if (mode !== "create" || !initialInfluencerId || influencer) return;
    fetch(`/api/admin/ih/influencers/${initialInfluencerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { influencer: { id: number; nickname: string; channel: string; follower_display: string | null; content_type: string[]; activity_area: string[] } } | null) => {
        if (!d) return;
        setInfluencer({
          id: d.influencer.id,
          nickname: d.influencer.nickname,
          channel: d.influencer.channel,
          follower_display: d.influencer.follower_display,
          content_type: d.influencer.content_type,
          activity_area: d.influencer.activity_area,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInfluencerId, mode]);

  // 등록 모드에서 인플루언서가 정해지면 다음 회차를 미리 조회해 보여준다(실제 저장값은 서버가 다시 계산).
  useEffect(() => {
    if (mode !== "create" || !influencer) {
      if (mode === "create" && !influencer) setNextRound(null);
      return;
    }
    fetch(`/api/admin/ih/branch-marketing/next-round?influencerId=${influencer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { round: number } | null) => setNextRound(d?.round ?? null))
      .catch(() => setNextRound(null));
  }, [influencer, mode]);

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!influencer) {
      setError("인플루언서를 선택해주세요.");
      return;
    }
    if (!form.branch_id) {
      setError("지점을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { status_date, cost_bearer, ...rest } = form;
      const payload = {
        ...rest,
        activity_type: "INFLUENCER_VISIT" as const,
        influencer_id: influencer.id,
        branch_id: Number(form.branch_id),
        cost: form.cost ? Number(form.cost) : null,
        views: form.views ? Number(form.views) : null,
        reactions: form.reactions ? Number(form.reactions) : null,
        comments: form.comments ? Number(form.comments) : null,
        marketing_date: form.marketing_date || null,
        support_date: status_date || null,
        operation_type: cost_bearer || null,
      };
      const url = mode === "create" ? "/api/admin/ih/branch-marketing" : `/api/admin/ih/branch-marketing/${detail!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fieldErrors ? Object.values(data.fieldErrors).join(" / ") : data.error ?? "저장 실패");
        return;
      }
      if (mode === "edit") {
        router.push("/admin/influencer-hub/branch-marketing");
      } else {
        router.push(`/admin/influencer-hub/branch-marketing/${data.id}`);
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      {mode === "edit" && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2.5 disabled:opacity-50"
          >
            수정완료
          </button>
        </div>
      )}
      {error && <p className="text-[13.5px] text-red-500">{error}</p>}

      <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
        <Field label="지점" required>
          <IHBranchPicker required branches={branches} value={form.branch_id} onChange={(id) => setForm((prev) => ({ ...prev, branch_id: id }))} />
        </Field>
        <Field label="진행일">
          <input type="date" className={inputCls} value={form.marketing_date} onChange={setField("marketing_date")} />
        </Field>
        <Field label="회차">
          <div className={`${inputCls} bg-slate-50 text-slate-500 tabular-nums`}>
            {nextRound != null ? `${nextRound}회차` : "-"}
          </div>
        </Field>
      </div>

      <Field label="인플루언서" required>
        {mode === "edit" ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-[14.5px] text-slate-800">
            <span>{influencer?.nickname} · {influencer?.channel}</span>
            {influencer && (
              <Link
                href={`/admin/influencer-hub/influencers/${influencer.id}`}
                className="flex-shrink-0 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold px-3 py-1.5"
              >
                인플루언서 페이지로 이동 →
              </Link>
            )}
          </div>
        ) : (
          <IHInfluencerPicker value={influencer} onChange={setInfluencer} />
        )}
      </Field>

      <div className="grid grid-cols-4 gap-3">
        <Field label="비용(원)">
          <IHNumberInput className={inputCls} value={form.cost} onChange={(v) => setForm((prev) => ({ ...prev, cost: v }))} />
        </Field>
        <Field label="비용주체">
          <select className={inputCls} value={form.cost_bearer} onChange={setField("cost_bearer")}>
            <option value="">선택해주세요</option>
            {BRANCH_MKT_COST_BEARER_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="상태">
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "REGISTRATION_COMPLETED" && form.status !== "REGISTRATION_COMPLETED") {
                window.alert("등록완료 상태에서는 콘텐츠 URL과 조회수/반응수/댓글을 입력해주세요.");
              }
              setField("status")(e);
            }}
          >
            {BRANCH_MKT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{BRANCH_MKT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="상태 날짜">
          <input type="date" className={inputCls} value={form.status_date} onChange={setField("status_date")} />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Field label="콘텐츠 형태">
          {contentFormatCustom ? (
            <div className="flex gap-1.5">
              <input
                className={inputCls}
                value={form.content_format}
                onChange={setField("content_format")}
                placeholder="직접 입력"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setContentFormatCustom(false);
                  setForm((prev) => ({ ...prev, content_format: "" }));
                }}
                className="flex-shrink-0 text-[12px] text-slate-500 hover:text-slate-800 px-1"
              >
                목록
              </button>
            </div>
          ) : (
            <select
              className={inputCls}
              value={form.content_format}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setContentFormatCustom(true);
                  setForm((prev) => ({ ...prev, content_format: "" }));
                  return;
                }
                setField("content_format")(e);
              }}
            >
              <option value="">선택해주세요</option>
              {CONTENT_FORMAT_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">직접 입력</option>
            </select>
          )}
        </Field>
        <Field label="조회수">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.views}
            onChange={(v) => setForm((prev) => ({ ...prev, views: v }))}
            disabled={!canRecordResults}
          />
        </Field>
        <Field label="반응수">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.reactions}
            onChange={(v) => setForm((prev) => ({ ...prev, reactions: v }))}
            disabled={!canRecordResults}
          />
        </Field>
        <Field label="댓글">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.comments}
            onChange={(v) => setForm((prev) => ({ ...prev, comments: v }))}
            disabled={!canRecordResults}
          />
        </Field>
      </div>
      {!canRecordResults && (
        <p className="-mt-2 text-[12.5px] text-slate-400">
          상태가 &quot;{BRANCH_MKT_STATUS_LABEL.REGISTRATION_COMPLETED}&quot;일 때만 조회수/반응수/댓글을 입력할 수 있습니다.
        </p>
      )}

      <Field label="콘텐츠 URL">
        <input className={inputCls} value={form.content_url} onChange={setField("content_url")} placeholder="https://..." />
      </Field>

      <Field label="메모">
        <textarea className={`${inputCls} min-h-[80px]`} value={form.memo} onChange={setField("memo")} />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50">
          {mode === "create" ? "마케팅 등록" : "저장"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-slate-300 text-slate-600 text-[13px] font-semibold px-4 py-2">
          취소
        </button>
      </div>
    </form>
  );
}
