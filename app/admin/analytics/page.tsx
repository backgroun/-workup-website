"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface Member {
  id: number;
  status: "active" | "dormant" | "withdrawn";
  created_at: string;
}

interface PixelSetting {
  platform: string;
  pixel_id: string;
  enabled: boolean;
}

const PLATFORM_INFO: Record<string, { name: string; color: string; desc: string }> = {
  gtm:    { name: "Google Tag Manager", color: "bg-blue-500",   desc: "모든 태그 통합 관리" },
  ga4:    { name: "Google Analytics 4", color: "bg-orange-500", desc: "웹 방문자 분석" },
  meta:   { name: "Meta Pixel",         color: "bg-[#1877F2]",  desc: "Instagram · Facebook 광고" },
  naver:  { name: "Naver 전환추적",      color: "bg-green-500",  desc: "네이버 검색광고" },
  kakao:  { name: "Kakao Pixel",        color: "bg-yellow-400", desc: "카카오 모먼트 광고" },
};

function getMonthLabel(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7);
}

export default function AnalyticsDashboardPage() {
  const [members, setMembers]   = useState<Member[]>([]);
  const [pixels, setPixels]     = useState<PixelSetting[]>([]);
  const [loadingM, setLoadingM] = useState(true);
  const [loadingP, setLoadingP] = useState(true);

  useEffect(() => {
    fetch("/api/admin/members")
      .then(r => r.json())
      .then(d => setMembers(Array.isArray(d) ? d : []))
      .finally(() => setLoadingM(false));

    fetch("/api/admin/analytics/pixels")
      .then(r => r.json())
      .then(d => setPixels(Array.isArray(d) ? d : []))
      .finally(() => setLoadingP(false));
  }, []);

  const memberStats = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => getMonthLabel(i)).reverse();
    const byMonth = months.map(m => ({
      month: m,
      count: members.filter(x => x.status !== "withdrawn" && x.created_at.slice(0, 7) === m).length,
    }));
    const max = Math.max(...byMonth.map(b => b.count), 1);
    return { byMonth, max,
      total:     members.filter(m => m.status !== "withdrawn").length,
      thisMonth: members.filter(m => m.status !== "withdrawn" && m.created_at.slice(0, 7) === now.toISOString().slice(0, 7)).length,
      active:    members.filter(m => m.status === "active").length,
    };
  }, [members]);

  const enabledPixels = pixels.filter(p => p.enabled && p.pixel_id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">마케팅/분석 대시보드</h1>
          <p className="text-base text-gray-400 mt-1">회원 추이, 픽셀 설정 현황, 광고 채널 관리</p>
        </div>
        <Link href="/admin/analytics/pixels"
          className="px-6 py-2.5 text-base bg-[#E5541B] text-white hover:bg-[#e04500] rounded font-bold">
          픽셀/광고 설정 →
        </Link>
      </div>

      {/* 픽셀 현황 요약 */}
      <div className={`p-5 rounded-xl border flex items-center gap-5 ${enabledPixels.length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <span className="text-2xl">{enabledPixels.length > 0 ? "✅" : "⚠"}</span>
        <div className="flex-1">
          <p className={`text-base font-bold ${enabledPixels.length > 0 ? "text-emerald-800" : "text-amber-800"}`}>
            {loadingP ? "픽셀 설정 확인 중..." :
             enabledPixels.length > 0
               ? `활성 픽셀 ${enabledPixels.length}개: ${enabledPixels.map(p => PLATFORM_INFO[p.platform]?.name ?? p.platform).join(", ")}`
               : "아직 활성화된 픽셀/태그가 없습니다. 광고를 집행하려면 픽셀 설정이 필요합니다."}
          </p>
          {enabledPixels.length === 0 && !loadingP && (
            <p className="text-[14px] text-amber-700 mt-0.5">GTM, GA4, Meta Pixel, 네이버, 카카오 픽셀을 설정하세요.</p>
          )}
        </div>
        <Link href="/admin/analytics/pixels"
          className={`px-4 py-2 text-[14px] font-bold border rounded ${enabledPixels.length > 0 ? "border-emerald-300 text-emerald-700 hover:bg-emerald-100" : "border-amber-300 text-amber-700 hover:bg-amber-100"}`}>
          픽셀 설정
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 회원 요약 카드 */}
        {[
          { label: "전체 회원",   value: memberStats.total,     color: "text-[#303236]" },
          { label: "이번달 신규", value: memberStats.thisMonth, color: "text-[#E5541B]" },
          { label: "활성 회원",   value: memberStats.active,    color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-[15px] text-gray-500 font-medium mb-2">{s.label}</p>
            <p className={`text-4xl font-black ${s.color}`}>{loadingM ? "-" : s.value.toLocaleString()}</p>
            <p className="text-[13px] text-gray-300 mt-1">명</p>
          </div>
        ))}
      </div>

      {/* 월별 신규 회원 차트 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">월별 신규 회원 추이</h2>
          <Link href="/admin/members" className="text-[14px] text-[#303236] hover:underline">회원 관리 →</Link>
        </div>
        {loadingM ? (
          <div className="h-40 flex items-center justify-center text-gray-400">불러오는 중...</div>
        ) : memberStats.byMonth.every(b => b.count === 0) ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-base">
            가입 회원이 없어 데이터가 없습니다.
          </div>
        ) : (
          <div className="flex items-end gap-4 h-44">
            {memberStats.byMonth.map(({ month, count }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[13px] font-bold text-[#303236]">{count > 0 ? count : ""}</span>
                <div className="w-full relative">
                  <div
                    className="w-full bg-[#303236] rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, (count / memberStats.max) * 120)}px` }}
                  />
                </div>
                <span className="text-[12px] text-gray-400">{month.slice(5)}월</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 광고 채널 현황 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">광고 채널 및 픽셀 현황</h2>
          <Link href="/admin/analytics/pixels"
            className="text-[14px] text-[#E5541B] hover:underline font-semibold">설정하기 →</Link>
        </div>
        <div className="p-6 grid grid-cols-5 gap-4">
          {Object.entries(PLATFORM_INFO).map(([key, info]) => {
            const pixel = pixels.find(p => p.platform === key);
            const isOn  = pixel?.enabled && pixel?.pixel_id;
            return (
              <Link key={key} href="/admin/analytics/pixels"
                className={`rounded-xl p-4 border-2 flex flex-col items-center gap-3 text-center transition-all hover:shadow-md ${isOn ? "border-emerald-300 bg-emerald-50" : "border-gray-100 bg-white"}`}>
                <div className={`w-12 h-12 rounded-xl ${info.color} flex items-center justify-center`}>
                  <span className="text-white text-lg font-black">{key.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800">{info.name}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{info.desc}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-[12px] font-bold rounded-full ${isOn ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                  {isOn ? "활성" : "미설정"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Google Analytics 연동 안내 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-black">GA</span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-orange-800 mb-1">Google Analytics 4 방문자 통계</p>
            <p className="text-[14px] text-orange-700 mb-3">
              실시간 방문자 수, 페이지별 조회수, 유입 경로, 기기/지역 분포를 확인하려면 GA4를 연동하세요.
              GA4 ID를 픽셀 설정에서 입력하면 자동으로 추적 코드가 사이트에 적용됩니다.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/analytics/pixels"
                className="px-4 py-2 bg-orange-500 text-white text-[14px] font-bold hover:bg-orange-600 rounded">
                GA4 설정하기
              </Link>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 border border-orange-300 text-orange-700 text-[14px] font-bold hover:bg-orange-100 rounded">
                GA4 대시보드 열기 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
