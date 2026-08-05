import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { notFound } from "next/navigation";
import { getPassContextByToken, getNoticeSchedule } from "@/lib/notices";
import RefreshButton from "./_components/RefreshButton";
import NoticeViewToggle, { type NoticeItem } from "./_components/NoticeViewToggle";

type Props = { params: Promise<{ token: string }> };

export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const ctx = await getPassContextByToken(token);
  return { title: ctx ? `${ctx.store.name} — 출고 패스` : "링크를 찾을 수 없음" };
}

export default async function BranchPassPage({ params }: Props) {
  const { token } = await params;
  const ctx = await getPassContextByToken(token);
  if (!ctx) notFound();
  const schedule = await getNoticeSchedule();

  const items: NoticeItem[] = ctx.notices.map((card) => ({
    noticeId: card.notice.id,
    status: card.notice.status,
    productName: card.product?.name ?? "상품 정보 없음",
    images: [card.product?.image_url, ...(card.product?.detail_image_urls ?? [])].filter(
      (u): u is string => Boolean(u)
    ),
    taglineHtml: card.product?.tagline ? DOMPurify.sanitize(card.product.tagline) : null,
    descriptionHtml: card.notice.description ? DOMPurify.sanitize(card.notice.description) : null,
    extraImages: card.notice.extraImages,
    passStatus: card.passStatus,
    updatedAt: card.updatedAt,
  }));

  return (
    <main className="min-h-screen bg-[#f7f7f5] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-[#303236] leading-snug">{ctx.store.name}</span>
              {ctx.store.manager_name && (
                <p className="text-[11px] text-gray-400 mt-0.5">{ctx.store.manager_name}님 반갑습니다</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
              </span>
              <RefreshButton />
            </div>
          </div>
        </div>

        <NoticeViewToggle items={items} token={token} closeTime={schedule.closeTime} />
      </div>
    </main>
  );
}
