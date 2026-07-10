"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_PARTNERSHIP, type FormConfig } from "@/data/partnership";
import type { FranchiseGuideConfig } from "@/data/franchise-guide";
import FranchiseGuide from "./FranchiseGuide";

type FormState = Record<string, string>;

function SuccessMessage({ title, desc, passwordHint, onReset }: { title: string; desc: string; passwordHint?: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 bg-[#ff550c] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-bold text-[#1A2B4A] mb-2">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>
      <div className="text-xs text-gray-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 leading-relaxed mb-6 max-w-xs text-left space-y-2.5">
        <p className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center mt-px">
            <svg className="w-3 h-3 text-[#1A2B4A]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </span>
          <span>오른쪽 <b>‘문의 현황’</b> 목록의 <b className="text-[#1A2B4A]">새로고침</b> 버튼을 누르면 방금 작성한 글이 나타납니다.</span>
        </p>
        {passwordHint && (
          <p className="flex items-start gap-2 border-t border-slate-200 pt-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff1e8] flex items-center justify-center mt-px">
              <svg className="w-3 h-3 text-[#ff550c]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <span>설정하신 <b className="text-[#ff550c]">비밀번호를 기억해 주세요.</b> 목록에서 내 글(🔒)을 눌러 내용·답변을 확인할 수 있어요.</span>
          </p>
        )}
      </div>
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
  label, name, type = "text", required, placeholder, value, onChange, labelStyle, inputStyle,
}: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  labelStyle: CSSProperties; inputStyle: CSSProperties;
}) {
  const cls = "w-full border border-gray-200 px-4 py-2.5 placeholder-gray-300 focus:outline-none focus:border-[#1A2B4A] transition-colors bg-white";
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="block mb-1.5" style={labelStyle}>
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
          style={inputStyle}
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
          style={inputStyle}
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
          <p>워크업은 문의 접수 및 상담을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>

          <table className="w-full border-t border-gray-200 text-left">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <th className="py-2.5 pr-3 align-top font-medium text-[#1A2B4A] whitespace-nowrap w-24">수집 항목</th>
                <td className="py-2.5 text-gray-600">이름, 연락처</td>
              </tr>
              <tr>
                <th className="py-2.5 pr-3 align-top font-medium text-[#1A2B4A] whitespace-nowrap">수집·이용 목적</th>
                <td className="py-2.5 text-gray-600">문의 접수 및 상담 안내</td>
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
  checked, onChange, text, note,
}: { checked: boolean; onChange: (v: boolean) => void; text: string; note: string }) {
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
          <span className="text-[#ff550c] font-medium">[필수]</span> {text}{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="underline text-[#1A2B4A] hover:text-[#ff550c] transition-colors"
          >
            내용 보기
          </button>
          {note && <span className="block text-gray-400 mt-0.5">{note}</span>}
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

// ── 문의 폼 (공통) — 필드를 config에서 동적으로 렌더 ─────────────
// franchise/wholesale 모두 이 컴포넌트를 사용한다. 차이는 개인정보 동의 유무뿐.
function InquiryForm({ type, config, consent, franchiseGuide }: {
  type: "franchise" | "wholesale"; config: FormConfig; consent: boolean;
  franchiseGuide?: { config?: FranchiseGuideConfig; storeCount?: number };
}) {
  const emptyState = () => Object.fromEntries(config.fields.map((fld) => [fld.key, ""])) as FormState;
  const [form, setForm] = useState<FormState>(emptyState);
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSeen, setGuideSeen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setGuideOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [guideOpen]);

  const labelStyle: CSSProperties = { fontSize: config.label_style.size, color: config.label_style.color };
  const inputStyle: CSSProperties = { fontSize: config.input_size, color: config.input_color };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // 가맹 문의는 접수 전 창업안내를 먼저 한 번 보여준다 — 폼 유효성 검사(required)나 동의 체크로
  // 제출 이벤트 자체가 막히지 않도록, 버튼 클릭 시점에 폼 검증 전에 가로챈다.
  const handleGuideIntercept = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!franchiseGuide || guideSeen) return;
    e.preventDefault();
    setGuideSeen(true);
    setGuideOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (franchiseGuide && !guideSeen) { setGuideSeen(true); setGuideOpen(true); return; }
    if (consent && !agreed) { setError("개인정보 수집·이용에 동의해주세요."); return; }
    setSubmitting(true); setError("");
    try {
      // 동의 시 payload에 기록 — 접수 시각(created_at)이 곧 동의 시각.
      const payload: FormState = { ...form };
      if (consent) payload.privacyAgree = "동의";
      if (password.trim()) payload.password = password; // 서버에서 해시로 저장(평문 미보관)
      await submitInquiry(type, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessMessage
        title={config.success_title}
        desc={config.success_desc}
        passwordHint={!!password.trim()}
        onReset={() => { setForm(emptyState()); setAgreed(false); setPassword(""); setSubmitted(false); }}
      />
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {config.fields.map((fld) => (
          <div key={fld.key} className={fld.full || fld.type === "textarea" ? "col-span-2" : "col-span-1"}>
            <Field
              label={fld.label}
              name={fld.key}
              type={fld.type}
              required={fld.required}
              placeholder={fld.placeholder}
              value={form[fld.key] ?? ""}
              onChange={handleChange}
              labelStyle={labelStyle}
              inputStyle={inputStyle}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block mb-1.5" style={labelStyle}>
          비밀번호 <span className="text-gray-400">(문의글 확인용)</span>
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="설정하면 오른쪽 목록에서 비밀번호로 내 글을 확인할 수 있어요"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={inputStyle}
          className="pw-mask w-full border border-gray-200 px-4 py-2.5 placeholder-gray-300 focus:outline-none focus:border-[#1A2B4A] transition-colors bg-white"
        />
      </div>
      {consent && <PrivacyConsent checked={agreed} onChange={setAgreed} text={config.consent_text} note={config.consent_note} />}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type={franchiseGuide && !guideSeen ? "button" : "submit"}
        onClick={handleGuideIntercept}
        disabled={submitting || ((!franchiseGuide || guideSeen) && consent && !agreed)}
        style={{ backgroundColor: config.button_bg, color: config.button_color }}
        className="w-full text-xs font-semibold tracking-widest py-3 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "접수 중..." : config.submit_text}
      </button>
      <p className="text-center" style={{ fontSize: config.footer_style.size, color: config.footer_style.color }}>{config.footer_text}</p>
    </form>

    {franchiseGuide && guideOpen && mounted && createPortal(
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-sm"
        onClick={() => setGuideOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="워크업 창업안내"
      >
        <div
          className="relative w-full sm:w-[min(960px,calc(100vw-48px))] max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden rounded-t-[20px] sm:rounded-[22px] border border-white/10 shadow-2xl bg-[#0d0d0d]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <FranchiseGuide embedded config={franchiseGuide.config} storeCount={franchiseGuide.storeCount} onClose={() => setGuideOpen(false)} />
          </div>
          <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#0d0d0d]/95 backdrop-blur">
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="flex items-center justify-center w-full min-h-[48px] rounded-xl bg-[#ff4d00] text-white text-sm font-extrabold"
            >
              확인했어요, 문의 이어서 작성하기
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

// ── 가맹 창업 문의 폼 (개인정보 동의 포함) ─────────────
// guideConfig/storeCount를 넘기면 접수 버튼 첫 클릭 시 창업안내 팝업을 먼저 보여준 뒤 실제 접수를 진행한다.
export function FranchiseForm({ config = DEFAULT_PARTNERSHIP.franchise.form, guideConfig, storeCount }: {
  config?: FormConfig; guideConfig?: FranchiseGuideConfig; storeCount?: number;
}) {
  return <InquiryForm type="franchise" config={config} consent franchiseGuide={{ config: guideConfig, storeCount }} />;
}

// ── 입점 문의 폼 (개인정보 동의 포함) ──────────────────
export function WholesaleForm({ config = DEFAULT_PARTNERSHIP.wholesale.form }: { config?: FormConfig }) {
  return <InquiryForm type="wholesale" config={config} consent />;
}
