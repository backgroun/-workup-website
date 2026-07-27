// 메인/서브 썸네일 자동 생성 (Canvas 기반)

import { extractDominantColors } from "./colorExtraction";
import { ProductType, detectProductType, getGuide } from "./thumbnailGuides";

// 이미지 URL 로드
async function loadImage(url: string): Promise<HTMLImageElement> {
  // 프록시 API를 통해 외부 이미지를 base64로 변환
  let actualImageUrl = url;

  if (url.startsWith("http") && !url.startsWith("data:")) {
    try {
      const proxyRes = await fetch("/api/admin/proxy-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (proxyRes.ok) {
        const { dataUrl } = await proxyRes.json();
        actualImageUrl = dataUrl;
      }
    } catch (error) {
      console.warn("Proxy fetch failed, using original URL:", error);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    // data URL은 CORS 제약 없음
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = actualImageUrl;
  });
}

// HEX 색상을 RGB로 변환
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 235, g: 235, b: 235 }; // 기본: 밝은 회색
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Canvas에 배경색 채우기
function fillCanvasBackground(ctx: CanvasRenderingContext2D, width: number, height: number, hexColor: string): void {
  const rgb = hexToRgb(hexColor);
  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  ctx.fillRect(0, 0, width, height);
}

// 이미지 안에서 실제 피사체(인물) 영역의 바운딩 박스 탐지
// AI 생성 이미지는 정사각형 프레임에 사람이 작게 중앙 배치되고 상하좌우 여백(단색 배경)이
// 많이 남는 경우가 있어, 크롭 가이드(%)를 원본 전체가 아니라 이 바운딩 박스 기준으로 적용해야 함
function detectContentBoundingBox(img: HTMLImageElement): { x: number; y: number; width: number; height: number } {
  // 성능을 위해 축소본으로 스캔 후 원본 크기로 환산
  const scanSize = 300;
  const scale = Math.min(scanSize / img.width, scanSize / img.height);
  const scanW = Math.max(1, Math.round(img.width * scale));
  const scanH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = scanW;
  canvas.height = scanH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { x: 0, y: 0, width: img.width, height: img.height };

  ctx.drawImage(img, 0, 0, scanW, scanH);
  const { data } = ctx.getImageData(0, 0, scanW, scanH);

  // 배경색은 가장자리 테두리 픽셀들의 평균으로 추정 (그라데이션·노이즈에 덜 민감하도록 모서리 4점이 아닌 테두리 전체 사용)
  let br = 0, bg = 0, bb = 0, borderCount = 0;
  const addPixel = (x: number, y: number) => {
    const i = (y * scanW + x) * 4;
    br += data[i]; bg += data[i + 1]; bb += data[i + 2];
    borderCount++;
  };
  for (let x = 0; x < scanW; x++) { addPixel(x, 0); addPixel(x, scanH - 1); }
  for (let y = 0; y < scanH; y++) { addPixel(0, y); addPixel(scanW - 1, y); }
  br /= borderCount; bg /= borderCount; bb /= borderCount;

  const tolerance = 28; // 배경색과의 허용 오차 (스튜디오 그라데이션·JPEG 압축 노이즈 감안)
  const isBackground = (i: number) =>
    Math.abs(data[i] - br) < tolerance &&
    Math.abs(data[i + 1] - bg) < tolerance &&
    Math.abs(data[i + 2] - bb) < tolerance;

  // 노이즈에 흔들리지 않도록: 한 행/열에서 배경이 아닌 픽셀 비율이 임계값을 넘어야 "내용 있음"으로 판단
  const rowThreshold = 0.03;
  const colThreshold = 0.03;

  const rowHasContent = new Array(scanH).fill(false);
  const colNonBgCount = new Array(scanW).fill(0);
  for (let y = 0; y < scanH; y++) {
    let nonBgInRow = 0;
    for (let x = 0; x < scanW; x++) {
      const i = (y * scanW + x) * 4;
      if (!isBackground(i)) {
        nonBgInRow++;
        colNonBgCount[x]++;
      }
    }
    rowHasContent[y] = nonBgInRow / scanW > rowThreshold;
  }
  const colHasContent = colNonBgCount.map((count) => count / scanH > colThreshold);

  let minY = -1, maxY = -1;
  for (let y = 0; y < scanH; y++) {
    if (rowHasContent[y]) { if (minY === -1) minY = y; maxY = y; }
  }
  let minX = -1, maxX = -1;
  for (let x = 0; x < scanW; x++) {
    if (colHasContent[x]) { if (minX === -1) minX = x; maxX = x; }
  }

  // 탐지 실패(내용 없음) 또는 비정상적으로 넓은 범위(거의 전체) → 원본 그대로 사용
  const found = minX !== -1 && minY !== -1 && maxX > minX && maxY > minY;
  if (!found) return { x: 0, y: 0, width: img.width, height: img.height };

  return {
    x: minX / scale,
    y: minY / scale,
    width: (maxX - minX) / scale,
    height: (maxY - minY) / scale,
  };
}

