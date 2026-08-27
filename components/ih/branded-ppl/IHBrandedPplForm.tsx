"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { IHBrandedPplDetail } from "@/lib/ih/collabs";
import { BRANDED_PPL_STATUS_ORDER, BRANDED_PPL_STATUS_LABEL, BRANDED_PPL_CATEGORY_ORDER, BRANDED_PPL_CATEGORY_LABEL } from "@/lib/ih/influencer-shared";
import IHNumberInput from "../IHNumberInput";
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
  category: string;
  name: string;
  height: string;
  opinion: string;
  contractPeriod: string;
  subscriberCount: string;
  mainCast: string;
  adProduct: string;
  channelLink: string;
  cost: string;
  status: string;
  memo: string;
  costChangeReason: string;
};

const EMPTY_FORM: FormState = {
  category: "INFLUENCER",
  name: "",
  height: "",
  opinion: "",
  contractPeriod: "",
  subscriberCount: "",
  mainCast: "",
  adProduct: "",
  channelLink: "",
  cost: "",
  status: "NEGOTIATING",
  memo: "",
  costChangeReason: "",
};

/** 브랜디드 PPL 등록/수정 공용 Form — Phase 7. 구분(연예인/PPL/인플루언서)에 따라 필요한 전용 필드만 노출한다. */
export default function IHBrandedPplForm({
  mode,
  detail,
}: {
  mode: "create" | "edit";
  detail?: IHBrandedPplDetail;
}) {
  const router = useRouter();
  const { setBrandedPplListState } = useIHMobileSelection();
  const [form, setForm] = useState<FormState>(
    detail
      ? {
          category: detail.category,
          name: detail.name,
          height: detail.height ?? "",
          opinion: detail.opinion ?? "",
          contractPeriod: detail.contractPeriod ?? "",
          subscriberCount: detail.subscriberCount != null ? String(detail.subscriberCount) : "",
          mainCast: detail.mainCast ?? "",
          adProduct: detail.adProduct ?? "",
          channelLink: detail.channelLink ?? "",
          cost: detail.cost != null ? String(detail.cost) : "",
          status: detail.status,
          memo: detail.memo ?? "",
          costChangeReason: "",
        }
      : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 등록/수정 폼에서는 무관한 전체 목록 대신, Mobile Viewer가 중립적인 빈 화면을 보여주도록 한다.
  useEffect(() => {
    setBrandedPplListState([]);
    return () => setBrandedPplListState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("모델명/채널명/인플루언서명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        cost: form.cost ? Number(form.cost) : null,
        subscriberCount: form.subscriberCount ? Number(form.subscriberCount) : null,
      };
      const url = mode === "create" ? "/api/admin/ih/branded-ppl" : `/api/admin/ih/branded-ppl/${detail!.id}`;
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
        router.push("/admin/influencer-hub/branded-ppl");
      } else {
        router.push(`/admin/influencer-hub/branded-ppl/${data.id}`);
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const isCelebrity = form.category === "CELEBRITY";
  const isPpl = form.category === "PPL";
  const isInfluencer = form.category === "INFLUENCER";

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

      <div className="grid grid-cols-2 gap-3">
        <Field label="구분" required>
          <select className={inputCls} value={form.category} onChange={setField("category")}>
            {BRANDED_PPL_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{BRANDED_PPL_CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </Field>
        <Field label={isCelebrity ? "모델명" : isPpl ? "채널명" : "인플루언서명"} required>
          <input required className={inputCls} value={form.name} onChange={setField("name")} placeholder="이름 직접 입력" />
        </Field>
      </div>

      {isCelebrity && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="키">
            <input className={inputCls} value={form.height} onChange={setField("height")} placeholder="예: 181" />
          </Field>
          <Field label="계약 기준(기간)">
            <input className={inputCls} value={form.contractPeriod} onChange={setField("contractPeriod")} placeholder="예: 6개월" />
          </Field>
        </div>
      )}
      {isCelebrity && (
        <Field label="의견(포지셔닝)">
          <textarea className={`${inputCls} min-h-[60px]`} value={form.opinion} onChange={setField("opinion")} placeholder="예: 전세대 호감형 / 배우 / 4050 인지도 상승" />
        </Field>
      )}

      {isPpl && (
        <Field label="메인패널(출연진)">
          <input className={inputCls} value={form.mainCast} onChange={setField("mainCast")} placeholder="예: 최성민, 남호연" />
        </Field>
      )}

      {(isPpl || isInfluencer) && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="구독자 수">
            <IHNumberInput
              className={inputCls}
              value={form.subscriberCount}
              onChange={(v) => setForm((prev) => ({ ...prev, subscriberCount: v }))}
              placeholder="숫자만 입력 (예: 13700)"
            />
          </Field>
          <Field label="광고상품(콘텐츠 형태)">
            <input className={inputCls} value={form.adProduct} onChange={setField("adProduct")} placeholder="예: 릴스, 브랜디드 룡폼" />
          </Field>
        </div>
      )}

      {(isPpl || isInfluencer) && (
        <Field label="채널 링크">
          <input className={inputCls} value={form.channelLink} onChange={setField("channelLink")} placeholder="https://..." />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="단가(원)">
          <IHNumberInput className={inputCls} value={form.cost} onChange={(v) => setForm((prev) => ({ ...prev, cost: v }))} />
        </Field>
        <Field label="상태">
          <select className={inputCls} value={form.status} onChange={setField("status")}>
            {BRANDED_PPL_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{BRANDED_PPL_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* 수정 화면에서 단가를 바꾼 경우에만 변경 사유를 받는다 — 단가 변경 이력에 함께 남는다. */}
      {mode === "edit" && detail && form.cost !== (detail.cost != null ? String(detail.cost) : "") && (
        <Field label="단가 변경 사유">
          <input
            className={inputCls}
            value={form.costChangeReason}
            onChange={setField("costChangeReason")}
            placeholder="예: 재협상, 시즌 할인 등 (선택)"
          />
        </Field>
      )}

      <Field label="특징">
        <textarea className={`${inputCls} min-h-[80px]`} value={form.memo} onChange={setField("memo")} />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50">
          {mode === "create" ? "PPL 등록" : "저장"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-slate-300 text-slate-600 text-[13px] font-semibold px-4 py-2">
          취소
        </button>
      </div>
    </form>
  );
}
