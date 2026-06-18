"use client";
import { useState, useRef } from "react";

// 이미지 업로드(Cloudinary) + AI 이미지 프롬프트 생성(템플릿, 무료)을 합친 관리용 필드.
// promptType: "person"(인물 사진) | "product"(제품/테스트 사진)

function buildImagePrompt(type: "person" | "product", seed: string, size?: string): string {
  const s = seed.trim();
  const sizeNote = size ? ` Exact canvas size: ${size} px — crop/compose accordingly.` : "";
  if (type === "person") {
    return [
      `A professional documentary-style portrait photograph of a Korean worker${s ? ` — ${s}` : ""}.`,
      `Authentic working environment, candid and confident expression, natural realistic lighting,`,
      `editorial photography style, shallow depth of field, high resolution.${sizeNote}`,
      `Leave clean space around the subject for layout.`,
    ].join(" ");
  }
  return [
    `A professional product test photograph for a Korean workwear brand${s ? ` — ${s}` : ""}.`,
    `Showing the product in a real field-test or studio setting, detail-focused, realistic lighting,`,
    `clean commercial composition, high resolution.${sizeNote}`,
  ].join(" ");
}

export default function AdminImageField({
  value, onChange, promptType, promptSeed, label = "이미지", recommendedSize,
}: {
  value?: string;
  onChange: (url: string) => void;
  promptType: "person" | "product";
  promptSeed: string;
  label?: string;
  recommendedSize?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (res.ok) { const { url } = await res.json(); onChange(url); }
      else { const e = await res.json().catch(() => ({})); alert("이미지 업로드 실패: " + (e.error ?? res.status)); }
    } finally { setUploading(false); }
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />

      <div className="flex items-start gap-3">
        {/* 업로드 박스 */}
        <div onClick={() => fileRef.current?.click()}
          className="relative w-32 h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer overflow-hidden bg-gray-50 flex-shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 px-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[11px] text-gray-400 text-center leading-tight">
                {uploading ? "업로드 중..." : "클릭하여 업로드"}
              </span>
              {recommendedSize && !uploading && (
                <span className="text-[10px] text-gray-300 font-mono leading-tight text-center">{recommendedSize}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-red-400 hover:text-red-600">이미지 제거</button>
          )}
          <button type="button" onClick={() => setPrompt(buildImagePrompt(promptType, promptSeed, recommendedSize))}
            className="block text-xs px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium transition-colors">
            ✨ AI 이미지 프롬프트 생성
          </button>
          {prompt && (
            <div className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 leading-relaxed pr-12">{prompt}</p>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 업로드 버튼 + 사이즈 안내 */}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "업로드 중..." : "파일 업로드"}
        </button>
        {recommendedSize && (
          <span className="text-[11px] text-gray-400">
            권장 사이즈: <span className="font-mono font-semibold text-gray-500">{recommendedSize}</span>
          </span>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">프롬프트를 복사해 ChatGPT·이미지 생성 도구로 사진을 만든 뒤 업로드하세요.</p>
    </div>
  );
}
