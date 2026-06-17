"use client";
import { useState, useEffect } from "react";

type Dummy = { id: string; type: string; name: string; content: string; created_at: string };
type Real = { id: string; type: string; payload: Record<string, string>; status?: string; created_at: string };

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const typeLabel = (t: string) => (t === "wholesale" ? "입점·제휴" : "가맹·창업");

export default function AdminInquiryBoardPage() {
  const [tab, setTab] = useState<"real" | "dummy">("real");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);

  const [reals, setReals] = useState<Real[]>([]);
  const [realLoaded, setRealLoaded] = useState(false);
  const [dummies, setDummies] = useState<Dummy[]>([]);
  const [dummyTotal, setDummyTotal] = useState(0);
  const [dummyLoaded, setDummyLoaded] = useState(false);

  const flash = (text: string, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3000); };

  const loadReal = async () => {
    try {
      const res = await fetch("/api/admin/inquiries");
      const data = await res.json();
      setReals(Array.isArray(data) ? data : []);
    } catch { setReals([]); }
    setRealLoaded(true);
  };
  const loadDummy = async () => {
    try {
      const res = await fetch("/api/admin/inquiry-dummies");
      const data = await res.json();
      setDummies(Array.isArray(data.items) ? data.items : []);
      setDummyTotal(typeof data.total === "number" ? data.total : 0);
    } catch { setDummies([]); }
    setDummyLoaded(true);
  };

  useEffect(() => { loadReal(); loadDummy(); }, []);

  const addDummy = async (count: number, historical = false) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inquiry-dummies", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count, historical }),
      });
      const data = await res.json();
      if (res.ok) { flash(`${data.added}개 추가됐습니다.`); loadDummy(); }
      else flash(data.error ?? "추가 실패", "err");
    } finally { setBusy(false); }
  };
  const clearDummy = async () => {
    if (!confirm("더미 데이터를 전부 삭제할까요? (실제 문의는 영향 없음)")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inquiry-dummies", { method: "DELETE" });
      if (res.ok) { flash("더미를 전부 삭제했습니다."); loadDummy(); }
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">문의 리스트</h1>
        <p className="text-sm text-gray-500 mt-1">공개 페이지 ‘실시간 문의 현황’에 노출되는 데이터를 관리합니다. (실제 + 더미)</p>
      </div>

      {msg.text && <div className={`mb-5 px-4 py-3 text-sm rounded-lg font-medium ${msg.type === "err" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>{msg.text}</div>}

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {([["real", `실제 데이터 (${realLoaded ? reals.length : "…"})`], ["dummy", `더미 데이터 (${dummyLoaded ? dummyTotal.toLocaleString() : "…"})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === k ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 실제 데이터 */}
      {tab === "real" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">실제 접수 문의</h2>
            <a href="/admin/inquiries" className="text-xs text-blue-600 hover:text-blue-800">문의 관리에서 자세히 ↗</a>
          </div>
          {!realLoaded ? <div className="py-12 text-center text-sm text-slate-400">불러오는 중...</div>
            : reals.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">접수된 실제 문의가 없습니다.</div>
            : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-2 font-medium">유형</th><th className="px-2 py-2 font-medium">이름</th><th className="px-2 py-2 font-medium">연락처</th><th className="px-2 py-2 font-medium">접수일</th><th className="px-2 py-2 font-medium">상태</th>
                </tr></thead>
                <tbody>
                  {reals.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-2.5"><span className={`text-[11px] px-2 py-0.5 rounded ${r.type === "wholesale" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-[#ff550c]"}`}>{typeLabel(r.type)}</span></td>
                      <td className="px-2 py-2.5 text-slate-700">{r.payload?.name || r.payload?.manager || "-"}</td>
                      <td className="px-2 py-2.5 text-slate-500">{r.payload?.phone || "-"}</td>
                      <td className="px-2 py-2.5 text-slate-400 text-xs">{fmt(r.created_at)}</td>
                      <td className="px-2 py-2.5"><span className="text-[11px] text-green-600">{r.status || "new"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* 더미 데이터 */}
      {tab === "dummy" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-700">더미 데이터 (보여주기용)</h2>
              <span className="text-sm text-slate-500">현재 <b className="text-[#ff550c]">{dummyTotal.toLocaleString()}</b>개</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">공개 페이지 리스트를 활발해 보이게 하는 가짜 데이터입니다. 방문자에게는 ‘더미’ 표시가 보이지 않습니다.</p>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => addDummy(1)} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">랜덤 1개 추가</button>
              <button disabled={busy} onClick={() => addDummy(100, true)} className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50">+100개</button>
              <button disabled={busy} onClick={() => addDummy(1000, true)} className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50">1000개 채우기</button>
              <button disabled={busy} onClick={clearDummy} className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto">전체 삭제</button>
            </div>
            {busy && <p className="text-xs text-slate-400 mt-3">처리 중...</p>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700">최근 더미 (50개)</h3></div>
            {!dummyLoaded ? <div className="py-12 text-center text-sm text-slate-400">불러오는 중...</div>
              : dummies.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">더미가 없습니다. 위 버튼으로 추가하세요.</div>
              : (
                <ul className="divide-y divide-slate-50">
                  {dummies.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-2 text-xs">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${d.type === "wholesale" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#ff550c]"}`}>{d.type === "wholesale" ? "입점" : "가맹"}</span>
                      <span className="text-slate-700 flex-1 truncate">{d.content}</span>
                      <span className="text-slate-500 w-16 truncate">{d.name}</span>
                      <span className="text-slate-300 w-32 text-right">{fmt(d.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
