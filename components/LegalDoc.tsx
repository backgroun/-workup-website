// 약관/방침 공통 렌더러 (순수 컴포넌트). 본문은 줄바꿈을 보존해 표시한다.
export default function LegalDoc({ title, content }: { title: string; content: string }) {
  return (
    <main className="bg-[#FAFAF8] min-h-screen">
      <div className="bg-[#303236] py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#E5541B] uppercase mb-2">WORKUP</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-10">
          <p className="text-[13px] md:text-[14px] text-gray-700 leading-[1.95] whitespace-pre-line">{content}</p>
        </div>
      </div>
    </main>
  );
}
