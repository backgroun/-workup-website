"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IHInfluencerDetail } from "@/lib/ih/influencers";
import type { IHSponsorDetail } from "@/lib/ih/collabs";
import { SPONSOR_STAGE_ORDER, SPONSOR_STAGE_SELECTABLE_ORDER, SPONSOR_STAGE_LABEL, CONTENT_FORMAT_OPTIONS } from "@/lib/ih/influencer-shared";
import IHInfluencerPicker, { type IHInfluencerPickerItem } from "./IHInfluencerPicker";
import IHNumberInput from "../IHNumberInput";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-[14.5px] text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-500";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[14px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function defaultSizeText(inf: { top_size: string | null; bottom_size: string | null; outer_size: string | null }): string {
  const parts: string[] = [];
  if (inf.top_size) parts.push(`상 ${inf.top_size}`);
  if (inf.bottom_size) parts.push(`하 ${inf.bottom_size}`);
  if (inf.outer_size) parts.push(`아우터 ${inf.outer_size}`);
  return parts.join(" · ");
}

type FormState = {
  product: string;
  support_type: string;
  content_format: string;
  send_date: string;
  upload_date: string;
  content_url: string;
  product_cost: string;
  shipping_cost: string;
  views: string;
  likes: string;
  comments: string;
  status: string;
  memo: string;
};

const EMPTY_FORM: FormState = {
  product: "",
  support_type: "",
  content_format: "",
  send_date: "",
  upload_date: "",
  content_url: "",
  product_cost: "",
  shipping_cost: "",
  views: "",
  likes: "",
  comments: "",
  status: "PLANNED",
  memo: "",
};

/**
 * 제품 협찬 등록/수정 공용 Form — Phase 5.
 * 등록: 인플루언서 선택 → 기존 사이즈/협찬이력 자동 조회 → 사이즈 기본값·회차 자동 제안(둘 다 수정 가능).
 * 수정: 인플루언서는 고정, 나머지 필드만 편집.
 */
