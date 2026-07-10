import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient, mapFromDb } from "@/lib/supabase-server";
import { products as staticProducts } from "@/data/products";
import ProductForm from "../../_components/ProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  let product;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    product = data ? mapFromDb(data) : staticProducts.find((p) => p.id === id);
  } catch {
    product = staticProducts.find((p) => p.id === id);
  }

  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/products" className="hover:text-[#303236]">제품 관리</Link>
        <span>/</span>
        <span className="text-[#303236] font-semibold">수정</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-10">{product.name} 수정</h1>
      <ProductForm initial={product} isEdit />
    </div>
  );
}
