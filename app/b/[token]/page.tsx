import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { notFound } from "next/navigation";
import { getPassContextByToken, getNoticeSchedule } from "@/lib/notices";
import TempProductReveal from "./_components/TempProductReveal";
import VerticalImageStack from "./_components/VerticalImageStack";
import CloseCountdown from "./_components/CloseCountdown";
import PassToggle from "./_components/PassToggle";

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
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap flex-shrink-0 pt-0.5">
              {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
            </span>
          </div>
        </div>

        {ctx.notices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 py-16 text-center text-sm text-gray-400">
            오늘 등록된 공지가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {ctx.notices.map((card) => {
              const images = [card.product?.image_url, ...(card.product?.detail_image_urls ?? [])].filter(
                (u): u is string => Boolean(u)
              );
              const taglineNode = card.product?.tagline ? (
                <div
                  className="text-[12.5px] text-gray-500 mt-0.5 [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.product.tagline) }}
                />
              ) : undefined;

              const isClosed = card.notice.status === "마감";

              return (
                <div
                  key={card.notice.id}
                  className={`rounded-2xl shadow-sm border p-6 ${
                    isClosed ? "bg-gray-100 border-gray-200" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] tracking-wide text-gray-400 uppercase">오늘의 상품</p>
                    {isClosed && <p className="text-xl font-black text-gray-400 tracking-wide">마감</p>}
                  </div>
                  {!isClosed && card.notice.status === "진행중" && <CloseCountdown closeTime={schedule.closeTime} />}
                  <div className={`rounded-xl border p-3.5 mb-4 ${isClosed ? "border-gray-200" : "border-gray-100"}`}>
                    {/* 정식등록·임시등록 구분 없이 동일하게: 대표 사진 + "펼쳐보기"를 누르면
                        모달에서 모든 사진을 세로로 이어 보여준다 (실제 상품페이지로 이동하지 않음). */}
                    <TempProductReveal images={images} name={card.product?.name ?? "상품 정보 없음"} tagline={taglineNode} />

                    {(card.notice.description || card.notice.extraImages.length > 0) && (
                      <div className="mt-3.5 pt-3.5 border-t border-gray-100">
                        {card.notice.description && (
                          <div
                            className="text-[12.5px] text-gray-600 mb-3 [&_p]:m-0"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.notice.description) }}
                          />
                        )}
                        {card.notice.extraImages.length > 0 && (
                          <VerticalImageStack images={card.notice.extraImages} alt="추가 사진" />
                        )}
                      </div>
                    )}
                  </div>

                  <PassToggle
                    token={token}
                    noticeId={card.notice.id}
                    noticeStatus={card.notice.status}
                    initialStatus={card.passStatus}
                    initialUpdatedAt={card.updatedAt}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
