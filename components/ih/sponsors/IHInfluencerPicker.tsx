"use client";
import { useEffect, useRef, useState } from "react";

// 협찬 Form에서 실제로 쓰는 필드만 담은 최소 타입 — IHInfluencerListItem 전체를 흉내내지 않는다
// (Picker/Form은 검색 결과 표시와 influencer_id 연결에만 쓰이고, 나머지 필드는 필요 없다).
export type IHInfluencerPickerItem = {
  id: number;
  nickname: string;
  channel: string;
  follower_display: string | null;
  content_type: string[];
  activity_area: string[];
  collab_types?: ("SPONSOR" | "VISIT")[];
};

/** 검색 결과에서 "제품 협찬 메이트/방문 인플루언서" 구분을 아이콘으로 표시 — COLLAB_TYPE_LABEL과 동일한 개념. */
function CollabTypeIcons({ types }: { types?: ("SPONSOR" | "VISIT")[] }) {
  if (!types || types.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 mr-1.5 align-middle">
      {types.includes("SPONSOR") && (
        <span title="제품 협찬 메이트" className="inline-flex items-center justify-center w-4 h-4 rounded bg-blue-50 text-blue-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41 12 22l-9-9V4a1 1 0 0 1 1-1h9l7.59 7.59a2 2 0 0 1 0 2.82Z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </svg>
        </span>
      )}
      {types.includes("VISIT") && (
        <span title="방문 인플루언서" className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
      )}
    </span>
  );
}

/**
 * 협찬 등록 Form의 "인플루언서 선택" — 기존 /api/admin/ih/influencers 목록 API를 그대로 검색에 재사용한다
 * (별도 인플루언서 검색 API를 새로 만들지 않음, 목록 화면과 동일한 데이터 소스).
 * 검색 결과에 닉네임/채널/팔로워/콘텐츠/활동지역을 함께 보여준다(Phase 5 요구사항).
 */
export default function IHInfluencerPicker({
  value,
  onChange,
}: {
  value: IHInfluencerPickerItem | null;
  onChange: (influencer: IHInfluencerPickerItem) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<IHInfluencerPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({ pageSize: "8" });
        if (q.trim()) sp.set("q", q.trim());
        const res = await fetch(`/api/admin/ih/influencers?${sp.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      {value ? (
        <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 bg-slate-50">
          <div className="min-w-0">
            <p className="text-[14.5px] font-semibold text-slate-800">
              <CollabTypeIcons types={value.collab_types} />
              {value.nickname}
            </p>
            <p className="text-[13px] text-slate-600 truncate">
              {value.channel} · {value.follower_display ?? "-"}
              {value.content_type.length > 0 ? ` · ${value.content_type.join(" · ")}` : ""}
              {Array.isArray(value.activity_area) && value.activity_area.length > 0 ? ` · ${value.activity_area.join(" · ")}` : ""}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="flex-shrink-0 text-[13px] text-slate-600 hover:text-slate-800 ml-2">
            변경
          </button>
        </div>
      ) : (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="닉네임 / 채널로 인플루언서 검색"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-[14.5px] text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-500"
        />
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-3 text-[13.5px] text-slate-500">검색 중…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-[13.5px] text-slate-500">검색 결과가 없습니다.</p>
          ) : (
            results.map((inf) => (
              <button
                key={inf.id}
                type="button"
                onClick={() => {
                  onChange(inf);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <p className="text-[14px] font-medium text-slate-800">
                  <CollabTypeIcons types={inf.collab_types} />
                  {inf.nickname}
                </p>
                <p className="text-[12.5px] text-slate-500 truncate">
                  {inf.channel} · {inf.follower_display ?? "-"}
                  {inf.content_type.length > 0 ? ` · ${inf.content_type.join(" · ")}` : ""}
                  {Array.isArray(inf.activity_area) && inf.activity_area.length > 0 ? ` · ${inf.activity_area.join(" · ")}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
