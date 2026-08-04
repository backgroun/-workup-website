"use client";
import { useRouter } from "next/navigation";

export default function LogoutLink() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/member/logout", { method: "POST" });
    router.push("/member/login");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-[#303236] transition-colors">
      로그아웃
    </button>
  );
}
