const lines = [
  {
    label: "WORKUP SITE",
    sub: "현장을 위한 라인",
    desc: "혹독한 환경에서 살아남도록 설계된 순수 기능 워크웨어",
    href: "/site",
    bg: "bg-[#303236]",
    text: "text-white",
    sub_color: "text-[#E5541B]",
  },
  {
    label: "WORKUP DAILY",
    sub: "일상을 위한 라인",
    desc: "워크웨어의 기능을 일상복의 무드로 재해석",
    href: "/daily",
    bg: "bg-[#3D3D3D]",
    text: "text-white",
    sub_color: "text-gray-400",
  },
  {
    label: "WORKUP PRO",
    sub: "프리미엄 라인",
    desc: "소재와 설계를 타협하지 않은 워크업의 플래그십",
    href: "/pro",
    bg: "bg-[#E5541B]",
    text: "text-white",
    sub_color: "text-orange-100",
  },
  {
    label: "BEST",
    sub: "가장 많이 팔린",
    desc: "이번 시즌 가장 많이 팔린 이유가 있습니다",
    href: "/site",
    bg: "bg-[#FAFAF8]",
    text: "text-[#303236]",
    sub_color: "text-[#E5541B]",
  },
];

export default function CategoryBanner() {
  return (
    <section className="py-16 bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-[#303236] tracking-wide mb-8">
          라인업
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lines.map((line) => (
            <a
              key={line.label}
              href={line.href}
              className={`${line.bg} ${line.text} p-8 flex flex-col justify-between cursor-pointer group hover:opacity-90 transition-opacity`}
            >
              <span className={`text-xs tracking-widest mb-6 ${line.sub_color}`}>
                {line.sub}
              </span>
              <div>
                <span className="text-base font-bold tracking-wider block mb-2 group-hover:underline underline-offset-2">
                  {line.label}
                </span>
                <span className="text-xs opacity-70 leading-relaxed">
                  {line.desc}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
