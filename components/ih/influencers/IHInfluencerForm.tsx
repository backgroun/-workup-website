"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IHInfluencerInput, IHInfluencerRow } from "@/lib/ih/influencers";
import { STATUS_LABEL, CHANNEL_OPTIONS, formatFollowerDisplay, COLLAB_TYPE_LABEL, COLLAB_TYPE_ORDER, type IHCollabType } from "@/lib/ih/influencer-shared";
import IHTagBadges from "./IHTagBadges";
import IHRegionMultiSelect from "./IHRegionMultiSelect";
import IHAddressSearchField from "./IHAddressSearchField";
import IHNumberInput from "../IHNumberInput";

type Props = {
  mode: "create" | "edit";
  influencerId?: number;
  initial?: IHInfluencerRow;
};

function toFormState(initial?: IHInfluencerRow): IHInfluencerInput {
  if (!initial) return { nickname: "", channel: "Instagram", status: "ACTIVE", tags: [], content_type: [], activity_area: [], collab_types: [] };
  return {
    nickname: initial.nickname,
    channel: initial.channel,
    handle: initial.handle ?? "",
    channel_id: initial.channel_id ?? "", // 등록 Form에는 노출하지 않지만 값은 보존한다(향후 API/자동수집용).
    channel_url: initial.channel_url ?? "",
    follower_count: initial.follower_count,
    follower_display: initial.follower_display ?? "",
    content_type: initial.content_type,
    activity_area: Array.isArray(initial.activity_area) ? initial.activity_area : [],
    collab_types: Array.isArray(initial.collab_types) ? initial.collab_types : [],
    status: initial.status,
    tags: initial.tags,
    name: initial.name ?? "",
    gender: initial.gender ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
    height: initial.height,
    top_size: initial.top_size ?? "",
    bottom_size: initial.bottom_size ?? "",
    outer_size: initial.outer_size ?? "",
    upload_cycle: initial.upload_cycle ?? "",
    memo: initial.memo ?? "",
  };
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[14px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[12.5px] text-red-500">{error}</p>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-[14.5px] text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-500";

/** 숫자만 입력해도 010-0000-0000 형태로 자동 하이픈 삽입. */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const GROUP_COLS_CLASS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

function Group({
  title,
  cols = 2,
  headerRight,
  children,
}: {
  title: string;
  cols?: 2 | 3 | 4;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3 gap-3">
        <h2 className="text-[14.5px] font-bold text-slate-900">{title}</h2>
        {headerRight}
      </div>
      <div className={`grid grid-cols-1 ${GROUP_COLS_CLASS[cols]} gap-3`}>{children}</div>
    </section>
  );
}

export default function IHInfluencerForm({ mode, influencerId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<IHInfluencerInput>(toFormState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicate, setDuplicate] = useState<{ id: number; nickname: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof IHInfluencerInput>(key: K, value: IHInfluencerInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setDuplicate(null);

    const payload: IHInfluencerInput = {
      ...form,
      follower_count: form.follower_count === ("" as unknown) ? null : form.follower_count,
      height: form.height === ("" as unknown) ? null : form.height,
    };

    try {
      const url = mode === "create" ? "/api/admin/ih/influencers" : `/api/admin/ih/influencers/${influencerId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        setDuplicate({ id: data.existing.id, nickname: data.existing.nickname });
        return;
      }
      if (res.status === 400) {
        setErrors(data.fieldErrors ?? {});
        return;
      }
      if (!res.ok) {
        setErrors({ _global: data.error ?? "저장 중 오류가 발생했습니다." });
        return;
      }

      if (mode === "edit") {
        router.push("/admin/influencer-hub/influencers");
      } else {
        router.push(`/admin/influencer-hub/influencers/${data.id}`);
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-4xl">
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
      {duplicate && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center justify-between">
          <p className="text-[14px] text-amber-800">
            이미 등록된 인플루언서입니다. <span className="font-semibold">{duplicate.nickname}</span>
          </p>
          <a
            href={`/admin/influencer-hub/influencers/${duplicate.id}`}
            className="text-[13.5px] font-semibold text-amber-800 underline"
          >
            기존 인플루언서 보기
          </a>
        </div>
      )}
      {errors._global && <p className="text-[14px] text-red-500">{errors._global}</p>}

      <Group
        title="기본정보"
        cols={3}
        headerRight={
          <div className="flex-shrink-0 text-right">
            <span className="block text-[12.5px] font-medium text-slate-600 mb-1">활동 유형</span>
            <div className="flex items-center gap-3">
              {COLLAB_TYPE_ORDER.map((t) => {
                const checked = (form.collab_types ?? []).includes(t);
                return (
                  <label key={t} className="flex items-center gap-1.5 text-[14px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const cur = form.collab_types ?? [];
                        const next: IHCollabType[] = e.target.checked ? [...cur, t] : cur.filter((v) => v !== t);
                        set("collab_types", next);
                      }}
                      className="w-4 h-4"
                    />
                    {COLLAB_TYPE_LABEL[t]}
                  </label>
                );
              })}
            </div>
          </div>
        }
      >
        <Field label="닉네임" required error={errors.nickname}>
          <input className={inputCls} value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
        </Field>
        <Field label="상태">
          <select className={inputCls} value={form.status ?? "ACTIVE"} onChange={(e) => set("status", e.target.value as IHInfluencerInput["status"])}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="채널">
          <div className="flex gap-2">
            <select
              className={inputCls}
              value={CHANNEL_OPTIONS.includes(form.channel as (typeof CHANNEL_OPTIONS)[number]) ? form.channel : "기타"}
              onChange={(e) => set("channel", e.target.value === "기타" ? "" : e.target.value)}
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="기타">기타(직접 입력)</option>
            </select>
            {!CHANNEL_OPTIONS.includes(form.channel as (typeof CHANNEL_OPTIONS)[number]) && (
              <input className={inputCls} value={form.channel ?? ""} onChange={(e) => set("channel", e.target.value)} placeholder="채널명 직접 입력" />
            )}
          </div>
        </Field>
        <Field label="채널 URL" error={errors.channel_url}>
          <input className={inputCls} value={form.channel_url ?? ""} onChange={(e) => set("channel_url", e.target.value)} placeholder="https://instagram.com/..." />
        </Field>
        <Field label="팔로워" error={errors.follower_count}>
          <div className="flex items-center gap-2">
            <IHNumberInput
              className={inputCls}
              value={form.follower_count != null ? String(form.follower_count) : ""}
              onChange={(v) => {
                const n = v === "" ? null : Number(v);
                setForm((prev) => ({
                  ...prev,
                  follower_count: n,
                  follower_display: n != null ? formatFollowerDisplay(n) : prev.follower_display,
                }));
              }}
              placeholder="숫자 (예: 56000)"
            />
            <span className="flex-shrink-0 text-[13.5px] text-slate-500 whitespace-nowrap">{form.follower_display || "-"}</span>
          </div>
        </Field>
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[13.5px] font-medium text-slate-700">콘텐츠</span>
            <p className="text-[12.5px] text-slate-500">쉼표(,)로 여러 개 입력 — 예: 캠핑, 차박, 여행</p>
            <div className="mt-1">
              <IHTagBadges
                tags={form.content_type ?? []}
                editable
                hashPrefix={false}
                placeholder="캠핑, 차박, 여행"
                onChange={(next) => set("content_type", next)}
              />
            </div>
          </div>
          <div>
            <span className="text-[13.5px] font-medium text-slate-700">활동지역</span>
            <div className="mt-1">
              <IHRegionMultiSelect value={form.activity_area ?? []} onChange={(next) => set("activity_area", next)} />
            </div>
          </div>
        </div>
        {/* 태그는 콘텐츠와 중복이라 Form에서 제거(기존 값은 보존되어 그대로 저장됨). */}
        {/* 채널 ID는 일반 관리자가 직접 입력할 필요가 없어 Form에서 숨긴다(DB 컬럼/값은 유지, 향후 API·자동수집용). */}
      </Group>

      {mode === "create" && (
        <div className="flex items-start gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2.5 text-[13px] text-orange-800">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            단가는 이 등록 화면에서 입력하지 않습니다. 단가는 시점에 따라 바뀔 수 있어 변경 이력을 남겨야 하므로, 등록을 마친 뒤
            인플루언서 상세 페이지의 <span className="font-semibold">&quot;기타정보&quot;</span> 탭에서 등록/수정해주세요.
          </span>
        </div>
      )}

      <Group title="개인정보" cols={3}>
        <Field label="이름">
          <input className={inputCls} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="성별">
          <select className={inputCls} value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">선택 안 함</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </Field>
        <Field label="연락처" error={errors.phone}>
          <input
            className={inputCls}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", formatPhoneNumber(e.target.value))}
            placeholder="010-0000-0000"
          />
        </Field>
        <div className="sm:col-span-3">
          <Field label="주소">
            <IHAddressSearchField value={form.address ?? ""} onChange={(next) => set("address", next)} />
          </Field>
        </div>
      </Group>

      <Group title="사이즈" cols={4}>
        <Field label="키" error={errors.height}>
          <IHNumberInput
            className={inputCls}
            value={form.height != null ? String(form.height) : ""}
            onChange={(v) => set("height", v === "" ? null : Number(v))}
          />
        </Field>
        <Field label="상의">
          <input className={inputCls} value={form.top_size ?? ""} onChange={(e) => set("top_size", e.target.value)} />
        </Field>
        <Field label="하의">
          <input className={inputCls} value={form.bottom_size ?? ""} onChange={(e) => set("bottom_size", e.target.value)} />
        </Field>
        <Field label="아우터">
          <input className={inputCls} value={form.outer_size ?? ""} onChange={(e) => set("outer_size", e.target.value)} />
        </Field>
      </Group>

      <Group title="협업정보">
        <Field label="업로드 주기">
          <input className={inputCls} value={form.upload_cycle ?? ""} onChange={(e) => set("upload_cycle", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="메모">
            <textarea
              className={`${inputCls} min-h-[80px]`}
              value={form.memo ?? ""}
              onChange={(e) => set("memo", e.target.value)}
            />
          </Field>
        </div>
      </Group>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {mode === "create" ? "등록" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 text-slate-700 text-[14px] font-semibold px-5 py-2.5"
        >
          취소
        </button>
      </div>
    </form>
  );
}
