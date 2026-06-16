import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FIELD TEST — 제품 검증 콘텐츠 | WORKUP",
  description: "워크업이 현장에서 직접 검증한 제품 테스트 결과를 공개합니다.",
};

type DataPoint = {
  spec: string;
  plain: string;
};

type Test = {
  id: number;
  category: string;
  product: string;
  title: string;
  subtitle: string;
  conditions: string[];
  data: DataPoint[];
  feedback: string;
};

const tests: Test[] = [
  {
    id: 1,
    category: "방수 테스트",
    product: "경량 방풍 자켓 A형",
    title: "폭우 8시간 방수 테스트",
    subtitle: "20,000mm 방수 수치 현장 검증",
    conditions: [
      "강우량 100mm/h 환경 재현",
      "8시간 연속 착용",
      "움직임 포함 (상체 굴신 500회)",
    ],
    data: [
      { spec: "방수 수치 20,000mm", plain: "폭우에도 안 젖습니다" },
      { spec: "발수 등급 4급", plain: "표면 물방울이 그대로 굴러떨어집니다" },
      { spec: "봉제선 방수 처리", plain: "솔기에서 스며드는 현상 없음" },
    ],
    feedback: "8시간 착용 후 내피 완전 건조 상태 확인. 실제 물류 현장 배달기사 3인 착용 테스트 동일 결과.",
  },
  {
    id: 2,
    category: "내구성 테스트",
    product: "스트레치 카고 팬츠",
    title: "무릎 내구성 1,000회 테스트",
    subtitle: "굴신 반복 및 마찰 강도 측정",
    conditions: [
      "무릎 굴신 1,000회 반복",
      "마찰 강도 측정 (마틴데일 테스트)",
      "세탁 50회 후 재측정",
    ],
    data: [
      { spec: "마틴데일 마찰 강도 50,000회", plain: "5년 매일 입어도 해지지 않습니다" },
      { spec: "무릎 이중 보강 처리", plain: "가장 많이 닳는 부위를 두 겹으로 만들었습니다" },
      { spec: "스트레치율 35%", plain: "쪼그려 앉아도 원단이 당기지 않습니다" },
    ],
    feedback: "건설 현장 작업자 5인 3개월 실착 테스트 완료. 무릎 부위 마모 없음 확인.",
  },
  {
    id: 3,
    category: "쿨링 테스트",
    product: "쿨링 반팔 티셔츠",
    title: "35도 현장 8시간 체온 측정",
    subtitle: "실제 현장 착용 체온 변화 데이터",
    conditions: [
      "기온 35도 야외 현장",
      "8시간 연속 착용",
      "1시간 간격 체온 및 발한량 측정",
    ],
    data: [
      { spec: "흡한속건 20분 건조", plain: "땀이 차지 않고 계속 쾌적합니다" },
      { spec: "UPF 50+ 자외선 차단", plain: "직사광선 아래서도 피부 보호됩니다" },
      { spec: "항균 처리 (냄새 억제)", plain: "8시간 착용 후에도 냄새가 나지 않습니다" },
    ],
    feedback: "일반 면 티셔츠 대비 착용 쾌적도 82% 향상 (착용자 자체 평가). 물류센터 현장 직원 10인 착용 만족도 9.1/10.",
  },
];

export default function FieldTestPage() {
  return (
    <main>

      {/* ── 페이지 타이틀 ── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="px-[15px] md:px-[70px]">
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#1A2B4A] leading-tight mb-4">
            제품 검증 콘텐츠
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed max-w-xl">
            워크업은 제품을 팔기 전에 현장에서 먼저 씁니다.<br />
            통과한 것만 올립니다. 수치는 현장 언어로 번역합니다.
          </p>
        </div>
      </section>

      {/* ── 테스트 결과 카드 ── */}
      <section className="bg-[#F5F2ED] py-16">
        <div className="px-[15px] md:px-[70px]">

          <div className="mb-8 flex items-center gap-3">
            <span className="bg-[#1A2B4A] text-white text-xs font-bold px-3 py-1.5">
              통과 {tests.length}건
            </span>
            <span className="text-xs text-gray-400">누적 {tests.length}건 테스트</span>
          </div>

          <div className="space-y-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white border-l-4 border-[#ff550c] overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3">

                  {/* 영상 플레이스홀더 */}
                  <div className="bg-[#1A2B4A] aspect-video lg:aspect-auto flex flex-col items-center justify-center gap-3 p-8">
                    <div className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/50 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-xs tracking-widest uppercase text-center">테스트 영상</p>
                    <p className="text-white/25 text-xs text-center">업로드 예정</p>
                  </div>

                  {/* 테스트 정보 */}
                  <div className="p-8 lg:col-span-2">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{test.category}</p>
                        <h3 className="text-[18px] font-bold text-[#1A2B4A] mb-1">{test.product}</h3>
                        <p className="text-sm text-gray-500">{test.title}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-bold px-4 py-2 bg-[#ff550c] text-white">
                        통과
                      </span>
                    </div>

                    {/* 테스트 조건 */}
                    <div className="mb-5">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">테스트 조건</p>
                      <div className="flex flex-wrap gap-2">
                        {test.conditions.map((c) => (
                          <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-1">{c}</span>
                        ))}
                      </div>
                    </div>

                    {/* 수치 → 현장 언어 */}
                    <div className="mb-5 space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">수치 → 현장 언어</p>
                      {test.data.map((d) => (
                        <div key={d.spec} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 font-mono">{d.spec}</div>
                          <div className="bg-orange-50 px-3 py-2 text-xs font-semibold text-[#ff550c]">→ {d.plain}</div>
                        </div>
                      ))}
                    </div>

                    {/* 착용자 피드백 */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">착용자 피드백</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{test.feedback}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="px-[15px] md:px-[70px]">
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-5">Experience</p>
          <h2 className="text-[26px] font-bold text-[#1A2B4A] mb-4">
            테스트 통과 제품을 직접 확인하세요.
          </h2>
          <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">
            데이터로 검증됐지만, 몸으로 느끼는 건 직접 입어봐야 압니다.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[12px] tracking-widest font-medium px-8 py-3.5 hover:bg-[#1A2B4A] hover:text-white transition-colors"
          >
            근처 매장 찾아보기 →
          </Link>
        </div>
      </section>

    </main>
  );
}
