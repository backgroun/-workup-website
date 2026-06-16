"use client";
import { useState, useRef } from "react";

// 이미지 업로드(Cloudinary) + AI 이미지 프롬프트 생성(템플릿, 무료)을 합친 관리용 필드.
// promptType: "person"(인물 사진) | "product"(제품/테스트 사진)

function buildImagePrompt(type: "person" | "product", seed: string): string {
  const s = seed.trim();
  if (type === "person") {
    return [
      `A professional documentary-style portrait photograph of a Korean worker${s ? ` — ${s}` : ""}.`,
      `Authentic working environment, candid and confident expression, natural realistic lighting,`,
      `editorial photography style, shallow depth of field, high resolution.`,
      `Leave clean space around the subject for layout.`,
    ].join(" ");
  }
  return [
    `A professional product test photograph for a Korean workwear brand${s ? ` — ${s}` : ""}.`,
    `Showing the product in a real field-test or studio setting, detail-focused, realistic lighting,`,
    `clean commercial composition, high resolution.`,
  ].join(" ");
}

export default function AdminImageField({
  value, onChange, promptType, promptSeed, label = "이미지",
}: {
  value?: string;
  onChange: (url: string) => void;
  promptType: "person" | "product";
  promptSeed: string;
  label?: string;
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
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
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
            <div className="flex items-center justify-center h-full text-xs text-gray-400 text-center px-2">
              {uploading ? "업로드 중..." : "클릭하여 업로드"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-red-400 hover:text-red-600">이미지 제거</button>
          )}
          <button type="button" onClick={() => setPrompt(buildImagePrompt(promptType, promptSeed))}
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
      <p className="text-[10px] text-gray-400 mt-1.5">프롬프트를 복사해 ChatGPT·이미지 생성 도구로 사진을 만든 뒤 업로드하세요.</p>
    </div>
  );
}
