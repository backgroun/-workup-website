"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IHInfluencerMemoRow } from "@/lib/ih/memos";

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 메모 탭 — 이력(날짜/작성자별) + "+ 메모 등록". ih_influencer_memos migration 실행 전에는 등록 시 안내 문구를 보여준다. */
export default function IHMemoPanel({ influencerId, memos }: { influencerId: number; memos: IHInfluencerMemoRow[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ih/influencers/${influencerId}/memos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "메모 등록에 실패했습니다.");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-[12.5px] font-medium text-slate-600 mb-2">+ 메모 등록</p>
        {error && <p className="text-[12.5px] text-red-500 mb-2">{error}</p>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내부 메모를 입력하세요"
          className="w-full min-h-[70px] rounded-md border border-slate-200 px-3 py-2 text-[13.5px] outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="mt-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50"
        >
          등록
        </button>
      </form>

      {memos.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center">
          <p className="text-[13px] text-slate-400">등록된 메모가 없습니다.</p>
        </div>
      ) : (
        <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {memos.map((m) => (
            <li key={m.id} className="px-4 py-3">
              <div className="flex items-center justify-between text-[11.5px] text-slate-400">
                <span>{m.author_name ?? "알 수 없음"}</span>
                <span>{fmtDateTime(m.created_at)}</span>
              </div>
              <p className="mt-1 text-[13.5px] text-slate-700 whitespace-pre-wrap">{m.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
