"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { ArrivalProduct, ArrivalStatus } from "@/lib/arrival";

// ─── 유틸 ────────────────────────────────────────────────────────────────────
const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_KO   = ["일","월","화","수","목","금","토"];
const DAY_EN   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function parseDate(iso: string) {
  if (!iso?.trim()) return null;
  const d = new Date(iso.trim() + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(iso: string) {
  const d = parseDate(iso);
  if (!d) return { mm:"--", dd:"--", day:"--", dayKo:"", month:"--", full: iso };
  return {
    mm:    String(d.getMonth() + 1).padStart(2, "0"),
    dd:    String(d.getDate()).padStart(2, "0"),
    day:   DAY_EN[d.getDay()],
    dayKo: DAY_KO[d.getDay()],
    month: MONTH_KO[d.getMonth()],
    full:  `${d.getMonth()+1}/${d.getDate()}(${DAY_KO[d.getDay()]})`,
  };
}
const BRAND_BG: Record<string, string> = {
  "켄타":        "bg-[#1a56db]",   // 로열 블루       hue 225
  "디트로잇":    "bg-[#cc0000]",   // 선명 레드       hue 0
  "GRBD":        "bg-[#009b3a]",   // 선명 그린       hue 132
  "K-WORKERS":   "bg-[#5e17eb]",   // 바이올렛        hue 264
  "덴버":        "bg-[#cc0077]",   // 마젠타/핫핑크   hue 330
  "디월트":      "bg-[#ffd700]",   // 선명 옐로       hue 51
  "매드독캠프":  "bg-[#007660]",   // 다크 틸         hue 165
  "모디뜨":      "bg-[#e74694]",   // 핑크            hue 335
  "몬스톤":      "bg-[#60a5fa]",   // 라이트 블루      hue 213
  "볼컴":        "bg-[#ff7700]",   // 선명 오렌지     hue 29
  "블랙스미스":  "bg-[#884400]",   // 브라운          hue 30 (dark)
  "블랙아머":    "bg-[#1f1f3a]",   // 다크 네이비     near black
  "유니보스":    "bg-[#00b4cc]",   // 아쿠아/시안     hue 186
  "이글서플라이":"bg-[#e6a817]",   // 앰버/골드       hue 43
  "프레파라트":  "bg-[#7cb900]",   // 라임 그린       hue 81
};

const BRAND_BG_HEX: Record<string, string> = {
  "켄타":        "#1a56db",
  "디트로잇":    "#cc0000",
  "GRBD":        "#009b3a",
  "K-WORKERS":   "#5e17eb",
  "덴버":        "#cc0077",
  "디월트":      "#ffd700",
  "매드독캠프":  "#007660",
  "모디뜨":      "#e74694",
  "몬스톤":      "#60a5fa",
  "볼컴":        "#ff7700",
  "블랙스미스":  "#884400",
  "블랙아머":    "#1f1f3a",
  "유니보스":    "#00b4cc",
  "이글서플라이":"#e6a817",
  "프레파라트":  "#7cb900",
};

function brandBg(brand: string) {
  return BRAND_BG[brand] ?? "bg-[#edebe8]";
}
function brandBgHex(brand: string) {
  return BRAND_BG_HEX[brand] ?? "#edebe8";
}
// 밝은 배경색(노란색 계열)은 어두운 텍스트 사용
const LIGHT_BRANDS = new Set(["디월트", "프레파라트", "이글서플라이", "몬스톤"]);
function brandTextCls(brand: string) {
  return LIGHT_BRANDS.has(brand) ? "text-[#1a1a1a]" : "text-white";
}
function brandTextColor(brand: string) {
  return LIGHT_BRANDS.has(brand) ? "#1a1a1a" : "#fff";
}

function stripBrand(name: string, brand: string) {
  if (!brand) return name;
  const prefix = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[_\\s]+`, "i");
  return name.replace(prefix, "").trim() || name;
}

function fmtPrice(n: number) {
  return n > 0 ? n.toLocaleString("ko-KR") + "원" : "—";
}
function toMonthKey(iso: string) {
  const d = parseDate(iso);
  if (!d) return "미정";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthKeyLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}년 ${MONTH_KO[parseInt(m)-1]}`;
}

const STATUS_META: Record<ArrivalStatus, { label: string; cls: string }> = {
  입고완료:   { label: "완료",      cls: "bg-gray-200 text-gray-600" },
  입고예정:   { label: "예정",      cls: "bg-[#1a1a1a] text-white"  },
  입고지연:   { label: "지연",      cls: "bg-amber-100 text-amber-800" },
  일정미정:   { label: "미정",      cls: "bg-gray-200 text-gray-600" },
  대기:       { label: "대기",      cls: "bg-blue-50 text-blue-600" },
  일정미표기: { label: "일정미표기", cls: "bg-gray-100 text-gray-500" },
};

// ─── 이미지 파싱 ─────────────────────────────────────────────────────────────
function parseImages(product: ArrivalProduct): string[] {
  if (!product.image) return [];
  return product.image.split(",").map(s => s.trim()).filter(Boolean);
}

// ─── 이미지 플레이스홀더 ──────────────────────────────────────────────────────
function ProductImage({ product, size = "md" }: { product: ArrivalProduct; size?: "sm" | "md" }) {
  const imgs = parseImages(product);
  const src = imgs[0] ?? `/images/arrival/${product.productCode}.jpg`;
  const [failed, setFailed] = useState(imgs.length === 0);
  const aspectCls = "aspect-[3/4]";
  if (failed) {
    return (
      <div className={`w-full ${aspectCls} bg-[#f0eeeb] flex flex-col items-center justify-center gap-1`}>
        <span className="text-[10px] tracking-widest text-gray-500 font-mono uppercase">{product.productCode}</span>
        <div className="w-6 h-px bg-gray-300" />
        <span className="text-[10px] tracking-widest text-gray-400 uppercase">no image</span>
      </div>
    );
  }
  return (
    <img src={src} alt={product.productName}
      className={`w-full ${aspectCls} object-cover bg-[#f0eeeb]`}
      onError={() => setFailed(true)} />
  );
}

// ─── 이미지 갤러리 (모달용) ───────────────────────────────────────────────────
function ImageGallery({ product, aspectCls = "aspect-[3/4]" }: { product: ArrivalProduct; aspectCls?: string }) {
  const customImages = parseImages(product);
  const fallback = `/images/arrival/${product.productCode}.jpg`;
  const images = customImages.length > 0 ? customImages : [fallback];

  const [index, setIndex] = useState(0);
  const [failedSet, setFailedSet] = useState<Set<number>>(new Set());

  const markFailed = (i: number) => setFailedSet(prev => new Set(prev).add(i));
  const allFailed  = images.every((_, i) => failedSet.has(i));

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex(i => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIndex(i => (i + 1) % images.length); };

  if (allFailed) {
    return (
      <div className={`w-full ${aspectCls} bg-[#f0eeeb] flex flex-col items-center justify-center gap-1 rounded-sm`}>
        <span className="text-[10px] tracking-widest text-gray-500 font-mono uppercase">{product.productCode}</span>
        <div className="w-6 h-px bg-gray-300" />
        <span className="text-[10px] tracking-widest text-gray-400 uppercase">no image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 메인 이미지 + 양쪽 화살표 */}
      <div className="flex items-center gap-2">
        {/* 왼쪽 화살표 (이미지 바깥) */}
        {images.length > 1 ? (
          <button onClick={prev}
            className="shrink-0 w-9 h-9 bg-white border border-gray-200 hover:border-gray-400 rounded-full flex items-center justify-center text-[20px] text-gray-600 hover:text-[#1a1a1a] shadow-sm transition-all">
            ‹
          </button>
        ) : (
          <div className="shrink-0 w-9" />
        )}

        {/* 이미지 */}
        <div className={`relative flex-1 ${aspectCls} overflow-hidden rounded-sm bg-[#f0eeeb]`}>
          {!failedSet.has(index) && (
            <img
              key={images[index]}
              src={images[index]}
              alt={`${product.productName} ${index + 1}`}
              className="w-full h-full object-cover"
              onError={() => markFailed(index)}
            />
          )}
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/40 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {index + 1} / {images.length}
            </div>
          )}
        </div>

        {/* 오른쪽 화살표 (이미지 바깥) */}
        {images.length > 1 ? (
          <button onClick={next}
            className="shrink-0 w-9 h-9 bg-white border border-gray-200 hover:border-gray-400 rounded-full flex items-center justify-center text-[20px] text-gray-600 hover:text-[#1a1a1a] shadow-sm transition-all">
            ›
          </button>
        ) : (
          <div className="shrink-0 w-9" />
        )}
      </div>

      {/* 썸네일 스트립 */}
      {images.length > 1 && (
        <div className="px-11">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full pb-1.5">
            {images.map((src, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`shrink-0 w-14 h-14 overflow-hidden rounded transition-all ${i === index ? "ring-2 ring-[#1a1a1a]" : "opacity-45 hover:opacity-75"}`}>
                {!failedSet.has(i) && (
                  <img src={src} alt="" className="w-full h-full object-cover" onError={() => markFailed(i)} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 상품 상세 모달 ───────────────────────────────────────────────────────────
function ProductModal({ product, onClose }: { product: ArrivalProduct; onClose: () => void }) {
  const { full } = fmtDate(product.arrivalDate);
  const meta = STATUS_META[product.status] ?? STATUS_META["입고예정"];
  const history = product.changeHistory ?? [];

  // 모바일 스와이프 다운으로 닫기
  const startY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startY.current > 80) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-5xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 모바일 핸들 */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-gray-200">
          <span className="text-[11px] sm:text-[12px] tracking-[0.2em] text-gray-500 uppercase font-semibold">PRODUCT DETAIL</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* 본문 */}
        <div className="flex flex-col sm:flex-row gap-0 sm:gap-8 sm:p-6">
          {/* 이미지 영역 */}
          <div className="sm:w-[480px] shrink-0">
            {/* 모바일: 4:3 비율 */}
            <div className="sm:hidden pt-4 pb-2 px-5">
              <ImageGallery product={product} aspectCls="aspect-[4/3]" />
            </div>
            {/* PC: 3:4 비율 (세로형) */}
            <div className="hidden sm:block">
              <ImageGallery product={product} aspectCls="aspect-[3/4]" />
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="flex-1 flex flex-col gap-5 px-5 sm:px-0 pb-6 sm:pb-0 pt-2 sm:pt-1">
            {/* 브랜드 + 제품명 */}
            <div>
              <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-semibold mb-1">{product.brand}</p>
              <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1a1a1a] leading-snug">{product.productName}</h2>
            </div>

            {/* 스펙 테이블 */}
            <table className="w-full text-[13px] border-collapse">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap w-24 align-middle">상태</td>
                  <td className="py-2.5 align-middle">
                    <span className={`inline-block text-[12px] px-2.5 py-1 rounded-full font-bold ${meta.cls}`}>{meta.label}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">코드</td>
                  <td className="py-2.5 font-mono text-[12px] text-[#1a1a1a] align-middle">{product.productCode}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">카테고리</td>
                  <td className="py-2.5 text-[#1a1a1a] align-middle">{product.category || "—"}</td>
                </tr>
                {product.productType && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">상품구분</td>
                    <td className="py-2.5 text-[#1a1a1a] align-middle">{product.productType}</td>
                  </tr>
                )}
                {product.newArrivalType && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">신상구분</td>
                    <td className="py-2.5 text-[#1a1a1a] align-middle">{product.newArrivalType}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">컬러</td>
                  <td className="py-2.5 text-[#1a1a1a] align-middle">{product.color || "—"}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">공급가</td>
                  <td className="py-2.5 text-[#1a1a1a] align-middle">{product.supplyPrice && product.supplyPrice > 0 ? fmtPrice(product.supplyPrice) : "—"}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">판매가</td>
                  <td className="py-2.5 font-bold text-[16px] text-[#1a1a1a] align-middle">{product.price > 0 ? fmtPrice(product.price) : "—"}</td>
                </tr>
                {product.quantity != null && product.quantity > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">수량</td>
                    <td className="py-2.5 text-[#1a1a1a] align-middle font-semibold">{product.quantity.toLocaleString("ko-KR")}개</td>
                  </tr>
                )}
                <tr className="last:border-0">
                  <td className="py-2.5 pr-4 text-[11px] tracking-widest text-gray-400 uppercase font-semibold whitespace-nowrap align-middle">입고일</td>
                  <td className="py-2.5 text-[#1a1a1a] align-middle">{full}</td>
                </tr>
              </tbody>
            </table>

            {product.description && (
              <div>
                <p className="text-[11px] tracking-widest text-gray-400 uppercase font-semibold mb-2">설명</p>
                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description.replace(/\\n/g, "\n")}
                </p>
              </div>
            )}

            {history.length > 0 && (
              <div>
                <p className="text-[11px] tracking-widest text-gray-400 uppercase font-semibold mb-2">변경 이력</p>
                <div className="space-y-2">
                  {history.slice().reverse().map((h, i) => (
                    <div key={i} className="text-[13px] bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="line-through">{h.previousDate}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-[#1a1a1a]">{h.newDate}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{h.reason}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{new Date(h.changedAt).toLocaleString("ko-KR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 타입 ─────────────────────────────────────────────────────────────────────
type ViewMode  = "grid" | "list" | "calendar";
type GroupMode = "date" | "month" | "category" | "brand";

// ─── 상품 카드 (그리드용) ─────────────────────────────────────────────────────
function ProductCard({ product, onSelect, showDate }: { product: ArrivalProduct; onSelect: () => void; showDate?: boolean }) {
  const meta = STATUS_META[product.status] ?? STATUS_META["입고예정"];
  const { full } = fmtDate(product.arrivalDate);
  return (
    <button onClick={onSelect}
      className="text-left transition-opacity hover:opacity-80 flex flex-col">
      <div className="w-full overflow-hidden rounded-sm"><ProductImage product={product} size="sm" /></div>
      <div className="pt-2 flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] tracking-wider text-gray-500 uppercase truncate font-medium">{product.brand}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${meta.cls}`}>{meta.label}</span>
        </div>
        <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2 flex-1">{stripBrand(product.productName, product.brand)}</p>
        {showDate && product.arrivalDate ? (
          <div className="text-[11px] text-gray-600 flex items-center justify-between gap-1 mt-auto">
            <span className="truncate">{full}</span>
            {product.price > 0 && <span className="font-medium text-[#1a1a1a] whitespace-nowrap shrink-0">{fmtPrice(product.price)}</span>}
          </div>
        ) : (
          <p className="text-[11px] text-gray-600 font-medium text-right mt-auto">{fmtPrice(product.price)}</p>
        )}
      </div>
    </button>
  );
}

const GRID_COLS = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3";

// ─── 그룹 헤더 ───────────────────────────────────────────────────────────────
function GroupHeader({ groupKey, groupMode, count }: { groupKey: string; groupMode: GroupMode; count: number }) {
  if (groupMode === "date") {
    const { mm, dd, day, month } = fmtDate(groupKey);
    return (
      <div className="flex items-baseline gap-4 mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-[#1a1a1a] tracking-tighter leading-none">{mm}.{dd}</span>
          <span className="text-[13px] tracking-[0.15em] text-gray-600 uppercase font-semibold">{day}</span>
          <span className="text-[13px] text-gray-500">{month}</span>
        </div>
        <span className="text-[13px] text-gray-500 font-medium">{count}개</span>
      </div>
    );
  }
  if (groupMode === "month") {
    const label = groupKey === "미정" ? "일정 미정" : monthKeyLabel(groupKey);
    return (
      <div className="flex items-baseline gap-4 mb-5">
        <span className="text-3xl font-black text-[#1a1a1a] tracking-tight leading-none">{label}</span>
        <span className="text-[13px] text-gray-500 font-medium">{count}개</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-4 mb-5">
      <span className="text-2xl font-black text-[#1a1a1a] tracking-tight leading-none uppercase">{groupKey || "미분류"}</span>
      <span className="text-[13px] text-gray-500 font-medium">{count}개</span>
    </div>
  );
}

// ─── 그리드 뷰 ───────────────────────────────────────────────────────────────
function GridView({ grouped, groupMode, onSelect }: {
  grouped: [string, ArrivalProduct[]][]; groupMode: GroupMode; onSelect: (p: ArrivalProduct) => void;
}) {
  return (
    <div>
      {grouped.map(([key, items]) => (
        <div key={key} id={`group-${key}`} className="border-t border-gray-100 pt-6 pb-10">
          <GroupHeader groupKey={key} groupMode={groupMode} count={items.length} />
          <div className={GRID_COLS}>
            {items.map(p => <ProductCard key={`${p.productCode}_${p.arrivalDate || "none"}`} product={p} onSelect={() => onSelect(p)} showDate={groupMode !== "date"} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 리스트 뷰 ───────────────────────────────────────────────────────────────
function ListView({ grouped, groupMode, onSelect }: {
  grouped: [string, ArrivalProduct[]][]; groupMode: GroupMode; onSelect: (p: ArrivalProduct) => void;
}) {
  return (
    <div className="space-y-1">
      {grouped.map(([key, items]) => (
        <div key={key} id={`group-${key}`}>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-lg mb-1">
            {groupMode === "date" ? (
              <>
                <span className="text-[14px] font-black text-[#1a1a1a]">{fmtDate(key).mm}.{fmtDate(key).dd}</span>
                <span className="text-[12px] text-gray-600 uppercase font-semibold">{fmtDate(key).day}</span>
              </>
            ) : groupMode === "month" ? (
              <span className="text-[14px] font-black text-[#1a1a1a]">{key === "미정" ? "일정 미정" : monthKeyLabel(key)}</span>
            ) : (
              <span className="text-[14px] font-black text-[#1a1a1a] uppercase">{key || "미분류"}</span>
            )}
            <span className="text-[12px] text-gray-600 font-medium ml-auto">{items.length}개</span>
          </div>
          <div className="space-y-px mb-6">
            {items.map(p => {
              const meta = STATUS_META[p.status] ?? STATUS_META["입고예정"];
              const { full, day } = fmtDate(p.arrivalDate);
              const history = p.changeHistory ?? [];
              return (
                <div key={`${p.productCode}_${p.arrivalDate || "none"}`}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                  {/* 상단 요약 행 */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${meta.cls}`}>{meta.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">
                        {p.brand}
                        {p.color && <span className="ml-2 text-gray-400">·</span>}
                        {p.color && <span className="ml-1 text-gray-400">{p.color}</span>}
                      </p>
                      <p className="text-[15px] font-bold text-[#1a1a1a] leading-tight">{stripBrand(p.productName, p.brand)}</p>
                    </div>
                    <button onClick={() => onSelect(p)}
                      className="shrink-0 text-[11px] text-gray-400 hover:text-[#1a1a1a] border border-gray-200 hover:border-gray-400 rounded-full px-3 py-1 transition-colors">
                      상세보기
                    </button>
                  </div>

                  {/* 스펙 그리드 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">코드</p>
                      <p className="text-[12px] text-gray-700 font-mono">{p.productCode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">입고일</p>
                      <p className="text-[13px] text-gray-800 font-semibold flex items-center justify-between">
                        <span>{full}</span>
                        {p.price > 0 && <span className="text-[#1a1a1a]">{fmtPrice(p.price)}</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">카테고리</p>
                      <p className="text-[12px] text-gray-700">{p.category || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">공급가</p>
                      <p className="text-[13px] text-gray-700 font-semibold">{p.supplyPrice ? fmtPrice(p.supplyPrice) : "—"}</p>
                    </div>
                    {p.color && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">컬러</p>
                        <p className="text-[12px] text-gray-700">{p.color}</p>
                      </div>
                    )}
                  </div>

                  {/* 상세 설명 */}
                  {p.description && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">상세 설명</p>
                      <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
                        {p.description.replace(/\\n/g, "\n")}
                      </p>
                    </div>
                  )}

                  {/* 변경 이력 */}
                  {history.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-amber-50/50">
                      <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-2">입고일 변경 이력</p>
                      <div className="space-y-1.5">
                        {history.slice().reverse().map((h, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-2 text-[12px]">
                            <span className="text-gray-400 line-through">{h.previousDate}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold text-[#1a1a1a]">{h.newDate}</span>
                            {h.reason && <span className="text-gray-600">· {h.reason}</span>}
                            <span className="text-[11px] text-gray-400 ml-auto">{new Date(h.changedAt).toLocaleDateString("ko-KR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 캘린더 셀 미니 썸네일 ──────────────────────────────────────────────────
function MiniThumb({ product }: { product: ArrivalProduct }) {
  const images = parseImages(product);
  const src = images[0] ?? (product.image ? product.image : null);
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div className="w-full h-full bg-[#edebe8] flex items-center justify-center">
        <span className="text-[5px] text-gray-400 font-mono uppercase">no</span>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      <img src={src} alt={product.productName}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)} />
    </div>
  );
}

// ─── PDF 생성 ─────────────────────────────────────────────────────────────────
// A4 가로 기준 높이 추정값 (mm)
const PDF_COL_W_MM   = 281 / 7;          // 열 너비 ≈ 40mm (정사각형 이미지 기준)
const PDF_PRODUCT_MM = PDF_COL_W_MM + 14; // 이미지 + 제품명 + 상태 ≈ 54mm
const PDF_THEAD_MM   = 20;                // 월 제목 + 요일 헤더
const PDF_PAGE_MM    = 210 - 12;          // A4 가로 사용 가능 높이 (상하 마진 6mm×2)
const PDF_CONTENT_MM = PDF_PAGE_MM - PDF_THEAD_MM; // 178mm

function pdfWeekHeightMM(
  week: (number | null)[],
  dateMap: Map<string, ArrivalProduct[]>,
  year: number,
  month: number
): number {
  let max = 0;
  for (const day of week) {
    if (!day) continue;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cnt = dateMap.get(key)?.length ?? 0;
    if (cnt > max) max = cnt;
  }
  return Math.max(max * PDF_PRODUCT_MM + 4, 14);
}

function buildCalendarPDF(
  products: ArrivalProduct[],
  dateMap: Map<string, ArrivalProduct[]>,
  months: { year: number; month: number }[],
  allDates: string[]
) {
  let isFirstTable = true;
  const monthsHTML = months.map(({ year, month }) => {
    const monthTotal = allDates.filter(d => {
      const dd = parseDate(d);
      return dd && dd.getFullYear() === year && dd.getMonth() === month;
    }).reduce((sum, d) => sum + (dateMap.get(d)?.length ?? 0), 0);
    if (monthTotal === 0) return "";

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    // 주 단위로 분할 + 입고 없는 주 제거
    const allWeeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) allWeeks.push(cells.slice(i, i + 7));
    const weeks = allWeeks.filter(week =>
      week.some(day => {
        if (!day) return false;
        const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return (dateMap.get(k)?.length ?? 0) > 0;
      })
    );

    // 추정 높이 기반으로 청크 분리 (각 청크 = 독립 테이블 + 헤더)
    const chunks: (number | null)[][][] = [];
    let curChunk: (number | null)[][] = [];
    let curH = 0;
    for (const week of weeks) {
      const wh = pdfWeekHeightMM(week, dateMap, year, month);
      if (curH + wh > PDF_CONTENT_MM && curChunk.length > 0) {
        chunks.push(curChunk);
        curChunk = [];
        curH = 0;
      }
      curChunk.push(week);
      curH += wh;
    }
    if (curChunk.length > 0) chunks.push(curChunk);

    const dayHeaderCells = DAY_KO.map(d => `<th class="dh">${d}</th>`).join("");
    const theadHTML = `<thead>
      <tr><td colspan="7" class="mh-cell">
        <span class="mt">WORKUP — ${year}. ${MONTH_KO[month]}</span>
        <span class="mc">${monthTotal}개 상품</span>
      </td></tr>
      <tr>${dayHeaderCells}</tr>
    </thead>`;

    return chunks.map(chunk => {
      const weeksHTML = chunk.map(week => {
        const tds = week.map(day => {
          if (!day) return `<td class="ec"></td>`;
          const isoKey   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const items    = dateMap.get(isoKey) ?? [];
          const done     = items.length > 0 && items.every(p => p.status === "입고완료");
          const itemsHTML = items.map(p => {
            const imgSrc      = parseImages(p)[0] ?? "";
            const statusLabel = STATUS_META[p.status]?.label ?? "";
            const statusCls   = p.status === "입고예정" ? "s-upcoming" : p.status === "입고지연" ? "s-delay" : "s-done";
            const bgHex       = brandBgHex(p.brand);
            const pName       = stripBrand(p.productName, p.brand);
            const supplyTxt   = p.supplyPrice && p.supplyPrice > 0 ? `공급 ${p.supplyPrice.toLocaleString("ko-KR")}` : "";
            const priceTxt    = p.price > 0 ? `판매 ${p.price.toLocaleString("ko-KR")}` : "";
            const priceLine   = [supplyTxt, priceTxt].filter(Boolean).join(" / ");
            const qtyTxt      = p.quantity && p.quantity > 0 ? `수량 ${p.quantity.toLocaleString("ko-KR")}` : "";
            return `<div class="pi">
              <div class="pi-img">
                ${imgSrc
                  ? `<img class="pimg" src="${imgSrc}" alt="" />`
                  : `<div class="pimg-no"></div>`}
              </div>
              <div class="pi-body">
                <div class="pi-meta">
                  <span class="${statusCls}">${statusLabel}</span>
                  <span class="pbrand" style="background:${bgHex};color:${brandTextColor(p.brand)};">${p.brand}</span>
                </div>
                <p class="pname">${pName}</p>
                ${priceLine ? `<p class="pprice">${priceLine}</p>` : ""}
                ${qtyTxt ? `<p class="pqty">${qtyTxt}</p>` : ""}
              </div>
            </div>`;
          }).join("");
          return `<td class="cell${done ? " done" : ""}">
            <span class="dn${items.length === 0 ? " dn-empty" : ""}">${day}</span>
            ${itemsHTML}
          </td>`;
        }).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
      const needsBreak = !isFirstTable;
      isFirstTable = false;
      return `<table class="cg${needsBreak ? " cg-break" : ""}">${theadHTML}<tbody>${weeksHTML}</tbody></table>`;
    }).join("");
  }).filter(Boolean).join("");

  if (!monthsHTML) return null;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>WORKUP Arrival Calendar</title>
<style>
  @page { size: A4 landscape; margin: 6mm 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* 각 페이지 청크를 독립 테이블로 생성 → 헤더(월 제목+요일) 100% 반복 보장 */
  .cg { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .cg-break { page-break-before: always; }
  thead { display: table-header-group; }
  tbody { display: table-row-group; }

  /* 월 제목 행 */
  .mh-cell { padding: 2px 0 5px 0; border-bottom: 1.5px solid #1a1a1a; }
  .mt { font-size: 13px; font-weight: 900; letter-spacing: -0.02em; margin-right: 8px; }
  .mc { font-size: 9px; color: #6b7280; font-weight: 600; }

  /* 요일 헤더 */
  .dh {
    text-align: center;
    font-size: 8px;
    font-weight: 800;
    padding: 3px 2px;
    color: #6b7280;
    border: 1px solid #d1d5db;
    letter-spacing: 0.05em;
    background: #fff;
  }

  /* 날짜 셀: page-break 금지 해제 → 테이블이 자연스럽게 페이지를 나눌 수 있어야 thead가 반복됨 */
  .cell {
    padding: 3px 3px 4px;
    vertical-align: top;
    border: 1px solid #d1d5db;
  }
  .ec {
    border: 1px solid #d1d5db;
    min-height: 8mm;
  }

  .dn { display: block; font-size: 10px; font-weight: 900; color: #1a1a1a; margin-bottom: 2px; line-height: 1; }
  .dn-empty { color: #d1d5db; }

  /* 제품 아이템 단위만 잘림 방지 — tr/td 단위 금지 없애야 thead가 매 페이지 반복됨 */
  .pi { margin-bottom: 3px; page-break-inside: avoid; break-inside: avoid; }
  .pi:last-child { margin-bottom: 0; }
  .pi-img { width: 100%; }
  .pi-body { padding: 2px 3px 3px; }

  .pimg     { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
  .pimg-no  { width: 100%; aspect-ratio: 1/1; display: block; }
  .pi-meta    { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; margin-bottom: 1px; }
  .s-upcoming { font-size: 6.5px; font-weight: 700; color: #374151; }
  .s-delay    { font-size: 6.5px; font-weight: 700; color: #b45309; }
  .s-done     { font-size: 6.5px; font-weight: 600; color: #9ca3af; }
  .pbrand     { font-size: 6.5px; font-weight: 700; color: #fff; padding: 1px 3px; border-radius: 2px; }
  .pname    { font-size: 7.5px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
  .pprice   { font-size: 6.5px; color: #6b7280; margin-top: 1px; }
  .pqty     { font-size: 6.5px; color: #6b7280; }
  .cell.done .pname { color: #9ca3af; }
  .cell.done .dn    { color: #9ca3af; }
</style>
</head>
<body>${monthsHTML}</body>
</html>`;
}

// ─── 캘린더 뷰 ───────────────────────────────────────────────────────────────
function CalendarView({ products, onSelect }: {
  products: ArrivalProduct[]; onSelect: (p: ArrivalProduct) => void;
}) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const thisYear  = today.getFullYear();
  const thisMonth = today.getMonth();

  const dateMap = useMemo(() => {
    const m = new Map<string, ArrivalProduct[]>();
    for (const p of products) {
      const key = p.arrivalDate?.trim();
      if (!key) continue;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return m;
  }, [products]);

  const allDates = Array.from(dateMap.keys()).sort();
  if (allDates.length === 0) return (
    <div className="py-20 text-center text-gray-400 text-[14px]">표시할 데이터가 없습니다.</div>
  );

  const minDate = parseDate(allDates[0])!;
  const maxDate = parseDate(allDates[allDates.length-1])!;
  const months: { year: number; month: number }[] = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }

  const isPast = (year: number, month: number) =>
    year < thisYear || (year === thisYear && month < thisMonth);

  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    new Set(months.filter(({ year, month }) => isPast(year, month)).map(({ year, month }) => `${year}-${month}`))
  );
  const toggleCollapse = (key: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  useEffect(() => {
    const target = months.find(({ year, month }) => !isPast(year, month)) ?? months[months.length - 1];
    if (!target) return;
    const id = `cal-month-${target.year}-${target.month}`;
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePDF() {
    const html = buildCalendarPDF(products, dateMap, months, allDates);
    if (!html) return;
    const w = window.open("", "_blank", "width=1400,height=900");
    if (!w) { alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요."); return; }
    w.document.write(html);
    w.document.close();
    // 이미지 로드 완료 후 인쇄 (최대 6초 대기)
    let printed = false;
    const doPrint = () => { if (!printed) { printed = true; w.focus(); w.print(); } };
    const imgs = Array.from(w.document.images);
    if (imgs.length === 0) { setTimeout(doPrint, 300); return; }
    let loaded = 0;
    const onLoad = () => { if (++loaded >= imgs.length) setTimeout(doPrint, 200); };
    imgs.forEach(img => {
      if (img.complete) onLoad();
      else { img.addEventListener("load", onLoad); img.addEventListener("error", onLoad); }
    });
    setTimeout(doPrint, 6000);
  }

  return (
    <div className="space-y-8">
      {/* 안내 + PDF 버튼 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[12px] text-gray-600 flex flex-col sm:flex-row gap-1 sm:gap-3">
          <span><strong className="text-[#1a1a1a]">상품 클릭</strong> → 상세 보기</span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span><strong className="text-[#1a1a1a]">월 헤더</strong> → 접기 / 펼치기</span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-gray-500 sm:hidden">좌우로 스크롤해 이미지를 볼 수 있습니다</span>
          <span className="text-gray-500 hidden sm:inline">PC에서는 이미지가, 모바일에서는 텍스트가 표시됩니다</span>
        </div>
        {/* PDF 버튼: PC 전용 */}
        <button
          onClick={handlePDF}
          className="hidden sm:flex items-center gap-1.5 shrink-0 border border-gray-300 hover:border-[#1a1a1a] text-[12px] font-semibold text-gray-700 hover:text-[#1a1a1a] px-4 py-2.5 rounded-xl transition-colors bg-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PDF 다운로드
        </button>
      </div>

      {months.map(({ year, month }) => {
        const monthKey = `${year}-${month}`;
        const isCollapsed = collapsed.has(monthKey);
        const past = isPast(year, month);

        const monthTotal = allDates.filter(d => {
          const dd = parseDate(d);
          return dd && dd.getFullYear() === year && dd.getMonth() === month;
        }).reduce((sum, d) => sum + (dateMap.get(d)?.length ?? 0), 0);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month+1, 0).getDate();
        const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
        while (cells.length % 7 !== 0) cells.push(null);
        // 주 단위로 분리 후 입고 없는 주 제거
        const weeks: (number|null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
        const activeWeeks = weeks.filter(week =>
          week.some(day => {
            if (!day) return false;
            const k = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            return (dateMap.get(k)?.length ?? 0) > 0;
          })
        );

        return (
          <div key={monthKey} id={`cal-month-${year}-${month}`}>
            {/* 월 헤더 */}
            <button onClick={() => toggleCollapse(monthKey)}
              className="w-full flex items-center gap-3 mb-3 group text-left">
              <span className={`text-[14px] tracking-[0.1em] uppercase font-bold transition-colors ${past ? "text-gray-400" : "text-gray-700"} group-hover:text-gray-900`}>
                {year}. {MONTH_KO[month]}
              </span>
              {monthTotal > 0 && (
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-semibold ${past ? "bg-gray-100 text-gray-500" : "bg-[#1a1a1a]/10 text-gray-700"}`}>
                  {monthTotal}개
                </span>
              )}
              <span className={`ml-auto text-[12px] font-medium ${past ? "text-gray-400" : "text-gray-500"} group-hover:text-gray-700`}>
                {isCollapsed ? "▼ 펼치기" : "▲ 접기"}
              </span>
            </button>

            {isCollapsed ? (
              <div className="flex flex-wrap gap-1.5 px-1 pb-2">
                {allDates
                  .filter(d => { const dd = parseDate(d); return dd && dd.getFullYear() === year && dd.getMonth() === month; })
                  .map(d => {
                    const { dd: dayNum } = fmtDate(d);
                    const count = dateMap.get(d)?.length ?? 0;
                    return (
                      <span key={d} className="text-[12px] text-gray-600 border border-gray-200 rounded px-2 py-0.5 font-medium">
                        {dayNum}일 {count}개
                      </span>
                    );
                  })}
                {monthTotal === 0 && <span className="text-[12px] text-gray-400">입고 일정 없음</span>}
              </div>
            ) : (
              <>
                {/* ── 모바일: 텍스트 전용 ─────────────────────────────────── */}
                <div className="sm:hidden">
                  <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
                    {DAY_KO.map(d => (
                      <div key={d} className="bg-gray-100 text-center text-[10px] text-gray-500 py-1.5 font-bold">{d}</div>
                    ))}
                    {cells.map((day, idx) => {
                      if (!day) return <div key={idx} className="bg-[#fafaf8] min-h-[3.5rem]" />;
                      const isoKey = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const items  = dateMap.get(isoKey) ?? [];
                      const hasItems = items.length > 0;
                      const completedAll = hasItems && items.every(p => p.status === "입고완료");
                      return (
                        <div key={idx} className="bg-white p-1 min-h-[3.5rem]">
                          <span className={`block text-[11px] font-black mb-0.5 ${hasItems && !completedAll ? "text-[#1a1a1a]" : "text-gray-300"}`}>
                            {day}
                          </span>
                          <div className="space-y-0.5">
                            {items.map(p => (
                              <button key={`${p.productCode}_${p.arrivalDate || "none"}`} onClick={() => onSelect(p)}
                                className="w-full text-left transition-opacity hover:opacity-70">
                                <p className="text-[8px] text-gray-800 leading-snug font-semibold line-clamp-2">{p.productName}</p>
                                <p className="text-[7px] text-gray-400 leading-none mt-px">{p.brand}</p>
                                {p.price > 0 && <p className="text-[7px] text-gray-500 leading-none mt-px">₩{p.price.toLocaleString("ko-KR")}</p>}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── PC: 이미지 + 텍스트 (좌우 스크롤) ──────────────────── */}
                <div className="hidden sm:block overflow-x-auto">
                  <div className="min-w-[840px] space-y-px">
                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-xl overflow-hidden border border-b-0 border-gray-200">
                      {DAY_KO.map(d => (
                        <div key={d} className="bg-gray-100 text-center text-[12px] text-gray-500 py-2 font-bold">{d}</div>
                      ))}
                    </div>
                    {/* 입고 있는 주만 렌더 */}
                    {activeWeeks.map((week, wi) => (
                      <div key={wi} className={`grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 ${wi === activeWeeks.length - 1 ? "rounded-b-xl overflow-hidden" : ""}`}>
                        {week.map((day, di) => {
                          if (!day) return <div key={di} className="bg-[#fafaf8]" />;
                          const isoKey     = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                          const items      = dateMap.get(isoKey) ?? [];
                          const hasItems   = items.length > 0;
                          const completedAll = hasItems && items.every(p => p.status === "입고완료");
                          return (
                            <div key={di} className="bg-white p-1.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[13px] font-black leading-none ${hasItems && !completedAll ? "text-[#1a1a1a]" : "text-gray-300"}`}>
                                  {day}
                                </span>
                                {items.length > 0 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none
                                    ${completedAll ? "bg-gray-100 text-gray-400" : "bg-[#1a1a1a] text-white"}`}>
                                    {items.length}
                                  </span>
                                )}
                              </div>
                              {hasItems && (
                                <div className="space-y-2">
                                  {items.map(p => {
                                    const meta = STATUS_META[p.status] ?? STATUS_META["입고예정"];
                                    return (
                                      <button key={`${p.productCode}_${p.arrivalDate || "none"}`} onClick={() => onSelect(p)}
                                        className="w-full text-left transition-opacity hover:opacity-75">
                                        <div className="w-full aspect-square overflow-hidden rounded-sm bg-[#f0efed]">
                                          <MiniThumb product={p} />
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none shrink-0 ${meta.cls}`}>{meta.label}</span>
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none truncate ${brandTextCls(p.brand)} ${brandBg(p.brand)}`}>{p.brand}</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-[#1a1a1a] leading-tight mt-0.5 line-clamp-2">{stripBrand(p.productName, p.brand)}</p>
                                        <div className="mt-0.5 space-y-0">
                                          {p.quantity != null && p.quantity > 0 && (
                                            <p className="text-[9px] text-gray-500">수량 <span className="font-semibold text-[#1a1a1a]">{p.quantity.toLocaleString("ko-KR")}</span></p>
                                          )}
                                          {(p.supplyPrice != null && p.supplyPrice > 0) || p.price > 0 ? (
                                            <p className="text-[9px] text-gray-500 flex gap-1.5">
                                              {p.supplyPrice != null && p.supplyPrice > 0 && <span>공급 <span className="font-semibold text-[#1a1a1a]">{p.supplyPrice.toLocaleString("ko-KR")}</span></span>}
                                              {p.price > 0 && <span>판매 <span className="font-semibold text-[#1a1a1a]">{p.price.toLocaleString("ko-KR")}</span></span>}
                                            </p>
                                          ) : null}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function ArrivalTimeline() {
  const [products,    setProducts]   = useState<ArrivalProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ArrivalProduct | null>(null);

  const [viewMode,  setViewMode]  = useState<ViewMode>("grid");
  const [groupMode, setGroupMode] = useState<GroupMode>("month");

  const [filterBrand,    setFilterBrand]    = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");

  useEffect(() => {
    fetch("/api/arrival")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .finally(() => setLoadingData(false));
  }, []);

  const brands     = useMemo(() => Array.from(new Set(products.map(p => p.brand))).sort(),     [products]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      if (filterBrand    !== "all" && p.brand    !== filterBrand)    return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterStatus   !== "all" && p.status   !== filterStatus)   return false;
      if (q && !p.productName.toLowerCase().includes(q) && !p.productCode.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filterBrand, filterCategory, filterStatus, searchQuery]);

  const grouped = useMemo<[string, ArrivalProduct[]][]>(() => {
    const map = new Map<string, ArrivalProduct[]>();
    for (const p of filtered) {
      let key: string;
      if      (groupMode === "date")     key = p.arrivalDate || "미정";
      else if (groupMode === "month")    key = toMonthKey(p.arrivalDate);
      else if (groupMode === "brand")    key = p.brand || "미분류";
      else                               key = p.category || "미분류";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [filtered, groupMode]);

  // 날짜별 모드로 전환 시 오늘과 가장 가까운 날짜 그룹으로 스크롤
  useEffect(() => {
    if (groupMode !== "date" || viewMode === "calendar" || grouped.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = grouped.find(([key]) => {
      const d = parseDate(key);
      return d !== null && d >= today;
    }) ?? grouped[grouped.length - 1];
    if (!target) return;
    setTimeout(() => {
      document.getElementById(`group-${target[0]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [groupMode, viewMode]);

  const stats = useMemo(() => ({
    total:     products.length,
    completed: products.filter(p => p.status === "입고완료").length,
    upcoming:  products.filter(p => p.status === "입고예정").length,
    brands:    new Set(products.map(p => p.brand)).size,
  }), [products]);

  const resetFilters = useCallback(() => {
    setFilterBrand("all"); setFilterCategory("all");
    setFilterStatus("all"); setSearchQuery("");
  }, []);
  const hasFilter = filterBrand !== "all" || filterCategory !== "all" || filterStatus !== "all" || searchQuery !== "";

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[12px] tracking-[0.2em] text-gray-400 uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* ── 필터 + 뷰 전환 ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 sm:px-10 lg:px-16 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="상품명 / 코드"
            className="border border-gray-300 px-3 py-1.5 text-[13px] rounded-full focus:outline-none focus:border-[#1a1a1a] w-36 text-gray-800 placeholder:text-gray-400" />
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="border border-gray-300 px-2 py-1.5 text-[13px] rounded-full bg-white focus:outline-none focus:border-[#1a1a1a] text-gray-700">
            <option value="all">전체 브랜드</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 px-2 py-1.5 text-[13px] rounded-full bg-white focus:outline-none focus:border-[#1a1a1a] text-gray-700">
            <option value="all">전체 카테고리</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 px-2 py-1.5 text-[13px] rounded-full bg-white focus:outline-none focus:border-[#1a1a1a] text-gray-700">
            <option value="all">전체 상태</option>
            <option value="입고예정">입고예정</option>
            <option value="입고완료">입고완료</option>
            <option value="입고지연">입고지연</option>
            <option value="일정미정">일정미정</option>
          </select>
          {hasFilter && (
            <button onClick={resetFilters} className="text-[12px] text-gray-500 hover:text-[#1a1a1a] underline underline-offset-2 font-medium">초기화</button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* 그룹 기준 (캘린더 뷰 제외) */}
            {viewMode !== "calendar" && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-full p-0.5">
                {([ ["month","월별"], ["date","날짜별"], ["category","카테고리별"], ["brand","브랜드별"] ] as [GroupMode, string][]).map(([mode, label]) => (
                  <button key={mode} onClick={() => setGroupMode(mode)}
                    className={`px-2.5 py-1 text-[12px] font-semibold rounded-full transition-all whitespace-nowrap ${
                      groupMode === mode ? "bg-gray-800 text-white" : "text-gray-600 hover:text-[#1a1a1a]"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {/* 뷰 전환 */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-full p-0.5">
              {([ ["grid","▦ 이미지"], ["list","☰ 리스트"], ["calendar","⊞ 캘린더"] ] as [ViewMode, string][]).map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all whitespace-nowrap ${
                    viewMode === mode ? "bg-[#1a1a1a] text-white" : "text-gray-600 hover:text-[#1a1a1a]"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-gray-600 font-medium shrink-0">{filtered.length}개</span>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="px-6 sm:px-10 lg:px-16 py-6">
        {filtered.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-[13px] text-gray-400">조건에 맞는 상품이 없습니다.</p>
            <button onClick={resetFilters} className="mt-3 text-[12px] text-[#1a1a1a] underline underline-offset-2">필터 초기화</button>
          </div>
        ) : viewMode === "grid" ? (
          <GridView grouped={grouped} groupMode={groupMode} onSelect={setSelectedProduct} />
        ) : viewMode === "list" ? (
          <ListView grouped={grouped} groupMode={groupMode} onSelect={setSelectedProduct} />
        ) : (
          <CalendarView products={filtered} onSelect={setSelectedProduct} />
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
