"use client";
import { useEffect, useState } from "react";

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

// ── 개인정보 수집·이용 동의 안내 모달 ──
function ConsentModal({ onClose }: { onClose: () => void }) {
  // ESC 닫기 + 모달 동안 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      <div
        className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 id="consent-modal-title" className="text-sm font-bold text-[#1A2B4A]">개인정보 수집·이용 동의</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 -mr-2 flex items-center justify-center text-gray-400 hover:text-[#1A2B4A] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 py-5 text-xs text-gray-600 leading-relaxed space-y-4">
          <p>워크업은 가맹·창업 문의 접수 및 상담을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>

          <table className="w-full border-t border-gray-200 text-left">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <th className="py-2.5 pr-3 align-top font-medium text-[#1A2B4A] whitespace-nowrap w-24">수집 항목</th>
                <td className="py-2.5 text-gray-600">이름, 연락처</td>
              </tr>
              <tr>
                <th className="py-2.5 pr-3 align-top font-medium text-[#1A2B4A] whitespace-nowrap">수집·이용 목적</th>
                <td className="py-2.5 text-gray-600">가맹·창업 문의 접수 및 상담 안내</td>
              </tr>
              <tr>
                <th className="py-2.5 pr-3 align-top font-medium text-[#1A2B4A] whitespace-nowrap">보유·이용 기간</th>
                <td className="py-2.5 text-gray-600">문의 처리 완료 후 지체 없이 파기 (관계 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)</td>
              </tr>
            </tbody>
          </table>

          <p className="text-gray-500">
            귀하는 개인정보 수집·이용에 동의하지 않으실 수 있으며, 동의하지 않으실 경우 문의 접수가 제한됩니다.
          </p>

          <p className="text-gray-400">
            자세한 내용은{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-[#1A2B4A] hover:text-[#ff550c]">
              개인정보처리방침
            </a>
            에서 확인하실 수 있습니다.
          </p>
        </div>

        {/* 푸터 */}
        <div className="px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A2B4A] text-white text-xs font-semibold tracking-widest py-2.5 hover:bg-[#ff550c] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 개인정보 수집·이용 동의 (로그인 없이 접수하므로 필수) ──
function PrivacyConsent({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
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
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="underline text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
          >
            내용 보기
          </button>
          <span className="block text-gray-400 mt-0.5">
            이름·연락처는 문의 접수 및 상담 안내 목적으로만 사용됩니다.
          </span>
        </span>
      </label>

      {open && <ConsentModal onClose={() => setOpen(false)} />}
    </>
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
