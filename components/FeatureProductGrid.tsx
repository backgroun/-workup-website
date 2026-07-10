"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productDisplayName, type Product } from "@/data/products";
import NearbyStoreModal from "@/components/NearbyStoreModal";

export default function FeatureProductGrid({ products }: { products: Product[] }) {
  const [modalProduct, setModalProduct] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <div className="py-24 text-center text-sm text-gray-400">
        해당 기획의 제품이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 flex flex-col">
            <Link
              href={`/products/${product.id}`}
              className={`${product.bg} aspect-square flex items-center justify-center relative overflow-hidden`}
            >
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              ) : (
                <span className="text-white/20 text-xs tracking-widest uppercase">WORKUP</span>
              )}
              {product.isNew && (
                <span className="absolute top-3 left-3 bg-[#ff550c] text-white text-xs font-bold px-2 py-0.5 tracking-widest z-10">
                  NEW
                </span>
              )}
            </Link>

            <div className="p-6 flex flex-col flex-1">
              <p className="text-xs text-[#ff550c] tracking-widest uppercase mb-1">
                {product.category} · {product.subCategory}
              </p>
              <h3 className="text-base font-bold text-[#303236] mb-3">
                <Link href={`/products/${product.id}`} className="hover:text-[#ff550c] transition-colors">
                  {productDisplayName(product)}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 italic">
                &ldquo;{product.tagline}&rdquo;
              </p>

              <ul className="space-y-1 mb-4">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 bg-[#ff550c] rounded-full flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {product.fieldTest && (
                <div className="flex items-center gap-2 mb-4 bg-orange-50 px-3 py-2">
                  <span className="text-[#ff550c] text-xs font-bold flex-shrink-0">✓ FIELD TEST</span>
                  <span className="text-xs text-gray-500 truncate">{product.fieldTest}</span>
                </div>
              )}

              <p className="text-lg font-bold text-[#303236] mb-5 mt-auto">{product.price}</p>

              <button
                onClick={() => setModalProduct(product.name)}
                className="w-full text-center bg-[#303236] text-white text-xs font-semibold tracking-widest py-3 hover:bg-[#ff550c] transition-colors"
              >
                근처 매장 찾아보기
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalProduct && (
        <NearbyStoreModal
          productName={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}
    </>
  );
}
