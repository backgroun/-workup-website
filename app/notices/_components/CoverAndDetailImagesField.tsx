"use client";
import { useState } from "react";
import Image from "next/image";
import { resizeImageToMaxWidth } from "@/lib/imageResize";

const PHOTO_MAX_WIDTH = 1600;

// 대표 썸네일 1장 + 나머지 사진(상세페이지 detail_blocks에 등록될) 여러 장을 나눠서 관리한다.
// 임시등록 새로 만들기 / 약식 수정 양쪽에서 공용으로 쓴다.
export default function CoverAndDetailImagesField({
  cover,
  onCoverChange,
  detailImages,
  onDetailImagesChange,
  onError,
  onInfo,
  showCover = true,
  showDetail = true,
  detailLabel = "나머지 사진 (상세페이지에 등록)",
  detailHint = "여기 추가한 사진은 상품 상세페이지(세로로 이어지는 상세 이미지)에 그대로 등록됩니다.",
}: {
  cover: string;
  onCoverChange: (url: string) => void;
  detailImages: string[];
  onDetailImagesChange: (urls: string[]) => void;
  onError: (msg: string) => void;
  onInfo: (msg: string) => void;
  showCover?: boolean;
  showDetail?: boolean;
  detailLabel?: string;
  detailHint?: string;
}) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDetail, setUploadingDetail] = useState(false);

  const uploadOne = async (file: File): Promise<{ url: string | null; resized: boolean }> => {
    const r = await resizeImageToMaxWidth(file, PHOTO_MAX_WIDTH);
    const fd = new FormData();
    fd.append("file", r.file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      onError(data.error ?? `"${file.name}" 업로드에 실패했습니다.`);
      return { url: null, resized: false };
    }
    return { url: data.url, resized: r.resized };
  };

  const handleCoverChange = async (file: File) => {
    setUploadingCover(true);
    const { url, resized } = await uploadOne(file);
    setUploadingCover(false);
    if (url) {
      onCoverChange(url);
      if (resized) onInfo(`대표 사진을 ${PHOTO_MAX_WIDTH}px 기준으로 자동 축소했습니다.`);
    }
  };

  const handleDetailAdd = async (files: FileList) => {
    setUploadingDetail(true);
    const uploaded: string[] = [];
    let resizedCount = 0;
    for (const file of Array.from(files)) {
      const { url, resized } = await uploadOne(file);
      if (url) {
        uploaded.push(url);
        if (resized) resizedCount++;
      }
    }
    if (uploaded.length) onDetailImagesChange([...detailImages, ...uploaded]);
    if (resizedCount > 0) onInfo(`이미지 ${resizedCount}장을 ${PHOTO_MAX_WIDTH}px 기준으로 자동 축소했습니다.`);
    setUploadingDetail(false);
  };

  const removeDetailImage = (idx: number) => onDetailImagesChange(detailImages.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {showCover && (
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">대표 썸네일</label>
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-[11px] text-center px-1">
                이미지 없음
              </div>
            )}
          </div>
          <label className="px-3 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
            {uploadingCover ? "업로드 중..." : cover ? "사진 바꾸기" : "사진 선택"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingCover}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCoverChange(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5">목록·지점 화면에 대표로 보이는 사진입니다.</p>
      </div>
      )}

      {showDetail && (
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">{detailLabel}</label>
        <div className="flex flex-wrap gap-2">
          {detailImages.map((url, idx) => (
            <div key={url + idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => removeDetailImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="이미지 삭제"
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg text-[11px] text-gray-400 text-center cursor-pointer hover:border-gray-300 px-1">
            {uploadingDetail ? "업로드 중..." : "+ 추가"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingDetail}
              onChange={(e) => {
                if (e.target.files?.length) handleDetailAdd(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5">{detailHint}</p>
      </div>
      )}
    </div>
  );
}
