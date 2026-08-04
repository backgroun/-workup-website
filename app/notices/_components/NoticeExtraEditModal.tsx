"use client";
import { useState } from "react";
import DescriptionField from "./DescriptionField";
import CoverAndDetailImagesField from "./CoverAndDetailImagesField";

// 정식등록 상품 공지 전용 "공지 수정" — 상품 자체(이름·기본 사진 등)는 건드리지 않고,
// 이 공지에 한해 대표 사진 아래에 덧붙는 추가 설명·사진만 고친다.
export default function NoticeExtraEditModal({
  noticeId,
  productName,
  initialDescription,
  initialExtraImages,
  onClose,
  onSaved,
}: {
  noticeId: string;
  productName?: string;
  initialDescription: string | null;
  initialExtraImages: string[];
  onClose: () => void;
  onSaved: (data: { description: string | null; extra_images: string[] }) => void;
}) {
  const [description, setDescription] = useState(initialDescription ?? "");
  const [extraImages, setExtraImages] = useState<string[]>(initialExtraImages);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  const showInfo = (text: string) => {
    setInfo(text);
    setTimeout(() => setInfo(""), 4000);
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || null, extra_images: extraImages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved({ description: data.description ?? null, extra_images: data.extra_images ?? [] });
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
          <span className="font-bold text-[16px] text-gray-900">
            공지 수정{productName ? ` — ${productName}` : ""}
          </span>
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

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              공지 추가 설명 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <DescriptionField value={description} onChange={setDescription} />
          </div>

          <CoverAndDetailImagesField
            showCover={false}
            cover=""
            onCoverChange={() => {}}
            detailImages={extraImages}
            onDetailImagesChange={setExtraImages}
            detailLabel="추가 사진 (선택)"
            detailHint="여기 추가한 사진은 이 공지에서 대표 사진 아래에 함께 노출됩니다. (상품 자체 정보는 변경되지 않습니다)"
            onError={setError}
            onInfo={showInfo}
          />

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
