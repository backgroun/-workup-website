/**
 * Schema.org 구조화 데이터(JSON-LD)를 페이지에 삽입하는 서버 컴포넌트.
 * 검색엔진이 제품·매장 정보를 리치 결과/지도에 표시하도록 돕는다.
 * data는 이미 구성된 JSON-LD 객체(@context/@type 포함)를 전달한다.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify 결과만 주입 — 사용자 입력이 아닌 서버 구성 객체라 안전
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
