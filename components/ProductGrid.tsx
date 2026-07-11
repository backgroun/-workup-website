type Product = {
  id: number;
  line: string;
  name: string;
  description: string;
  price: string;
  color: string;
};

const products: Product[] = [
  {
    id: 1,
    line: "SITE",
    name: "스트레치 카고 팬츠",
    description: "하루 종일 쪼그려 앉아도 안 당깁니다. 11개 포켓 / 무릎 이중 보강 / 스트레치 원단",
    price: "39,000원",
    color: "bg-[#303236]",
  },
  {
    id: 2,
    line: "SITE",
    name: "경량 방풍 자켓",
    description: "바람 막고, 비 막고. 방풍 100% / 발수 가공 / 360g",
    price: "59,000원",
    color: "bg-[#243d5e]",
  },
  {
    id: 3,
    line: "SITE",
    name: "쿨링 반팔 티셔츠",
    description: "가장 더운 계절, 가장 많이 일하는 사람을 위해. 흡한속건 / UPF 50+ / 냄새 억제",
    price: "19,000원",
    color: "bg-[#2d4f72]",
  },
  {
    id: 4,
    line: "DAILY",
    name: "워크 치노 팬츠",
    description: "현장 느낌은 살리고, 일상에서도 어색하지 않은. 스트레치 소재 / 테이퍼드 핏",
    price: "45,000원",
    color: "bg-[#3D3D3D]",
  },
  {
    id: 5,
    line: "DAILY",
    name: "헤비 크루넥 스웻셔츠",
    description: "출근도, 카페도, 퇴근도. 옷 한 벌로. 300g 기모 안감 / 루즈핏",
    price: "49,000원",
    color: "bg-[#4d4d4d]",
  },
  {
    id: 6,
    line: "DAILY",
    name: "멀티포켓 조끼",
    description: "공구 없이도 쓸 수 있는 포켓 9개. 가벼운 20D 나일론 / 무게 190g",
    price: "35,000원",
    color: "bg-[#5a5a5a]",
  },
];

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  filter?: string;
};

export default function ProductGrid({ id, title, subtitle, filter }: Props) {
  const filtered = filter
    ? products.filter((p) => p.line === filter)
    : products;

  return (
    <section id={id} className="py-20 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#303236] tracking-wide mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div
                className={`${product.color} aspect-square mb-4 flex items-center justify-center overflow-hidden`}
              >
                <span className="text-xs text-white/40 tracking-widest uppercase">
                  {product.line}
                </span>
              </div>
              <p className="text-xs text-[#E5541B] tracking-widest uppercase mb-1">
                WORKUP {product.line}
              </p>
              <h3 className="text-base font-semibold text-[#303236] mb-2 group-hover:underline underline-offset-2 transition-all">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                {product.description}
              </p>
              <p className="text-sm font-bold text-[#303236]">
                {product.price}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
