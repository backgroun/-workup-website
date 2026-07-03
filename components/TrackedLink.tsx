"use client";
import { trackStoreEvent, type StoreEventType } from "@/lib/track";

// 클릭 시 이벤트를 기록하는 앵커. 서버 컴포넌트의 <a> 대체용.
export default function TrackedLink({
  href,
  eventType,
  storeId,
  storeName,
  className,
  target,
  rel,
  children,
}: {
  href: string;
  eventType: StoreEventType;
  storeId: number;
  storeName: string;
  className?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => trackStoreEvent(eventType, { id: storeId, name: storeName })}
    >
      {children}
    </a>
  );
}
