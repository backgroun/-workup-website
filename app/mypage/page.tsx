"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, FITTING_LIST_KEY } from "@/contexts/CartContext";
import PasswordInput from "@/components/PasswordInput";

type MemberInfo = {
  id: string | number;
  name: string;
  email: string;
  grade: string;
};

type MyInquiry = {
  id: number;
  type: string;
  typeLabel: string;
  status: "new" | "processing" | "done" | string;
  createdAt: string;
  title: string;
  content: string;
  reply: string;
  repliedAt: string;
};

type NearbyStore = { id: number; name: string; distance: number };

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  return km < 1 ? `~${Math.round(km * 1000)}m` : `~${km.toFixed(1)}km`;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new:        { label: "접수",     cls: "bg-gray-100 text-gray-600" },
  processing: { label: "처리중",   cls: "bg-amber-100 text-amber-700" },
  done:       { label: "답변완료", cls: "bg-green-100 text-green-700" },
};

// PC(2×2 배치)에서 4개 카드를 동일한 크기로 맞추는 고정 높이.
// 내용이 넘치는 카드(문의 내역 등)는 내부 스크롤로 처리한다.
const CARD_H = "lg:h-[260px]";
const CARD_CLS = "bg-white border border-gray-300";

// 마이페이지(고객 화면)에 노출할 등급만 화이트리스트로 관리한다.
// "관리자"는 내부 운영 등급이라 고객 화면에는 보여주지 않는다.
const VISIBLE_GRADES = ["일반회원", "VIP", "VVIP", "도매회원", "거래처"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

const GRADE_COLOR: Record<string, string> = {
  일반회원: "bg-gray-100 text-gray-600",
  VIP:     "bg-amber-100 text-amber-700",
  VVIP:    "bg-purple-100 text-purple-700",
  도매회원:  "bg-blue-100 text-blue-700",
  거래처:   "bg-green-100 text-green-700",
  관리자:   "bg-red-100 text-red-700",
};

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.currentPassword || !form.newPassword) {
      setError("모든 항목을 입력해주세요."); return;
    }
    if (form.newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다."); return;
    }
    if (form.newPassword !== form.newPasswordConfirm) {
      setError("새 비밀번호가 일치하지 않습니다."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/member/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setDone(true);
      else setError(d.error ?? "비밀번호 변경에 실패했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">비밀번호 변경</h2>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-700">비밀번호가 변경됐습니다.</p>
            <button onClick={onClose}
              className="mt-5 w-full py-3 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] transition-colors">
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">현재 비밀번호</label>
              <PasswordInput
                value={form.currentPassword} onChange={e => set("currentPassword", e.target.value)}
                autoComplete="current-password"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">새 비밀번호</label>
              <PasswordInput
                value={form.newPassword} onChange={e => set("newPassword", e.target.value)}
                placeholder="8자 이상" autoComplete="new-password"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">새 비밀번호 확인</label>
              <PasswordInput
                value={form.newPasswordConfirm} onChange={e => set("newPasswordConfirm", e.target.value)}
                placeholder="새 비밀번호 재입력" autoComplete="new-password"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-[#303236] focus:ring-2 focus:ring-[#303236]/10 transition-colors"
              />
            </div>
            <div className="pt-1 flex gap-2.5">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-[#303236] text-white text-sm font-semibold rounded-lg hover:bg-[#243d5e] disabled:opacity-50 transition-colors">
                {saving ? "변경 중..." : "변경하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MyPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { items: wishlist } = useCart();
  const router = useRouter();
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/member/me")
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.replace("/member/login");
        } else {
          setMember(data);
        }
      })
      .catch(() => router.replace("/member/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // 내가 남긴 문의 내역 (로그인 상태에서 작성한 문의만 연결됨)
  useEffect(() => {
    if (!member) return;
    fetch("/api/member/inquiries")
      .then(r => (r.ok ? r.json() : []))
      .then(data => setInquiries(Array.isArray(data) ? data : []))
      .catch(() => setInquiries([]))
      .finally(() => setInquiriesLoading(false));
  }, [member]);

  // 현재 위치 기준 가까운 매장 3곳
  useEffect(() => {
    if (!member) return;
    if (!navigator.geolocation) { setNearbyStatus("error"); return; }
    setNearbyStatus("loading");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        fetch("/api/stores")
          .then(r => r.json())
          .then((stores: { id: number; name: string; lat: number; lng: number }[]) => {
            const sorted = (Array.isArray(stores) ? stores : [])
              .map(s => ({ id: s.id, name: s.name, distance: haversine(lat, lng, s.lat, s.lng) }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 3);
            setNearbyStores(sorted);
            setNearbyStatus("success");
          })
          .catch(() => setNearbyStatus("error"));
      },
      () => setNearbyStatus("error"),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [member]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/member/logout", { method: "POST" });
    // 찜은 계정에 저장되므로, 이 기기의 캐시는 지워 다음 사용자에게 노출되지 않게 한다.
    try { localStorage.removeItem(FITTING_LIST_KEY); } catch {}
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <span className="w-7 h-7 border-2 border-[#303236] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 lg:px-12 py-12">
      <div className="max-w-md lg:max-w-none 2xl:max-w-[1680px] mx-auto">

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#303236]">{member.name}님, 안녕하세요.</h1>
        </div>

        {/* PC(lg~)에서는 2×2 배치로 4개 카드를 동일한 크기(CARD_H)로 맞춘다. 모바일은 1열 유지. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

        {/* 회원 정보 카드 */}
        <div className={`${CARD_CLS} p-7 lg:p-8 ${CARD_H} lg:overflow-y-auto`}>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">이름</span>
              <span className="font-medium text-gray-800">{member.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">아이디</span>
              <span className="font-medium text-gray-800">{member.email}</span>
            </div>

            {/* 가까운 매장 3곳 (현재 위치 기준) */}
            {nearbyStatus === "loading" && (
              <p className="text-xs text-gray-400 pt-1">가까운 매장 확인 중...</p>
            )}
            {nearbyStatus === "success" && nearbyStores.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">가까운 매장</p>
                <ul className="space-y-1.5">
                  {nearbyStores.map(s => (
                    <li key={s.id}>
                      <Link href={`/store?store=${s.id}`}
                        className="flex items-center justify-between text-sm text-gray-700 hover:text-[#303236] transition-colors">
                        <span className="truncate">{s.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDist(s.distance)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {VISIBLE_GRADES.includes(member.grade) && (
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-gray-400">회원등급</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${GRADE_COLOR[member.grade] ?? "bg-gray-100 text-gray-600"}`}>
                  {member.grade}
                </span>
              </div>
            )}
            <button onClick={() => setShowPasswordModal(true)}
              className="w-full mt-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
              비밀번호 변경
            </button>
          </div>
        </div>

        {/* 찜한 제품 */}
        <div className={`${CARD_CLS} overflow-hidden flex flex-col ${CARD_H}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <p className="text-sm font-bold text-gray-800">찜한 제품</p>
            {wishlist.length > 0 && (
              <Link href="/cart" className="text-xs text-gray-400 hover:text-[#303236] transition-colors">
                전체 보기 ({wishlist.length})
              </Link>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
              <p className="text-sm text-gray-400">찜한 제품이 없습니다.</p>
              <Link href="/products" className="inline-block mt-3 text-sm font-semibold text-[#303236] hover:underline">
                제품 보러 가기
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 grid grid-cols-4 gap-3">
                {wishlist.slice(0, 4).map(item => (
                  <Link key={item.cartId} href={`/products/${item.productId}`} className="group">
                    {/* 이미지가 없는 제품은 제품 대표색(bg)이 보이도록 — 제품 카드와 동일한 방식 */}
                    <div className={`${item.bg} aspect-square rounded-lg overflow-hidden`}>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform"
                        />
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-600 line-clamp-1">{item.name}</p>
                  </Link>
                ))}
              </div>
              <p className="px-5 pb-4 text-xs text-gray-400">
                매장을 방문하시면 찜한 제품을 직접 입어보실 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 내 문의 내역 */}
        <div className={`${CARD_CLS} overflow-hidden flex flex-col ${CARD_H}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <p className="text-sm font-bold text-gray-800">내 문의 내역</p>
            {inquiries.length > 0 && (
              <span className="text-xs text-gray-400">{inquiries.length}건</span>
            )}
          </div>

          {inquiriesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-[#303236] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
              <p className="text-sm text-gray-400">아직 남기신 문의가 없습니다.</p>
              <Link href="/support" className="inline-block mt-3 text-sm font-semibold text-[#303236] hover:underline">
                1:1 문의하기
              </Link>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {inquiries.map(inq => {
                const meta = STATUS_META[inq.status] ?? STATUS_META.new;
                const isOpen = openId === inq.id;
                const heading = inq.title || inq.content || inq.typeLabel;
                return (
                  <li key={inq.id}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : inq.id)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">{inq.typeLabel}</span>
                        <span className="text-xs text-gray-300 ml-auto">{fmtDate(inq.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-1">{heading}</p>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 space-y-3">
                        {inq.content && (
                          <div className="bg-gray-50 rounded-lg px-4 py-3">
                            <p className="text-xs font-semibold text-gray-400 mb-1">문의 내용</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.content}</p>
                          </div>
                        )}
                        {inq.reply ? (
                          <div className="bg-[#303236]/5 border border-[#303236]/10 rounded-lg px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-[#303236]">담당자 답변</p>
                              {inq.repliedAt && (
                                <span className="text-xs text-gray-400">{fmtDate(inq.repliedAt)}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.reply}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 px-1">
                            담당자가 확인 중입니다. 빠른 상담은 매장으로 전화 주세요.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div className={`${CARD_CLS} overflow-hidden flex flex-col ${CARD_H}`}>
          {[
            { label: "전체 제품 보기", href: "/products", desc: "워크업 라인업 탐색" },
            { label: "매장 찾기", href: "/store", desc: "가까운 매장 위치 확인" },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        </div>{/* /2×2 그리드 */}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout} disabled={loggingOut}
          className="w-full mt-4 lg:mt-6 py-3.5 border border-gray-200 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>

      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
