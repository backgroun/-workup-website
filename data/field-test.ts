// FIELD TEST(/field-test) 페이지 제품 검증 데이터
// 관리자가 site_settings("field_test_page")에서 수정. 미설정 시 아래 DEFAULT_TESTS를 사용.

export type DataPoint = { spec: string; plain: string };

export type Test = {
  id: string;
  category: string;     // 테스트 종류
  product: string;      // 제품명
  title: string;        // 테스트 제목
  subtitle: string;     // 부제
  conditions: string[]; // 테스트 조건
  data: DataPoint[];    // 수치 → 현장 언어
  feedback: string;     // 착용자 피드백
};

export const DEFAULT_TESTS: Test[] = [
  {
    id: "1",
    category: "방수 테스트",
    product: "경량 방풍 자켓 A형",
    title: "폭우 8시간 방수 테스트",
    subtitle: "20,000mm 방수 수치 현장 검증",
    conditions: [
      "강우량 100mm/h 환경 재현",
      "8시간 연속 착용",
      "움직임 포함 (상체 굴신 500회)",
    ],
    data: [
      { spec: "방수 수치 20,000mm", plain: "폭우에도 안 젖습니다" },
      { spec: "발수 등급 4급", plain: "표면 물방울이 그대로 굴러떨어집니다" },
      { spec: "봉제선 방수 처리", plain: "솔기에서 스며드는 현상 없음" },
    ],
    feedback: "8시간 착용 후 내피 완전 건조 상태 확인. 실제 물류 현장 배달기사 3인 착용 테스트 동일 결과.",
  },
  {
    id: "2",
    category: "내구성 테스트",
    product: "스트레치 카고 팬츠",
    title: "무릎 내구성 1,000회 테스트",
    subtitle: "굴신 반복 및 마찰 강도 측정",
    conditions: [
      "무릎 굴신 1,000회 반복",
      "마찰 강도 측정 (마틴데일 테스트)",
      "세탁 50회 후 재측정",
    ],
    data: [
      { spec: "마틴데일 마찰 강도 50,000회", plain: "5년 매일 입어도 해지지 않습니다" },
      { spec: "무릎 이중 보강 처리", plain: "가장 많이 닳는 부위를 두 겹으로 만들었습니다" },
      { spec: "스트레치율 35%", plain: "쪼그려 앉아도 원단이 당기지 않습니다" },
    ],
    feedback: "건설 현장 작업자 5인 3개월 실착 테스트 완료. 무릎 부위 마모 없음 확인.",
  },
  {
    id: "3",
    category: "쿨링 테스트",
    product: "쿨링 반팔 티셔츠",
    title: "35도 현장 8시간 체온 측정",
    subtitle: "실제 현장 착용 체온 변화 데이터",
    conditions: [
      "기온 35도 야외 현장",
      "8시간 연속 착용",
      "1시간 간격 체온 및 발한량 측정",
    ],
    data: [
      { spec: "흡한속건 20분 건조", plain: "땀이 차지 않고 계속 쾌적합니다" },
      { spec: "UPF 50+ 자외선 차단", plain: "직사광선 아래서도 피부 보호됩니다" },
      { spec: "항균 처리 (냄새 억제)", plain: "8시간 착용 후에도 냄새가 나지 않습니다" },
    ],
    feedback: "일반 면 티셔츠 대비 착용 쾌적도 82% 향상 (착용자 자체 평가). 물류센터 현장 직원 10인 착용 만족도 9.1/10.",
  },
];
