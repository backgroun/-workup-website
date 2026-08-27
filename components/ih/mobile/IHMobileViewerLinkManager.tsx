"use client";
import { useState } from "react";

/**
 * "모바일 뷰어" 로그인 없이 접근 링크 발급/재발급 — PC 관리자(로그인 필요) 전용 화면.
 * 토큰은 site_settings.ih_mobile_viewer에 저장되고, /ih-mobile/[token]이 그 값과 일치할 때만 데이터를 보여준다.
 */
function fmtIssuedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} 발급`;
}

export default function IHMobileViewerLinkManager({
  initialToken,
  initialIssuedAt,
  onIssued,
}: {
  initialToken: string | null;
  initialIssuedAt: string | null;
  /** 발급/재발급에 성공할 때마다 호출 — 이 컴포넌트를 여는 트리거(링크 텍스트 등)에도 최신 발급일자를 반영할 때 쓴다. */
  onIssued?: (info: { token: string; issuedAt: string }) => void;
}) {
  const [token, setToken] = useState(initialToken);
  const [issuedAt, setIssuedAt] = useState(initialIssuedAt);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const path = token ? `/ih-mobile/${token}` : null;
  const fullUrl = path && typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const issueToken = async () => {
    if (token && !window.confirm("재발급하면 기존에 공유했던 링크는 더 이상 열리지 않습니다. 계속할까요?")) return;
    setSaving(true);
    try {
      const next = crypto.randomUUID().replace(/-/g, "");
      const nextIssuedAt = new Date().toISOString();
      const res = await fetch("/api/admin/site-settings/ih_mobile_viewer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: next, issuedAt: nextIssuedAt }),
      });
      if (!res.ok) {
        alert("링크 발급에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setToken(next);
      setIssuedAt(nextIssuedAt);
      setCopied(false);
      onIssued?.({ token: next, issuedAt: nextIssuedAt });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("복사에 실패했습니다. 링크를 직접 선택해 복사해주세요.");
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 max-w-xl">
      <p className="text-[14px] font-bold text-slate-900 mb-1">공유 링크</p>
      <p className="text-[13px] text-slate-500 mb-4">
        이 링크를 아는 사람은 관리자 로그인 없이 모바일 뷰어(인플루언서·제품 협찬·지점 마케팅·브랜디드/PPL·대시보드)를 볼 수 있습니다.
        비용·연락처 등 민감한 정보가 포함되어 있으니, 사내 관리자에게만 공유해주세요.
      </p>

      {fullUrl ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            readOnly
            value={fullUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700"
          />
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 rounded-md border border-slate-200 hover:border-slate-400 text-slate-700 text-[13px] font-semibold px-3 py-2"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      ) : (
        <p className="mb-3 text-[13px] text-slate-400">아직 발급된 링크가 없습니다.</p>
      )}

      {fullUrl && issuedAt && <p className="mb-3 -mt-1.5 text-[12px] text-slate-400">{fmtIssuedAt(issuedAt)}</p>}

      <button
        type="button"
        onClick={issueToken}
        disabled={saving}
        className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-semibold px-4 py-2 disabled:opacity-50"
      >
        {saving ? "처리 중…" : token ? "링크 재발급" : "링크 발급"}
      </button>
    </div>
  );
}
