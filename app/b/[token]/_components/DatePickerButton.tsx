"use client";
import { useRouter, usePathname } from "next/navigation";
import MiniCalendar from "./MiniCalendar";

export default function DatePickerButton({
  selectedDate,
  todayKst,
  markedDates = {},
}: {
  selectedDate: string;
  todayKst: string;
  markedDates?: Record<string, { outbound: number; pass: number }>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (date: string) => {
    router.push(date === todayKst ? pathname : `${pathname}?date=${date}`);
  };

  return (
    <MiniCalendar
      selectedDate={selectedDate}
      todayKst={todayKst}
      onSelect={handleSelect}
      markedDates={markedDates}
    />
  );
}