export default function IHSponsorForm({
  mode,
  initialInfluencerId,
  sponsor,
}: {
  mode: "create" | "edit";
  initialInfluencerId?: number;
  sponsor?: IHSponsorDetail;
}) {
  const router = useRouter();
  const [influencer, setInfluencer] = useState<IHInfluencerPickerItem | null>(
    sponsor
      ? {
          id: sponsor.influencer.id,
          nickname: sponsor.influencer.nickname,
          channel: sponsor.influencer.channel,
          follower_display: sponsor.influencer.followerDisplay,
          content_type: sponsor.influencer.contentType,
          activity_area: sponsor.influencer.activityArea,
        }
      : null
  );
  const [influencerDetail, setInfluencerDetail] = useState<IHInfluencerDetail | null>(null);
  const [nextRound, setNextRound] = useState<number | null>(sponsor?.round ?? null);
  const [form, setForm] = useState<FormState>(
    sponsor
      ? {
          product: sponsor.product,
          support_type: sponsor.supportType ?? "",
          content_format: sponsor.contentFormat ?? "",
          send_date: sponsor.sendDate ?? "",
          upload_date: sponsor.uploadDate ?? "",
          content_url: sponsor.contentUrl ?? "",
          product_cost:
            sponsor.productCost != null ? String(sponsor.productCost) : sponsor.cost != null ? String(sponsor.cost) : "",
          shipping_cost: sponsor.shippingCost != null ? String(sponsor.shippingCost) : "",
          views: sponsor.views != null ? String(sponsor.views) : "",
          likes: sponsor.likes != null ? String(sponsor.likes) : "",
          comments: sponsor.comments != null ? String(sponsor.comments) : "",
          status: sponsor.status,
          memo: sponsor.memo ?? "",
        }
      : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentFormatCustom, setContentFormatCustom] = useState(
    !!form.content_format && !(CONTENT_FORMAT_OPTIONS as readonly string[]).includes(form.content_format)
  );

  // 등록 모드에서만: 인플루언서 선택 시 상세(사이즈/기존 협찬이력)를 불러와 사이즈·회차 기본값을 채운다.
  useEffect(() => {
    if (mode !== "create" || !influencer) {
      if (mode === "create" && !influencer) setNextRound(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/ih/influencers/${influencer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((detail: IHInfluencerDetail | null) => {
        if (cancelled || !detail) return;
        setInfluencerDetail(detail);
        const maxRound = detail.sponsors.reduce((m, s) => Math.max(m, s.round ?? 0), 0);
        setNextRound(maxRound + 1);
        setForm((prev) => ({
          ...prev,
          support_type: prev.support_type || defaultSizeText(detail.influencer),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [influencer?.id, mode]);

  // 등록 시 initialInfluencerId(예: 인플루언서 상세의 "+ 협찬 등록")가 있으면 자동 선택한다.
  useEffect(() => {
    if (mode !== "create" || !initialInfluencerId || influencer) return;
    fetch(`/api/admin/ih/influencers/${initialInfluencerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((detail: IHInfluencerDetail | null) => {
        if (!detail) return;
        setInfluencer({
          id: detail.influencer.id,
          nickname: detail.influencer.nickname,
          channel: detail.influencer.channel,
          follower_display: detail.influencer.follower_display,
          content_type: detail.influencer.content_type,
          activity_area: detail.influencer.activity_area,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInfluencerId, mode]);

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!influencer) {
      setError("인플루언서를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        product_cost: form.product_cost ? Number(form.product_cost) : null,
        shipping_cost: form.shipping_cost ? Number(form.shipping_cost) : null,
        views: form.views ? Number(form.views) : null,
        likes: form.likes ? Number(form.likes) : null,
        comments: form.comments ? Number(form.comments) : null,
        send_date: form.send_date || null,
        upload_date: form.upload_date || null,
      };
      const url = mode === "create" ? `/api/admin/ih/influencers/${influencer.id}/sponsors` : `/api/admin/ih/sponsors/${sponsor!.id}`;
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
        router.push("/admin/influencer-hub/sponsors");
      } else {
        router.push(`/admin/influencer-hub/sponsors/${data.id}`);
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const sponsorHistory = influencerDetail?.sponsors ?? [];
  // 콘텐츠 URL/조회수는 실제로 업로드가 끝난 뒤에나 존재하는 값이라 "업로드 완료"/"종료" 상태에서만 기록하게 한다.
  const canRecordResults = form.status === "UPLOADED" || form.status === "ENDED";

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      {mode === "edit" && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-5 py-2.5 disabled:opacity-50"
          >
            수정완료
          </button>
        </div>
      )}
      {error && <p className="text-[13.5px] text-red-500">{error}</p>}

      <Field label="인플루언서" required>
        {mode === "edit" ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 bg-slate-50 text-[14.5px] text-slate-700">
            <span>{influencer?.nickname} · {influencer?.channel}</span>
            {influencer && (
              <Link
                href={`/admin/influencer-hub/influencers/${influencer.id}`}
                className="flex-shrink-0 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-3 py-1.5"
              >
                인플루언서 페이지로 이동 →
              </Link>
            )}
          </div>
        ) : (
          <IHInfluencerPicker value={influencer} onChange={setInfluencer} />
        )}
      </Field>

      {mode === "create" && influencer && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[14px] text-slate-700 space-y-1">
          <p className="font-semibold text-slate-800">기존 정보 자동 반영</p>
          {influencerDetail ? (
            <>
              <p>
                사이즈 — {defaultSizeText(influencerDetail.influencer) || "등록된 사이즈 없음"}
              </p>
              <p>
                기존 협찬 — 총 {sponsorHistory.length}회
                {sponsorHistory[0] && ` · 최근 ${sponsorHistory[0].product}(${sponsorHistory[0].round ?? "-"}회차, ${SPONSOR_STAGE_LABEL[sponsorHistory[0].status as keyof typeof SPONSOR_STAGE_LABEL] ?? sponsorHistory[0].status})`}
              </p>
            </>
          ) : (
            <p>불러오는 중…</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Field label="회차">
          <div className={`${inputCls} bg-slate-50 text-slate-500 tabular-nums`}>
            {nextRound != null ? `${nextRound}회차` : "-"}
          </div>
        </Field>
        <Field label="콘텐츠 형태">
          {contentFormatCustom ? (
            <div className="flex gap-1.5">
              <input
                className={inputCls}
                value={form.content_format}
                onChange={setField("content_format")}
                placeholder="콘텐츠 형태 직접 입력"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setContentFormatCustom(false);
                  setForm((prev) => ({ ...prev, content_format: "" }));
                }}
                className="flex-shrink-0 text-[13px] text-slate-600 hover:text-slate-800 px-1"
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="제품" required>
          <input required className={inputCls} value={form.product} onChange={setField("product")} placeholder="제품명 직접 입력" />
        </Field>
        <Field label="제공 제품 / 사이즈">
          <input className={inputCls} value={form.support_type} onChange={setField("support_type")} placeholder="예: 상 95 · 하 32" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="상태">
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "UPLOADED" && form.status !== "UPLOADED") {
                window.alert("업로드 완료 상태에서는 콘텐츠 URL과 조회수를 입력해주세요.");
              }
              setField("status")(e);
            }}
          >
            {/* 이미 "종료"로 저장된 기존 건은 그 값을 계속 보여주되, 새로 종료를 고를 수는 없게 한다. */}
            {(form.status === "ENDED" ? SPONSOR_STAGE_ORDER : SPONSOR_STAGE_SELECTABLE_ORDER).map((s) => (
              <option key={s} value={s}>{SPONSOR_STAGE_LABEL[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="상태 일정">
          <input type="date" className={inputCls} value={form.upload_date} onChange={setField("upload_date")} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <Field label="원가(원)">
          <IHNumberInput className={inputCls} value={form.product_cost} onChange={(v) => setForm((prev) => ({ ...prev, product_cost: v }))} />
        </Field>
        <Field label="택배비(원)">
          <IHNumberInput className={inputCls} value={form.shipping_cost} onChange={(v) => setForm((prev) => ({ ...prev, shipping_cost: v }))} />
        </Field>
        <div className="pb-2">
          <span className="text-[14px] font-semibold text-slate-700">제품+배송비 합계</span>
          <p className="mt-1 px-3 py-2 text-[14.5px] text-slate-900 font-semibold">
            {((Number(form.product_cost) || 0) + (Number(form.shipping_cost) || 0)).toLocaleString("ko-KR")}원
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="콘텐츠 URL">
          <input
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.content_url}
            onChange={setField("content_url")}
            placeholder="https://..."
            disabled={!canRecordResults}
          />
        </Field>
        <Field label="조회수">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.views}
            onChange={(v) => setForm((prev) => ({ ...prev, views: v }))}
            placeholder="직접 입력"
            disabled={!canRecordResults}
          />
        </Field>
        <Field label="좋아요">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.likes}
            onChange={(v) => setForm((prev) => ({ ...prev, likes: v }))}
            placeholder="직접 입력"
            disabled={!canRecordResults}
          />
        </Field>
        <Field label="댓글">
          <IHNumberInput
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
            value={form.comments}
            onChange={(v) => setForm((prev) => ({ ...prev, comments: v }))}
            placeholder="직접 입력"
            disabled={!canRecordResults}
          />
        </Field>
        {!canRecordResults && (
          <p className="col-span-2 -mt-1 text-[12.5px] text-slate-400">
            상태가 &quot;{SPONSOR_STAGE_LABEL.UPLOADED}&quot; 또는 &quot;{SPONSOR_STAGE_LABEL.ENDED}&quot;일 때만 입력할 수 있습니다.
          </p>
        )}
      </div>

      <Field label="메모">
        <textarea className={`${inputCls} min-h-[80px]`} value={form.memo} onChange={setField("memo")} />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2 disabled:opacity-50">
          {mode === "create" ? "협찬 등록" : "저장"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-slate-300 text-slate-700 text-[14px] font-semibold px-4 py-2">
          취소
        </button>
      </div>
    </form>
  );
}
