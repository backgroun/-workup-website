import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import StoreForm from "../../_components/StoreForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditStorePage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("stores").select("*").eq("id", id).single();
  if (error || !data) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/stores" className="hover:text-gray-900">스토어 관리</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">매장 수정</span>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
        <p className="text-base text-gray-400 mt-1">매장 정보를 수정합니다.</p>
      </div>
      <StoreForm storeId={Number(id)} initialData={data} />
    </div>
  );
}
