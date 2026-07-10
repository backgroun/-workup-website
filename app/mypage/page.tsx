"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, FITTING_LIST_KEY } from "@/contexts/CartContext";

type MemberInfo = {
  id: string | number;
  name: string;
  email: string;
  grade: string;
};

type MyInquiry = {
  id: number;
  type: string;
  typeLabel: string;
  status: "new" | "processing" | "done" | string;
  createdAt: string;
  title: string;
  content: string;
  reply: string;
  repliedAt: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new:        { label: "접수",     cls: "bg-gray-100 text-gray-600" },
  processing: { label: "처리중",   cls: "bg-amber-100 text-amber-700" },
  done:       { label: "답변완료", cls: "bg-green-100 text-green-700" },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

const GRADE_COLOR: Record<string, string> = {
  일반회원: "bg-gray-100 text-gray-600",
  VIP:     "bg-amber-100 text-amber-700",
  VVIP:    "bg-purple-100 text-purple-700",
  도매회원:  "bg-blue-100 text-blue-700",
  거래처:   "bg-green-100 text-green-700",
  관리자:   "bg-red-100 text-red-700",
};

export default function MyPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const { items: wishlist } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/member/me")
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.replace("/member/login");
        } else {
          setMember(data);
        }
      })
      .catch(() => router.replace("/member/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // 내가 남긴 문의 내역 (로그인 상태에서 작성한 문의만 연결됨)
  useEffect(() => {
    if (!member) return;
    fetch("/api/member/inquiries")
      .then(r => (r.ok ? r.json() : []))
      .then(data => setInquiries(Array.isArray(data) ? data : []))
      .catch(() => setInquiries([]))
      .finally(() => setInquiriesLoading(false));
  }, [member]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/member/logout", { method: "POST" });
    // 찜은 계정에 저장되므로, 이 기기의 캐시는 지워 다음 사용자에게 노출되지 않게 한다.
    try { localStorage.removeItem(FITTING_LIST_KEY); } catch {}
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <span className="w-7 h-7 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 py-12">
      <div className="max-w-md lg:max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-2xl font-black tracking-[0.15em] text-[#1A2B4A]">WORKUP</Link>
          <button
            onClick={handleLogout} disabled={loggingOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>

        {/* PC(lg~)에서는 2×2 배치, 모바일은 1열 유지 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">

        {/* 회원 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            {/* 아바타 */}
            <div className="w-14 h-14 rounded-full bg-[#1A2B4A] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{member.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-900">{member.name}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${GRADE_COLOR[member.grade] ?? "bg-gray-100 text-gray-600"}`}>
                  {member.grade}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{member.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">이름</span>
              <span className="font-medium text-gray-800">{member.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">이메일</span>
              <span className="font-medium text-gray-800">{member.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">회원등급</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${GRADE_COLOR[member.grade] ?? "bg-gray-100 text-gray-600"}`}>
                {member.grade}
              </span>
            </div>
          </div>
        </div>

        {/* 찜한 제품 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">찜한 제품</p>
            {wishlist.length > 0 && (
              <Link href="/cart" className="text-xs text-gray-400 hover:text-[#1A2B4A] transition-colors">
                전체 보기 ({wishlist.length})
              </Link>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">찜한 제품이 없습니다.</p>
              <Link href="/products" className="inline-block mt-3 text-sm font-semibold text-[#1A2B4A] hover:underline">
                제품 보러 가기
              </Link>
            </div>
          ) : (
            <>
              <div className="p-4 grid grid-cols-4 gap-3">
                {wishlist.slice(0, 4).map(item => (
                  <Link key={item.cartId} href={`/products/${item.productId}`} className="group">
                    {/* 이미지가 없는 제품은 제품 대표색(bg)이 보이도록 — 제품 카드와 동일한 방식 */}
                    <div className={`${item.bg} aspect-square rounded-lg overflow-hidden`}>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-600 line-clamp-1">{item.name}</p>
                  </Link>
                ))}
              </div>
              <p className="px-5 pb-4 text-xs text-gray-400">
                매장을 방문하시면 찜한 제품을 직접 입어보실 수 있습니다.
              </p>
            </>
          )}
        </div>

        {/* 내 문의 내역 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">내 문의 내역</p>
            {inquiries.length > 0 && (
              <span className="text-xs text-gray-400">{inquiries.length}건</span>
            )}
          </div>

          {inquiriesLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="w-5 h-5 border-2 border-[#1A2B4A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">아직 남기신 문의가 없습니다.</p>
              <Link href="/support" className="inline-block mt-3 text-sm font-semibold text-[#1A2B4A] hover:underline">
                1:1 문의하기
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inquiries.map(inq => {
                const meta = STATUS_META[inq.status] ?? STATUS_META.new;
                const isOpen = openId === inq.id;
                const heading = inq.title || inq.content || inq.typeLabel;
                return (
                  <li key={inq.id}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : inq.id)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">{inq.typeLabel}</span>
                        <span className="text-xs text-gray-300 ml-auto">{fmtDate(inq.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-1">{heading}</p>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 space-y-3">
                        {inq.content && (
                          <div className="bg-gray-50 rounded-lg px-4 py-3">
                            <p className="text-xs font-semibold text-gray-400 mb-1">문의 내용</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.content}</p>
                          </div>
                        )}
                        {inq.reply ? (
                          <div className="bg-[#1A2B4A]/5 border border-[#1A2B4A]/10 rounded-lg px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-[#1A2B4A]">담당자 답변</p>
                              {inq.repliedAt && (
                                <span className="text-xs text-gray-400">{fmtDate(inq.repliedAt)}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.reply}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 px-1">
                            담당자가 확인 중입니다. 빠른 상담은 매장으로 전화 주세요.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: "전체 제품 보기", href: "/products", desc: "워크업 라인업 탐색" },
            { label: "매장 찾기", href: "/store", desc: "가까운 매장 위치 확인" },
            { label: "카카오톡 상담", href: "https://pf.kakao.com", desc: "빠른 제품 문의" },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        </div>{/* /2×2 그리드 */}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout} disabled={loggingOut}
          className="w-full mt-4 lg:mt-6 py-3.5 border border-gray-200 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>

      </div>
    </div>
  );
}
