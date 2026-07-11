import Link from "next/link";

const stories = [
  { job: "건설 현장직", years: "경력 15년", text: "현장에서 옷이 불편하면 사고 납니다. 이 바지는 어떤 자세에서도 안 당겨요." },
  { job: "새벽 배달기사", years: "경력 4년",  text: "비 와도 멈출 수 없어요. 이 자켓 입고부터 폭우에도 그냥 달립니다." },
  { job: "카페 사장",    years: "창업 3년차", text: "10시간 서 있어도 구겨지지 않아요. 손님 앞에서도 괜찮고 뒷정리할 때도 편하고." },
];

export default function HomePeopleTeaser() {
  return (
    <section className="bg-[#FAFAF8] py-16 border-t border-gray-200">
      <div className="px-[15px] md:px-[70px]">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-2">MATE</p>
            <h2 className="text-2xl font-bold text-[#303236]">일하는 사람들의 이야기</h2>
          </div>
          <Link href="/people" className="text-xs text-gray-400 hover:text-[#303236] tracking-wide transition-colors hidden sm:block">
            더 많은 이야기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <div key={i} className="bg-white p-7 flex flex-col justify-between border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                "{s.text}"
              </p>
              <div>
                <div className="w-6 h-0.5 bg-[#ff550c] mb-3" />
                <p className="text-xs font-bold text-[#303236]">{s.job}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.years}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/people"
            className="inline-block border border-[#303236] text-[#303236] text-xs tracking-widest px-8 py-3 hover:bg-[#303236] hover:text-white transition-colors"
          >
            MATE 바로가기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
