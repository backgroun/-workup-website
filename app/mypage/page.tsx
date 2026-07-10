"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MemberInfo = {
  id: string | number;
  name: string;
  email: string;
  grade: string;
};

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

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/member/logout", { method: "POST" });
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
      <div className="max-w-md mx-auto space-y-4">

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

        {/* 회원 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
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

        {/* 로그아웃 */}
        <button
          onClick={handleLogout} disabled={loggingOut}
          className="w-full py-3.5 border border-gray-200 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>

      </div>
    </div>
  );
}
