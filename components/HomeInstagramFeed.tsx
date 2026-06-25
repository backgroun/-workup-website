// 워크업 공식 인스타그램 프로필
const IG_PROFILE = "https://www.instagram.com/workup_official_kr/";

// 그리드에 노출할 게시물 (정사각형 1:1).
// - image : 텍스트 없는 순수 비주얼 (실제 인스타 이미지로 교체하세요. 예: /images/insta/01.jpg)
// - href  : 해당 게시물 링크 (생략 시 프로필로 이동)
// 이미지가 없는 칸은 브랜드 플레이스홀더(WU)로 표시되며, image 경로만 채우면 바로 반영됩니다.
const POSTS: { image?: string; href?: string }[] = [
  { image: "/images/people-construction.jpg" },
  {},
  {},
  {},
  {},
  {},
];

const InstagramGlyph = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default function HomeInstagramFeed() {
  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="px-[15px] md:px-[70px]">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-2">Instagram</p>
            <h2 className="text-2xl font-bold text-[#1A2B4A]">@workup_official_kr</h2>
          </div>
          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#1A2B4A] tracking-wide transition-colors hidden sm:flex items-center gap-1"
          >
            <InstagramGlyph className="w-3.5 h-3.5" />
            인스타그램 바로가기 →
          </a>
        </div>

        {/* 피드 그리드 — 데스크탑 6열 1줄 / 모바일 3열 2줄 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
          {POSTS.map((post, i) => (
            <a
              key={i}
              href={post.href || IG_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-gray-100"
              aria-label="워크업 인스타그램에서 보기"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt="워크업 작업복 현장 이야기"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl font-black select-none">
                  WU
                </span>
              )}

              {/* 호버 오버레이 — 인스타로 연결됨을 시각적으로 표시 */}
              <span className="absolute inset-0 flex items-center justify-center bg-[#1A2B4A]/0 opacity-0 transition-all duration-300 group-hover:bg-[#1A2B4A]/35 group-hover:opacity-100">
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
            className="inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-xs tracking-widest px-8 py-3"
          >
            <InstagramGlyph className="w-4 h-4" />
            인스타그램 팔로우 →
          </a>
        </div>
      </div>
    </section>
  );
}
