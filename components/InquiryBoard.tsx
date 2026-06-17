"use client";
import { useEffect, useRef, useState } from "react";
import { makeDummy, type FeedItem } from "@/data/inquiryDummy";

// 공개 페이지 우측 '실시간 문의 현황' 보드 (보여주기).
// 통합 피드(더미 + 마스킹된 실제)를 불러오고, 새 문의가 위에서 떨어지는 드립 애니메이션으로 활발해 보이게 한다.

const NOTICES = [
  "[필독] 가맹·창업 상담 운영 안내",
  "[필독] 입점·제휴 접수 절차 안내",
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

export default function InquiryBoard() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [newId, setNewId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/inquiry-feed")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(Array.isArray(d.items) ? d.items.slice(0, 18) : []);
        setTotal(typeof d.total === "number" ? d.total : 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { alive = false; };
  }, []);

  // 실시간 드립 (화면 표시용 — 새 문의가 위로 올라오는 효과)
  useEffect(() => {
    if (!loaded) return;
    const schedule = () => {
      const delay = 5000 + Math.random() * 5000;
      timerRef.current = window.setTimeout(() => {
        const it = makeDummy();
        setItems((prev) => [it, ...prev].slice(0, 40));
        setTotal((t) => t + 1);
        setNewId(it.id);
        window.setTimeout(() => setNewId((cur) => (cur === it.id ? null : cur)), 1000);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loaded]);

  return (
    <div className="bg-white border border-gray-200 h-full min-h-[480px] flex flex-col overflow-hidden">
      <style>{`@keyframes inq-drop{0%{opacity:0;transform:translateY(-12px);background:rgba(255,85,12,.12)}100%{opacity:1;transform:translateY(0);background:transparent}}.inq-new{animation:inq-drop .9s ease-out}`}</style>

      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1A2B4A]">실시간 문의 현황</h3>
          <span className="flex items-center gap-1 text-[10px] text-green-600">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />LIVE
          </span>
        </div>
        <span className="text-xs text-gray-400">총 <b className="text-[#ff550c]">{total.toLocaleString()}</b>건</span>
      </div>

      <div className="grid grid-cols-[46px_1fr_64px_62px] px-5 py-2 text-[10px] text-gray-400 border-b border-gray-100 tracking-wider flex-shrink-0">
        <span>NO.</span><span>CONTENT</span><span className="text-center">NAME</span><span className="text-right">DATE</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {NOTICES.map((n, i) => (
          <div key={`notice-${i}`} className="grid grid-cols-[46px_1fr_64px_62px] px-5 py-2.5 text-[11px] items-center border-b border-gray-50 bg-amber-50/40">
            <span className="text-gray-300">📌</span>
            <span className="font-semibold text-[#1A2B4A] truncate">{n}</span>
            <span className="text-center text-gray-400">관리자</span>
            <span className="text-right text-gray-400">공지</span>
          </div>
        ))}
        {!loaded ? (
          <div className="py-10 text-center text-xs text-gray-300">불러오는 중...</div>
        ) : (
          items.map((it, idx) => (
            <div key={it.id} className={`grid grid-cols-[46px_1fr_64px_62px] px-5 py-2.5 text-[11px] items-center border-b border-gray-50 ${it.id === newId ? "inq-new" : ""}`}>
              <span className="text-gray-400">{Math.max(1, total - idx).toLocaleString()}</span>
              <span className="text-[#1A2B4A] truncate flex items-center gap-1.5 min-w-0">
                <span className={`flex-shrink-0 text-[9px] px-1 py-0.5 rounded ${it.type === "wholesale" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#ff550c]"}`}>
                  {it.type === "wholesale" ? "입점" : "가맹"}
                </span>
                <span className="truncate">{it.content}</span>
              </span>
              <span className="text-center text-gray-500 truncate">{it.name}</span>
              <span className="text-right text-gray-400 whitespace-nowrap">{fmtDate(it.created_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 text-center flex-shrink-0">
        <p className="text-[10px] text-gray-400">문의 주신 순서대로 영업일 기준 2일 이내 연락드립니다.</p>
      </div>
    </div>
  );
}
