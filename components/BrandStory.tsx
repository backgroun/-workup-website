export default function BrandStory() {
  return (
    <section id="story" className="py-24 bg-[#303236] border-t border-[#243d5e]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-4">
              Brand Story
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-6">
              일하는 사람에게는
              <br />
              그에 맞는 옷이 필요합니다.
            </h2>
            <p className="text-sm text-gray-300 leading-loose mb-4">
              화려하지 않아도 됩니다.
              비싸지 않아도 됩니다.
              다만 — 제대로 만들었으면 됩니다.
            </p>
            <p className="text-sm text-gray-300 leading-loose mb-4">
              워크업은 옷을 만들기 전에 현장에 먼저 갑니다.
              어떤 동작에서 옷이 당기는지,
              어떤 날씨에 가장 불편한지,
              어느 부위가 가장 먼저 닳는지.
            </p>
            <p className="text-sm text-gray-300 leading-loose mb-10">
              그걸 알아야 제대로 만들 수 있다고 생각합니다.
            </p>
            <a
              href="/site"
              className="inline-block border border-[#E5541B] text-[#E5541B] text-sm tracking-widest px-8 py-3 hover:bg-[#E5541B] hover:text-white transition-colors"
            >
              제품 전체 보기 →
            </a>
          </div>
          <div className="bg-[#243d5e] aspect-[4/3] flex flex-col items-center justify-center gap-4 p-10">
            <p className="text-4xl font-bold text-white text-center leading-tight">
              "땀 흘리는 사람이<br />제일 멋있다고<br />생각합니다."
            </p>
            <p className="text-xs text-[#E5541B] tracking-widest uppercase">WORKUP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-16 border-t border-[#243d5e]">
          {[
            { label: "기능성", value: "현장 검증", desc: "사무실이 아니라 실제 현장에서 설계됩니다" },
            { label: "내구성", value: "3년 보증", desc: "한 철 입고 버리는 옷이 아닙니다" },
            { label: "가격", value: "납득 가능한", desc: "기능과 품질에 맞는 정직한 가격표" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-[#E5541B] tracking-widest uppercase mb-2">{item.label}</p>
              <p className="text-xl font-bold text-white mb-2">{item.value}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
