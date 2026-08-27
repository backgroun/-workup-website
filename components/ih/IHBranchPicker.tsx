"use client";
import { useEffect, useRef, useState } from "react";
import type { IHBranchOption } from "@/lib/ih/collabs";

/**
 * 지점 선택 — STORE(매장) 수가 많아(150+) <select> 드롭다운 대신 검색형 콤보박스로 제공한다.
 * 매장 목록은 이미 한 번에 다 내려오는 소량 데이터라 별도 서버 검색 없이 클라이언트에서 필터링한다.
 */
export default function IHBranchPicker({
  branches,
  value,
  onChange,
  required,
}: {
  branches: IHBranchOption[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = branches.find((b) => String(b.id) === value) ?? null;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = q.trim()
    ? branches.filter((b) => b.branch_name.toLowerCase().includes(q.trim().toLowerCase()))
    : branches;

  return (
    <div ref={boxRef} className="relative">
      {selected && !open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setQ("");
          }}
          className="w-full flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 bg-white text-left"
        >
          <span className="text-[14.5px] text-slate-900">{selected.branch_name}</span>
          <span className="flex-shrink-0 text-[12.5px] text-slate-500 ml-2">변경</span>
        </button>
      ) : (
        <input
          required={required && !value}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="지점명 검색"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500"
        />
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[13.5px] text-slate-500">검색 결과가 없습니다.</p>
          ) : (
            results.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(String(b.id));
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-[14px] text-slate-800"
              >
                {b.branch_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
