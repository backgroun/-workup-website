"use client";
import { useState } from "react";
import Link from "next/link";

function formatPhone(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", passwordConfirm: "",
    phone: "", agreeTerms: false, agreePrivacy: false,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("이름, 이메일, 비밀번호는 필수입니다."); return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다."); return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다."); return;
    }
    if (!form.agreeTerms || !form.agreePrivacy) {
      setError("필수 약관에 동의해주세요."); return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "회원가입 중 오류가 발생했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">가입이 완료됐습니다</h2>
          <p className="text-gray-500 text-sm mb-8">워크업 회원이 되신 것을 환영합니다.<br />매장을 방문하시면 더 많은 혜택을 누리실 수 있습니다.</p>
          <div className="flex gap-3">
            <Link href="/mypage"
              className="flex-1 py-3 text-center bg-[#1A2B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] transition-colors">
              마이페이지
            </Link>
            <Link href="/products"
              className="flex-1 py-3 text-center border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              제품 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <p className="text-2xl font-black tracking-[0.15em] text-[#1A2B4A]">WORKUP</p>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">회원가입</h1>
          <p className="text-sm text-gray-400 mt-1">워크업 회원이 되시면 다양한 혜택을 누리실 수 있습니다</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">전화번호</label>
              <input
                type="tel" value={form.phone}
                onChange={e => set("phone", formatPhone(e.target.value))}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="example@email.com"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password" value={form.password} onChange={e => set("password", e.target.value)}
              placeholder="8자 이상"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#1A2B4A] focus:ring-2 focus:ring-[#1A2B4A]/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password" value={form.passwordConfirm} onChange={e => set("passwordConfirm", e.target.value)}
              placeholder="비밀번호 재입력"
              className={`w-full border px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                form.passwordConfirm && form.password !== form.passwordConfirm
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-[#1A2B4A] focus:ring-[#1A2B4A]/10"
              }`}
            />
            {form.passwordConfirm && form.password !== form.passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox" checked={form.agreeTerms} onChange={e => set("agreeTerms", e.target.checked)}
                  className="w-4 h-4 accent-[#1A2B4A]"
                />
              </div>
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-[#1A2B4A]">[필수]</span> 이용약관에 동의합니다
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox" checked={form.agreePrivacy} onChange={e => set("agreePrivacy", e.target.checked)}
                  className="w-4 h-4 accent-[#1A2B4A]"
                />
              </div>
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-[#1A2B4A]">[필수]</span> 개인정보 처리방침에 동의합니다
              </span>
            </label>
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors mt-2"
          >
            {saving ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          이미 회원이신가요?{" "}
          <Link href="/member/login" className="text-[#1A2B4A] font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
