// 대표 사진 한 장 + 상품명 + 설명만 보여준다 (여러 장을 모아보는 펼쳐보기 기능은 제거됨).
export default function TempProductReveal({
  images,
  name,
  tagline,
}: {
  images: string[];
  name: string;
  tagline?: React.ReactNode;
}) {
  const cover = images[0];

  return (
    <div>
      <div className="mb-3">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">이미지 없음</div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h2 className="font-bold text-[15.5px] text-gray-900">{name}</h2>
        {tagline}
      </div>
    </div>
  );
}
