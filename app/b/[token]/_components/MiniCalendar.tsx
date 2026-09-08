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
  markedDates?: Record<string, number>;
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
          if (!date) return <div key={`empty-${i}`} className="h-8" />;
          const isFuture = date > todayKst;
          const isToday = date === todayKst;
          const isSelected = date === selectedDate;
          const count = markedDates[date] ?? 0;
          return (
            <button
              key={date}
              type="button"
              onClick={() => !isFuture && onSelect(date)}
              disabled={isFuture}
              className={`h-8 rounded flex flex-col items-center justify-center transition-colors ${
                isSelected
                  ? "bg-[#303236] text-white font-bold"
                  : isFuture
                  ? "text-gray-300 cursor-default"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-[#E5541B] font-bold text-[#E5541B]" : ""}`}
            >
              <span className="text-[11px] leading-none">{Number(date.slice(-2))}</span>
              {count > 0 && (
                <span
                  className={`mt-0.5 min-w-[14px] h-[13px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold leading-none ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-[#E5541B] text-white"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
