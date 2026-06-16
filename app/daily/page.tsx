import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "WORKUP DAILY — 일상을 위한 워크웨어",
  description: "워크웨어의 기능을 일상복의 무드로. 현장 출근, 퇴근 후 카페, 옷 한 벌로.",
};

export default function DailyPage() {
  return (
    <main>
      <div className="bg-[#3D3D3D] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">WORKUP DAILY</p>
          <h1 className="text-4xl font-bold text-white mb-4">일상을 위한 라인</h1>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
            워크웨어의 기능을 일상복의 무드로 재해석했습니다.<br />
            현장 출근, 점심 식사, 퇴근 후. 옷 한 벌로.
          </p>
        </div>
      </div>
      <ProductGrid
        title="WORKUP DAILY"
        subtitle="워크웨어의 기능을 일상복의 무드로. 현장 출근, 퇴근 후 카페, 옷 한 벌로."
        filter="DAILY"
      />
    </main>
  );
}
