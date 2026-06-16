"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-white px-4 py-1.5 transition-colors"
    >
      로그아웃
    </button>
  );
}
