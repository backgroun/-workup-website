import type { Metadata } from "next";
import PeopleGrid from "@/components/PeopleGrid";

export const metadata: Metadata = {
  title: "PEOPLE — 일하는 사람들의 이야기 | WORKUP",
  description: "워크업과 함께하는 사람들. 매일 현장에서 땀 흘리는 사람들의 이야기.",
};

export default function PeoplePage() {
  return (
    <main>
      <PeopleGrid />
    </main>
  );
}
