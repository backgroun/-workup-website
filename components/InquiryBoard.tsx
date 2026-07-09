"use client";
import { useEffect, useState } from "react";
import { type FeedItem } from "@/data/inquiryDummy";

// 가맹/제휴 페이지 우측 '문의 현황' 보드.
// 통합 피드(더미 + 마스킹된 실제)를 불러와 누적 전체를 스크롤로 보여준다.

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

const STATUS_LABEL: Record<string, string> = { new: "접수", processing: "처리중", done: "답변완료" };

type ViewedPost = {
  status: string; created_at: string; name: string; title: string;
  content: string; reply: string | null; repliedAt: string | null;
};

// 비밀글 열람 모달 — 비밀번호 입력 → 맞으면 본문·답변 표시.
function PostViewModal({ item, onClose }: { item: FeedItem; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<ViewedPost | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) { setError("비밀번호를 입력해주세요."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/inquiries/${item.id}/view`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "확인에 실패했습니다."); return; }
      setPost(d);
    } catch { setError("확인에 실패했습니다. 잠시 후 다시 시도해주세요."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-bold text-[#1A2B4A] truncate pr-3">{post?.title || item.content}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-8 h-8 -mr-2 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-[#1A2B4A]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {!post ? (
          <form onSubmit={submit} className="px-5 py-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">작성 시 설정한 <b>비밀번호</b>를 입력하면<br />내용과 답변을 볼 수 있어요.</p>
            </div>
            <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus placeholder="비밀번호"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              className="pw-mask w-full border border-gray-200 px-4 py-2.5 text-sm text-center focus:outline-none focus:border-[#1A2B4A] bg-white" />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#1A2B4A] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors disabled:opacity-50">
              {loading ? "확인 중..." : "확인"}
            </button>
          </form>
        ) : (
          <div className="px-5 py-5 space-y-4 text-sm">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{post.name}</span><span>·</span><span>{fmtDate(post.created_at)}</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">{STATUS_LABEL[post.status] ?? post.status}</span>
            </div>
            <div className="text-[#1A2B4A] whitespace-pre-line break-words leading-relaxed border border-gray-100 rounded-lg p-3.5 bg-gray-50/40">{post.content || "(내용 없음)"}</div>
            {post.reply ? (
              <div className="border border-[#ffd9c4] bg-[#fff7f1] rounded-lg p-3.5">
                <p className="text-xs font-bold text-[#ff550c] mb-1.5">답변{post.repliedAt ? ` · ${fmtDate(post.repliedAt)}` : ""}</p>
                <p className="text-[#1A2B4A] whitespace-pre-line break-words leading-relaxed">{post.reply}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">아직 답변이 등록되지 않았습니다. 영업일 기준 2일 이내 연락드립니다.</p>
            )}
            <button type="button" onClick={onClose} className="w-full border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded hover:bg-gray-50">닫기</button>
          </div>
        )}
      </div>
    </div>
  );
}

const RENDER_STEP = 60; // 스크롤 시 한 번에 더 그리는 개수

export default function InquiryBoard({ type }: { type?: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(RENDER_STEP); // 점진 렌더(무한 스크롤)
  const [viewItem, setViewItem] = useState<FeedItem | null>(null); // 비밀글 열람 대상

  const title = type === "wholesale" ? "워크업 입점/제휴 문의 현황"
    : type === "franchise" ? "워크업 가맹/창업 문의 현황"
    : "워크업 문의 현황";
  const accent = type === "wholesale" ? "#2563eb" : "#ff550c"; // 입점=블루, 가맹=오렌지

  const load = () => {
    setRefreshing(true);
    setVisible(RENDER_STEP);
    fetch(`/api/inquiry-feed${type ? `?type=${type}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d.items) ? d.items : []);
        setTotal(typeof d.total === "number" ? d.total : 0);
      })
      .catch(() => {})
      .finally(() => { setLoaded(true); setRefreshing(false); });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // 스크롤이 바닥 근처에 오면 더 그린다.
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      setVisible((v) => (v < items.length ? Math.min(v + RENDER_STEP, items.length) : v));
    }
  };

  return (
    <div className="bg-white border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0" style={{ background: "linear-gradient(180deg,#fafbfc,#fff)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
          <h3 className="text-[15px] font-bold text-[#1A2B4A] truncate">{title}</h3>
          <span className="flex items-center gap-1 text-[10px] text-green-600 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />LIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
            누적 <b className="text-[#1A2B4A]">{total.toLocaleString()}</b>건
          </span>
          <button type="button" onClick={load} disabled={refreshing} title="새로고침" aria-label="새로고침"
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-[#1A2B4A] hover:border-gray-300 transition-colors disabled:opacity-50">
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="grid grid-cols-[1fr_70px_64px] px-5 py-2 text-[10px] font-medium text-gray-400 border-b border-gray-100 tracking-wider flex-shrink-0 bg-gray-50/50">
        <span>제목</span><span className="text-center">작성자</span><span className="text-right">날짜</span>
      </div>

      {/* 목록 (전체 스크롤 — 바닥 근처에서 점진 로드) */}
      <div className="flex-1 overflow-y-auto" onScroll={onScroll}>
        {!loaded ? (
          <div className="py-12 text-center text-xs text-gray-300">불러오는 중...</div>
        ) : (
          items.slice(0, visible).map((it) => {
            const today = isToday(it.created_at);
            return (
              <div
                key={it.id}
                onClick={it.locked ? () => setViewItem(it) : undefined}
                className={`grid grid-cols-[1fr_70px_64px] px-5 py-2.5 text-[11px] items-center border-b border-gray-50 border-l-2 transition-colors hover:bg-slate-50/70 ${it.locked ? "cursor-pointer" : ""} ${today ? "bg-[#fff7f1] border-l-[#ff550c]" : "border-l-transparent"}`}
              >
                <span className="text-[#1A2B4A] truncate flex items-center gap-1.5 min-w-0">
                  {today && <span className="flex-shrink-0 text-[9px] font-bold text-white bg-[#ff550c] rounded px-1 leading-tight py-0.5">NEW</span>}
                  {it.locked && (
                    <svg className="w-3 h-3 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-label="비밀글">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
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

      {viewItem && <PostViewModal item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  );
}
