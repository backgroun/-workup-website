import type { PartnerInfo } from "@/data/partnership";

// 가맹·창업 / 입점·제휴 페이지 좌측 소개 패널 (순수 표시용).
// 서버 페이지(PartnershipLayout)와 관리자 미리보기에서 공유해 마크업 드리프트를 막는다.
// 크기·색상은 info.styles의 인라인 스타일로 적용한다.
export default function PartnershipPanel({ info }: { info: PartnerInfo }) {
  const st = info.styles;
  return (
    <div className="px-8 py-10" style={{ backgroundColor: info.panel_bg }}>
      <p className="tracking-widest uppercase mb-3" style={{ fontSize: st.eyebrow.size, color: st.eyebrow.color }}>
        {info.eyebrow}
      </p>
      <h2 className="font-bold mb-4" style={{ fontSize: st.panel_title.size, color: st.panel_title.color }}>
        {info.panel_title}
      </h2>
      <p className="leading-relaxed" style={{ fontSize: st.panel_desc.size, color: st.panel_desc.color }}>
        {info.panel_desc}
      </p>
      {info.benefits.length > 0 && (
        <ul className="mt-7 space-y-3">
          {info.benefits.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2"
              style={{ fontSize: st.benefits.size, color: st.benefits.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: st.bullet_color }}
              />
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 pt-7 border-t border-white/15">
        <p className="tracking-widest uppercase mb-1" style={{ fontSize: st.phone_label.size, color: st.phone_label.color }}>
          {info.phone_label}
        </p>
        <p className="font-semibold" style={{ fontSize: st.phone.size, color: st.phone.color }}>
          {info.phone}
        </p>
        <p className="mt-0.5" style={{ fontSize: st.hours.size, color: st.hours.color }}>
          {info.hours}
        </p>
      </div>
    </div>
  );
}
