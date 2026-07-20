"use client";
import { useState, useRef } from "react";

// 영상 업로드(R2 스토리지) + URL 직접 입력을 합친 관리용 필드.
// aspectClass: 실제 페이지에 노출되는 비율 그대로 미리보기 (예: "aspect-[3/4]")

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export default function AdminVideoField({
  value,
  onChange,
  label = "영상",
  hint,
  aspectClass = "aspect-[3/4]",
  folder = "workup/videos",
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspectClass?: string;
  folder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setError("");
    if (file.size > MAX_BYTES) {
      setError("영상이 너무 큽니다 (10MB 이하)");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        onChange(url);
      } else {
        const e = await res.json().catch(() => ({}));
        setError("영상 업로드 실패: " + (e.error ?? res.status));
      }
    } catch {
      setError("업로드 실패 (네트워크를 확인해 주세요)");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />

      <div className="flex items-start gap-3">
        {/* 실제 노출 비율 그대로 미리보기 — 클릭하면 업로드/교체 */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative w-24 ${aspectClass} rounded-lg overflow-hidden border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer flex-shrink-0 bg-black`}
        >
          {value ? (
            <video src={value} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-50 px-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-gray-400 text-center leading-tight">
                {uploading ? "업로드 중..." : "영상 업로드"}
              </span>
            </div>
          )}
          {uploading && value && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[11px] text-white">업로드 중...</div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? "업로드 중..." : value ? "영상 교체" : "영상 파일 선택"}
          </button>

          <input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="또는 영상 URL 직접 입력 (https://...)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />

          {error && <p className="text-[11px] text-red-500">{error}</p>}
          {hint && !error && <p className="text-[10px] text-gray-400 leading-relaxed">{hint}</p>}

          {value && !uploading && (
            <button type="button" onClick={() => onChange("")} className="text-[11px] text-red-400 hover:text-red-600">
              영상 제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
