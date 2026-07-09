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

  const hasWorkMoments = person.workMoments.photos.length > 0 || !!person.workMoments.video;
  const hasQna = person.qna.some((qa) => qa.q.trim());
  const hasProducts = person.products.some((p) => p.name.trim());
  const ig = person.instagram;
  const hasInstagram = !!ig && !!ig.handle.trim() && (ig.reels.length > 0 || ig.photos.length > 0);

  return (
    <section className="bg-[#F5F2ED]">
      <div className="px-[15px] md:px-[70px] py-10">
        {/* 섹션 헤더 */}
        <div className="mb-8">
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#1A2B4A] leading-tight mb-3">
            {h.title}
          </h1>
          <p className="text-[13px] text-gray-500 leading-relaxed">
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
                          <span className="block text-[14px] text-[#1A2B4A] font-medium leading-snug">
                            {p.quote.split("\n")[0]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── 히어로 ── */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-[#1A2B4A]">
        {person.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.image_url} alt={person.job} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1A2B4A,#101a30)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-[15px] md:px-[70px]">
          <span className="text-[#ff550c] text-[12px] md:text-[13px] font-bold tracking-wider mb-3">WORKUP MATE</span>
          <h2 className="text-white text-[26px] md:text-[42px] font-bold leading-tight mb-4 max-w-[600px]">
            {person.quote.split("\n").map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h2>
          <p className="text-white/80 text-[13px] md:text-[15px]">
            {person.job} {person.job && person.years && <span className="mx-1.5 text-white/40">|</span>} {person.years}
          </p>
        </div>
      </div>

      <div className="px-[15px] md:px-[70px]">
        {/* ── WORK MOMENTS ── */}
        {hasWorkMoments && (
          <div className="py-12 md:py-16 border-b border-gray-200">
            <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
              <div>
                <h3 className="text-[13px] font-bold tracking-wider text-[#1A2B4A] mb-3">WORK MOMENTS</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-4">현장의 순간들을<br />기록합니다.</p>
                {ig?.link && (
                  <a href={ig.link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#1A2B4A] hover:text-[#ff550c] transition-colors">
                    더 많은 사진/영상 보기 →
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {person.workMoments.photos.map((url, i) => (
                  <div key={i} className="aspect-[3/4] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {person.workMoments.video && (
                  <div className="relative aspect-[3/4] overflow-hidden bg-black">
                    <video src={person.workMoments.video} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[#1A2B4A] ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── INTERVIEW ── */}
        {hasQna && (
          <div className="py-12 md:py-16 border-b border-gray-200">
            <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-10">
              <div>
                <h3 className="text-[13px] font-bold tracking-wider text-[#1A2B4A] mb-3">INTERVIEW</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">그가 들려주는<br />이야기</p>
              </div>
              <InterviewAccordion qna={person.qna} />
            </div>
          </div>
        )}

        {/* ── WEAR THIS ── */}
        {hasProducts && (
          <div className="py-12 md:py-16 border-b border-gray-200">
            <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
              <div>
                <h3 className="text-[13px] font-bold tracking-wider text-[#1A2B4A] mb-3">WEAR THIS</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">실제 현장에서<br />착용한 제품</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {person.products.filter((p) => p.name.trim()).map((product, i) => (
                  <Link key={i} href={product.href} className="group block">
                    <div className="aspect-square bg-gray-100 overflow-hidden mb-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                      ) : null}
                    </div>
                    <p className="text-[14px] font-semibold text-[#1A2B4A] mb-1">{product.name}</p>
                    <span className="text-[12px] text-gray-500 group-hover:text-[#ff550c] transition-colors">자세히 보기 →</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INSTAGRAM ── */}
        {hasInstagram && ig && (
          <div className="py-12 md:py-16">
            <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-10 items-start">
              <div>
                <h3 className="text-[13px] font-bold tracking-wider text-[#1A2B4A] mb-3">INSTAGRAM</h3>
                <p className="text-[14px] font-semibold text-[#1A2B4A] mb-2">{ig.handle}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
                  {ig.description.split("\n").map((line, i) => (
                    <span key={i}>{line}{i < ig.description.split("\n").length - 1 && <br />}</span>
                  ))}
                </p>
                {ig.link && (
                  <a href={ig.link} target="_blank" rel="noopener noreferrer"
                    className="inline-block text-[13px] font-semibold bg-[#1A2B4A] text-white px-4 py-2.5 hover:bg-[#ff550c] transition-colors">
                    인스타그램 바로가기 →
                  </a>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {ig.reels.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-gray-400 mb-2">REELS</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ig.reels.slice(0, 3).map((url, i) => (
                        <div key={i} className="relative aspect-[9/16] overflow-hidden bg-black">
                          {url.match(/\.(mp4|webm|mov)$/i) ? (
                            <video src={url} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {ig.photos.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-gray-400 mb-2">PHOTOS</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ig.photos.slice(0, 6).map((url, i) => (
                        <div key={i} className="aspect-square overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 이전 / 다음 이야기 — 해당 방향에 글이 있을 때만 버튼 노출 */}
        {hasPrev || hasNext ? (
          <div className="pb-10 flex gap-3">
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
          <p className="pb-10 text-center text-[13px] text-gray-400">
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

function InterviewAccordion({ qna }: { qna: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const items = qna.filter((item) => item.q.trim());

  return (
    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left min-h-[44px]"
              aria-expanded={isOpen}
            >
              <span className="text-[14px] md:text-[15px] text-[#1A2B4A]">
                <span className="font-bold text-[#ff550c] mr-2">Q{i + 1}.</span>
                {item.q}
              </span>
              <span className="text-[18px] text-gray-400 flex-shrink-0">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && item.a.trim() && (
              <div className="pb-5 pr-8">
                <p className="text-[14px] text-gray-600 leading-loose whitespace-pre-line">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
