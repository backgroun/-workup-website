"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MemberLoginPage() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const router = useRouter();

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("이메일과 비밀번호를 입력해주세요."); return;
    }
    setSaving(true);
    const res = await fetch("/api/member/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.trim(), password: form.password }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/mypage");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <p className="text-2xl font-black tracking-[0.15em] text-[#1A2B4A]">WORKUP</p>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">로그인</h1>
          <p className="text-sm text-gray-400 mt-1">워크업 회원 전용 로그인</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="example@email.com"
              inputMode="email" autoComplete="email" autoCapitalize="none"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password" value={form.password} onChange={e => set("password", e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors mt-2"
          >
            {saving ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-400">
            아직 회원이 아니신가요?{" "}
            <Link href="/register" className="text-[#1A2B4A] font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
