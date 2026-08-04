"use client";
import { useState } from "react";
import type { Product } from "@/data/products";
import DescriptionField from "./DescriptionField";
import CoverAndDetailImagesField from "./CoverAndDetailImagesField";

// 임시등록 상품을 "정식등록 하러가기"(전체 상품 편집 폼)로 가지 않고 이름·설명·사진만 빠르게 고치는 공지 수정.
// PUT /api/admin/products/[id]는 부분 병합이 아니라 전체 객체를 그대로 저장하므로,
// 기존 product를 통째로 스프레드한 뒤 이 화면에서 다루는 필드만 덮어써서 보낸다.
// registrationStatus는 명시적으로 "임시등록"으로 유지 — 이 화면에서 정식등록으로 전환하지 않는다.
export default function QuickEditModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [name, setName] = useState(product.name);
  const [tagline, setTagline] = useState(product.tagline ?? "");
  const [cover, setCover] = useState(product.imageUrl ?? "");
  const [detailImages, setDetailImages] = useState<string[]>(
    (product.detailBlocks ?? []).map((b) => b.imageUrl).filter((u): u is string => Boolean(u))
  );
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  const showInfo = (text: string) => {
    setInfo(text);
    setTimeout(() => setInfo(""), 4000);
  };

  const save = async () => {
    if (!name.trim()) {
      setError("상품명을 입력해 주세요.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload: Product = {
        ...product,
        name: name.trim(),
        tagline: tagline.trim(),
        imageUrl: cover || undefined,
        detailBlocks: detailImages.map((url, i) => ({
          id: `d${i + 1}`,
          type: "상품 소개" as const,
          content: "",
          imageUrl: url,
        })),
        registrationStatus: "임시등록",
      };
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved(data);
    } catch {
      setError("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white z-10 rounded-t-2xl">
          <span className="font-bold text-[16px] text-gray-900">공지 수정</span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {info && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-lg">{info}</div>
          )}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <CoverAndDetailImagesField
            cover={cover}
            onCoverChange={setCover}
            detailImages={detailImages}
            onDetailImagesChange={setDetailImages}
            onError={setError}
            onInfo={showInfo}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">상품명</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#303236]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">한 줄 설명</label>
            <DescriptionField value={tagline} onChange={setTagline} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold bg-[#E5541B] text-white rounded-lg hover:bg-[#e04500] disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-lg hover:border-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
