"use client";
import { useState } from "react";

type FormState = Record<string, string>;

function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 bg-[#ff550c] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-bold text-[#1A2B4A] mb-2">문의가 접수되었습니다</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-6">
        영업일 기준 2일 이내에 담당자가 연락드립니다.
      </p>
      <button
        onClick={onReset}
        className="text-xs text-gray-400 underline hover:text-[#1A2B4A] transition-colors"
      >
        다시 문의하기
      </button>
    </div>
  );
}

function Field({
  label, name, type = "text", required, placeholder, value, onChange,
}: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  const cls = "w-full border border-gray-200 px-4 py-2.5 text-sm text-[#1A2B4A] placeholder-gray-300 focus:outline-none focus:border-[#1A2B4A] transition-colors bg-white";
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="block text-xs text-gray-500 mb-1.5">
        {label}{required && <span className="text-[#ff550c] ml-0.5">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          id={`pf-${name}`}
          name={name}
          rows={4}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          id={`pf-${name}`}
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cls}
        />
      )}
    </div>
  );
}

// ── 개인정보 수집·이용 동의 (로그인 없이 접수하므로 필수) ──
function PrivacyConsent({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
      <input
        type="checkbox"
        name="privacyAgree"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#1A2B4A]"
      />
      <span className="text-xs text-gray-500 leading-relaxed">
        <span className="text-[#ff550c] font-medium">[필수]</span> 개인정보 수집·이용에 동의합니다.{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="underline text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
        >
          내용 보기
        </a>
        <span className="block text-gray-400 mt-0.5">
          이름·연락처는 문의 접수 및 상담 안내 목적으로만 사용됩니다.
        </span>
      </span>
    </label>
  );
}

// ── 문의 제출 헬퍼 ──
async function submitInquiry(type: "franchise" | "wholesale", payload: FormState) {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "접수에 실패했습니다.");
}

// ── 가맹 창업 문의 폼 ─────────────────────────────────
export function FranchiseForm() {
  const init: FormState = { name: "", phone: "", region: "", message: "" };
  const [form, setForm] = useState(init);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("개인정보 수집·이용에 동의해주세요."); return; }
    setSubmitting(true); setError("");
    try {
      // 동의값을 payload에 기록 — 접수 시각(created_at)이 곧 동의 시각.
      await submitInquiry("franchise", { ...form, privacyAgree: "동의" });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessMessage onReset={() => { setForm(init); setAgreed(false); setSubmitted(false); }} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="이름" name="name" required placeholder="홍길동" value={form.name} onChange={handleChange} />
        <Field label="연락처" name="phone" type="tel" required placeholder="010-0000-0000" value={form.phone} onChange={handleChange} />
      </div>
      <Field label="창업 희망 지역" name="region" placeholder="예) 서울 강남, 경기 수원 등" value={form.region} onChange={handleChange} />
      <Field label="문의 내용" name="message" type="textarea" placeholder="창업 예산, 희망 규모, 궁금한 점을 자유롭게 적어주세요." value={form.message} onChange={handleChange} />
      <PrivacyConsent checked={agreed} onChange={setAgreed} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !agreed}
        className="w-full bg-[#1A2B4A] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors disabled:opacity-50 disabled:hover:bg-[#1A2B4A] disabled:cursor-not-allowed"
      >
        {submitting ? "접수 중..." : "가맹 문의 접수하기 →"}
      </button>
      <p className="text-xs text-gray-400 text-center">영업일 기준 2일 이내 연락드립니다.</p>
    </form>
  );
}

// ── 입점 문의 폼 ──────────────────────────────────────
export function WholesaleForm() {
  const init: FormState = { brand: "", manager: "", phone: "", category: "", link: "", message: "" };
  const [form, setForm] = useState(init);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await submitInquiry("wholesale", form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessMessage onReset={() => { setForm(init); setSubmitted(false); }} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="브랜드명" name="brand" required placeholder="브랜드 이름" value={form.brand} onChange={handleChange} />
        <Field label="담당자명" name="manager" required placeholder="홍길동" value={form.manager} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="연락처" name="phone" type="tel" required placeholder="010-0000-0000" value={form.phone} onChange={handleChange} />
        <Field label="취급 품목" name="category" placeholder="예) 작업복, 안전용품, 잡화 등" value={form.category} onChange={handleChange} />
      </div>
      <Field label="브랜드 소개 링크" name="link" type="url" placeholder="홈페이지, 인스타그램, 카탈로그 URL 등" value={form.link} onChange={handleChange} />
      <Field label="문의 내용" name="message" type="textarea" placeholder="입점을 원하는 이유, 제품 특장점, 희망 조건 등을 자유롭게 적어주세요." value={form.message} onChange={handleChange} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1A2B4A] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors disabled:opacity-50"
      >
        {submitting ? "접수 중..." : "입점 문의 접수하기 →"}
      </button>
      <p className="text-xs text-gray-400 text-center">영업일 기준 2일 이내 연락드립니다.</p>
    </form>
  );
}
