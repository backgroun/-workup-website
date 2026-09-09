"use client";
import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MiniCalendar({
  selectedDate,
  todayKst,
  onSelect,
  markedDates = {},
}: {
  selectedDate: string;
  todayKst: string;
  onSelect: (date: string) => void;
  markedDates?: Record<string, { outbound: number; pass: number }>;
}) {
  const [y0, m0] = selectedDate.split("-").map(Number);
  const [viewMonth, setViewMonth] = useState(new Date(y0, m0 - 1, 1));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const [ty, tm] = todayKst.split("-").map(Number);
  const isCurrentViewMonth = year === ty && month === tm - 1;

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, month, d));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 text-base"
        >
          ‹
        </button>
        <span className="text-[12px] font-bold text-gray-900">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          disabled={isCurrentViewMonth}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-base"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[9px] font-semibold text-gray-400 pb-0.5">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="h-9" />;
          const isFuture = date > todayKst;
          const isToday = date === todayKst;
          const isSelected = date === selectedDate;
          const counts = markedDates[date];
          const outbound = counts?.outbound ?? 0;
          const pass = counts?.pass ?? 0;

          // 날짜 셀 스타일
          // 오늘: 항상 선형(테두리) — 선택 여부 무관
          // 오늘 아닌 선택: 검정 채움
          // 나머지: 일반
          const cellCls = [
            "h-9 rounded flex flex-col items-center justify-center transition-colors",
            isSelected && !isToday
              ? "ring-2 ring-[#303236] text-[#303236] font-bold"
              : isFuture
              ? "text-gray-300 cursor-default"
              : "text-gray-700 hover:bg-gray-100 cursor-pointer",
            isToday
              ? isSelected
                ? "ring-2 ring-[#E5541B] text-[#E5541B] font-bold"
                : "ring-1 ring-inset ring-[#E5541B] font-bold text-[#E5541B]"
              : "",
          ].join(" ");

          return (
            <button
              key={date}
              type="button"
              onClick={() => !isFuture && onSelect(date)}
              disabled={isFuture}
              className={cellCls}
            >
              <span className="text-[11px] leading-none">{Number(date.slice(-2))}</span>

              {/* 배지: 출고(주황) + 패스(블랙) — 선택 여부와 무관하게 항상 동일 색상 */}
              {(outbound > 0 || pass > 0) && (
                <div className="flex items-center gap-[2px] mt-0.5">
                  {outbound > 0 && (
                    <span className="min-w-[13px] h-[12px] px-0.5 rounded-full flex items-center justify-center text-[7px] font-bold leading-none bg-[#E5541B] text-white">
                      {outbound}
                    </span>
                  )}
                  {pass > 0 && (
                    <span className="min-w-[13px] h-[12px] px-0.5 rounded-full flex items-center justify-center text-[7px] font-bold leading-none bg-[#303236] text-white">
                      {pass}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* 범례 */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 justify-center">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#E5541B] flex-shrink-0" />
          <span className="text-[9px] text-gray-400">출고</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#303236] flex-shrink-0" />
          <span className="text-[9px] text-gray-400">패스</span>
        </div>
      </div>

      {selectedDate !== todayKst && (
        <button
          type="button"
          onClick={() => onSelect(todayKst)}
          className="w-full mt-1.5 pt-1.5 border-t border-gray-100 text-[11px] font-semibold text-[#E5541B] hover:underline"
        >
          오늘로 돌아가기
        </button>
      )}
    </div>
  );
}
