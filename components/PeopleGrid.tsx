"use client";
import { useState } from "react";
import Link from "next/link";
import { DEFAULT_PEOPLE, type Person } from "@/data/people";
import MateZone from "@/components/MateZone";
import type { MateZoneConfig } from "@/data/mate-zone";

type PageHeader = { title: string; description: string };

const DEFAULT_HEADER: PageHeader = {
  title: "일하는 사람이 제일 멋있다.",
  description: "워크업이 만드는 옷의 주인공은 제품이 아닙니다.\n매일 현장에서 땀 흘리는 사람들의 이야기입니다.",
};

export default function PeopleGrid({ items, header, mateZone }: { items?: Person[]; header?: PageHeader; mateZone?: MateZoneConfig }) {
  const people: Person[] = items && items.length ? items : DEFAULT_PEOPLE;
  const h = header ?? DEFAULT_HEADER;

  const [current, setCurrent] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  const total = people.length;
  const hasMultiple = total > 1;
  const person = people[current] ?? people[0];

  // 글 전환 시 본문 상단으로 스크롤(블로그처럼 한 편씩 읽는 경험)
  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(total - 1, index)); // 경계 클램프(순환 안 함)
    setCurrent(next);
    setListOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  return (
    <section className="py-20 bg-[#F5F2ED]">
      <div className="px-[15px] md:px-[70px]">

        {/* 섹션 헤더 */}
        <div className="mb-10">
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#1A2B4A] leading-tight mb-4">
            {h.title}
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            {h.description.split("\n").map((line, i) => (
              <span key={i}>{line}{i < h.description.split("\n").length - 1 && <br />}</span>
            ))}
          </p>
        </div>

        {/* 목록 바 — 글이 2편 이상일 때만 */}
        {hasMultiple && (
          <div className="mb-6">
            <div className="flex items-center justify-between border-y border-gray-200 py-3">
              <span className="text-[12px] text-gray-500">
                MATE 이야기 · 총 <span className="font-semibold text-[#1A2B4A]">{total}</span>편 중{" "}
                <span className="font-semibold text-[#ff550c]">{current + 1}</span>편째
              </span>
              <button
                onClick={() => setListOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A2B4A] hover:text-[#ff550c] transition-colors min-h-[44px] px-2"
                aria-expanded={listOpen}
                aria-controls="mate-list"
              >
                {listOpen ? "목록 닫기 ▲" : "전체 목록 보기 ▼"}
              </button>
            </div>

            {/* 전체 글 목록 패널 */}
            {listOpen && (
              <ul id="mate-list" className="mt-3 border border-gray-200 bg-white divide-y divide-gray-100">
                {people.map((p, i) => {
                  const isActive = i === current;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => goTo(i)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors min-h-[44px] ${
                          isActive ? "bg-[#F5F2ED]" : "hover:bg-gray-50"
                        }`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <span className={`text-[11px] font-bold mt-0.5 ${isActive ? "text-[#ff550c]" : "text-gray-300"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">
                          <span className="block text-[12px] text-[#ff550c] font-semibold mb-0.5">{p.job}</span>
                          <span className="block text-[14px] text-[#1A2B4A] font-medium leading-snug">"{p.quote}"</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* 본문 — 한 편의 글 (모바일: 세로 / PC: 사진+본문 2단으로 화면 꽉 채움) */}
        <article className="bg-white border border-gray-200 overflow-hidden grid lg:grid-cols-2 items-stretch">
          {/* 대형 사진 — PC에서는 본문 높이만큼 꽉 채움 */}
          <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto lg:min-h-[560px]" style={{ backgroundColor: person.bg }}>
            {person.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.image_url} alt={person.job} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">{person.initial}</span>
                </div>
                <span className="text-xs text-white/50 tracking-widest uppercase">실제 고객 인터뷰</span>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-[#ff550c] text-white text-xs px-2.5 py-1 font-semibold z-10">
              {person.job}
            </div>
          </div>

          {/* 글 본문 */}
          <div className="p-6 md:p-10 lg:p-14 lg:flex lg:flex-col lg:justify-center">
            <p className="text-xs text-gray-400 mb-3">{person.years}</p>

            <blockquote className="text-[22px] md:text-[26px] font-bold text-[#1A2B4A] leading-snug mb-8">
              "{person.quote}"
            </blockquote>

            <div className="space-y-4 mb-10">
              {person.story.map((line, i) => (
                <p key={i} className="text-[15px] text-gray-700 leading-loose">
                  {line}
                </p>
              ))}
            </div>

            {/* 중요하게 여기는 것 */}
            <div className="border-t border-gray-100 pt-6 mb-8">
              <p className="text-xs text-gray-400 mb-1">중요하게 여기는 것</p>
              <p className="text-[15px] font-semibold text-[#1A2B4A]">{person.theme}</p>
            </div>

            {/* 추천 제품 */}
            <div>
              <p className="text-xs text-gray-400 mb-3">이 분이 함께한 제품</p>
              <div className="flex flex-wrap gap-2">
                {person.products.map((product) => (
                  <Link
                    key={product.name}
                    href={product.href}
                    className="text-[13px] bg-[#1A2B4A] text-white px-4 py-2 hover:bg-[#ff550c] transition-colors"
                  >
                    {product.name} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* 이전 / 다음 이야기 — 해당 방향에 글이 있을 때만 버튼 노출 */}
        {hasPrev || hasNext ? (
          <div className="mt-6 flex gap-3">
            {hasPrev && (
              <button
                onClick={() => goTo(current - 1)}
                className="flex-1 flex flex-col items-start border border-gray-200 bg-white px-5 py-4 text-left hover:border-[#ff550c] transition-colors min-h-[44px]"
              >
                <span className="text-[11px] text-gray-400 mb-1">← 이전 이야기</span>
                <span className="text-[13px] font-medium text-[#1A2B4A] line-clamp-1">
                  {people[current - 1].job}
                </span>
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => goTo(current + 1)}
                className="flex-1 flex flex-col items-end border border-gray-200 bg-white px-5 py-4 text-right hover:border-[#ff550c] transition-colors min-h-[44px]"
              >
                <span className="text-[11px] text-gray-400 mb-1">다음 이야기 →</span>
                <span className="text-[13px] font-medium text-[#1A2B4A] line-clamp-1">
                  {people[current + 1].job}
                </span>
              </button>
            )}
          </div>
        ) : (
          <p className="mt-6 text-center text-[13px] text-gray-400">
            더 많은 이야기가 곧 추가됩니다.
          </p>
        )}

        {/* MATE ZONE — 같은 페이지 흐름 안의 릴스 영역(릴스 없으면 자동 숨김) */}
        {mateZone && <MateZone config={mateZone} />}

      </div>

      {/* 데스크톱 우하단 고정 CTA — 글을 읽는 내내 매장 방문 유도(모바일은 전역 하단바 '매장' 탭이 담당) */}
      <Link
        href="/store"
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-[#ff550c] text-white text-[14px] font-semibold px-6 py-3.5 rounded-full shadow-[0_4px_20px_rgba(255,85,12,0.35)] hover:bg-[#1A2B4A] transition-colors"
      >
        가까운 매장 찾기 →
      </Link>
    </section>
  );
}