// 메인 썸네일 생성 (1600×1600px)
export async function generateMainThumbnail(
  imageUrl: string,
  productCategory?: string,
  tuckInMode?: "tuck-in" | "un-tuck"
): Promise<Blob> {
  // 1. 이미지 로드
  const img = await loadImage(imageUrl);

  // 2. 분류 감지
  const productType = detectProductType(productCategory) as ProductType;

  // 3. 가이드 조회
  const guide = getGuide(productType, tuckInMode);
  const targetSize = guide.targetSize; // 1600

  // 4. 배경색 추출
  let bgColor = "#EDEDED"; // 기본값
  try {
    const hexColors = await extractDominantColors(imageUrl, 1);
    if (hexColors.length > 0) {
      bgColor = hexColors[0];
    }
  } catch {
    // 색상 추출 실패 시 기본색 사용
  }

  // 5. Canvas 생성
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // 6. 배경색 채우기
  fillCanvasBackground(ctx, targetSize, targetSize, bgColor);

  // 7. 실제 피사체 영역 탐지 (여백 제외) 후 그 영역 기준으로 크롭 가이드 적용
  const content = detectContentBoundingBox(img);

  const cropTop = content.y + content.height * guide.top;
  const cropHeight = content.height * (1 - guide.top - guide.bottom);
  const cropLeft = content.x + content.width * guide.left;
  const cropWidth = content.width * guide.width;

  // 8. 크롭한 이미지를 Canvas 중앙에 배치
  const canvasX = (targetSize - cropWidth) / 2;
  const canvasY = (targetSize - cropHeight) / 2;

  ctx.drawImage(img, cropLeft, cropTop, cropWidth, cropHeight, canvasX, canvasY, cropWidth, cropHeight);

  // 9. Canvas → Blob 변환
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to create blob"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

// 서브 썸네일 생성 (960×960px)
export async function generateSubThumbnail(imageUrl: string): Promise<Blob> {
  // 1. 이미지 로드
  const img = await loadImage(imageUrl);

  // 2. 배경색 추출
  let bgColor = "#FFFFFF"; // 기본: 흰색
  try {
    const hexColors = await extractDominantColors(imageUrl, 1);
    if (hexColors.length > 0) {
      bgColor = hexColors[0];
    }
  } catch {
    // 색상 추출 실패 시 기본색 사용
  }

  // 3. Canvas 생성 (960×960px)
  const targetSize = 960;
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // 4. 배경색 채우기
  fillCanvasBackground(ctx, targetSize, targetSize, bgColor);

  // 5. 이미지 중앙 정렬 배치
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Canvas 안에 온전히 들어오도록 비율 유지 축소만 (확대·크롭 없음 — "contain")
  const scale = Math.min(targetSize / imgWidth, targetSize / imgHeight, 1);
  const displayWidth = imgWidth * scale;
  const displayHeight = imgHeight * scale;

  const canvasX = (targetSize - displayWidth) / 2;
  const canvasY = (targetSize - displayHeight) / 2;

  ctx.drawImage(img, canvasX, canvasY, displayWidth, displayHeight);

  // 6. Canvas → Blob 변환
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to create blob"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

// 여러 서브 썸네일 일괄 생성
export async function generateSubThumbnails(imageUrls: string[]): Promise<Blob[]> {
  try {
    const blobs = await Promise.all(imageUrls.map((url) => generateSubThumbnail(url)));
    return blobs;
  } catch (error) {
    console.error("Failed to generate sub thumbnails:", error);
    throw error;
  }
}

// Blob → File 변환 (업로드용)
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: "image/jpeg" });
}

// Blob → Data URL 변환 (미리보기용)
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
