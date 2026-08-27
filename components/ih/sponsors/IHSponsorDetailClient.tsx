"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IHSponsorDetail } from "@/lib/ih/collabs";
import type { IHInfluencerMobileSummary } from "@/lib/ih/influencers";
import { SPONSOR_STAGE_ORDER, SPONSOR_STAGE_LABEL } from "@/lib/ih/influencer-shared";
import IHMobileSelectSync from "../influencers/IHMobileSelectSync";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}
function fmtWon(n: number | null) {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const y = String(d.getFullYear()).slice(2);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-[13px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[14px] text-slate-700 text-right ml-4 break-words">{value}</span>
    </div>
  );
}

export default function IHSponsorDetailClient({
  sponsor: initial,
  mobileSummary,
}: {
  sponsor: IHSponsorDetail;
  mobileSummary: IHInfluencerMobileSummary;
}) {
  const router = useRouter();
  const [sponsor, setSponsor] = useState(initial);
  const [statusSaving, setStatusSaving] = useState(false);

  const changeStatus = async (next: string) => {
    if (next === sponsor.status) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/admin/ih/sponsors/${sponsor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSponsor((prev) => ({ ...prev, status: updated.status, updatedAt: updated.updated_at }));
        router.refresh();
      }
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <IHMobileSelectSync summary={mobileSummary} />

      <Link href="/admin/influencer-hub/sponsors" className="inline-flex items-center gap-1 text-[13.5px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        제품 협찬
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">{sponsor.product}</h1>
            <p className="mt-1 text-[14px] text-slate-600">
              {sponsor.round != null ? `${sponsor.round}회차 · ` : ""}
              <Link href={`/admin/influencer-hub/influencers/${sponsor.influencerId}`} className="text-blue-600 hover:underline">
                {sponsor.influencer.nickname}
              </Link>
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <select
              value={sponsor.status}
              disabled={statusSaving}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[13.5px] text-slate-700 disabled:opacity-50"
            >
              {SPONSOR_STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{SPONSOR_STAGE_LABEL[s]}</option>
              ))}
            </select>
            <Link
              href={`/admin/influencer-hub/sponsors/${sponsor.id}/edit`}
              className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold px-4 py-2"
            >
              수정
            </Link>
          </div>
        </div>

        <div className="max-w-xl">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-[14px] font-bold text-slate-900 mb-2">협찬 정보</h3>
            <InfoRow label="제품" value={sponsor.product} />
            <InfoRow label="회차" value={sponsor.round ?? "-"} />
            <InfoRow label="제공 제품 / 사이즈" value={sponsor.supportType ?? "-"} />
            <InfoRow label="콘텐츠 형태" value={sponsor.contentFormat ?? "-"} />
            <InfoRow label="발송일" value={fmtDate(sponsor.sendDate)} />
            <InfoRow label="실제 업로드일" value={fmtDate(sponsor.uploadDate)} />
            <InfoRow label="제품+배송비" value={fmtWon(sponsor.cost)} />
            <InfoRow label="조회수" value={sponsor.views != null ? sponsor.views.toLocaleString("ko-KR") : "-"} />
            <InfoRow label="좋아요" value={sponsor.likes != null ? sponsor.likes.toLocaleString("ko-KR") : "-"} />
            <InfoRow label="댓글" value={sponsor.comments != null ? sponsor.comments.toLocaleString("ko-KR") : "-"} />
            <InfoRow label="상태" value={SPONSOR_STAGE_LABEL[sponsor.status as keyof typeof SPONSOR_STAGE_LABEL] ?? sponsor.status} />
            <InfoRow label="최근 업데이트" value={fmtDateTime(sponsor.updatedAt)} />
            <InfoRow
              label="콘텐츠 URL"
              value={
                sponsor.contentUrl ? (
                  <a href={sponsor.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {sponsor.contentUrl}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            {sponsor.memo && (
              <div className="pt-2 mt-1 border-t border-slate-50">
                <p className="text-[13px] text-slate-500 mb-1">메모</p>
                <p className="text-[14px] text-slate-700 whitespace-pre-wrap">{sponsor.memo}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
