"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import NoticeStatusLine from "../_components/NoticeStatusLine";
import PassEntriesTable from "../_components/PassEntriesTable";

type NoticeDetail = {
  id: string;
  notice_date: string;
  status: "대기" | "진행중" | "마감";
  opened_at: string | null;
  closed_at: string | null;
  temp_name: string | null;
  temp_image_url: string | null;
  temp_tagline: string | null;
  products: { id: string; name: string; image_url: string | null; tagline: string | null; registration_status: string } | null;
};

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notices/${id}`);
      const data = await res.json();
      if (res.ok) setNotice(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) return <div className="py-20 text-center text-sm text-gray-400">불러오는 중...</div>;
  if (!notice) return <div className="py-20 text-center text-sm text-gray-400">공지를 찾을 수 없습니다.</div>;

  const product = notice.products;
  const name = product?.name ?? notice.temp_name ?? "상품 정보 없음";
  const imageUrl = product?.image_url ?? notice.temp_image_url;
  const tagline = product?.tagline ?? notice.temp_tagline;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">없음</div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{name}</h1>
          <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-baseline gap-x-1">
            <span>{notice.notice_date} 공지</span>
            {tagline && (
              <>
                <span>·</span>
                <span
                  className="[&_p]:m-0 [&_p]:inline"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tagline) }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <NoticeStatusLine
        noticeId={notice.id}
        productName={name}
        status={notice.status}
        openedAt={notice.opened_at}
        closedAt={notice.closed_at}
        onChanged={(status, data) => setNotice((prev) => (prev ? { ...prev, status, ...data } : prev))}
      />

      <PassEntriesTable noticeId={notice.id} noticeDate={notice.notice_date} />
    </div>
  );
}
