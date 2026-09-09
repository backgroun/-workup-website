import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStorePassHistoryByToken } from "@/lib/notices";
import PassPageShell from "../_components/PassPageShell";
import MonthNavigator from "./_components/MonthNavigator";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
};

export const revalidate = 0;

function kstNow() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const STATUS_STYLE: Record<string, string> = {
  출고: "bg-blue-50 text-blue-600 border-blue-200",
  패스: "bg-gray-100 text-gray-500 border-gray-200",
};

export default async function PassHistoryPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const { year: todayYear, month: todayMonth } = kstNow();

  const year = sp.year ? Number(sp.year) : todayYear;
  const month = sp.month ? Number(sp.month) : todayMonth;

  const result = await getStorePassHistoryByToken(token, year, month);
  if (!result) notFound();

  const { storeName, items } = result;

  // 날짜별로 그룹핑
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    if (!grouped.has(item.noticeDate)) grouped.set(item.noticeDate, []);
    grouped.get(item.noticeDate)!.push(item);
  }
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <PassPageShell>
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-3 px-1 flex items-center gap-2">
          <Link
            href={`/b/${token}`}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 text-lg flex-shrink-0"
          >
            ‹
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#303236] leading-snug truncate">{storeName}</h1>
            <p className="text-[11px] text-gray-400">패스현황</p>
          </div>
        </div>

        {/* 월 네비게이터 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-4">
          <MonthNavigator
            year={year}
            month={month}
            maxYear={todayYear}
            maxMonth={todayMonth}
          />
        </div>

        {/* 리스트 */}
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-[13px] text-gray-400">
            {year}년 {month}월 패스 기록이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedDates.map((date) => {
              const dayItems = grouped.get(date)!;
              const [, , dd] = date.split("-");
              return (
                <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* 날짜 헤더 */}
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-[12px] font-bold text-gray-600">{month}월 {Number(dd)}일</span>
                  </div>
                  {/* 아이템 목록 */}
                  <ul className="divide-y divide-gray-50">
                    {dayItems.map((item) => (
                      <li key={item.noticeId} className="flex items-center gap-3 px-4 py-2.5">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <span className="flex-1 text-[13px] text-[#303236] font-medium leading-snug">
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.passStatus ? (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLE[item.passStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {item.passStatus}
                            </span>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border bg-orange-50 text-orange-400 border-orange-200">
                                미응답
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-600 border-blue-200">
                                출고
                              </span>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PassPageShell>
  );
}
