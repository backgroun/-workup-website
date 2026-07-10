import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JOURNAL — 콘텐츠 허브 | WORKUP",
  description: "워크업의 세계관을 담은 콘텐츠 허브.",
};

export default function JournalPage() {
  return (
    <main>
      <div className="bg-[#303236] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-3">JOURNAL</p>
          <h1 className="text-4xl font-bold text-white mb-4">콘텐츠 허브</h1>
          <p className="text-gray-300 text-sm">일하는 사람들의 세계를 담은 이야기.</p>
        </div>
      </div>
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F5F2ED]">
        <div className="text-center">
          <p className="text-xs tracking-widest text-[#ff550c] uppercase mb-4">COMING SOON</p>
          <p className="text-2xl font-bold text-[#303236]">콘텐츠를 준비 중입니다.</p>
        </div>
      </div>
    </main>
  );
}
