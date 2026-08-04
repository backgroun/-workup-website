"use client";
import { useEffect, useState } from "react";
import StoreStatusModal from "../_components/StoreStatusModal";

type StoreRow = {
  id: number;
  name: string;
  store_code: string | null;
  manager_name: string | null;
  pass_link_token: string | null;
};

export default function PassLinksPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [regenId, setRegenId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [previewStoreId, setPreviewStoreId] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const previewStore = stores.find((s) => s.id === previewStoreId) ?? null;

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stores")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: StoreRow[]) => {
        const list = Array.isArray(data) ? data : [];
        setStores(list);
        setDrafts(Object.fromEntries(list.map((s) => [s.id, s.manager_name ?? ""])));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const saveManager = async (id: number) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/stores/${id}/pass-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_name: drafts[id] || null }),
      });
      if (res.ok) {
        showMsg("담당자명이 저장됐습니다.");
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        showMsg(`저장 실패: ${d.error ?? res.status}`);
      }
    } finally {
      setSavingId(null);
    }
  };

  const regenerate = async (id: number, name: string) => {
    if (!confirm(`${name}의 링크를 재발급할까요? 기존 링크는 즉시 무효화됩니다.`)) return;
    setRegenId(id);
    try {
      const res = await fetch(`/api/admin/stores/${id}/pass-link`, { method: "POST" });
      if (res.ok) {
        showMsg("링크가 재발급됐습니다.");
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        showMsg(`재발급 실패: ${d.error ?? res.status}`);
      }
    } finally {
      setRegenId(null);
    }
  };

  const copyLink = async (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/b/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showMsg("링크가 복사됐습니다.");
    } catch {
      showMsg(url);
    }
  };

  return (
    <>
      <div className="space-y-5 lg:pr-[46vw]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">지점 링크 관리</h1>
            <p className="text-sm text-gray-500 mt-1">링크 토큰이 지점코드 역할을 합니다. 유출이 의심되면 즉시 재발급하세요.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowStatus(true)}
            className="flex-shrink-0 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-600 hover:border-[#303236] hover:text-[#303236]"
          >
            지점 현황
          </button>
        </div>

        {msg && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-auto" style={{ maxHeight: "80vh" }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">지점코드</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">지점명</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">담당자명</th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">링크</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stores.map((s) => (
                  <tr
                    key={s.id}
                    className={previewStore?.id === s.id ? "bg-gray-50" : !s.pass_link_token ? "bg-amber-50/60" : undefined}
                  >
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono">{s.store_code || "-"}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{s.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={drafts[s.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                          placeholder="담당자명"
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-[#303236]"
                        />
                        <button
                          onClick={() => saveManager(s.id)}
                          disabled={savingId === s.id}
                          className="px-3 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg hover:border-[#303236] disabled:opacity-50"
                        >
                          저장
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {s.pass_link_token ? (
                        <button onClick={() => copyLink(s.pass_link_token)} className="text-sm text-[#3A6DF0] hover:underline">
                          링크 복사
                        </button>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[12px] font-semibold rounded-full bg-amber-100 text-amber-700">발급 필요</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewStoreId(s.id)}
                        className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg ${
                          previewStore?.id === s.id
                            ? "bg-[#303236] text-white"
                            : "border border-gray-300 text-gray-600 hover:border-[#303236] hover:text-[#303236]"
                        }`}
                      >
                        화면 확인
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fixed top-0 right-0 h-screen w-full sm:w-[46vw] bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 gap-3">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {previewStore ? `${previewStore.name} 화면 확인` : "화면 확인"}
          </span>
          {previewStore && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewStore.pass_link_token && (
                <button
                  type="button"
                  onClick={() => copyLink(previewStore.pass_link_token)}
                  className="px-2.5 py-1 text-[12px] font-semibold text-[#3A6DF0] border border-[#3A6DF0]/30 rounded-lg hover:bg-blue-50"
                >
                  링크 복사
                </button>
              )}
              <button
                type="button"
                onClick={() => regenerate(previewStore.id, previewStore.name)}
                disabled={regenId === previewStore.id}
                className="px-2.5 py-1 text-[12px] font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {regenId === previewStore.id ? "처리 중..." : previewStore.pass_link_token ? "재발급" : "발급"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewStoreId(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="선택 해제"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 bg-gray-100">
          {previewStore?.pass_link_token ? (
            <iframe
              key={previewStore.id}
              src={`/b/${previewStore.pass_link_token}`}
              className="w-full h-full border-0 bg-white"
              title={`${previewStore.name} 지점 화면`}
            />
          ) : previewStore ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 text-center px-6">
              아직 링크가 발급되지 않았습니다. 위의 &quot;발급&quot; 버튼을 눌러주세요.
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 text-center px-6">
              지점 목록에서 &quot;화면 확인&quot;을 누르면 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {showStatus && <StoreStatusModal onClose={() => setShowStatus(false)} />}
    </>
  );
}
