"use client";
import { useEffect, useState } from "react";

type NoticeStatus = "대기" | "진행중" | "마감";
type NoticeRow = { id: string; status: NoticeStatus; notice_date: string };
type HistoryRow = { summary: string; actor_name: string; created_at: string };

const SCHEDULE_SECTION = "notice_schedule";
const DEFAULT_OPEN = "11:00";
const DEFAULT_CLOSE = "14:00";

function fmtHistoryTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function DeadlineManagementPage() {
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busy, setBusy] = useState<"open" | "close" | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  // ── 오픈/마감 시각 설정 ──
  const [openTime, setOpenTime] = useState(DEFAULT_OPEN);
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const loadNotices = () => {
    setLoading(true);
    fetch("/api/admin/notices")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotices(Array.isArray(data) ? data.filter((n: NoticeRow) => n.notice_date === today) : []))
      .finally(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    fetch("/api/admin/notices/history")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .finally(() => setHistoryLoading(false));
  };

  const loadSchedule = () => {
    fetch(`/api/admin/site-settings/${SCHEDULE_SECTION}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setOpenTime(data?.openTime || DEFAULT_OPEN);
        setCloseTime(data?.closeTime || DEFAULT_CLOSE);
      })
      .finally(() => setScheduleLoaded(true));
  };

  useEffect(() => {
    loadNotices();
    loadHistory();
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const saveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleMsg("");
    try {
      const res = await fetch(`/api/admin/site-settings/${SCHEDULE_SECTION}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openTime, closeTime }),
      });
      if (res.ok) {
        setScheduleMsg("저장되었습니다.");
        setTimeout(() => setScheduleMsg(""), 3000);
      } else {
        setScheduleMsg("저장에 실패했습니다.");
      }
    } catch {
      setScheduleMsg("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const counts = {
    total: notices.length,
    대기: notices.filter((n) => n.status === "대기").length,
    진행중: notices.filter((n) => n.status === "진행중").length,
    마감: notices.filter((n) => n.status === "마감").length,
  };

  const runBulk = async (action: "open-all" | "close-all") => {
    setBusy(action === "open-all" ? "open" : "close");
    setError("");
    try {
      const res = await fetch(`/api/admin/notices/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "처리에 실패했습니다.");
        return;
      }
      loadNotices();
      loadHistory();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  const progressPct = Math.min(100, Math.max(0, ((nowMinutes - openMinutes) / (closeMinutes - openMinutes)) * 100));
  const nowLabel = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const remainingMin = closeMinutes - nowMinutes;
  const countdownLabel =
    nowMinutes < openMinutes
      ? `${openTime}에 자동 오픈 예정`
      : nowMinutes >= closeMinutes
      ? "마감 시간이 지났습니다"
      : `마감까지 ${Math.floor(remainingMin / 60)}시간 ${remainingMin % 60}분 남음`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">마감 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          자동 스케줄 위에 관리자가 언제든 수동으로 개입할 수 있습니다. 오늘 등록된 모든 공지에 한 번에 적용됩니다.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-4 text-sm mb-1 flex-wrap">
            <span className="font-bold text-gray-900 text-base">{counts.total}</span>
            <span className="text-gray-400">오늘 공지</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-500">{counts.대기}</span>
            <span className="text-gray-400">대기</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-emerald-600">{counts.진행중}</span>
            <span className="text-gray-400">진행중</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-amber-600">{counts.마감}</span>
            <span className="text-gray-400">마감</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {openTime} 자동 오픈 · {closeTime} 자동 마감 예정
          </p>

          <div className="relative h-1.5 bg-gray-200 rounded-full">
            <div
              className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono mt-1 mb-4">
            <span>{openTime}</span>
            <span>{closeTime}</span>
          </div>
          <p className="text-[12.5px] text-gray-500 mb-4">
            현재 {nowLabel} · {countdownLabel}
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => runBulk("close-all")}
              disabled={busy !== null || counts.진행중 === 0}
              className="px-4 py-1.5 text-[13px] font-bold rounded-lg disabled:opacity-40 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            >
              {busy === "close" ? "처리 중..." : `지금 전체 마감하기 (${counts.진행중}건)`}
            </button>
            <button
              onClick={() => runBulk("open-all")}
              disabled={busy !== null || counts.대기 === 0}
              className="px-4 py-1.5 text-[13px] font-bold rounded-lg disabled:opacity-40 bg-[#303236] text-white hover:bg-[#1f2124]"
            >
              {busy === "open" ? "처리 중..." : `지금 전체 오픈하기 (${counts.대기}건)`}
            </button>
          </div>

          {error && (
            <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
              i
            </span>
            <p className="text-[12.5px] text-amber-700">
              전체 마감하면 모든 지점 화면이 즉시 읽기 전용으로 전환됩니다. 실수로 마감했다면 &quot;지금 전체
              오픈하기&quot;로 되돌릴 수 있습니다.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h2 className="font-bold text-gray-900 mb-1">오픈·마감 시각 설정</h2>
            <p className="text-[12.5px] text-gray-500 mb-4">
              여기서 바꾼 시각은 위 타임라인 표시와 &quot;지금 전체 오픈·마감하기&quot; 버튼 안내에 바로 반영됩니다.
            </p>
            {!scheduleLoaded ? (
              <p className="text-[13px] text-gray-400">불러오는 중...</p>
            ) : (
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1">오픈 시각</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#303236]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 mb-1">마감 시각</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#303236]"
                  />
                </div>
                <button
                  onClick={saveSchedule}
                  disabled={savingSchedule}
                  className="px-4 py-1.5 text-[13px] font-bold rounded-lg bg-[#303236] text-white hover:bg-[#1f2124] disabled:opacity-50"
                >
                  {savingSchedule ? "저장 중..." : "저장"}
                </button>
                {scheduleMsg && <span className="text-[12.5px] text-gray-500">{scheduleMsg}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <p className="text-[12px] font-semibold text-gray-500 mb-1">최근 상태 변경 이력</p>
        {historyLoading ? (
          <p className="text-[13px] text-gray-400 py-2">불러오는 중...</p>
        ) : history.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-2">아직 변경 이력이 없습니다.</p>
        ) : (
          <div>
            {history.map((h, i) => (
              <div key={i} className="py-2.5 border-b border-gray-100 last:border-0 text-[13px] text-gray-600">
                <span className="font-mono text-gray-400 mr-2">{fmtHistoryTime(h.created_at)}</span>—{" "}
                {h.summary} <span className="text-gray-400">({h.actor_name})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
