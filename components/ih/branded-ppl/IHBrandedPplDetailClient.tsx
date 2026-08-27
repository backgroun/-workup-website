"use client";
import Link from "next/link";
import type { IHBrandedPplDetail, IHBrandedPplPriceHistoryEntry } from "@/lib/ih/collabs";
import { BRANDED_PPL_STATUS_LABEL, BRANDED_PPL_CATEGORY_LABEL, fmtCostManwon, formatFollowerDisplay } from "@/lib/ih/influencer-shared";

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
      <span className="text-[12.5px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[14px] text-slate-800 text-right ml-4 break-words">{value}</span>
    </div>
  );
}

export default function IHBrandedPplDetailClient({
  detail,
  priceHistory,
}: {
  detail: IHBrandedPplDetail;
  priceHistory: IHBrandedPplPriceHistoryEntry[];
}) {
  const isCelebrity = detail.category === "CELEBRITY";
  const isPpl = detail.category === "PPL";
  const isInfluencer = detail.category === "INFLUENCER";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/influencer-hub/branded-ppl" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        브랜디드/PPL
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">{detail.name}</h1>
            <p className="mt-1 text-[14px] text-slate-600">{BRANDED_PPL_CATEGORY_LABEL[detail.category] ?? detail.category}</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {detail.channelLink && (
              <a
                href={detail.channelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 text-[13.5px] font-semibold px-4 py-2"
              >
                채널 바로가기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <Link
              href={`/admin/influencer-hub/branded-ppl/${detail.id}/edit`}
              className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2"
            >
              정보 수정
            </Link>
          </div>
        </div>

        <div className="max-w-xl">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-[14px] font-bold text-slate-900 mb-2">PPL 정보</h3>
            <InfoRow label="구분" value={BRANDED_PPL_CATEGORY_LABEL[detail.category] ?? detail.category} />
            <InfoRow label="이름" value={detail.name} />
            {isCelebrity && <InfoRow label="키" value={detail.height ?? "-"} />}
            {isCelebrity && <InfoRow label="의견" value={detail.opinion ?? "-"} />}
            {isPpl && <InfoRow label="메인패널" value={detail.mainCast ?? "-"} />}
            {(isPpl || isInfluencer) && (
              <InfoRow label="구독자" value={detail.subscriberCount != null ? formatFollowerDisplay(detail.subscriberCount) : "-"} />
            )}
            {/* 연예인은 광고상품 개념이 없어 계약 기준(기간)을 이 칸에 대신 기재한다. */}
            <InfoRow label="광고상품" value={isCelebrity ? detail.contractPeriod ?? "-" : detail.adProduct ?? "-"} />
            {(isPpl || isInfluencer) && (
              <InfoRow
                label="채널 링크"
                value={
                  detail.channelLink ? (
                    <a href={detail.channelLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {detail.channelLink}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            )}
            <InfoRow label="단가" value={fmtCostManwon(detail.cost)} />
            <InfoRow label="상태" value={BRANDED_PPL_STATUS_LABEL[detail.status] ?? detail.status} />
            <InfoRow label="최근 업데이트" value={fmtDateTime(detail.updatedAt)} />
            {detail.memo && (
              <div className="pt-2 mt-1 border-t border-slate-50">
                <p className="text-[12.5px] text-slate-500 mb-1">특징</p>
                <p className="text-[14px] text-slate-800 whitespace-pre-wrap">{detail.memo}</p>
              </div>
            )}
          </section>

          {priceHistory.length > 0 && (
            <section className="rounded-lg border border-slate-200 p-4 mt-4">
              <h3 className="text-[14px] font-bold text-slate-900 mb-2">단가 변경 이력</h3>
              <div className="divide-y divide-slate-50">
                {priceHistory.map((h) => (
                  <div key={h.id} className="py-2 text-[13.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-800">
                        {fmtWon(h.oldCost)} → <span className="font-semibold">{fmtWon(h.newCost)}</span>
                      </span>
                      <span className="flex-shrink-0 text-[12px] text-slate-400">{fmtDateTime(h.changedAt)}</span>
                    </div>
                    {h.reason && <p className="mt-0.5 text-[12.5px] text-slate-500">{h.reason}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
