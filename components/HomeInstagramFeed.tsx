// 워크업 인스타그램 피드 — Behold JSON 피드에서 데이터만 받아 직접 렌더링한다.
// 위젯(closed shadow DOM)과 달리 비율·열 수·crop을 코드로 제어할 수 있어,
// 게시물 원본 비율(4:5)에 맞춰 위아래 잘림 없이 보여준다.
// 서버에서 30분마다 재검증 → 새 게시물 자동 반영 + 인스타 CDN 서명 URL 자동 갱신.

// 워크업 공식 인스타그램 프로필
const IG_PROFILE = "https://www.instagram.com/workup_official_kr/";

// Behold.so 피드 ID (공개 식별자). 환경변수로 덮어쓸 수 있다.
const FEED_ID = process.env.NEXT_PUBLIC_BEHOLD_FEED_ID || "ZNUmKPgmgkl9x5xyKChS";

// 한 번에 보여줄 게시물 수 (Behold 무료 플랜은 최대 6)
const MAX_POSTS = 6;

// Behold 미설정/오류 시 폴백 타일 (텍스트 없는 순수 비주얼)
const FALLBACK_POSTS: { image?: string }[] = [
  { image: "/images/people-construction.jpg" },
  {},
  {},
  {},
  {},
  {},
];

type BeholdPost = {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  mediaType: string;
};

type FeedTile = { image?: string; href: string };

async function getTiles(): Promise<FeedTile[]> {
  try {
    const res = await fetch(`https://feeds.behold.so/${FEED_ID}`, {
      next: { revalidate: 1800 }, // 30분 캐시 → 새 게시물·갱신된 이미지 URL 자동 반영
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BeholdPost[] };
    return (data.posts ?? []).slice(0, MAX_POSTS).map((p) => ({
      // 비디오(릴스)는 썸네일, 그 외는 원본 이미지 — 둘 다 원본 비율(무크롭)
      image: p.mediaType === "VIDEO" ? p.thumbnailUrl || p.mediaUrl : p.mediaUrl,
      href: p.permalink || IG_PROFILE,
    }));
  } catch {
    return [];
  }
}

const InstagramGlyph = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default async function HomeInstagramFeed() {
  const tiles = await getTiles();
  const items: FeedTile[] =
    tiles.length > 0 ? tiles : FALLBACK_POSTS.map((p) => ({ image: p.image, href: IG_PROFILE }));

  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="px-[15px] md:px-[70px]">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-2">Instagram</p>
            <h2 className="text-2xl font-bold text-[#303236]">@workup_official_kr</h2>
          </div>
          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#303236] tracking-wide transition-colors hidden sm:flex items-center gap-1"
          >
            <InstagramGlyph className="w-3.5 h-3.5" />
            인스타그램 바로가기 →
          </a>
        </div>

        {/* 피드 그리드 — 데스크탑 6열 / 모바일 3열, 4:5 세로 비율(인스타 원본에 맞춰 무크롭) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[4/5] overflow-hidden bg-gray-100"
              aria-label="워크업 인스타그램에서 보기"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt="워크업 인스타그램 게시물"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl font-black select-none">
                  WU
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-[#303236]/0 opacity-0 transition-all duration-300 group-hover:bg-[#303236]/35 group-hover:opacity-100">
                <InstagramGlyph className="w-7 h-7 text-white" />
              </span>
            </a>
          ))}
        </div>

        {/* 모바일 팔로우 CTA */}
        <div className="mt-8 text-center sm:hidden">
          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#303236] text-[#303236] text-xs tracking-widest px-8 py-3"
          >
            <InstagramGlyph className="w-4 h-4" />
            인스타그램 팔로우 →
          </a>
        </div>
      </div>
    </section>
  );
}
