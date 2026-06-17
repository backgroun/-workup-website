"use client";
import { useEffect, useRef, useState } from "react";
import { makeDummy, type FeedItem } from "@/data/inquiryDummy";

// 가맹/제휴 페이지 우측 '문의 현황' 보드.
// 통합 피드(더미 + 마스킹된 실제)를 불러오고, 새 문의가 위에서 떨어지는 드립 애니메이션으로 활발해 보이게 한다.

const NOTICES = [
  "[필독] 상담 운영 시간 안내",
  "[필독] 문의 접수 절차 안내",
];

function fmtDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  if (diff < 60_000) return "방금 전";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === new Date().toDateString();
}

export default function InquiryBoard({ type }: { type?: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [newId, setNewId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<number | null>(null);

  const title = type === "wholesale" ? "워크업 입점/제휴 문의 현황"
    : type === "franchise" ? "워크업 가맹/창업 문의 현황"
    : "워크업 문의 현황";
  const accent = type === "wholesale" ? "#2563eb" : "#ff550c"; // 입점=블루, 가맹=오렌지

  useEffect(() => {
    let alive = true;
    fetch(`/api/inquiry-feed${type ? `?type=${type}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(Array.isArray(d.items) ? d.items.slice(0, 20) : []);
        setTotal(typeof d.total === "number" ? d.total : 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { alive = false; };
  }, [type]);

  // 새 문의가 위로 올라오는 효과 — 첫 등장 30~70초, 이후 하루 ~10개 페이스.
  useEffect(() => {
    if (!loaded) return;
    let first = true;
    const schedule = () => {
      const delay = first ? 30000 + Math.random() * 40000 : 7_200_000 + Math.random() * 3_600_000;
      first = false;
      timerRef.current = window.setTimeout(() => {
        const it = makeDummy({ type });
        setItems((prev) => [it, ...prev].slice(0, 40));
        setNewId(it.id);
        window.setTimeout(() => setNewId((cur) => (cur === it.id ? null : cur)), 1300);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loaded, type]);

  return (
    <div className="bg-white border border-gray-200 h-full min-h-[480px] flex flex-col overflow-hidden">
      <style>{`@keyframes inq-drop{0%{opacity:0;transform:translateY(-14px)}60%{background:rgba(255,85,12,.10)}100%{opacity:1;transform:translateY(0)}}.inq-new{animation:inq-drop 1s ease-out}`}</style>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0" style={{ background: "linear-gradient(180deg,#fafbfc,#fff)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
          <h3 className="text-[15px] font-bold text-[#1A2B4A] truncate">{title}</h3>
          <span className="flex items-center gap-1 text-[10px] text-green-600 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />LIVE
          </span>
        </div>
        <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
          누적 <b className="text-[#1A2B4A]">{total.toLocaleString()}</b>건
        </span>
      </div>

      {/* 컬럼 헤더 */}
      <div className="grid grid-cols-[48px_1fr_70px_64px] px-5 py-2 text-[10px] font-medium text-gray-400 border-b border-gray-100 tracking-wider flex-shrink-0 bg-gray-50/50">
        <span>NO.</span><span>제목</span><span className="text-center">작성자</span><span className="text-right">날짜</span>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-hidden">
        {NOTICES.map((n, i) => (
          <div key={`notice-${i}`} className="grid grid-cols-[48px_1fr_70px_64px] px-5 py-2.5 text-[11px] items-center border-b border-gray-50 bg-amber-50/50">
            <span className="text-amber-500 text-[12px]">📌</span>
            <span className="font-semibold text-[#1A2B4A] truncate">{n}</span>
            <span className="text-center text-gray-400">관리자</span>
            <span className="text-right text-gray-400">공지</span>
          </div>
        ))}

        {!loaded ? (
          <div className="py-12 text-center text-xs text-gray-300">불러오는 중...</div>
        ) : (
          items.map((it, idx) => {
            const today = isToday(it.created_at);
            return (
              <div
                key={it.id}
                className={`grid grid-cols-[48px_1fr_70px_64px] px-5 py-2.5 text-[11px] items-center border-b border-gray-50 border-l-2 transition-colors hover:bg-slate-50/70 ${
                  it.id === newId ? "inq-new" : ""
                } ${today ? "bg-[#fff7f1] border-l-[#ff550c]" : "border-l-transparent"}`}
              >
                <span className="text-gray-400 tabular-nums">{Math.max(1, total - idx).toLocaleString()}</span>
                <span className="text-[#1A2B4A] truncate flex items-center gap-1.5 min-w-0">
                  {today && <span className="flex-shrink-0 text-[9px] font-bold text-white bg-[#ff550c] rounded px-1 leading-tight py-0.5">NEW</span>}
                  <span className="truncate">{it.content}</span>
                </span>
                <span className="text-center text-gray-500 truncate">{it.name}</span>
                <span className={`text-right whitespace-nowrap ${today ? "text-[#ff550c] font-medium" : "text-gray-400"}`}>{fmtDate(it.created_at)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 py-3 border-t border-gray-100 text-center flex-shrink-0 bg-gray-50/40">
        <p className="text-[10px] text-gray-400">문의 주신 순서대로 영업일 기준 2일 이내 연락드립니다.</p>
      </div>
    </div>
  );
}
