import Link from "next/link";
import StoreForm from "../_components/StoreForm";

export default function NewStorePage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">매장 추가</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">매장 추가</h1>
        <p className="text-base text-gray-400 mt-1">새로운 매장 정보를 등록합니다.</p>
      </div>
      <StoreForm />
    </div>
  );
}
