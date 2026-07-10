export default function HomeFieldTestBar() {
  const stats = [
    { value: "1,000+", unit: "회", label: "내구성 테스트" },
    { value: "35", unit: "°C", label: "혹서기 현장 검증" },
    { value: "8", unit: "시간", label: "연속 착용 테스트" },
    { value: "3", unit: "년", label: "품질 보증" },
  ];

  return (
    <section className="bg-[#303236] border-t border-[#243d5e]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* 카피 */}
          <div>
            <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">Field Test</p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              팔기 전에
              <br />
              현장에 먼저 냅니다.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              워크업의 모든 제품은 출시 전 실제 현장 근무자와 함께
              반복 착용·환경 테스트를 거칩니다. 통과한 제품만 팝니다.
            </p>
          </div>

          {/* 숫자 4개 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-[#ff550c] pl-4">
                <p className="text-3xl font-black text-white leading-none">
                  {s.value}
                  <span className="text-base font-semibold text-[#ff550c] ml-0.5">{s.unit}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
