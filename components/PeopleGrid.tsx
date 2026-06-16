"use client";
import { useState } from "react";
import Link from "next/link";

type Person = {
  id: number;
  job: string;
  years: string;
  quote: string;
  story: string[];
  theme: string;
  products: { name: string; href: string }[];
  bg: string;
  initial: string;
};

const people: Person[] = [
  {
    id: 1,
    job: "건설 현장직",
    years: "경력 15년",
    quote: "현장에서 옷이 불편하면 사고 납니다.",
    story: [
      "15년 동안 현장을 다녔습니다. 그동안 옷 때문에 불편했던 적이 한두 번이 아니에요.",
      "좁은 공간에서 몸을 구부릴 때, 사다리를 오를 때 — 옷이 당기면 순간적으로 균형을 잃습니다.",
      "좋은 작업복은 단순히 편한 게 아닙니다. 안전입니다.",
    ],
    theme: "안전과 움직임",
    products: [
      { name: "스트레치 카고 팬츠", href: "/products" },
      { name: "경량 방풍 자켓", href: "/products" },
    ],
    bg: "bg-[#1A2B4A]",
    initial: "건",
  },
  {
    id: 2,
    job: "새벽 배달기사",
    years: "경력 4년",
    quote: "비 와도 멈출 수 없어요. 옷이라도 버텨줘야죠.",
    story: [
      "새벽 4시에 나옵니다. 비가 오는 날이 제일 바쁜 날이에요.",
      "날씨가 나쁠수록 주문이 몰립니다. 멈출 수가 없어요.",
      "온몸이 젖은 채로 배달하다 보면 체온이 내려가요. 방수가 되는 옷 하나가 하루를 버티게 해줍니다.",
    ],
    theme: "날씨 대응, 체온 유지",
    products: [
      { name: "기능성 레인코트", href: "/products" },
      { name: "쿨링 반팔 티셔츠", href: "/products" },
    ],
    bg: "bg-[#243d5e]",
    initial: "배",
  },
  {
    id: 3,
    job: "카페 사장",
    years: "창업 3년차",
    quote: "10시간 서 있는 건 나인데, 나를 위한 옷이 없었어요.",
    story: [
      "손님은 잠깐 있다 가지만 저는 하루 종일 서 있습니다.",
      "가볍고 구겨지지 않고 빨아도 멀쩡한 옷. 그게 제가 필요한 거였어요.",
      "작업복은 너무 투박하고, 일반 옷은 금방 상하고. 그 중간이 없었어요.",
    ],
    theme: "장시간 착용, 활동성",
    products: [
      { name: "워크 치노 팬츠", href: "/daily" },
      { name: "워크 롤업 셔츠", href: "/daily" },
    ],
    bg: "bg-[#3D3D3D]",
    initial: "카",
  },
  {
    id: 4,
    job: "물류센터 팀장",
    years: "경력 8년",
    quote: "하루에 만 보 이상 걷습니다. 그게 제 직업이에요.",
    story: [
      "박스를 들고 내리고, 분류하고, 다시 올리고. 반복 동작이 많습니다.",
      "여름에는 땀이 차는 게 제일 문제예요. 끈적한 느낌으로 하루를 버티는 게 고역이었는데.",
      "땀이 빨리 빠지는 소재, 포켓이 많은 옷. 단순한 조건인데 이게 생각보다 없더라고요.",
    ],
    theme: "반복 동작, 흡한속건",
    products: [
      { name: "흡한속건 긴팔 티셔츠", href: "/products" },
      { name: "멀티포켓 조끼", href: "/daily" },
    ],
    bg: "bg-[#2d4f72]",
    initial: "물",
  },
  {
    id: 5,
    job: "제조업 창업자",
    years: "창업 2년차",
    quote: "오전엔 공장 바닥, 오후엔 바이어 미팅. 옷 갈아입을 시간이 없어요.",
    story: [
      "창업하고 나서 생긴 문제예요. 오전에는 생산라인에 있다가 오후에는 외부 미팅이 있어요.",
      "작업복 입고 미팅 가기는 좀 그렇고, 그렇다고 정장을 공장에서 입을 수도 없고.",
      "현장에서도 괜찮고 미팅 테이블에서도 어색하지 않은 옷. 워크업 데일리가 딱 그 역할을 해줍니다.",
    ],
    theme: "현장 + 비즈니스 겸용",
    products: [
      { name: "워크 치노 팬츠", href: "/daily" },
      { name: "헤비 크루넥 스웻셔츠", href: "/daily" },
    ],
    bg: "bg-[#4d4d4d]",
    initial: "창",
  },
  {
    id: 6,
    job: "인테리어 현장 팀장",
    years: "경력 7년",
    quote: "도배, 타일, 전기까지. 하루에 세 가지 일을 합니다.",
    story: [
      "인테리어 현장은 좁고 먼지가 많아요. 가구를 옮기고 바닥을 기어다니는 일이 일상이에요.",
      "무릎이 금방 해지는 게 제일 문제였는데, 이중 보강된 카고 팬츠 입고 나서 1년이 지나도 멀쩡합니다.",
      "포켓이 많은 것도 중요해요. 공구를 수시로 넣고 꺼내야 하니까요.",
    ],
    theme: "무릎 내구성, 수납성",
    products: [
      { name: "리인포스 카고 팬츠", href: "/products" },
      { name: "멀티포켓 조끼", href: "/daily" },
    ],
    bg: "bg-[#3a4f3a]",
    initial: "인",
  },
  {
    id: 7,
    job: "편의점 야간 파트타임",
    years: "2년째",
    quote: "밤새 서 있어도 다리가 덜 붓는 걸 찾았어요.",
    story: [
      "편의점은 혼자 있는 시간이 많아요. 여름엔 덥고, 겨울엔 춥고.",
      "오래 서 있으면 발이 붓고 다리가 무거워지는 게 제일 힘들어요.",
      "스트레치 소재 워크 팬츠 입고 나서 퇴근할 때 느낌이 달라졌어요. 이게 이렇게 차이가 날 줄은 몰랐습니다.",
    ],
    theme: "장시간 착용, 체형 유지",
    products: [
      { name: "워크 치노 팬츠", href: "/daily" },
      { name: "흡한속건 긴팔 티셔츠", href: "/products" },
    ],
    bg: "bg-[#5a4a3a]",
    initial: "편",
  },
  {
    id: 8,
    job: "농산물 직거래 농부",
    years: "농사 12년",
    quote: "논밭에서 하루 종일 입어도 세탁 한 번이면 되더라고요.",
    story: [
      "농사일은 흙 속에서 하는 일이에요. 옷이 더러워지는 건 어쩔 수 없어요.",
      "그래도 세탁 잘 되고 빨리 마르는 게 제일 중요합니다. 매일 세탁해야 하니까요.",
      "가격도 합리적이고 질기기까지 해요. 한 철 지나면 버리던 작업복이 3년째 멀쩡합니다.",
    ],
    theme: "세탁 내구성, 속건",
    products: [
      { name: "스트레치 카고 팬츠", href: "/products" },
      { name: "경량 방풍 자켓", href: "/products" },
    ],
    bg: "bg-[#3d5232]",
    initial: "농",
  },
  {
    id: 9,
    job: "시설관리 담당자",
    years: "경력 10년",
    quote: "건물 옥상부터 지하까지. 하루에 수십 번 계단을 오릅니다.",
    story: [
      "관리하는 건물이 10개가 넘어요. 각 건물 구석구석을 돌아야 해요.",
      "좁은 기계실, 뜨거운 보일러실, 비바람 맞는 옥상. 하루에 다 경험합니다.",
      "어떤 환경에서도 불편하지 않은 옷이 필요했는데, 워크업이 딱 맞았어요. 기능성과 활동성 둘 다 잡았습니다.",
    ],
    theme: "환경 대응, 활동 범위",
    products: [
      { name: "경량 방풍 자켓", href: "/products" },
      { name: "리인포스 카고 팬츠", href: "/products" },
    ],
    bg: "bg-[#2d3f5e]",
    initial: "시",
  },
];

export default function PeopleGrid() {
  const [expanded, setExpanded] = useState<number | null>(null);

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
                <div className={`${person.bg} aspect-[4/3] relative overflow-hidden`}>
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
