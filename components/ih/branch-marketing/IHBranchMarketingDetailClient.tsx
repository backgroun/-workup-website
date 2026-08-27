"use client";
import Link from "next/link";
import type { IHBranchMarketingDetail } from "@/lib/ih/collabs";
import { BRANCH_MKT_STATUS_LABEL } from "@/lib/ih/influencer-shared";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y.slice(2)}.${m}.${d}`;
}
function fmtWon(n: number | null) {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}
function fmtNum(n: number | null) {
  return n == null ? "-" : n.toLocaleString("ko-KR");
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
      <span className="text-[12.5px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[14px] text-slate-800 text-right ml-4 break-words">{value}</span>
    </div>
  );
}

export default function IHBranchMarketingDetailClient({ detail }: { detail: IHBranchMarketingDetail }) {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/influencer-hub/branch-marketing" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        지점 마케팅
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">{detail.branchName}</h1>
            {detail.influencer && (
              <p className="mt-1 text-[14px] text-slate-600">
                <Link href={`/admin/influencer-hub/influencers/${detail.influencer.id}`} className="text-blue-600 hover:underline">
                  {detail.influencer.nickname}
                </Link>
              </p>
            )}
          </div>
          <Link
            href={`/admin/influencer-hub/branch-marketing/${detail.id}/edit`}
            className="flex-shrink-0 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2"
          >
            정보 수정
          </Link>
        </div>

        <div className="max-w-xl">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-[14px] font-bold text-slate-900 mb-2">마케팅 정보</h3>
            <InfoRow label="지점" value={detail.branchName} />
            <InfoRow
              label="인플루언서"
              value={
                detail.influencer ? (
                  <Link href={`/admin/influencer-hub/influencers/${detail.influencer.id}`} className="text-blue-600 hover:underline">
                    {detail.influencer.nickname} · {detail.influencer.channel}
                  </Link>
                ) : (
                  "미매칭"
                )
              }
            />
            <InfoRow label="진행일" value={fmtDate(detail.marketingDate)} />
            <InfoRow label="회차" value={detail.round != null ? `${detail.round}회차` : "-"} />
            <InfoRow label="비용" value={fmtWon(detail.cost)} />
            <InfoRow label="비용주체" value={detail.operationType ?? "-"} />
            {detail.taxType && <InfoRow label="세금 유형" value={detail.taxType} />}
            <InfoRow label="콘텐츠 형태" value={detail.contentFormat ?? "-"} />
            <InfoRow label="조회수" value={fmtNum(detail.views)} />
            <InfoRow label="반응수" value={fmtNum(detail.reactions)} />
            <InfoRow label="댓글" value={fmtNum(detail.comments)} />
            <InfoRow
              label="콘텐츠 URL"
              value={
                detail.contentUrl ? (
                  <a href={detail.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {detail.contentUrl}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <InfoRow label="상태" value={BRANCH_MKT_STATUS_LABEL[detail.status] ?? detail.status} />
            <InfoRow label="상태 날짜" value={fmtDate(detail.supportDate)} />
            <InfoRow label="최근 업데이트" value={fmtDateTime(detail.updatedAt)} />
            {detail.memo && (
              <div className="pt-2 mt-1 border-t border-slate-50">
                <p className="text-[12.5px] text-slate-500 mb-1">메모</p>
                <p className="text-[14px] text-slate-800 whitespace-pre-wrap">{detail.memo}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
