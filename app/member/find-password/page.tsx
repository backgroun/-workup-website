"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";

type Step = "form" | "reset" | "done";

export default function FindPasswordPage() {
  const [step, setStep]         = useState<Step>("form");
  const [form, setForm]         = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ newPassword: "", confirm: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set  = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const setP = (k: string, v: string) => setPasswords(p => ({ ...p, [k]: v }));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("이름과 이메일을 모두 입력해주세요."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/member/find-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", name: form.name.trim(), email: form.email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep("reset");
      } else {
        setError(data.error ?? "조회에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (passwords.newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다."); return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      setError("비밀번호가 일치하지 않습니다."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/member/find-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "reset",
          name: form.name.trim(),
          email: form.email.trim(),
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep("done");
      } else {
        setError(data.error ?? "비밀번호 변경에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo_black.png"
              alt="WORKUP"
              width={140}
              height={20}
              className="h-5 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-5">비밀번호 찾기</h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === "form"  && "가입 시 등록한 이름과 이메일을 입력해주세요"}
            {step === "reset" && "새로 사용할 비밀번호를 입력해주세요"}
            {step === "done"  && "비밀번호가 변경되었습니다"}
          </p>
        </div>

        {/* 단계 표시 */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === "form" ? "bg-[#303236] text-white" : "bg-green-500 text-white"}`}>
              {step === "form" ? "1" : "✓"}
            </div>
            <div className={`flex-1 h-0.5 ${step === "reset" ? "bg-[#303236]" : "bg-gray-200"}`} />
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === "reset" ? "bg-[#303236] text-white" : "bg-gray-200 text-gray-400"}`}>
              2
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: 본인 확인 */}
        {step === "form" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="fp-name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="fp-name"
                type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fp-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="fp-email"
                type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="example@email.com"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "확인 중..." : "본인 확인"}
            </button>
          </form>
        )}

        {/* Step 2: 새 비밀번호 입력 */}
        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="fp-new-pw" className="block text-xs font-semibold text-gray-600 mb-1.5">
                새 비밀번호 <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                id="fp-new-pw"
                value={passwords.newPassword} onChange={e => setP("newPassword", e.target.value)}
                placeholder="8자 이상"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fp-confirm-pw" className="block text-xs font-semibold text-gray-600 mb-1.5">
                새 비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                id="fp-confirm-pw"
                value={passwords.confirm} onChange={e => setP("confirm", e.target.value)}
                placeholder="비밀번호 재입력"
                className={`w-full border px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  passwords.confirm && passwords.newPassword !== passwords.confirm
                    ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                    : "border-gray-200 focus:border-[#303236] focus:ring-[#303236]/10"
                }`}
              />
              {passwords.confirm && passwords.newPassword !== passwords.confirm && (
                <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}

        {/* 완료 */}
        {step === "done" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-8">
              비밀번호가 성공적으로 변경되었습니다.<br />새 비밀번호로 로그인해주세요.
            </p>
            <Link
              href="/member/login"
              className="block w-full py-3.5 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] transition-colors text-center"
            >
              로그인하기
            </Link>
          </div>
        )}

        {step !== "done" && (
          <div className="mt-6 text-center">
            <Link href="/member/login" className="text-sm text-gray-400 hover:text-[#303236] transition-colors">
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
