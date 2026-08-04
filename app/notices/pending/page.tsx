"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";

export default function PendingRegistrationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 지점 출고 패스(공지)에 실제로 쓰인 임시등록 상품만 — 공지와 무관한 옛 미완성 상품은 여기 안 뜬다.
    fetch("/api/admin/notices/pending-products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const pending = useMemo(
    () => [...products].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
    [products]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">정식등록 대기</h1>
        <p className="text-sm text-gray-500 mt-1">
          임시등록 상태로 남아있는 상품입니다. 나머지 정보를 채워 정식등록으로 전환해 주세요.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : pending.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">정식등록을 기다리는 상품이 없습니다.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase">상품명</th>
                <th className="px-5 py-3 text-left text-[12px] font-bold text-gray-500 uppercase whitespace-nowrap">임시등록일</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">
                    {p.createdAt?.slice(0, 10) ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1.5 text-[13px] font-semibold border border-[#303236] text-[#303236] rounded-lg hover:bg-[#303236] hover:text-white transition-colors whitespace-nowrap"
                    >
                      정식등록 하러가기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
