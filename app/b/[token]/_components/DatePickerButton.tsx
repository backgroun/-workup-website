"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MiniCalendar from "./MiniCalendar";

function fmt(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y}. ${m}. ${d}.`;
}

// 상단 날짜 표시 겸 버튼 — 아이콘 대신 "이전 현황 보기" 텍스트 라벨을 버튼 앞에 나란히 두어
// 캘린더가 열린다는 걸 알려주고, 날짜를 고르면 그날 등록된 이 지점의 출고·패스 현황으로 화면을 이동한다.
export default function DatePickerButton({ selectedDate, todayKst }: { selectedDate: string; todayKst: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (date: string) => {
    setOpen(false);
    router.push(date === todayKst ? pathname : `${pathname}?date=${date}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 whitespace-nowrap">이전 현황 보기</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`px-2.5 py-1.5 rounded-lg text-[12.5px] font-bold font-mono whitespace-nowrap border-2 transition-colors ${
            open
              ? "border-[#E5541B] bg-[#E5541B] text-white"
              : "border-[#E5541B]/40 bg-[#E5541B]/5 text-[#303236] hover:border-[#E5541B]"
          }`}
        >
          {fmt(selectedDate)}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-20 animate-[fadeIn_0.12s_ease-out]">
              <MiniCalendar selectedDate={selectedDate} todayKst={todayKst} onSelect={handleSelect} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
