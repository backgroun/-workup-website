"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";

interface Member {
  id: number;
  email: string;
  name: string;
  phone?: string;
  grade: string;
  status: "active" | "dormant" | "withdrawn";
  last_login_at?: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  dormant:   "bg-amber-100 text-amber-600",
  withdrawn: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = { active: "활성", dormant: "휴면", withdrawn: "탈퇴" };

function fmtDateTime(iso?: string) {
  if (!iso) return "없음";
  return iso.slice(0, 16).replace("T", " ");
}

function daysSince(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

export default function MemberAccessPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [msg, setMsg]         = useState("");

  const showMsg = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/members");
    const d = await r.json();
    // 최근 접속 순 정렬
    const list: Member[] = Array.isArray(d) ? d : [];
    list.sort((a, b) => {
      if (!a.last_login_at && !b.last_login_at) return 0;
      if (!a.last_login_at) return 1;
      if (!b.last_login_at) return -1;
      return b.last_login_at.localeCompare(a.last_login_at);
    });
    setMembers(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  // 접속 통계
  const accessStats = useMemo(() => {
    const now = new Date();
    const todayStr  = now.toISOString().slice(0, 10);
    const weekAgo   = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo  = new Date(now.getTime() - 30 * 86400000).toISOString();
    return {
      today:   members.filter(m => m.last_login_at?.slice(0, 10) === todayStr).length,
      week:    members.filter(m => m.last_login_at && m.last_login_at >= weekAgo).length,
      month:   members.filter(m => m.last_login_at && m.last_login_at >= monthAgo).length,
      never:   members.filter(m => !m.last_login_at).length,
    };
  }, [members]);

  const blockMember = async (m: Member) => {
    if (!confirm(`"${m.name}" 회원을 휴면 처리(접속 제한)하시겠습니까?`)) return;
    await fetch(`/api/admin/members/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, status: "dormant" }),
    });
    showMsg(`"${m.name}" 휴면 처리됐습니다.`);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/members" className="text-[15px] text-gray-400 hover:text-[#1A2B4A]">← 회원 현황</Link>
          <span className="text-gray-200">/</span>
          <h1 className="text-3xl font-bold text-gray-900">회원 접속 관리</h1>
        </div>
        <p className="text-base text-gray-400 mt-1">회원별 최근 접속 현황 (last_login_at 기준)</p>
      </div>

      {msg && <div className="px-5 py-3 bg-green-50 border border-green-200 text-green-700 text-base rounded-lg">{msg}</div>}

      {/* 접속 통계 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "오늘 접속",  value: accessStats.today, color: "text-emerald-600" },
          { label: "7일 이내",   value: accessStats.week,  color: "text-blue-600" },
          { label: "30일 이내",  value: accessStats.month, color: "text-[#1A2B4A]" },
          { label: "미접속",     value: accessStats.never, color: "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-[15px] text-gray-500 font-medium mb-2">{s.label}</p>
            <p className={`text-4xl font-black ${s.color}`}>{loading ? "-" : s.value.toLocaleString()}</p>
            <p className="text-[13px] text-gray-300 mt-1">명</p>
          </div>
        ))}
      </div>

      {/* 안내 */}
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex gap-4 items-start">
        <span className="text-2xl">📌</span>
        <div>
          <p className="text-base font-bold text-blue-800 mb-1">실시간 접속 로그 활성화 방법</p>
          <p className="text-[14px] text-blue-700">
            현재는 members 테이블의 <code className="bg-blue-100 px-1.5 py-0.5 rounded text-[13px]">last_login_at</code> 필드를 기준으로 표시됩니다.
            실시간 상세 접속 로그(IP, 기기 정보)가 필요하다면 Next.js 미들웨어에서 접속 이벤트를 기록하도록 설정할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 검색 + 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="이름 또는 이메일 검색..."
            className="flex-1 border border-gray-200 px-4 py-2.5 text-[15px] rounded focus:outline-none focus:border-[#1A2B4A]" />
          <span className="text-[14px] text-gray-400">{filtered.length}명 표시</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["이름", "이메일", "등급", "계정 상태", "마지막 접속", "경과", "가입일", "관리"].map(h => (
                  <th key={h} className={`px-5 py-4 text-[13px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "관리" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center text-[15px] text-gray-400">불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-[15px] text-gray-400">회원이 없습니다.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-[15px] font-bold text-gray-900">{m.name}</td>
                  <td className="px-5 py-4 text-[15px] text-gray-600">{m.email}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 text-[12px] font-bold rounded-full bg-gray-100 text-gray-600">{m.grade}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-[12px] font-bold rounded-full ${STATUS_COLOR[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] text-gray-500 whitespace-nowrap">{fmtDateTime(m.last_login_at)}</td>
                  <td className="px-5 py-4 text-[14px] text-gray-400">{daysSince(m.last_login_at) ?? "미접속"}</td>
                  <td className="px-5 py-4 text-[13px] text-gray-400">{m.created_at.slice(0, 10)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {m.status === "active" && (
                        <button onClick={() => blockMember(m)}
                          className="text-[14px] font-semibold text-amber-600 border border-amber-200 px-3.5 py-1.5 hover:bg-amber-50 rounded whitespace-nowrap">
                          접속 제한
                        </button>
                      )}
                      {m.status === "dormant" && (
                        <button onClick={async () => {
                          await fetch(`/api/admin/members/${m.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...m, status: "active" }),
                          });
                          showMsg(`"${m.name}" 복원됐습니다.`); load();
                        }} className="text-[14px] font-semibold text-emerald-600 border border-emerald-200 px-3.5 py-1.5 hover:bg-emerald-50 rounded whitespace-nowrap">
                          복원
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
