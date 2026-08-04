import NoticeProductPicker from "../_components/NoticeProductPicker";

export default function NewNoticePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">공지 상품 선택</h1>
        <p className="text-sm text-gray-500 mt-1">
          기존 상품에서 고르거나, 아직 없는 상품은 임시등록으로 바로 추가해 공지에 씁니다.
        </p>
      </div>
      <NoticeProductPicker />
    </div>
  );
}
