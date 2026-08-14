"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { IHDuplicateCandidate } from "@/lib/ih/influencers";

/**
 * 중복 후보 검수 패널 — 닉네임만 같은 애매한 케이스를 자동 병합하지 않고 여기서 확인한다.
 * '동일 인물' 선택 시에도 실제 데이터 병합/삭제는 하지 않고 검수 상태만 변경한다(Phase 1 결정사항).
 */
export default function IHDuplicateCandidatesPanel() {
  const [items, setItems] = useState<IHDuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ih/influencers/duplicate-candidates");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id: number, decision: "same" | "different") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/ih/influencers/duplicate-candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) setItems((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 mb-3">
      <div className="px-4 py-2.5 border-b border-amber-200/70">
        <h2 className="text-[13.5px] font-bold text-amber-800">중복 검수 필요 {items.length}건</h2>
      </div>
      <div className="divide-y divide-amber-200/70">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex items-center gap-3 text-[13px]">
              <Link
                href={c.influencerA ? `/admin/influencer-hub/influencers/${c.influencerA.id}` : "#"}
                className="font-medium text-slate-800 hover:text-blue-700"
              >
                {c.influencerA?.nickname ?? "-"}
              </Link>
              <span className="text-slate-400">vs</span>
              <Link
                href={c.influencerB ? `/admin/influencer-hub/influencers/${c.influencerB.id}` : "#"}
                className="font-medium text-slate-800 hover:text-blue-700"
              >
                {c.influencerB?.nickname ?? "-"}
              </Link>
              <span className="text-[11.5px] text-slate-400">
                매칭 근거: {c.matchedOn === "nickname" ? "닉네임" : c.matchedOn} · 신뢰도 {c.confidence}
              </span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => resolve(c.id, "same")}
                className="rounded-md bg-slate-900 text-white text-[12px] font-semibold px-3 py-1.5 disabled:opacity-40"
              >
                동일 인물
              </button>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => resolve(c.id, "different")}
                className="rounded-md border border-slate-300 text-slate-600 text-[12px] font-semibold px-3 py-1.5 disabled:opacity-40"
              >
                다른 인물
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
