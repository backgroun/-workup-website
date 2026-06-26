"use client";
import { useRouter } from "next/navigation";

// 통합 회원 세션(wu-member) 로그아웃. 관리자 대시보드 헤더에서 사용.
export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/member/logout", { method: "POST" });
    router.push("/member/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-white px-4 py-1.5 rounded transition-colors"
    >
      로그아웃
    </button>
  );
}
