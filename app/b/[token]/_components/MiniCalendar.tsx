"use client";
import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 지점 화면에서 과거 패스 현황을 조회하기 위한 날짜 선택 캘린더 — 라이브러리 없이 순수 그리드.
// 아직 오지 않은 미래 날짜는 공지가 있을 수 없으므로 선택할 수 없게 막는다.
export default function MiniCalendar({
  selectedDate,
  todayKst,
  onSelect,
}: {
  selectedDate: string;
  todayKst: string;
  onSelect: (date: string) => void;
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
        >
          ‹
        </button>
        <span className="text-[12.5px] font-bold text-gray-900">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          disabled={isCurrentViewMonth}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-semibold text-gray-400 py-1">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const isFuture = date > todayKst;
          const isToday = date === todayKst;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => !isFuture && onSelect(date)}
              disabled={isFuture}
              className={`aspect-square rounded text-[12px] flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-[#303236] text-white font-bold"
                  : isFuture
                  ? "text-gray-300 cursor-default"
                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-[#E5541B] font-bold text-[#E5541B]" : ""}`}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
      {selectedDate !== todayKst && (
        <button
          type="button"
          onClick={() => onSelect(todayKst)}
          className="w-full mt-2 pt-2 border-t border-gray-100 text-[12px] font-semibold text-[#E5541B] hover:underline"
        >
          오늘로 돌아가기
        </button>
      )}
    </div>
  );
}
