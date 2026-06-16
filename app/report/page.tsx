"use client";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0 print:px-0">

      {/* 인쇄 버튼 — 화면에서만 표시 */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1A2B4A] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#243d5e] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PDF로 저장
        </button>
      </div>

      {/* 보고서 본문 */}
      <div className="max-w-3xl mx-auto bg-white shadow-sm p-10 print:shadow-none print:p-0">

        {/* 헤더 */}
        <div className="border-b-2 border-[#1A2B4A] pb-6 mb-8">
          <p className="text-xs text-gray-400 mb-1">내부 보고용 문서</p>
          <h1 className="text-2xl font-bold text-[#1A2B4A] mb-2">개발 인프라 계정 이전 및 비용 보고서</h1>
          <p className="text-sm text-gray-500">작성일: 2026년 6월 10일</p>
        </div>

        {/* 섹션 1 — 서비스 소개 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2B4A] mb-5 pb-2 border-b border-gray-200">
            1. 사용 중인 서비스 소개
          </h2>

          <div className="space-y-5">
            {[
              {
                name: "GitHub (깃허브)",
                tag: "코드 저장 창고",
                desc: "웹사이트를 만드는 코드(설계도)를 저장하고 관리하는 곳입니다. 중요한 문서를 USB가 아닌 클라우드에 저장해두는 것처럼, 코드를 안전하게 보관하고 변경 이력을 관리합니다. 실수로 파일을 망쳐도 이전 버전으로 되돌릴 수 있습니다.",
                color: "bg-blue-50 border-blue-200",
                tagColor: "bg-blue-100 text-blue-700",
              },
              {
                name: "Vercel (버셀)",
                tag: "웹사이트 게시판",
                desc: "만든 웹사이트를 인터넷에 올려서 누구나 볼 수 있게 해주는 서비스입니다. 식당으로 비유하면 음식(웹사이트)을 만드는 곳이 아니라, 손님들이 실제로 찾아올 수 있도록 간판을 달고 문을 여는 역할입니다.",
                color: "bg-purple-50 border-purple-200",
                tagColor: "bg-purple-100 text-purple-700",
              },
              {
                name: "Supabase (수파베이스)",
                tag: "데이터 저장 창고",
                desc: "웹사이트에서 필요한 데이터(회원 정보, 상품 정보, 주문 내역 등)를 저장하는 데이터베이스입니다. 엑셀 파일처럼 정보를 정리해서 보관하는데, 수천 명이 동시에 접속해도 빠르게 처리할 수 있습니다.",
                color: "bg-green-50 border-green-200",
                tagColor: "bg-green-100 text-green-700",
              },
            ].map((s) => (
              <div key={s.name} className={`border rounded-lg p-4 ${s.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-bold text-[#1A2B4A] text-sm">{s.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.tagColor}`}>
                    {s.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 섹션 2 — 현황 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2B4A] mb-5 pb-2 border-b border-gray-200">
            2. 현황
          </h2>
          <p className="text-sm text-gray-600 mb-4">현재 아래 3가지 서비스를 개인 계정으로 운영 중입니다.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1A2B4A] text-white">
                <th className="text-left px-4 py-2.5">서비스</th>
                <th className="text-left px-4 py-2.5">하는 일</th>
                <th className="text-left px-4 py-2.5">현재 상태</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["GitHub", "코드 저장 및 관리", "개인 계정"],
                ["Vercel", "웹사이트 인터넷 게시", "개인 계정"],
                ["Supabase", "데이터 저장 및 관리", "개인 계정"],
              ].map(([service, role, status], i) => (
                <tr key={service} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-semibold">{service}</td>
                  <td className="px-4 py-2.5 text-gray-600">{role}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 섹션 3 — 이전 절차 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2B4A] mb-5 pb-2 border-b border-gray-200">
            3. 계정 이전 절차
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "GitHub",
                time: "약 30분",
                loss: "없음",
                steps: [
                  "회사 GitHub Organization 생성",
                  "기존 저장소 이전: Settings → Transfer repository → 회사 Organization 선택",
                  "Vercel의 GitHub 연결을 새 Organization으로 재연결",
                ],
                note: null,
              },
              {
                title: "Vercel",
                time: "약 30분",
                loss: "없음",
                steps: [
                  "Vercel에서 회사 Team 생성",
                  "기존 프로젝트 이전: Project Settings → Transfer Project → 회사 Team 선택",
                  "GitHub Organization 재연결",
                ],
                note: null,
              },
              {
                title: "Supabase",
                time: "약 1~2시간",
                loss: "없음 (백업/복원 방식)",
                steps: [
                  "회사 Supabase Organization 생성",
                  "기존 DB 내보내기: Project Settings → Database → Backup 다운로드",
                  "회사 계정에 새 프로젝트 생성 후 백업 데이터 가져오기",
                  "웹사이트 연결 정보 새 프로젝트 값으로 교체 및 재배포",
                ],
                note: "마이그레이션 중 서비스 일시 중단 가능 — 심야 작업 권장",
              },
            ].map((item, i) => (
              <div key={item.title} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <p className="font-bold text-[#1A2B4A]">3-{i + 1}. {item.title}</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>소요시간: <strong>{item.time}</strong></span>
                    <span>데이터 손실: <strong className="text-green-600">{item.loss}</strong></span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <ol className="space-y-1.5">
                    {item.steps.map((step, j) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-[#1A2B4A] text-white rounded-full text-xs flex items-center justify-center font-bold">{j + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {item.note && (
                    <p className="mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded">
                      ⚠️ {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 섹션 4 — 비용 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2B4A] mb-5 pb-2 border-b border-gray-200">
            4. 비용 분석
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-5 text-sm text-yellow-800">
            ⚠️ <strong>주의:</strong> Vercel 무료 플랜은 상업적 이용이 약관상 불가합니다. 회사 서비스 운영 시 즉시 유료 전환이 필요합니다.
          </div>

          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="bg-[#1A2B4A] text-white">
                <th className="text-left px-4 py-2.5">서비스</th>
                <th className="text-left px-4 py-2.5">플랜</th>
                <th className="text-left px-4 py-2.5">월 비용</th>
                <th className="text-left px-4 py-2.5">주요 제공 범위</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["GitHub", "Free", "무료", "무제한 저장소"],
                ["Vercel", "Pro", "$20 (약 27,000원)", "월 1TB 대역폭, 상업적 이용 가능"],
                ["Supabase", "Pro", "$25 (약 34,000원)", "DB 8GB, 월 250GB 대역폭"],
              ].map(([service, plan, cost, desc], i) => (
                <tr key={service} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-semibold">{service}</td>
                  <td className="px-4 py-2.5 text-gray-600">{plan}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1A2B4A]">{cost}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-[#1A2B4A] text-white rounded-lg px-6 py-4 flex justify-between items-center">
            <p className="font-bold">월 예상 총 비용</p>
            <p className="text-xl font-bold text-[#ff550c]">$45 <span className="text-sm font-normal text-gray-300">(약 61,000원/월)</span></p>
          </div>
        </section>

        {/* 섹션 5 — 권고안 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#1A2B4A] mb-5 pb-2 border-b border-gray-200">
            5. 전환 권고안 및 일정
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1A2B4A] text-white">
                <th className="text-left px-4 py-2.5">일정</th>
                <th className="text-left px-4 py-2.5">작업 내용</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1일차 (즉시)", "GitHub Organization 생성 및 저장소 이전"],
                ["1일차 (즉시)", "Vercel Team 생성, 프로젝트 이전 및 Pro 결제"],
                ["2일차 (심야)", "Supabase 데이터 마이그레이션"],
                ["2일차", "연결 정보 업데이트 및 정상 작동 확인"],
              ].map(([day, task], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-semibold text-[#1A2B4A] whitespace-nowrap">{day}</td>
                  <td className="px-4 py-2.5 text-gray-600">{task}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-gray-500 mt-3">총 예상 소요 기간: <strong>2일</strong></p>
        </section>

        {/* 푸터 */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center">
          본 문서는 내부 검토용이며, 비용은 환율 변동에 따라 달라질 수 있습니다.
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          @page { margin: 20mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
