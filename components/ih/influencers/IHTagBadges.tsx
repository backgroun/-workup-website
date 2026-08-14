"use client";
import { useState } from "react";

/**
 * 태그/콘텐츠 Badge 표시(+선택적 편집) — 재사용 가능한 독립 컴포넌트.
 * 콤마(,)로 구분해 여러 값을 한 번에 입력할 수 있다(예: "캠핑, 차박, 여행" → 3개 chip).
 * 태그 마스터 관리(전체 태그 목록 관리 등)는 Phase 10/Settings에서 이 컴포넌트를 확장한다.
 */
export default function IHTagBadges({
  tags,
  editable = false,
  onChange,
  hashPrefix = true,
  placeholder = "입력 후 Enter (콤마로 여러 개)",
}: {
  tags: string[];
  editable?: boolean;
  onChange?: (next: string[]) => void;
  hashPrefix?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commitValues = (raw: string) => {
    if (!onChange) return;
    const parts = raw
      .split(",")
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // 콤마가 들어오는 순간(직접 타이핑 또는 붙여넣기) 바로 분리해서 반영한다.
    if (v.includes(",")) {
      commitValues(v);
      setDraft("");
    } else {
      setDraft(v);
    }
  };

  const commitDraft = () => {
    commitValues(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.length === 0 && !editable && <span className="text-[12.5px] text-slate-400">없음</span>}
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-[12px] font-medium px-2.5 py-1"
        >
          {hashPrefix ? `#${t}` : t}
          {editable && onChange && (
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-slate-400 hover:text-slate-700"
              aria-label={`${t} 삭제`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {editable && onChange && (
        <input
          value={draft}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          onBlur={commitDraft}
          placeholder={placeholder}
          className="w-40 rounded-md border border-slate-200 px-2 py-1 text-[12px] outline-none focus:border-slate-400"
        />
      )}
    </div>
  );
}
