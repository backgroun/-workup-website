"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type StoreFormData = {
  name: string;
  region: string;
  address: string;
  lat: string;
  lng: string;
  hours: string;
  phone: string;
  store_type: string;
  description: string;
  brands: string;
  parking: boolean;
  kakao_channel_url: string;
  store_url: string;
  is_active: boolean;
  sort_order: string;
  image_urls: string[];
};

const EMPTY: StoreFormData = {
  name: "", region: "", address: "", lat: "", lng: "",
  hours: "", phone: "", store_type: "직영점", description: "",
  brands: "", parking: false, kakao_channel_url: "", store_url: "",
  is_active: true, sort_order: "0", image_urls: [],
};

const STORE_TYPES = ["직영점", "대리점", "아울렛", "복합쇼핑몰", "기타"];

export default function StoreForm({
  storeId,
  initialData,
}: {
  storeId?: number;
  initialData?: Partial<StoreFormData & { image_urls: string[]; brands: string[] | string }>;
}) {
  const router = useRouter();
  const isEdit = !!storeId;

  const normalize = (d: typeof initialData): StoreFormData => ({
    name: d?.name ?? "",
    region: d?.region ?? "",
    address: d?.address ?? "",
    lat: d?.lat ?? "",
    lng: d?.lng ?? "",
    hours: d?.hours ?? "",
    phone: d?.phone ?? "",
    store_type: d?.store_type ?? "직영점",
    description: d?.description ?? "",
    brands: Array.isArray(d?.brands) ? d.brands.join(";") : (d?.brands ?? ""),
    parking: d?.parking ?? false,
    kakao_channel_url: d?.kakao_channel_url ?? "",
    store_url: d?.store_url ?? "",
    is_active: d?.is_active ?? true,
    sort_order: String(d?.sort_order ?? "0"),
    image_urls: Array.isArray(d?.image_urls) ? d.image_urls : [],
  });

  const [form, setForm] = useState<StoreFormData>(() => normalize(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof StoreFormData, v: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, url] }));
      } else {
        alert("이미지 업로드 실패");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) =>
    setForm((prev) => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("매장명을 입력하세요.");
    if (!form.address.trim()) return setError("주소를 입력하세요.");
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      sort_order: Number(form.sort_order) || 0,
      brands: form.brands.split(";").map((b) => b.trim()).filter(Boolean),
    };
    const url = isEdit ? `/api/admin/stores/${storeId}` : "/api/admin/stores";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/admin/stores");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "저장 실패");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="px-5 py-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">기본 정보</h2>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              매장명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="워크업 포천직영점"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">지역</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => set("region", e.target.value)}
              placeholder="경기 / 서울 / 부산 등"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">매장 유형</label>
            <select
              value={form.store_type}
              onChange={(e) => set("store_type", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            >
              {STORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="경기도 포천시 호국로 90 워크업 포천 본점"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">위도 (lat)</label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => set("lat", e.target.value)}
              placeholder="37.7834706370167"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">경도 (lng)</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => set("lng", e.target.value)}
              placeholder="127.121414777823"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="031-000-0000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">영업시간</label>
            <input
              type="text"
              value={form.hours}
              onChange={(e) => set("hours", e.target.value)}
              placeholder="10:00 - 20:00 (매일)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">매장 소개</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="매장 소개 및 특징을 입력하세요."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A] resize-none"
          />
        </div>
      </section>

      {/* 추가 정보 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">추가 정보</h2>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              취급 브랜드 <span className="text-xs font-normal text-gray-400">(세미콜론으로 구분: 나이키;아디다스;워크업)</span>
            </label>
            <input
              type="text"
              value={form.brands}
              onChange={(e) => set("brands", e.target.value)}
              placeholder="WORKUP;나이키;아디다스"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">카카오 채널 URL</label>
            <input
              type="url"
              value={form.kakao_channel_url}
              onChange={(e) => set("kakao_channel_url", e.target.value)}
              placeholder="https://pf.kakao.com/..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">스토어 URL</label>
            <input
              type="url"
              value={form.store_url}
              onChange={(e) => set("store_url", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">정렬 순서</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A2B4A]"
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.parking}
                onChange={(e) => set("parking", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#1A2B4A]"
              />
              <span className="text-sm font-medium text-gray-700">주차 가능</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#1A2B4A]"
              />
              <span className="text-sm font-medium text-gray-700">활성 (공개)</span>
            </label>
          </div>
        </div>
      </section>

      {/* 매장 이미지 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">매장 사진</h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
        />
        <div className="flex flex-wrap gap-3">
          {form.image_urls.map((url, i) => (
            <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#1A2B4A] hover:text-[#1A2B4A] transition-colors"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1A2B4A] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">이미지 추가</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 저장 */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-[#ff550c] text-white text-base font-semibold hover:bg-[#e04500] transition-colors disabled:opacity-50 rounded"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              저장 중...
            </span>
          ) : isEdit ? "수정 완료" : "매장 등록"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stores")}
          className="px-6 py-3 border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors rounded"
        >
          취소
        </button>
      </div>
    </form>
  );
}
