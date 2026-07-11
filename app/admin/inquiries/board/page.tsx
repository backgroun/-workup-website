"use client";
import { useState, useEffect } from "react";

type Dummy = { id: string; type: string; name: string; content: string; created_at: string };

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const typeLabel = (t: string) => (t === "wholesale" ? "입점·제휴" : "가맹·창업");

// 문의 리스트(보여주기) — 더미 데이터 전용.
// 공개 페이지 '실시간 문의 현황'을 활발해 보이게 하는 가짜 데이터를 관리한다.
// 실제 접수 문의는 '문의 관리'에서 다룬다.
export default function AdminInquiryBoardPage() {
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);
  const [dummyType, setDummyType] = useState<"franchise" | "wholesale">("franchise");

  const [dummies, setDummies] = useState<Dummy[]>([]);
  const [dummyTotal, setDummyTotal] = useState(0);
  const [dummyLoaded, setDummyLoaded] = useState(false);

  const flash = (text: string, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3000); };

  const loadDummy = async () => {
    try {
      const res = await fetch(`/api/admin/inquiry-dummies?type=${dummyType}`);
      const data = await res.json();
      setDummies(Array.isArray(data.items) ? data.items : []);
      setDummyTotal(typeof data.total === "number" ? data.total : 0);
    } catch { setDummies([]); }
    setDummyLoaded(true);
  };

  // 유형이 바뀌면 해당 유형 더미만 다시 불러온다.
  useEffect(() => { loadDummy(); }, [dummyType]); // eslint-disable-line react-hooks/exhaustive-deps

  // 랜덤 더미 1개 추가 (수동)
  const addOne = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inquiry-dummies", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: 1, historical: false, type: dummyType }),
      });
      const data = await res.json();
      if (res.ok) { flash(`${typeLabel(dummyType)} 더미 1개 추가됐습니다.`); loadDummy(); }
      else flash(data.error ?? "추가 실패", "err");
    } finally { setBusy(false); }
  };
  const clearDummyType = async () => {
    if (!confirm(`${typeLabel(dummyType)} 더미를 전부 삭제할까요?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/inquiry-dummies?type=${dummyType}`, { method: "DELETE" });
      if (res.ok) { flash(`${typeLabel(dummyType)} 더미를 삭제했습니다.`); loadDummy(); }
    } finally { setBusy(false); }
  };
  const clearDummy = async () => {
    if (!confirm("모든 유형의 더미를 전부 삭제할까요? (실제 문의는 영향 없음)")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inquiry-dummies", { method: "DELETE" });
      if (res.ok) { flash("더미를 전부 삭제했습니다."); loadDummy(); }
    } finally { setBusy(false); }
  };
  const deleteDummy = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/inquiry-dummies?id=${id}`, { method: "DELETE" });
      if (res.ok) { setDummies((prev) => prev.filter((x) => x.id !== id)); setDummyTotal((n) => Math.max(0, n - 1)); }
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">더미 리스트 <span className="text-base font-medium text-slate-400">(보여주기용)</span></h1>
        <p className="text-sm text-gray-500 mt-1">공개 페이지 ‘실시간 문의 현황’을 활발해 보이게 하는 가짜 데이터입니다. 실제 접수 문의는 <a href="/admin/inquiries" className="text-blue-600 hover:text-blue-800">문의 관리</a>에서 확인하세요.</p>
      </div>

      {msg.text && <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>{msg.text}</div>}

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700">더미 데이터</h2>
            <span className="text-sm text-slate-500">{typeLabel(dummyType)} <b className="text-[#E5541B]">{dummyTotal.toLocaleString()}</b>개</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">방문자에게는 ‘더미’ 표시가 보이지 않습니다. 가맹/입점 페이지가 각각 자기 유형만 표시합니다.</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">유형 (보기·추가·삭제 공통)</span>
            {(["franchise", "wholesale"] as const).map((t) => (
              <button key={t} onClick={() => setDummyType(t)}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors ${dummyType === t ? "border-blue-400 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {t === "franchise" ? "가맹·창업" : "입점·제휴"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={addOne} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">랜덤 1개 추가</button>
            <button disabled={busy} onClick={clearDummyType} className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto">이 유형 삭제</button>
            <button disabled={busy} onClick={clearDummy} className="px-4 py-2 text-sm font-medium border border-red-200 text-red-400 rounded-lg hover:bg-red-50 disabled:opacity-50">전체 삭제</button>
          </div>
          {busy && <p className="text-xs text-slate-400 mt-3">처리 중...</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700">최근 {typeLabel(dummyType)} 더미 <span className="text-slate-400 font-normal">({dummies.length}건 표시 · 최신 50건까지)</span></h3></div>
          {!dummyLoaded ? <div className="py-12 text-center text-sm text-slate-400">불러오는 중...</div>
            : dummies.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">더미가 없습니다. 위 ‘랜덤 1개 추가’로 만들어 보세요.</div>
            : (
              <ul className="divide-y divide-slate-50">
                {dummies.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-2 text-xs hover:bg-slate-50">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${d.type === "wholesale" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#E5541B]"}`}>{d.type === "wholesale" ? "입점" : "가맹"}</span>
                    <span className="text-slate-700 flex-1 truncate">{d.content}</span>
                    <span className="text-slate-500 w-16 truncate">{d.name}</span>
                    <span className="text-slate-300 w-28 text-right">{fmt(d.created_at)}</span>
                    <button onClick={() => deleteDummy(d.id)} disabled={busy} title="삭제" className="text-red-400 hover:text-red-600 disabled:opacity-40 text-sm px-1 flex-shrink-0">✕</button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}
