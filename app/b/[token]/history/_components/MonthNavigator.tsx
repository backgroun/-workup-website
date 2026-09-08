"use client";
import { useRouter, usePathname } from "next/navigation";

export default function MonthNavigator({
  year,
  month,
  maxYear,
  maxMonth,
}: {
  year: number;
  month: number;
  maxYear: number;
  maxMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (y: number, m: number) => {
    router.push(`${pathname}?year=${y}&month=${m}`);
  };

  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const isMax = year === maxYear && month === maxMonth;

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => go(prevMonth.y, prevMonth.m)}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 text-lg"
      >
        ‹
      </button>
      <span className="text-[14px] font-bold text-[#303236]">
        {year}년 {month}월
      </span>
      <button
        type="button"
        onClick={() => go(nextMonth.y, nextMonth.m)}
        disabled={isMax}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-lg"
      >
        ›
      </button>
    </div>
  );
}
