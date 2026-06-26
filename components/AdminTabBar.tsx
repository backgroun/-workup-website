"use client";
import { useAdminUI } from "./admin-ui-context";

/** 우측 본문 상단의 멀티탭 스트립. 열었던 페이지를 탭으로 유지한다. */
export default function AdminTabBar() {
  const { tabs, currentHref, selectTab, closeTab } = useAdminUI();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-stretch gap-1 bg-white border-b border-slate-200 px-2 h-11 flex-shrink-0 overflow-x-auto admin-tabbar">
      {tabs.map((tab) => {
        const active = tab.href === currentHref;
        return (
          <div
            key={tab.href}
            onClick={() => selectTab(tab.href)}
            title={tab.label}
            className={`group/tab flex items-center my-1.5 pl-3 pr-1.5 rounded-md max-w-[180px] cursor-pointer select-none transition-colors ${
              active
                ? "bg-[#1d4ed8] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="truncate text-[13px] font-medium">{tab.label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.href);
              }}
              aria-label={`${tab.label} 탭 닫기`}
              className={`ml-1.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
                active ? "text-white/80 hover:bg-white/20" : "text-slate-400 hover:bg-slate-300"
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
