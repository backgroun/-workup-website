"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

type Job = {
  id: number;
  store_id: number;
  title: string;
  employment_type: string;
  salary_info: string;
  description: string;
  requirements: string;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  stores: { id: number; name: string; region: string; address: string; phone: string } | null;
};

const ET_COLOR: Record<string, string> = {
  정규직: "bg-blue-100 text-blue-700",
  계약직: "bg-purple-100 text-purple-700",
  파트타임: "bg-amber-100 text-amber-700",
  아르바이트: "bg-orange-100 text-orange-700",
  인턴: "bg-pink-100 text-pink-700",
};

function fmtDate(s: string | null) {
  if (!s) return "상시 모집";
  const [y, m, d] = s.slice(0, 10).split("-");
  return `${y}. ${m}. ${d}`;
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

export default function CareersClient({ jobs, regions }: { jobs: Job[]; regions: string[] }) {
  const [regionFilter, setRegionFilter] = useState("전체");
  const [etFilter, setEtFilter] = useState("전체");
  const [expanded, setExpanded] = useState<number | null>(null);

  const employmentTypes = useMemo(() => {
    const set = new Set(jobs.map((j) => j.employment_type));
    return ["전체", ...Array.from(set)];
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (regionFilter !== "전체" && j.stores?.region !== regionFilter) return false;
      if (etFilter !== "전체" && j.employment_type !== etFilter) return false;
      return true;
    });
  }, [jobs, regionFilter, etFilter]);

  return (
    <div>
      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
        >
          <option value="전체">지역 전체</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={etFilter}
          onChange={(e) => setEtFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
        >
          {employmentTypes.map((t) => <option key={t} value={t}>{t === "전체" ? "고용형태 전체" : t}</option>)}
        </select>
        <p className="text-sm text-gray-400 ml-auto">{filtered.length}개 공고</p>
      </div>

      {/* 공고 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center text-gray-400">
          조건에 맞는 공고가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const days = daysLeft(job.deadline);
            const isOpen = expanded === job.id;
            return (
              <div key={job.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpanded(isOpen ? null : job.id)}
                  className="w-full text-left px-6 py-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-gray-500">
                          {job.stores?.name ?? `지점 #${job.store_id}`}
                        </span>
                        {job.stores?.region && (
                          <span className="text-xs text-gray-400">· {job.stores.region}</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-base">{job.title}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${ET_COLOR[job.employment_type] ?? "bg-gray-100 text-gray-600"}`}>
                          {job.employment_type}
                        </span>
                        {job.salary_info && (
                          <span className="text-xs text-gray-500">{job.salary_info}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {days !== null && days <= 7 ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                          D-{days}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{fmtDate(job.deadline)}</span>
                      )}
                      <div className="mt-2 text-gray-400">
                        <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>

                {/* 상세 */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                    {job.description && (
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1.5">업무 내용</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
                      </div>
                    )}
                    {job.requirements && (
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1.5">지원 자격</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.requirements}</p>
                      </div>
                    )}
                    {job.stores && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-bold text-gray-900 mb-2">근무지 정보</p>
                        <p className="text-sm text-gray-700 mb-1">{job.stores.name}</p>
                        <p className="text-xs text-gray-500 mb-3">{job.stores.address}</p>
                        <div className="flex gap-2">
                          {job.stores.phone && (
                            <a
                              href={`tel:${job.stores.phone}`}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A2B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#243a63] transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              전화 문의
                            </a>
                          )}
                          <Link
                            href={`/store/${job.stores.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors"
                          >
                            매장 정보 보기
                          </Link>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">마감일: {fmtDate(job.deadline)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 CTA */}
      <div className="mt-10 bg-[#1A2B4A] rounded-2xl px-6 py-8 text-center">
        <p className="text-white font-bold text-lg mb-2">원하는 매장을 직접 찾아보세요</p>
        <p className="text-blue-300 text-sm mb-5">전국 매장 목록과 위치를 확인하고 방문 문의드리세요.</p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A2B4A] text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          전국 매장 찾기
        </Link>
      </div>
    </div>
  );
}
