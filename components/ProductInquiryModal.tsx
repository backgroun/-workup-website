"use client";
import { useState } from "react";
import type { Product } from "@/data/products";

// 상품 문의 유형 — 오프라인 방문/상담 유도에 맞춘 항목
const INQUIRY_TYPES = ["제품 정보 안내", "재고 문의", "사이즈 문의", "매장 방문·픽업 문의", "기타"];

export default function ProductInquiryModal({
  product,
  open,
  onClose,
  onSubmitted,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [inquiryType, setInquiryType] = useState(INQUIRY_TYPES[0]);
  const [title, setTitle] = useState("");
  const [secret, setSecret] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const canSubmit = !!title.trim() && !!content.trim() && !submitting;

  const submit = async () => {
    setError("");
    if (!title.trim()) { setError("문의 제목을 입력해 주세요."); return; }
    if (!content.trim()) { setError("문의 내용을 입력해 주세요."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          payload: {
            productName: product.name,
            productId: product.id,
            sku: product.sku ?? "",
            subject: inquiryType,
            title: title.trim(),
            content: content.trim(),
            secret: secret ? "비밀글" : "",
          },
        }),
      });
      if (res.ok) {
        alert("문의가 접수되었습니다. 빠른 시일 내 답변드리겠습니다.");
        setTitle(""); setContent("");
        onSubmitted?.();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-[#1A2B4A] mb-6">상품 문의</h2>

          {/* 문의 상품 */}
          <div className="mb-5">
            <p className="text-sm font-bold text-[#1A2B4A] mb-2">문의 상품</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-[#f4f4f4] rounded overflow-hidden flex-shrink-0">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-sm text-[#1A2B4A]">{product.name}</p>
            </div>
          </div>

          {/* 문의유형 */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-[#1A2B4A] mb-2">문의유형</label>
            <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}
              className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] bg-transparent">
              {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 문의글 제목 */}
          <div className="mb-3">
            <label className="block text-sm font-bold text-[#1A2B4A] mb-2">문의글 제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문의 제목은 필수로 입력해 주세요."
              className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-[#1A2B4A] placeholder:text-gray-300" />
          </div>

          {/* 비밀글 */}
          <label className="flex items-center gap-2 mb-5 cursor-pointer w-fit">
            <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} className="accent-[#1A2B4A] w-4 h-4" />
            <span className="text-sm text-[#1A2B4A]">비밀글</span>
          </label>

          {/* 내용 */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-[#1A2B4A] mb-2">내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="문의 내용은 필수로 입력해 주세요."
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-[#1A2B4A] placeholder:text-gray-300 resize-y" />
          </div>

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-gray-300 text-[#1A2B4A] text-sm font-semibold rounded hover:bg-gray-50 transition-colors">
              문의 취소
            </button>
            <button type="button" onClick={submit} disabled={!canSubmit}
              className="flex-1 py-3.5 bg-[#1A2B4A] text-white text-sm font-semibold rounded hover:bg-[#243d5e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? "접수 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
