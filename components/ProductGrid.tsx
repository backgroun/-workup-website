import Link from "next/link";
import { products, isPubliclyVisible, productDisplayName, type LineType } from "@/data/products";

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  filter?: LineType;
};

export default function ProductGrid({ id, title, subtitle, filter }: Props) {
  const filtered = products
    .filter(isPubliclyVisible)
    .filter((p) => !filter || p.line === filter);

  return (
    <section id={id} className="py-20 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#303236] tracking-wide mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              <div className={`${product.bg} aspect-square mb-4 flex items-center justify-center overflow-hidden`}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-xs text-white/40 tracking-widest uppercase">
                    {product.line}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#ff550c] tracking-widest uppercase mb-1">
                WORKUP {product.line}
              </p>
              <h3 className="text-base font-semibold text-[#303236] mb-2 group-hover:underline underline-offset-2 transition-all">
                {productDisplayName(product)}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                {product.tagline}
              </p>
              <p className="text-sm font-bold text-[#303236]">
                {product.price}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
