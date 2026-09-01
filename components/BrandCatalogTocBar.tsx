"use client";
import { useEffect, useState } from "react";
import { type CatalogTocGroup, catalogItemAnchor } from "@/data/brandCatalog";

export default function BrandCatalogTocBar({
  groups,
  accent,
}: {
  groups: CatalogTocGroup[];
  accent: string;
}) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id: string) => {
    document.getElementById(catalogItemAnchor(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const flat = groups.flatMap((g) => g.items);
  if (flat.length === 0) return null;

  return (
    <div
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur border-b transition-shadow ${stuck ? "shadow-sm" : ""}`}
      style={{ borderColor: `${accent}22` }}
    >
      <div className="max-w-screen-lg mx-auto px-4 py-2 flex gap-3 overflow-x-auto text-xs whitespace-nowrap">
        {flat.map((it) => (
          <button key={it.id} type="button" onClick={() => jump(it.id)}
            className="text-gray-500 hover:text-gray-900 py-1 min-h-[44px]">
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
}
