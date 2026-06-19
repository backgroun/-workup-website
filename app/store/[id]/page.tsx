import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";

type Props = { params: Promise<{ id: string }> };

type Store = {
  id: number;
  name: string;
  region: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  phone: string;
  description: string;
  image_urls: string[];
  brands: string[];
  parking: boolean;
  store_type: string;
  kakao_channel_url: string;
  store_url: string;
  store_jobs: Array<{
    id: number;
    title: string;
    employment_type: string;
    salary_info: string;
    deadline: string | null;
    is_active: boolean;
  }>;
};

async function getStore(id: string): Promise<Store | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*, store_jobs(id, title, employment_type, salary_info, deadline, is_active)")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data as Store;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = await getStore(id);
  if (!store) return { title: "매장 없음 — WORKUP" };
  return {
    title: `${store.name} — WORKUP`,
    description: store.description || `${store.name} | ${store.address} | ${store.hours}`,
    openGraph: {
      title: `${store.name} — WORKUP`,
      description: store.address,
      images: store.image_urls[0] ? [store.image_urls[0]] : undefined,
    },
  };
}

const ET_COLOR: Record<string, string> = {
  정규직: "bg-blue-100 text-blue-700",
  계약직: "bg-purple-100 text-purple-700",
  파트타임: "bg-amber-100 text-amber-700",
  아르바이트: "bg-orange-100 text-orange-700",
  인턴: "bg-pink-100 text-pink-700",
};

function fmtDate(s: string | null) {
  if (!s) return "상시 모집";
  return s.slice(0, 10).replace(/-/g, ". ");
}

function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return deadline < new Date().toISOString().slice(0, 10);
}

export default async function StoreDetailPage({ params }: Props) {
  const { id } = await params;
  const store = await getStore(id);
  if (!store) notFound();

  // 카카오는 좌표 순서가 (위도, 경도) — lat, lng
  const kakaoMapUrl = store.lat && store.lng
    ? `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`;

  // 네이버는 좌표 순서가 (경도, 위도) — lng, lat (카카오와 반대!)
  const naverMapUrl = store.lat && store.lng
    ? `https://map.naver.com/p/directions/-/${store.lng},${store.lat},${encodeURIComponent(store.name)}/-/car`
    : `https://map.naver.com/p/search/${encodeURIComponent(store.address)}`;

  const activeJobs = (store.store_jobs ?? []).filter(
    (j) => j.is_active && !isExpired(j.deadline)
  );

  return (
    <main className="min-h-screen bg-white">
      {/* 상단 내비게이션 */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/store" className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-900 truncate">오프라인 스토어</span>
          <div className="ml-auto">
            <button className="text-gray-400 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 매장명 + 기본 정보 */}
        <div className="px-5 py-6 border-b border-gray-100">
          <p className="text-xs font-semibold text-[#ff550c] mb-1">{store.store_type}</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{store.name}</h1>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-700">{store.address}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <a
                    href={kakaoMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#3A6DF0] hover:underline"
                  >
                    카카오지도
                  </a>
                  <span className="text-xs text-gray-300">·</span>
                  <a
                    href={naverMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#03C75A] hover:underline"
                  >
                    네이버지도
                  </a>
                </div>
              </div>
            </div>
            {store.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${store.phone}`} className="text-sm text-gray-700 hover:text-[#ff550c] transition-colors">{store.phone}</a>
              </div>
            )}
          </div>
        </div>

        {/* 취급 브랜드 */}
        {store.brands && store.brands.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">취급 브랜드</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {store.brands.map((b, i) => (
                <span key={i} className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* 스토어 바로가기 */}
        {store.store_url && (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">스토어 바로가기</span>
            </div>
            <a
              href={store.store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[#3A6DF0] hover:underline font-medium"
            >
              바로가기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}

        {/* 영업시간 */}
        {store.hours && (
          <div className="px-5 py-5 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 mb-2">영업시간</p>
            <p className="text-sm text-gray-700">{store.hours}</p>
            {store.parking && (
              <div className="mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-600 font-medium">주차 가능</span>
              </div>
            )}
          </div>
        )}

        {/* 매장 소개 */}
        {store.description && (
          <div className="px-5 py-5 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 mb-2">스토어 안내</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{store.description}</p>
          </div>
        )}

        {/* 매장 사진 */}
        {store.image_urls && store.image_urls.length > 0 && (
          <div className="border-b border-gray-100">
            <div className="grid grid-cols-1 gap-0.5">
              {store.image_urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`${store.name} 매장 사진`} className="w-full object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* 채용공고 */}
        {activeJobs.length > 0 && (
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">채용공고</p>
              <Link href="/careers" className="text-xs text-[#3A6DF0] hover:underline">전체 보기</Link>
            </div>
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ET_COLOR[job.employment_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {job.employment_type}
                      </span>
                      {job.salary_info && <span className="text-xs text-gray-500">{job.salary_info}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{fmtDate(job.deadline)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA 섹션 */}
        <div className="px-5 py-6 space-y-3">
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#1A2B4A] text-white font-bold text-base rounded-xl hover:bg-[#243a63] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            길찾기 (카카오맵)
          </a>
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-[#1A2B4A] text-[#1A2B4A] font-bold text-base rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              전화 문의 ({store.phone})
            </a>
          )}
          {store.kakao_channel_url && (
            <a
              href={store.kakao_channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#FEE500] text-[#3C1E1E] font-bold text-base rounded-xl hover:bg-[#f5dc00] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.603 1.543 4.9 3.9 6.32l-.975 3.573c-.087.318.268.572.55.39L9.662 18.5A11.01 11.01 0 0012 18.75c5.523 0 10-3.697 10-8.25S17.523 3 12 3z" />
              </svg>
              카카오톡 상담
            </a>
          )}
        </div>

        {/* 전국 매장 보기 링크 */}
        <div className="px-5 pb-8">
          <Link
            href="/store"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            전국 매장 찾기
          </Link>
        </div>
      </div>
    </main>
  );
}
