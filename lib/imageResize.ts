// 브라우저에서 이미지 파일을 "기준 폭(maxWidth)"에 맞춰 다운스케일한다.
// - 원본 폭이 maxWidth 이하이면 원본 그대로 반환(resized: false)
// - 초과하면 maxWidth 폭으로 비율 유지 축소(resized: true)
// PNG는 PNG로(투명도 유지), 그 외는 JPEG로 내보낸다.

export type ResizeResult = {
  file: File;          // 업로드할 파일 (원본 또는 축소본)
  width: number;       // 결과 이미지 폭
  height: number;      // 결과 이미지 높이
  origWidth: number;   // 원본 폭
  origHeight: number;  // 원본 높이
  resized: boolean;    // 축소 여부
};

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export async function resizeImageToMaxWidth(file: File, maxWidth: number): Promise<ResizeResult> {
  // 이미지가 아니면 그대로 반환
  if (!file.type.startsWith("image/")) {
    return { file, width: 0, height: 0, origWidth: 0, origHeight: 0, resized: false };
  }
  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const ow = img.naturalWidth || img.width;
    const oh = img.naturalHeight || img.height;

    // 기준 폭 이하 → 원본 그대로
    if (!ow || ow <= maxWidth) {
      return { file, width: ow, height: oh, origWidth: ow, origHeight: oh, resized: false };
    }

    // 기준 폭 초과 → 비율 유지 축소
    const scale = maxWidth / ow;
    const nw = maxWidth;
    const nh = Math.max(1, Math.round(oh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, width: ow, height: oh, origWidth: ow, origHeight: oh, resized: false };
    ctx.drawImage(img, 0, 0, nw, nh);

    const isPng = file.type === "image/png";
    const outType = isPng ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outType, isPng ? undefined : 0.92)
    );
    if (!blob) return { file, width: ow, height: oh, origWidth: ow, origHeight: oh, resized: false };

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const newFile = new File([blob], `${baseName}.${isPng ? "png" : "jpg"}`, { type: outType });
    return { file: newFile, width: nw, height: nh, origWidth: ow, origHeight: oh, resized: true };
  } catch {
    // 실패 시 원본 그대로 업로드
    return { file, width: 0, height: 0, origWidth: 0, origHeight: 0, resized: false };
  }
}
