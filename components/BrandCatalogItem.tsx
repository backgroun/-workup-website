"use client";
import { useEffect, useState } from "react";
import { ikSrc } from "@/lib/imageSrc";
import {
  type BrandCatalogItem,
  catalogItemAnchor,
  catalogColorAnchor,
} from "@/data/brandCatalog";

export default function BrandCatalogItem({
  item,
  accent,
}: {
  item: BrandCatalogItem;
  accent: string;
}) {
  const colors = item.colors ?? [];
  const [active, setActive] = useState(0);

  // 마운트 시 해시로 초기 컬러 선택
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    const idx = colors.findIndex((c) => catalogColorAnchor(item.id, c.key) === h);
    if (idx >= 0) setActive(idx);
    // item.id 고정, colors 참조만 사용 — 최초 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = colors[active];
  const hero = current ? current.styled_url || current.cutout_url : "";

  const selectColor = (idx: number) => {
    setActive(idx);
    const c = colors[idx];
    if (c) {
      window.history.replaceState(null, "", `#${catalogColorAnchor(item.id, c.key)}`);
    }
  };

  return (
    <article className="scroll-mt-24 py-10 border-b border-gray-100 last:border-0">
      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        {/* 큰 이미지 */}
        <div className="relative w-full aspect-[4/5] bg-[#f5f0eb] overflow-hidden rounded-lg">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ikSrc(hero, 1200)}
              alt={`${item.name}${current ? ` ${current.label}` : ""}`}
              className="absolute inset-0 w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>

        {/* 정보 */}
        <div>
          <h2 id={catalogItemAnchor(item.id)} className="text-2xl font-black tracking-tight text-gray-900">
            {item.name}
          </h2>
          {item.summary ? <p className="mt-2 text-sm text-gray-600">{item.summary}</p> : null}

          {/* 컬러 칩 */}
          {colors.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {colors.map((c, idx) => (
                <button
                  key={c.key || idx}
                  type="button"
                  onClick={() => selectColor(idx)}
                  aria-pressed={idx === active}
                  className="flex items-center gap-2 rounded-full border px-2 py-1.5 min-h-[44px] transition-colors"
                  style={{
                    borderColor: idx === active ? accent : "#e5e7eb",
                    backgroundColor: idx === active ? `${accent}0d` : "#fff",
                  }}
                >
                  <span className="relative block w-9 h-9 rounded-full overflow-hidden bg-[#f5f0eb] flex-shrink-0">
                    {c.cutout_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ikSrc(c.cutout_url, 120)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : c.swatch ? (
                      <span className="absolute inset-0" style={{ backgroundColor: c.swatch }} />
                    ) : null}
                  </span>
                  <span className="text-xs text-gray-700 pr-1">{c.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {item.description ? (
            <p className="mt-5 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{item.description}</p>
          ) : null}

          {/* 스펙 */}
          {item.specs?.length > 0 ? (
            <dl className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
              {item.specs.map((s, i) => (
                <div key={i} className="flex py-2 text-sm">
                  <dt className="w-28 flex-shrink-0 text-gray-400">{s.label}</dt>
                  <dd className="text-gray-800">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* 가격 */}
          <p className="mt-5 text-lg font-bold" style={{ color: accent }}>
            {item.price?.trim() ? item.price : "가격 문의"}
          </p>
        </div>
      </div>

      {/* 갤러리 */}
      {current?.gallery && current.gallery.length > 0 ? (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {current.gallery.map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(g, 600)} alt={`${item.name} ${current.label} ${i + 1}`}
              className="w-full aspect-square object-cover rounded bg-[#f5f0eb]" loading="lazy" />
          ))}
        </div>
      ) : null}

      {/* 제품 전용 기술서 */}
      {item.tech_images?.length > 0 ? (
        <div className="mt-8 space-y-4">
          {item.tech_images.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ikSrc(t, 1400)} alt={`${item.name} 기술서 ${i + 1}`}
              className="w-full rounded border border-gray-100" loading="lazy" />
          ))}
        </div>
      ) : null}
    </article>
  );
}
