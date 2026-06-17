import Link from "next/link";
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600"] });

export default function AnnouncementBanner() {
  return (
    <div className="sticky top-0 z-[60] bg-[#ff550c] h-9 flex items-center">
      <div className="px-[15px] md:px-[70px] w-full flex items-center justify-between gap-4">
        <p className={`${oxanium.className} text-[9px] md:text-[11px] font-semibold text-white tracking-[0.14em] whitespace-nowrap`}>
          EVERY WORKER EVERY WEAR
        </p>
        <div className="flex items-center gap-2">
          <Link href="/catalog" className="text-[11px] font-bold text-white hover:opacity-60 transition-opacity whitespace-nowrap">
            카탈로그
          </Link>
          <span className="text-white/40 text-[10px]">|</span>
          <Link href="/brands" className="text-[11px] font-bold text-white hover:opacity-60 transition-opacity whitespace-nowrap">
            브랜드
          </Link>
          <span className="text-white/40 text-[10px]">|</span>
          <Link href="/partnership" className="text-[11px] font-bold text-white hover:opacity-60 transition-opacity whitespace-nowrap">
            가맹/제휴문의
          </Link>
        </div>
      </div>
    </div>
  );
}
