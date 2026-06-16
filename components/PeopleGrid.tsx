"use client";
import { useState } from "react";
import Link from "next/link";
import { DEFAULT_PEOPLE, type Person } from "@/data/people";

export default function PeopleGrid({ items }: { items?: Person[] }) {
  const people: Person[] = items && items.length ? items : DEFAULT_PEOPLE;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="py-20 bg-[#F5F2ED]">
      <div className="px-[15px] md:px-[70px]">

        {/* 섹션 헤더 */}
        <div className="mb-14">
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#1A2B4A] leading-tight mb-4">
            일하는 사람이 제일 멋있다.
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed max-w-xl">
            워크업이 만드는 옷의 주인공은 제품이 아닙니다.<br />
            매일 현장에서 땀 흘리는 사람들의 이야기입니다.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const isOpen = expanded === person.id;
            return (
              <div
                key={person.id}
                className="bg-white border border-gray-200 overflow-hidden flex flex-col"
              >
                {/* 사진 영역 */}
                <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: person.bg }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-white">{person.initial}</span>
                    </div>
                    <span className="text-xs text-white/50 tracking-widest uppercase">실제 고객 인터뷰</span>
                  </div>
                  {/* 직종 배지 */}
                  <div className="absolute top-4 left-4 bg-[#ff550c] text-white text-xs px-2 py-1 font-semibold">
                    {person.job}
                  </div>
                </div>

                {/* 카드 본문 */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 mb-2">{person.years}</p>

                  <blockquote className="text-[15px] font-bold text-[#1A2B4A] leading-snug mb-4">
                    "{person.quote}"
                  </blockquote>

                  <button
                    onClick={() => setExpanded(isOpen ? null : person.id)}
                    className="flex items-center gap-1 text-xs text-[#ff550c] font-semibold mb-4 hover:opacity-70 transition-opacity self-start"
                  >
                    {isOpen ? "접기 ▲" : "이야기 읽기 ▼"}
                  </button>

                  {isOpen && (
                    <div className="mb-4 space-y-2 border-t border-gray-100 pt-4">
                      {person.story.map((line, i) => (
                        <p key={i} className="text-[13px] text-gray-600 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">중요하게 여기는 것</p>
                    <p className="text-xs font-semibold text-[#1A2B4A] mb-3">{person.theme}</p>
                    <div className="flex flex-wrap gap-2">
                      {person.products.map((product) => (
                        <Link
                          key={product.name}
                          href={product.href}
                          className="text-xs bg-[#1A2B4A] text-white px-3 py-1 hover:bg-[#ff550c] transition-colors"
                        >
                          {product.name} →
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 CTA */}
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
    </section>
  );
}
