"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { DEFAULT_FOOTER, type FooterConfig } from "@/lib/site-content";

const navLinks = [
  { label: "고객센터",       href: "/support" },
  { label: "1:1문의",        href: "/support" },
  { label: "가맹·창업문의",  href: "/partnership/franchise" },
  { label: "입점·제휴문의",  href: "/partnership/wholesale" },
];

const InstagramIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const YouTubeIcon = (
  <svg width="24" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const KakaoIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.477 3 2 6.582 2 11c0 2.7 1.56 5.087 3.938 6.574L5 21l4.187-2.201C9.758 18.927 10.865 19 12 19c5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
  </svg>
);

export default function Footer({ config }: { config?: FooterConfig | null }) {
  const c = config ?? DEFAULT_FOOTER;
  const [bizOpen, setBizOpen] = useState(false);

  const socials = [
    { label: "Instagram", href: c.instagram_url, icon: InstagramIcon },
    { label: "YouTube", href: c.youtube_url, icon: YouTubeIcon },
    { label: "카카오채널", href: c.kakao_url, icon: KakaoIcon },
  ].filter((s) => s.href && s.href.trim());

  const bizInfo = (
    <>
      <p>상호명 : {c.company_name}</p>
      <p>대표 : {c.ceo}</p>
      <p>주소 : {c.address}</p>
      <p>사업자등록번호 : {c.biz_no}</p>
      <p>통신판매업 신고번호 : {c.mail_order_no}</p>
    </>
  );

  return (
    <footer className="bg-white border-t border-gray-200">

      {/* ── 상단 링크 바 + TOP 버튼 ── */}
      <div className="border-b border-gray-100">
        <div className="px-[15px] md:px-[70px] py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#1A2B4A] transition-colors tracking-widest self-end md:order-last flex-shrink-0"
            aria-label="맨 위로"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            TOP
          </button>
          <div className="flex items-center gap-x-4 md:gap-x-7">
            <Link href="/story" className="text-[11px] md:text-[12px] text-gray-600 hover:text-[#1A2B4A] transition-colors whitespace-nowrap">
              About WORKUP
            </Link>
            <Link href="/store" className="text-[11px] md:text-[12px] text-gray-600 hover:text-[#1A2B4A] transition-colors whitespace-nowrap">
              매장안내
            </Link>
            <Link href="/terms" className="text-[11px] md:text-[12px] text-gray-600 hover:text-[#1A2B4A] transition-colors whitespace-nowrap">
              이용약관
            </Link>
            <Link href="/privacy" className="text-[11px] md:text-[12px] font-bold text-gray-800 hover:text-[#1A2B4A] transition-colors whitespace-nowrap">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>

      {/* ══ 데스크탑 푸터 (md 이상) ══ */}
      <div className="hidden md:block px-[70px] py-12">
        <div className="grid grid-cols-3 gap-16">

          {/* 열 1: 로고 + 내비 */}
          <div>
            <Link href="/" className="inline-block mb-8">
              <Image src="/images/logo_black.png" alt="WORKUP" width={100} height={14} className="h-[14px] w-[100px] opacity-50" />
            </Link>
            <nav className="flex flex-col gap-[18px]">
              {navLinks.map((item) => (
                <Link key={item.label} href={item.href}
                  className="text-[15px] text-[#1A2B4A] hover:opacity-50 transition-opacity leading-none">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 열 2: 회사 정보 + 임직원 인증 + 소셜 */}
          <div className="flex flex-col">
            <div className="text-[12px] text-gray-500 leading-[1.9]">{bizInfo}</div>
            <Link href="/admin"
              className="mt-3 text-[11px] text-gray-400 hover:text-[#1A2B4A] transition-colors inline-block">
              임직원 인증
            </Link>

            {socials.length > 0 && (
              <div className="flex items-center gap-5 mt-7">
                {socials.map(({ label, href, icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="text-gray-500 hover:text-[#1A2B4A] transition-colors">
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 열 3: 고객센터 */}
          <div>
            <p className="text-[12px] text-gray-500 mb-1">고객센터</p>
            <p className="text-[22px] font-bold text-[#1A2B4A] mb-3">{c.cs_phone}</p>
            <div className="text-[12px] text-gray-500 leading-[1.9]">
              <p>{c.cs_hours_weekday}</p>
              <p>{c.cs_hours_weekend}</p>
            </div>
            <Link href="/support" className="mt-4 inline-block text-[12px] font-semibold text-[#ff550c] hover:underline">
              1:1 문의하기 →
            </Link>
          </div>

        </div>
      </div>

      {/* ══ 모바일 푸터 (md 미만) ══ */}
      <div className="md:hidden px-[15px] py-8">
        <Link href="/" className="inline-block mb-6">
          <Image src="/images/logo_black.png" alt="WORKUP" width={100} height={14} className="h-[14px] w-[100px] opacity-50" />
        </Link>

        <nav className="flex flex-col gap-4 mb-6">
          {navLinks.map((item) => (
            <Link key={item.label} href={item.href} className="text-[14px] text-[#1A2B4A]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200">
          <button
            onClick={() => setBizOpen(!bizOpen)}
            className="w-full flex items-center justify-center gap-1.5 py-4"
          >
            <span className="text-[13px] text-gray-600">{c.company_name} 사업자정보</span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${bizOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {bizOpen && (
            <div className="pb-6">
              <div className="text-[12px] text-gray-500 leading-[2] mb-3">{bizInfo}</div>
              <Link href="/admin"
                className="block text-[12px] text-gray-400 hover:text-[#1A2B4A] transition-colors mb-5">
                임직원 인증
              </Link>

              {socials.length > 0 && (
                <div className="flex items-center gap-5 mb-5">
                  {socials.map(({ label, href, icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-gray-500">
                      {icon}
                    </a>
                  ))}
                </div>
              )}

              <div className="text-[12px] text-gray-500 leading-[1.9]">
                <p className="font-semibold text-[#1A2B4A] text-[13px] mb-1">
                  고객센터 <span className="font-bold">{c.cs_phone}</span>
                </p>
                <p>{c.cs_hours_weekday}</p>
                <p>{c.cs_hours_weekend}</p>
                <Link href="/support" className="mt-2 inline-block text-[12px] font-semibold text-[#ff550c]">
                  1:1 문의하기 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 카피라이트 ── */}
      <div className="border-t border-gray-100 px-[15px] md:px-[70px] py-4">
        <p className="text-[11px] text-gray-400">{c.copyright}</p>
      </div>

    </footer>
  );
}
