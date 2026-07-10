"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type StoreOption = { id: number; name: string; region: string };

type JobRow = {
  id: number;
  store_id: number;
  title: string;
  employment_type: string;
  salary_info: string;
  requirements: string;
  description: string;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  stores?: { id: number; name: string; region: string };
};

const EMPLOYMENT_TYPES = ["정규직", "계약직", "파트타임", "아르바이트", "인턴"];
const ET_COLOR: Record<string, string> = {
  정규직: "bg-blue-100 text-blue-700",
  계약직: "bg-purple-100 text-purple-700",
  파트타임: "bg-amber-100 text-amber-700",
  아르바이트: "bg-orange-100 text-orange-700",
  인턴: "bg-pink-100 text-pink-700",
};

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return deadline < new Date().toISOString().slice(0, 10);
}

function fmtDate(s: string | null) {
  if (!s) return "상시 모집";
  return s.slice(0, 10).replace(/-/g, ".");
}

const EMPTY_JOB = {
  store_id: 0,
  title: "",
  employment_type: "정규직",
  salary_info: "",
  requirements: "",
  description: "",
  deadline: "",
  is_active: true,
};

type JobDraft = typeof EMPTY_JOB;

export default function AdminStoreJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState("전체");
  const [activeFilter, setActiveFilter] = useState<"전체" | "활성" | "비활성">("전체");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobRow | null>(null);
  const [draft, setDraft] = useState<JobDraft>(EMPTY_JOB);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [jobsRes, storesRes] = await Promise.all([
      fetch("/api/admin/stores/jobs"),
      fetch("/api/admin/stores"),
    ]);
    if (jobsRes.ok) setJobs(await jobsRes.json());
    if (storesRes.ok) setStores(await storesRes.json());
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (storeFilter !== "전체" && String(j.store_id) !== storeFilter) return false;
      if (activeFilter === "활성" && !j.is_active) return false;
      if (activeFilter === "비활성" && j.is_active) return false;
      return true;
    });
  }, [jobs, storeFilter, activeFilter]);

  const openNew = () => {
    setEditingJob(null);
    setDraft({ ...EMPTY_JOB, store_id: stores[0]?.id ?? 0 });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (job: JobRow) => {
    setEditingJob(job);
    setDraft({
      store_id: job.store_id,
      title: job.title,
      employment_type: job.employment_type,
      salary_info: job.salary_info,
      requirements: job.requirements,
      description: job.description,
      deadline: job.deadline ?? "",
      is_active: job.is_active,
    });
    setFormError("");
    setShowForm(true);
  };

  const set = (k: keyof JobDraft, v: string | number | boolean) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!draft.store_id) return setFormError("지점을 선택하세요.");
    if (!draft.title.trim()) return setFormError("제목을 입력하세요.");
    setSaving(true);
    setFormError("");
    const payload = { ...draft, deadline: draft.deadline || null };
    const url = editingJob ? `/api/admin/stores/jobs/${editingJob.id}` : "/api/admin/stores/jobs";
    const method = editingJob ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const saved = await res.json();
      if (editingJob) {
        setJobs((prev) => prev.map((j) => (j.id === saved.id ? saved : j)));
      } else {
        setJobs((prev) => [saved, ...prev]);
      }
      setShowForm(false);
    } else {
      const d = await res.json();
      setFormError(d.error ?? "저장 실패");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 채용공고를 삭제할까요?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/stores/jobs/${id}`, { method: "DELETE" });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeleting(null);
  };

  const toggleActive = async (job: JobRow) => {
    const res = await fetch(`/api/admin/stores/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...job, is_active: !job.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">채용공고 관리</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">채용공고 관리</h1>
          <p className="text-base text-gray-400 mt-1">전 지점 채용공고를 등록하고 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/careers"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 transition-colors rounded"
          >
            공개 채용 페이지 ↗
          </Link>
          <button
            onClick={openNew}
            disabled={stores.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#303236] text-white text-sm font-semibold hover:bg-[#243a63] transition-colors rounded disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            채용공고 등록
          </button>
        </div>
      </div>

      {stores.length === 0 && !loading && (
        <div className="mb-6 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          먼저 <Link href="/admin/stores" className="font-semibold underline">스토어 관리</Link>에서 매장을 등록한 후 채용공고를 작성할 수 있습니다.
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6 flex flex-wrap gap-4 items-center">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
        >
          <option value="전체">지점 전체</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {(["전체", "활성", "비활성"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setActiveFilter(opt)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === opt ? "bg-[#303236] text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400 ml-auto">{filtered.length}개 공고</p>
      </div>

      {/* 공고 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#303236] rounded-full animate-spin" />
              불러오는 중...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400">
            {jobs.length === 0 ? "등록된 채용공고가 없습니다." : "조건에 맞는 공고가 없습니다."}
          </div>
        ) : (
          filtered.map((job) => {
            const expired = isExpired(job.deadline);
            return (
              <div
                key={job.id}
                className={`bg-white border rounded-xl px-6 py-5 flex items-center gap-5 ${expired ? "border-gray-100 opacity-60" : "border-gray-200"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500">
                      {job.stores?.name ?? `지점 #${job.store_id}`}
                    </span>
                    {job.stores?.region && (
                      <span className="text-xs text-gray-400">· {job.stores.region}</span>
                    )}
                    {expired && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-400 rounded-full">마감</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${ET_COLOR[job.employment_type] ?? "bg-gray-100 text-gray-600"}`}>
                      {job.employment_type}
                    </span>
                    {job.salary_info && (
                      <span className="text-xs text-gray-500">{job.salary_info}</span>
                    )}
                    <span className="text-xs text-gray-400">마감: {fmtDate(job.deadline)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(job)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${job.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {job.is_active ? "활성" : "비활성"}
                  </button>
                  <button
                    onClick={() => openEdit(job)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#303236] border border-[#303236] rounded hover:bg-[#303236] hover:text-white transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deleting === job.id}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingJob ? "채용공고 수정" : "채용공고 등록"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {formError && (
                <p className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{formError}</p>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">지점 <span className="text-red-500">*</span></label>
                <select
                  value={draft.store_id}
                  onChange={(e) => set("store_id", Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
                >
                  <option value={0}>지점 선택</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">공고 제목 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="매장 파트타임 직원 모집"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">고용형태</label>
                  <select
                    value={draft.employment_type}
                    onChange={(e) => set("employment_type", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
                  >
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">마감일</label>
                  <input
                    type="date"
                    value={draft.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">급여 정보</label>
                <input
                  type="text"
                  value={draft.salary_info}
                  onChange={(e) => set("salary_info", e.target.value)}
                  placeholder="시급 12,000원 / 월급 협의"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">공고 내용</label>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="업무 내용, 근무 환경 등을 입력하세요."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">지원 자격</label>
                <textarea
                  rows={3}
                  value={draft.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  placeholder="우대사항, 경력, 자격요건 등을 입력하세요."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#303236] resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#303236]"
                />
                <span className="text-sm font-medium text-gray-700">공개 게시 (체크 해제 시 비공개)</span>
              </label>
            </div>
            <div className="px-6 py-5 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#ff550c] text-white font-semibold text-sm hover:bg-[#e04500] transition-colors disabled:opacity-50 rounded-lg"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    저장 중...
                  </span>
                ) : editingJob ? "수정 완료" : "공고 등록"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors rounded-lg"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
