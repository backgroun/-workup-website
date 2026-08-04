// 임시등록 상품은 사진마다 가로세로 비율이 제각각이라(정식 등록의 표준 크롭을 거치지 않음)
// 정사각형으로 잘라 보여주는 캐러셀 대신, 원본 비율 그대로 세로로 이어붙여 스크롤로 보게 한다.
export default function VerticalImageStack({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
        이미지 없음
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="block w-full h-auto rounded-lg bg-gray-50"
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}
