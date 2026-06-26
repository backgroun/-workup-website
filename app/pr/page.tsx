import type { Metadata } from "next";
import Link from "next/link";
import { getPrRoom } from "@/lib/pr-room-server";
import { visiblePosts, type PrPost } from "@/lib/pr-room";

export const metadata: Metadata = {
  title: "PR룸 — 워크업 새소식·홍보 | WORKUP",
  description:
    "워크업의 새로운 소식, 매장 오픈, 이벤트와 홍보 이야기를 한눈에 확인하세요. 가까운 워크업 매장에서 직접 만나보실 수 있습니다.",
  openGraph: {
    title: "PR룸 — 워크업 새소식·홍보",
    description: "워크업의 새로운 소식과 이야기를 전해드립니다.",
    type: "website",
  },
};

// 카드 클릭 동작(하이브리드): 외부 링크가 있으면 새 탭으로 이동, 없으면 사이트 내 상세 페이지.
function CardLink({ post, children }: { post: PrPost; children: React.ReactNode }) {
  if (post.link) {
    return (
      <a href={post.link} target="_blank" rel="noopener noreferrer" className="group block">
        {children}
      </a>
    );
  }
  return (
    <Link href={`/pr/${post.id}`} className="group block">
      {children}
    </Link>
  );
}

export default async function PrRoomPage() {
  const config = await getPrRoom();
  const posts = visiblePosts(config);

  return (
    <main>
      {/* ── 히어로 ── */}
      <div className="bg-[#1A2B4A] py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">PR ROOM</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{config.title}</h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* ── 게시판 ── */}
      <div className="bg-[#F5F2ED] py-12 md:py-16 min-h-[40vh]">
        <div className="max-w-6xl mx-auto px-6">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-sm">아직 등록된 소식이 없습니다.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
              {posts.map((post) => (
                <li key={post.id}>
                  <CardLink post={post}>
                    <article className="bg-white overflow-hidden border border-gray-200 transition-shadow group-hover:shadow-lg h-full flex flex-col">
                      {/* 이미지 — 순수 비주얼(텍스트는 아래 HTML 레이어로 처리) */}
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.image_url}
                          alt={post.title || "워크업 소식"}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {post.link && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-black/55 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            바로가기
                          </span>
                        )}
                      </div>
                      {/* 텍스트 */}
                      <div className="p-5 flex flex-col flex-1">
                        {post.date && (
                          <p className="text-[11px] font-medium text-[#ff550c] tracking-wide mb-2">{post.date}</p>
                        )}
                        <h2 className="text-[15px] md:text-base font-bold text-[#1A2B4A] leading-snug line-clamp-2">
                          {post.title}
                        </h2>
                        {post.summary && (
                          <p className="mt-2 text-[13px] text-gray-500 leading-relaxed line-clamp-2">{post.summary}</p>
                        )}
                      </div>
                    </article>
                  </CardLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
