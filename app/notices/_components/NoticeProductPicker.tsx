"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Product } from "@/data/products";
import DescriptionField from "./DescriptionField";
import CoverAndDetailImagesField from "./CoverAndDetailImagesField";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[가-힣]/g, (c) => c.charCodeAt(0).toString(16));
}

export default function NoticeProductPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 이 화면은 "화면 모아보기"(/notices) 안에 iframe(embed=1)으로 열리기도 하고, 단독 페이지로도 열린다.
  // embed로 열린 상태에서 생성 완료 후 이동하는 페이지도 embed를 유지해야 iframe 안에 헤더가 이중으로 뜨지 않는다.
  const embed = searchParams.get("embed") === "1";
  const goToNotice = (id: string) => router.push(`/notices/${id}${embed ? "?embed=1" : ""}`);

  const [error, setError] = useState("");

  // ── 기존 상품에서 선택 (정식등록되어 실제 노출 중인 상품만 — 임시등록/진열대기는 제외) ──
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) => (p.registrationStatus ?? "정식등록") === "정식등록" && p.status !== "진열대기"
    );
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return [...list]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 30);
  }, [products, query]);

  const openNoticeForm = (productId: string) => {
    setExpandedId((prev) => (prev === productId ? null : productId));
    setExtraDesc("");
    setExtraImages([]);
    setError("");
  };

  const createNotice = async (productId: string) => {
    setError("");
    setCreatingId(productId);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          description: extraDesc.trim() || undefined,
          extra_images: extraImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "공지 생성에 실패했습니다.");
        return;
      }
      goToNotice(data.id);
    } catch {
      setError("네트워크 오류로 공지 생성에 실패했습니다.");
    } finally {
      setCreatingId(null);
    }
  };

  // ── 새 상품 임시등록 ──
  const [qName, setQName] = useState("");
  const [qTagline, setQTagline] = useState("");
  const [qCover, setQCover] = useState("");
  const [qDetailImages, setQDetailImages] = useState<string[]>([]);
  const [qSaving, setQSaving] = useState(false);
  const [info, setInfo] = useState("");
  // 상품 생성은 성공했는데 공지 생성만 실패하는 경우, 재시도 시 상품을 또 만들지 않고
  // 이미 만들어진 상품으로 공지만 다시 시도한다 (중복 상품 생성 방지).
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);

  const showInfo = (text: string) => {
    setInfo(text);
    setTimeout(() => setInfo(""), 4000);
  };

  const quickRegisterAndNotice = async () => {
    if (!createdProduct && !qName.trim()) {
      setError("상품명을 입력해 주세요.");
      return;
    }
    setError("");
    setQSaving(true);
    try {
      let product = createdProduct;
      if (!product) {
        // 같은 상품명으로 재시도해도 충돌하지 않도록 매번 고유한 접미사를 붙인다
        // (products.id가 PK라 slugify(name)만 쓰면 "duplicate key" 오류가 났었다).
        const suffix = Date.now().toString(36).slice(-5);
        const id = `${slugify(qName) || "product"}-${suffix}`;
        const productRes = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            name: qName.trim(),
            tagline: qTagline.trim(),
            imageUrl: qCover || undefined,
            // "나머지 사진들"은 갤러리(subImages)가 아니라 상세페이지(detailBlocks)에 그대로 들어가
            // 정식등록 시 상품 상세 탭의 세로 이미지로 자연스럽게 이어진다.
            detailBlocks: qDetailImages.map((url, i) => ({
              id: `d${i + 1}`,
              type: "상품 소개" as const,
              content: "",
              imageUrl: url,
            })),
            line: "DAILY",
            category: "소품",
            subCategory: "기타",
            registrationStatus: "임시등록",
            // 임시등록은 지점 출고 패스 내부용 — 정식등록 전까지 실제 사이트(고객)에는 노출되지 않아야 한다.
            status: "진열대기",
          }),
        });
        const created = await productRes.json();
        if (!productRes.ok) {
          setError(created.error ?? "임시등록에 실패했습니다.");
          return;
        }
        // 상품 생성은 성공했으므로, 아래 공지 생성이 실패하더라도 재시도 시 상품을 또 만들지 않는다.
        product = { id: created.id, name: created.name };
        setCreatedProduct(product);
      }

      const noticeRes = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, product_name: product.name }),
      });
      const notice = await noticeRes.json();
      if (!noticeRes.ok) {
        setError(`상품은 등록됐지만 공지 생성에 실패했습니다: ${notice.error ?? "알 수 없는 오류"} (다시 시도하면 상품을 새로 만들지 않고 공지만 다시 생성합니다.)`);
        return;
      }
      setCreatedProduct(null);
      goToNotice(notice.id);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setQSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {info && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-lg">{info}</div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-700 mb-3">새 상품 임시등록</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            {createdProduct && (
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 text-[13px] rounded-lg">
                &quot;{createdProduct.name}&quot; 상품은 이미 등록되어 있습니다. 아래 버튼을 다시 누르면 상품을 새로 만들지 않고 공지만 다시 생성합니다.
              </div>
            )}
            <CoverAndDetailImagesField
              cover={qCover}
              onCoverChange={setQCover}
              detailImages={qDetailImages}
              onDetailImagesChange={setQDetailImages}
              onError={setError}
              onInfo={showInfo}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">상품명</label>
              <input
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                placeholder="예: 린넨 셔츠 자켓"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#303236]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">한 줄 설명</label>
              <DescriptionField value={qTagline} onChange={setQTagline} />
            </div>
            <button
              onClick={quickRegisterAndNotice}
              disabled={qSaving}
              className="px-6 py-2.5 text-sm font-bold bg-[#E5541B] text-white rounded-lg hover:bg-[#e04500] disabled:opacity-50"
            >
              {qSaving ? "등록 중..." : "임시등록하고 공지에 추가"}
            </button>
            <p className="text-[12.5px] text-gray-400">
              임시등록 상품은 실제 사이트(고객 화면)에는 노출되지 않습니다. 가격·카테고리 등 나머지 정보는 정식 등록 화면에서 나중에 채우면 됩니다.
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-700 mb-3">기존 상품에서 선택</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상품명 검색"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#303236]"
              />
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  등록된 상품이 없습니다. &quot;새 상품 임시등록&quot;으로 추가해 주세요.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">없음</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[14px] text-gray-900 truncate">{p.name}</p>
                          <p className="text-[12.5px] text-gray-400 truncate">{p.tagline || "설명 없음"}</p>
                        </div>
                        <button
                          onClick={() => openNoticeForm(p.id)}
                          className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            expandedId === p.id
                              ? "bg-gray-100 text-gray-600"
                              : "bg-[#303236] text-white hover:bg-[#1f2124]"
                          }`}
                        >
                          {expandedId === p.id ? "접기" : "이 상품으로 공지"}
                        </button>
                      </div>

                      {expandedId === p.id && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50/70 space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                              공지 추가 설명 <span className="font-normal text-gray-400">(선택)</span>
                            </label>
                            <DescriptionField value={extraDesc} onChange={setExtraDesc} />
                          </div>
                          <CoverAndDetailImagesField
                            showCover={false}
                            cover=""
                            onCoverChange={() => {}}
                            detailImages={extraImages}
                            onDetailImagesChange={setExtraImages}
                            detailLabel="추가 사진 (선택)"
                            detailHint="여기 추가한 사진은 이 공지에서 대표 사진 아래에 함께 노출됩니다. (상품 자체 정보는 변경되지 않습니다)"
                            onError={setError}
                            onInfo={showInfo}
                          />
                          <button
                            onClick={() => createNotice(p.id)}
                            disabled={creatingId === p.id}
                            className="px-6 py-2.5 text-sm font-bold bg-[#E5541B] text-white rounded-lg hover:bg-[#e04500] disabled:opacity-50"
                          >
                            {creatingId === p.id ? "등록 중..." : "공지 등록"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
