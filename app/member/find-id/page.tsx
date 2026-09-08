"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function formatPhone(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

type Result = { maskedEmail: string; joinedAt: string | null };

export default function FindIdPage() {
  const [form, setForm]       = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [results, setResults] = useState<Result[] | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError("이름과 전화번호를 모두 입력해주세요."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/member/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResults(data.results);
      } else {
        setError(data.error ?? "조회에 실패했습니다.");
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
          <h1 className="text-xl font-bold text-gray-900 mt-5">아이디 찾기</h1>
          <p className="text-sm text-gray-400 mt-1">가입 시 등록한 이름과 전화번호를 입력해주세요</p>
        </div>

        {results ? (
          /* 결과 화면 */
          <div>
            <div className="rounded-xl bg-[#f8f8f6] border border-gray-100 p-5 mb-6">
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">조회된 아이디</p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-[15px] font-semibold text-[#303236]">{r.maskedEmail}</span>
                  {r.joinedAt && (
                    <span className="text-xs text-gray-400">{r.joinedAt} 가입</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link
                href="/member/login"
                className="flex-1 py-3 text-center bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] transition-colors"
              >
                로그인
              </Link>
              <button
                onClick={() => { setResults(null); setForm({ name: "", phone: "" }); }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                다시 찾기
              </button>
            </div>
          </div>
        ) : (
          /* 입력 폼 */
          <>
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fi-name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fi-name"
                  type="text" value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="홍길동"
                  autoComplete="name"
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="fi-phone" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fi-phone"
                  type="tel" value={form.phone}
                  onChange={e => set("phone", formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors mt-2"
              >
                {loading ? "조회 중..." : "아이디 찾기"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/member/login" className="text-sm text-gray-400 hover:text-[#303236] transition-colors">
                로그인으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
