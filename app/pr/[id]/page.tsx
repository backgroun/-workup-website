import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrRoom } from "@/lib/pr-room-server";
import { isHtmlBody } from "@/lib/pr-room";
import { getFooterConfig } from "@/lib/footer-server";

// 본문(에디터 HTML) 렌더용 자식 요소 스타일 — prose 플러그인 없이 임의 변형자로 처리.
const BODY_PROSE =
  "text-[15px] text-gray-700 leading-[1.9] " +
  "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1A2B4A] [&_h2]:mt-8 [&_h2]:mb-3 " +
  "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#1A2B4A] [&_h3]:mt-6 [&_h3]:mb-2 " +
  "[&_p]:mb-4 [&_strong]:font-bold [&_b]:font-bold [&_u]:underline [&_em]:italic " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 " +
  "[&_a]:text-[#1A2B4A] [&_a]:underline [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto";

type Params = { params: Promise<{ id: string }> };

async function findPost(id: string) {
  const config = await getPrRoom();
  return config.posts.find((p) => p.id === id && p.is_visible) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const post = await findPost(id);
  if (!post) return { title: "PR룸 — WORKUP" };
  const desc = post.summary || post.body.slice(0, 120) || "워크업의 새로운 소식";
  return {
    title: `${post.title} — PR룸 | WORKUP`,
    description: desc,
    openGraph: {
      title: post.title,
      description: desc,
      images: post.image_url ? [{ url: post.image_url }] : undefined,
      type: "article",
    },
  };
}

export default async function PrPostDetailPage({ params }: Params) {
  const { id } = await params;
  const [post, footer] = await Promise.all([findPost(id), getFooterConfig()]);
  if (!post) notFound();

  const telHref = `tel:${footer.cs_phone.replace(/[^0-9+]/g, "")}`;

  return (
    <main className="bg-white">
      <article className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        {/* 뒤로가기 */}
        <Link href="/pr" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#1A2B4A] transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          PR룸 목록
        </Link>

        {/* 헤더 */}
        <header className="mb-7">
          {post.date && <p className="text-xs font-medium text-[#ff550c] tracking-wide mb-2">{post.date}</p>}
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B4A] leading-snug">{post.title}</h1>
          {post.summary && <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">{post.summary}</p>}
        </header>

        {/* 대표 이미지 */}
        {post.image_url && (
          <div className="mb-8 overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image_url} alt={post.title} className="w-full h-auto object-contain" />
          </div>
        )}

        {/* 본문 — 에디터 HTML 은 그대로 렌더, 옛 평문은 줄바꿈 유지 */}
        {post.body && (
          isHtmlBody(post.body) ? (
            <div className={BODY_PROSE} dangerouslySetInnerHTML={{ __html: post.body }} />
          ) : (
            <div className="text-[15px] text-gray-700 leading-[1.9] whitespace-pre-line">{post.body}</div>
          )
        )}

        {/* 외부 원문 링크 (있을 경우) */}
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1A2B4A] hover:underline"
          >
            원문·자세히 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* ── 오프라인 전환 CTA ── */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <p className="text-[15px] font-bold text-[#1A2B4A] mb-1">매장에서 직접 만나보세요</p>
          <p className="text-[13px] text-gray-500 mb-5">가까운 워크업 매장에서 제품을 체험하고 상담받으실 수 있습니다.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/store"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A2B4A] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#22365c] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              가까운 매장 찾기
            </Link>
            <a
              href={telHref}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-[#ff550c] text-[#ff550c] text-sm font-semibold py-3 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              전화 문의 {footer.cs_phone}
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
