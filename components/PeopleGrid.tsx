"use client";
import { useState } from "react";
import Link from "next/link";
import { DEFAULT_PEOPLE, type Person } from "@/data/people";

type PageHeader = { title: string; description: string };

const DEFAULT_HEADER: PageHeader = {
  title: "일하는 사람이 제일 멋있다.",
  description: "워크업이 만드는 옷의 주인공은 제품이 아닙니다.\n매일 현장에서 땀 흘리는 사람들의 이야기입니다.",
};

export default function PeopleGrid({ items, header }: { items?: Person[]; header?: PageHeader }) {
  const people: Person[] = items && items.length ? items : DEFAULT_PEOPLE;
  const h = header ?? DEFAULT_HEADER;

  const [current, setCurrent] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  const total = people.length;
  const hasMultiple = total > 1;
  const person = people[current] ?? people[0];

  // 글 전환 시 본문 상단으로 스크롤(블로그처럼 한 편씩 읽는 경험)
  const goTo = (index: number) => {
    const next = ((index % total) + total) % total; // 순환
    setCurrent(next);
    setListOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-[#F5F2ED]">
      <div className="px-[15px] md:px-[70px] max-w-3xl mx-auto">

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

        {/* 본문 — 한 편의 글 */}
        <article className="bg-white border border-gray-200 overflow-hidden">
          {/* 대형 사진 */}
          <div className="aspect-[16/10] relative overflow-hidden" style={{ backgroundColor: person.bg }}>
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
          <div className="p-6 md:p-10">
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
            <div className="mb-8">
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

            {/* 글 하단 CTA — 오프라인 방문 유도 */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-[13px] text-gray-500 mb-4">
                매장에서 직접 입어보고, 내 일에 맞는 옷인지 확인해보세요.
              </p>
              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#ff550c] text-white text-[14px] font-semibold px-8 py-3 min-h-[48px] hover:bg-[#1A2B4A] transition-colors"
              >
                가까운 매장 찾기 →
              </Link>
            </div>
          </div>
        </article>

        {/* 이전 / 다음 이야기 — 글이 2편 이상일 때만 */}
        {hasMultiple ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => goTo(current - 1)}
              className="flex flex-col items-start border border-gray-200 bg-white px-5 py-4 text-left hover:border-[#ff550c] transition-colors min-h-[44px]"
            >
              <span className="text-[11px] text-gray-400 mb-1">← 이전 이야기</span>
              <span className="text-[13px] font-medium text-[#1A2B4A] line-clamp-1">
                {people[((current - 1) % total + total) % total].job}
              </span>
            </button>
            <button
              onClick={() => goTo(current + 1)}
              className="flex flex-col items-end border border-gray-200 bg-white px-5 py-4 text-right hover:border-[#ff550c] transition-colors min-h-[44px]"
            >
              <span className="text-[11px] text-gray-400 mb-1">다음 이야기 →</span>
              <span className="text-[13px] font-medium text-[#1A2B4A] line-clamp-1">
                {people[(current + 1) % total].job}
              </span>
            </button>
          </div>
        ) : (
          <p className="mt-6 text-center text-[13px] text-gray-400">
            더 많은 이야기가 곧 추가됩니다.
          </p>
        )}

        {/* 하단 CTA — YOUR STORY */}
        <div className="mt-16 border border-gray-200 bg-white px-8 py-10">
          <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-3">YOUR STORY</p>
          <p className="text-[20px] font-bold text-[#1A2B4A] mb-2">
            당신의 이야기도 워크업과 함께하고 있나요?
          </p>
          <p className="text-[13px] text-gray-500 mb-6">
            직접 경험한 워크업 이야기를 들려주세요.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 border border-[#1A2B4A] text-[#1A2B4A] text-[12px] tracking-widest font-medium px-8 py-3 hover:bg-[#1A2B4A] hover:text-white transition-colors"
          >
            가까운 매장 방문하기 →
          </Link>
        </div>

        {/* Instagram */}
        <div className="mt-10 bg-white border border-gray-200 px-8 py-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-1">Instagram</p>
            <p className="text-[18px] font-bold text-[#1A2B4A] mb-1">@workup_official_kr</p>
            <p className="text-[13px] text-gray-500">일하는 사람들의 일상을 팔로우하세요.</p>
          </div>
          <a
            href="https://www.instagram.com/workup_official_kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            팔로우하기
          </a>
        </div>

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
