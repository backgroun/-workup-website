// 이미지에서 주요 색상 추출 (Canvas 기반 dominant color algorithm)
// 썸네일 생성기(thumbnailGenerator.ts)의 배경색 추정에 쓰인다.

// RGB 객체를 HEX 문자열로 변환
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }).join("")}`.toUpperCase();
}

// 이미지 URL에서 주요 색상 추출
export async function extractDominantColors(
  imageUrl: string,
  count: number = 5
): Promise<string[]> {
  // 프록시 API를 통해 외부 이미지를 base64로 변환
  let actualImageUrl = imageUrl;

  if (imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
    try {
      const proxyRes = await fetch("/api/admin/proxy-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
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

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // 작은 크기로 축소해서 샘플링 성능 향상 (200x200 기준)
        const maxDim = 200;
        const scale = Math.min(maxDim / img.width, maxDim / img.height);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 색상 히스토그램: 각 색상(HEX)의 빈도 계산
        // 성능을 위해 색상 양자화 (8비트 → 5비트, 256색 → 32768색 범위)
        const colorMap = new Map<string, number>();

        // 4픽셀마다 샘플링 (성능)
        for (let i = 0; i < data.length; i += 16) { // RGBA마다 4바이트, 4픽셀 = 16바이트
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // 투명도가 거의 없으면 무시
          if (a < 128) continue;

          // 색상 양자화 (256 → 32 단위로 반올림)
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;

          const hex = rgbToHex(qr, qg, qb);
          colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
        }

        // 빈도순 정렬해서 상위 N개 반환
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)
          .map((entry) => entry[0]);

        resolve(sortedColors);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = actualImageUrl;
  });
}
