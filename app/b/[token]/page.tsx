import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { notFound } from "next/navigation";
import { getPassContextByToken, getNoticeSchedule } from "@/lib/notices";
import RefreshButton from "./_components/RefreshButton";
import NoticeViewToggle, { type NoticeItem } from "./_components/NoticeViewToggle";
import PassPageShell from "./_components/PassPageShell";
import DatePickerButton from "./_components/DatePickerButton";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ date?: string }> };

export const revalidate = 0;

function todayKstDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const ctx = await getPassContextByToken(token);
  return { title: ctx ? `${ctx.store.name} — 출고 패스` : "링크를 찾을 수 없음" };
}

export default async function BranchPassPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { date } = await searchParams;
  const todayKst = todayKstDate();
  // 캘린더에서 오늘을 다시 고른 경우도 date=todayKst로 넘어올 수 있으니, 그 경우는 기본(실시간) 조회로 취급한다.
  const selectedDate = date && date !== todayKst ? date : undefined;
  const ctx = await getPassContextByToken(token, selectedDate);
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
    <PassPageShell>
      <div className="w-full max-w-sm">
        {/* 지점명 — 박스 밖 별도 줄(긴 지점명이 컨트롤과 폭을 나눠 쓰다 2줄로 깨지는 문제 방지) */}
        <div className="mb-2 px-1">
          <h1 className="text-base font-bold text-[#303236] leading-snug">{ctx.store.name}</h1>
          {ctx.store.manager_name && (
            <p className="text-[11px] text-gray-400 mt-0.5">{ctx.store.manager_name}님 반갑습니다</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between gap-2">
            <DatePickerButton selectedDate={selectedDate ?? todayKst} todayKst={todayKst} />
            <RefreshButton />
          </div>
        </div>

        <NoticeViewToggle
          items={items}
          token={token}
          closeTime={schedule.closeTime}
          emptyMessage={selectedDate ? `${selectedDate} 등록된 공지가 없습니다.` : "오늘 등록된 공지가 없습니다."}
          isHistorical={Boolean(selectedDate)}
        />
      </div>
    </PassPageShell>
  );
}
