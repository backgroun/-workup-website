"use client";
import { useState, useEffect } from "react";
import {
  DEFAULT_PARTNERSHIP, INQUIRY_STATUS_LABEL,
  type PartnershipConfig, type PartnerInfo, type Inquiry, type InquiryStatus, type InquiryType,
} from "@/data/partnership";
import { DEFAULT_NOTIFICATIONS, normalizeNotifications, type NotificationConfig } from "@/lib/site-content";

const FIELD_LABELS: Record<string, string> = {
  name: "이름", phone: "연락처", region: "창업 희망 지역", message: "문의 내용",
  brand: "브랜드명", manager: "담당자명", category: "취급 품목", link: "브랜드 링크",
  subject: "문의 구분", privacyAgree: "개인정보 동의",
};

// 문의 유형 라벨/배지 (가맹·입점 + 고객 1:1)
const TYPE_LABEL: Record<string, string> = { franchise: "가맹·창업", wholesale: "입점·제휴", support: "고객 1:1" };
const TYPE_BADGE: Record<string, string> = { franchise: "bg-[#1A2B4A] text-white", wholesale: "bg-[#2d4f72] text-white", support: "bg-[#ff550c] text-white" };

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  done: "bg-gray-100 text-gray-500",
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return iso; }
}

export default function AdminInquiriesPage() {
  const [tab, setTab] = useState<"list" | "content" | "notify">("list");
  const [toast, setToast] = useState("");
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  // ── 알림 설정 (담당자 이메일 + 웹훅 테스트) ──
  const [notif, setNotif] = useState<NotificationConfig>(DEFAULT_NOTIFICATIONS);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings/notifications")
      .then(r => r.ok ? r.json() : null)
      .then(d => setNotif(normalizeNotifications(d)))
      .catch(() => setNotif(DEFAULT_NOTIFICATIONS))
      .finally(() => setLoadingNotif(false));
  }, []);

  const saveNotif = async () => {
    setSavingNotif(true);
    try {
      const r = await fetch("/api/admin/site-settings/notifications", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notif),
      });
      flash(r.ok ? "알림 설정을 저장했습니다." : "저장에 실패했습니다.");
    } finally { setSavingNotif(false); }
  };

  const testWebhook = async () => {
    setTesting(true); setTestResult("");
    try {
      const r = await fetch("/api/admin/inquiries/test-webhook", { method: "POST" });
      const d = await r.json();
      if (!d.configured) setTestResult("❌ 미설정: " + (d.error ?? ""));
      else if (d.ok) setTestResult(`✅ 전송 성공 (HTTP ${d.status})` + (d.notifyEmail ? ` · 이메일: ${d.notifyEmail}` : " · 이메일 발송 꺼짐") + " — 시트의 [테스트] 행" + (d.notifyEmail ? "과 담당자 메일" : "") + " 도착 여부를 확인하세요.");
      else setTestResult(`❌ 전송 실패 (HTTP ${d.status ?? "-"}) ${d.error ?? d.body ?? ""}`);
    } catch (e) {
      setTestResult("❌ 요청 실패: " + (e instanceof Error ? e.message : String(e)));
    } finally { setTesting(false); }
  };

  // ── 접수 내역 ──
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadInquiries = () => {
    setLoadingList(true);
    fetch("/api/admin/inquiries")
      .then(r => r.ok ? r.json() : [])
      .then((d: Inquiry[]) => setInquiries(Array.isArray(d) ? d : []))
      .catch(() => setInquiries([]))
      .finally(() => setLoadingList(false));
  };
  useEffect(() => { loadInquiries(); }, []);

  const changeStatus = async (id: string, status: InquiryStatus) => {
    const snapshot = inquiries;   // 실패 시 되돌릴 스냅샷
    setInquiries(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setInquiries(snapshot);
      flash("상태 변경에 실패했습니다.");
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("이 문의를 삭제할까요?")) return;
    const snapshot = inquiries;   // 실패 시 되돌릴 스냅샷
    setInquiries(prev => prev.filter(q => q.id !== id));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      flash("삭제됐습니다.");
    } catch {
      setInquiries(snapshot);
      flash("삭제에 실패했습니다.");
    }
  };

  const filtered = filter === "all" ? inquiries : inquiries.filter(q => (q.type as string) === filter);

  // ── 안내 문구 ──
  const [config, setConfig] = useState<PartnershipConfig>(DEFAULT_PARTNERSHIP);
  const [loadingContent, setLoadingContent] = useState(true);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings/partnership_page")
      .then(r => r.json())
      .then((d: Partial<PartnershipConfig> | null) => {
        setConfig({
          franchise: { ...DEFAULT_PARTNERSHIP.franchise, ...(d?.franchise ?? {}) },
          wholesale: { ...DEFAULT_PARTNERSHIP.wholesale, ...(d?.wholesale ?? {}) },
        });
      })
      .catch(() => setConfig(DEFAULT_PARTNERSHIP))
      .finally(() => setLoadingContent(false));
  }, []);

  const saveContent = async () => {
    setSavingContent(true);
    try {
      const r = await fetch("/api/admin/site-settings/partnership_page", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config),
      });
      flash(r.ok ? "저장됐습니다." : "저장에 실패했습니다.");
    } finally { setSavingContent(false); }
  };

  const setInfo = (key: InquiryType, patch: Partial<PartnerInfo>) =>
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">문의 관리</h1>
          <p className="mt-1 text-sm text-gray-500">가맹·창업 / 입점·제휴 / 고객 1:1 문의 접수 내역과 안내 문구를 관리합니다.</p>
        </div>
        {toast && <span className="text-sm font-medium text-green-600">{toast}</span>}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([["list", "접수 내역"], ["content", "안내 문구"], ["notify", "알림 설정"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-slate-800 text-slate-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}{t === "list" && inquiries.length > 0 ? ` (${inquiries.length})` : ""}
          </button>
        ))}
      </div>

      {/* ── 접수 내역 ── */}
      {tab === "list" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            {([["all", "전체"], ["franchise", "가맹·창업"], ["wholesale", "입점·제휴"], ["support", "고객 1:1"]] as const).map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                {label}
              </button>
            ))}
            <button onClick={loadInquiries} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">새로고침</button>
          </div>

          {loadingList ? (
            <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
              접수된 문의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${TYPE_BADGE[q.type] ?? "bg-gray-500 text-white"}`}>
                        {TYPE_LABEL[q.type] ?? q.type}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${STATUS_STYLE[q.status]}`}>{INQUIRY_STATUS_LABEL[q.status]}</span>
                      <span className="text-xs text-slate-400">{fmtDate(q.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={q.status} onChange={e => changeStatus(q.id, e.target.value as InquiryStatus)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none">
                        {(["new", "processing", "done"] as InquiryStatus[]).map(s => <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>)}
                      </select>
                      <button onClick={() => deleteInquiry(q.id)} className="text-[11px] text-red-400 border border-red-200 px-2 py-1 rounded hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {Object.entries(q.payload).filter(([, v]) => String(v).trim()).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-sm">
                        <span className="text-slate-400 w-24 shrink-0">{(q.type as string) === "support" && k === "subject" ? "문의 구분" : (FIELD_LABELS[k] ?? k)}</span>
                        <span className="text-slate-800 flex-1 break-words">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 안내 문구 ── */}
      {tab === "content" && (
        loadingContent ? (
          <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {(["franchise", "wholesale"] as InquiryType[]).map((key) => {
              const info = config[key];
              const title = key === "franchise" ? "가맹·창업 페이지" : "입점·제휴 페이지";
              return (
                <section key={key} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <h2 className="font-semibold text-gray-800">{title}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="상단 제목" value={info.hero_title} onChange={v => setInfo(key, { hero_title: v })} />
                    <Input label="폼 영역 제목" value={info.form_title} onChange={v => setInfo(key, { form_title: v })} />
                  </div>
                  <Textarea label="상단 설명" value={info.hero_desc} onChange={v => setInfo(key, { hero_desc: v })} />
                  <Input label="패널 제목" value={info.panel_title} onChange={v => setInfo(key, { panel_title: v })} />
                  <Textarea label="패널 설명" value={info.panel_desc} onChange={v => setInfo(key, { panel_desc: v })} />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-500">혜택 리스트</label>
                      <button type="button" onClick={() => setInfo(key, { benefits: [...info.benefits, ""] })} className="text-xs text-blue-600 hover:text-blue-800">+ 추가</button>
                    </div>
                    <div className="space-y-2">
                      {info.benefits.map((b, i) => (
                        <div key={i} className="flex gap-2">
                          <input type="text" value={b}
                            onChange={e => setInfo(key, { benefits: info.benefits.map((x, idx) => idx === i ? e.target.value : x) })}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                          <button type="button" onClick={() => setInfo(key, { benefits: info.benefits.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="직통 전화" value={info.phone} onChange={v => setInfo(key, { phone: v })} />
                    <Input label="운영 시간" value={info.hours} onChange={v => setInfo(key, { hours: v })} />
                  </div>
                </section>
              );
            })}
            <button onClick={saveContent} disabled={savingContent}
              className="w-full py-3 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {savingContent ? "저장 중..." : "안내 문구 저장"}
            </button>
          </div>
        )
      )}

      {/* ── 알림 설정 ── */}
      {tab === "notify" && (
        loadingNotif ? (
          <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">담당자 이메일 알림</h2>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={notif.email_enabled}
                  onChange={e => setNotif(n => ({ ...n, email_enabled: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">문의 접수 시 담당자 이메일로 발송</span>
              </label>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">담당자 이메일</label>
                <input type="email" value={notif.manager_email}
                  onChange={e => setNotif(n => ({ ...n, manager_email: e.target.value }))}
                  placeholder="manager@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                <p className="text-[11px] text-gray-400 mt-1">가맹·창업 / 입점·제휴 / 1:1 문의가 접수되면 이 주소로 메일이 발송됩니다.</p>
              </div>
              <button onClick={saveNotif} disabled={savingNotif}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {savingNotif ? "저장 중..." : "알림 설정 저장"}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">구글시트 · 이메일 연동 테스트</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                버튼을 누르면 실제 연동 경로(Apps Script 웹훅)로 <b>테스트 1건</b>을 즉시 전송합니다.
                구글시트에 <b>[테스트]</b> 행이 추가되고(설정 시) 담당자 메일이 도착하면 정상입니다.
              </p>
              <button onClick={testWebhook} disabled={testing}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50">
                {testing ? "전송 중..." : "테스트 전송"}
              </button>
              {testResult && (
                <p className={`text-sm mt-1 break-words ${testResult.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{testResult}</p>
              )}
              <div className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-3 mt-1 space-y-0.5">
                <p>· 시트 기록과 이메일 발송은 구글 Apps Script 웹앱 <b>하나</b>로 함께 처리됩니다(별도 메일 서비스 불필요).</p>
                <p>· 설정 방법: 저장소 <span className="font-mono">docs/google-sheet-setup.md</span> 참고 · Vercel 환경변수 <span className="font-mono">GOOGLE_SHEET_WEBHOOK_URL</span> 필요.</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
    </div>
  );
}
