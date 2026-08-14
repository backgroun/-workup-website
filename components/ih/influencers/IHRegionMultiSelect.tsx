"use client";
import { KOREA_PROVINCES, SUB_REGIONS } from "@/lib/ih/regions";

function parseRegion(v: string) {
  const [province, ...rest] = v.split(" ");
  return { province: province ?? "", sub: rest.join(" ") };
}

/** 활동지역 복수 선택 — "활동지역1, 활동지역2..."를 가로로 나란히 추가한다. 항상 최소 1개는 보인다. */
export default function IHRegionMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  // 값이 비어있어도 활동지역1은 항상 기본으로 보이게 한다.
  const rows = value.length > 0 ? value : [KOREA_PROVINCES[0]];

  const setRow = (i: number, province: string, sub: string) => {
    const next = [...rows];
    next[i] = sub ? `${province} ${sub}` : province;
    onChange(next);
  };
  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next);
  };
  const addRow = () => onChange([...rows, KOREA_PROVINCES[0]]);

  return (
    <div className="flex flex-wrap items-start gap-2">
      {rows.map((v, i) => {
        const { province, sub } = parseRegion(v);
        const subOptions = SUB_REGIONS[province];
        return (
          <div key={i} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5">
            <span className="text-[11.5px] text-slate-400 whitespace-nowrap">활동지역{i + 1}</span>
            <select
              value={province}
              onChange={(e) => setRow(i, e.target.value, "")}
              className="rounded-md border border-slate-200 px-1.5 py-1 text-[12.5px] text-slate-600"
            >
              {KOREA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {subOptions && (
              <select
                value={sub}
                onChange={(e) => setRow(i, province, e.target.value)}
                className="rounded-md border border-slate-200 px-1.5 py-1 text-[12.5px] text-slate-600"
              >
                <option value="">선택없음</option>
                {subOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(i)} className="text-slate-400 hover:text-slate-700 text-[14px]" aria-label={`활동지역${i + 1} 삭제`}>
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={addRow}
        className="text-[12px] font-semibold text-slate-500 hover:text-slate-800 whitespace-nowrap self-center"
      >
        + 활동지역 추가
      </button>
    </div>
  );
}
