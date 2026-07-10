import Link from "next/link";
import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/products" className="hover:text-[#303236]">제품 관리</Link>
        <span>/</span>
        <span className="text-[#303236] font-semibold">새 제품 추가</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-10">새 제품 추가</h1>
      <ProductForm />
    </div>
  );
}
