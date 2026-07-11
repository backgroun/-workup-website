import Link from "next/link";
import { getProductById, productDisplayName } from "@/data/products";

const MAIN_ID = "stretch-cargo-pants";
const SUB_IDS = ["reflective-safety-jacket", "multi-pocket-vest"];

export default function HomeFeatured() {
  const main = getProductById(MAIN_ID)!;
  const subs = SUB_IDS.map((id) => getProductById(id)!);

  return (
    <section className="bg-[#FAFAF8] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-2">Featured</p>
            <h2 className="text-2xl font-bold text-[#303236]">이번 시즌 주목 제품</h2>
          </div>
          <Link href="/products" className="text-xs text-gray-400 hover:text-[#303236] tracking-wide transition-colors hidden sm:block">
            전체 제품 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* 메인 카드 (3/5) */}
          <Link href={`/products/${main.id}`} className="lg:col-span-3 group block bg-white border border-gray-100">
            <div className={`${main.bg} aspect-[16/9] relative flex items-end p-8`}>
              <div className="text-white/10 text-8xl font-black leading-none select-none">WU</div>
              <div className="absolute top-5 left-5">
                <span className="bg-white/10 text-white text-[10px] px-2 py-1 tracking-widest uppercase">
                  {main.category}
                </span>
              </div>
            </div>
            <div className="p-8">
              <p className="text-[10px] text-[#ff550c] tracking-widest uppercase mb-2">
                {main.category} · {main.subCategory}
              </p>
              <h3 className="text-xl font-bold text-[#303236] mb-2 group-hover:underline underline-offset-2">
                {main.name}
              </h3>
              <p className="text-sm text-gray-500 italic mb-4">"{main.tagline}"</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
                {main.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-1 h-1 bg-[#ff550c] rounded-full" />{f}
                  </li>
                ))}
              </ul>
              {main.fieldTest && (
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 mb-5">
                  <span className="text-[#ff550c] text-xs font-bold">✓ FIELD TEST</span>
                  <span className="text-xs text-gray-500">{main.fieldTest}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#303236]">{main.price}</span>
                <span className="text-xs text-[#303236] border border-[#303236] px-4 py-2 group-hover:bg-[#303236] group-hover:text-white transition-colors">
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>

          {/* 서브 카드 2개 (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {subs.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block bg-white border border-gray-100 flex-1">
                <div className={`${p.bg} aspect-video relative flex items-end p-5`}>
                  <div className="text-white/10 text-5xl font-black leading-none select-none">WU</div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 tracking-widest uppercase">
                      {p.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-[#ff550c] tracking-widest uppercase mb-1">
                    {p.category} · {p.subCategory}
                  </p>
                  <h3 className="text-sm font-bold text-[#303236] mb-1 group-hover:underline underline-offset-2">
                    {productDisplayName(p)}
                  </h3>
                  <p className="text-xs text-gray-400 italic mb-3 line-clamp-1">"{p.tagline}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#303236]">{p.price}</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-[#303236] transition-colors">
                      보기 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
