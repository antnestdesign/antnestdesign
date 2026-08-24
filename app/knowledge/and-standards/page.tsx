import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";

const path = "/knowledge/and-standards";
const title = "AND STANDARD | ANTNEST DESIGN";
const description =
  "빛, 수납과 동선 등 주거공간을 판단하는 ANTNEST DESIGN의 설계 기준을 소개합니다.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: `https://www.antnestdesign.com${path}`,
    type: "website",
  },
};

const standards = [
  {
    number: "01",
    title: "조명은 자연광을 닮아야 합니다",
    description:
      "사람의 시선과 생활, 재료와 공간의 깊이를 기준으로 빛을 계획하는 방법을 이야기합니다.",
    href: "/knowledge/and-standards/lighting-natural-light",
    image:
      "/knowledge/and-standards/lighting-natural-light/09-dongtan-living-night-final.webp",
    width: 1448,
    height: 1086,
    alt: "계획된 빛으로 공간의 깊이를 드러낸 동탄 아파트 거실",
  },
  {
    number: "02",
    title: "수납은 생활의 흐름을 설계하는 일입니다",
    description:
      "물건의 양보다 행동의 순서와 가족의 생활을 먼저 살펴 수납과 동선의 관계를 정리합니다.",
    href: "/knowledge/and-standards/storage-flow",
    image: "/projects/cheongna-hanwha-kkumegreen-39a/07-master-bedroom-day.webp",
    width: 1672,
    height: 1125,
    alt: "침대 헤드 구조가 침실의 중심면을 만드는 청라 한화꿈에그린 침실 주간 렌더링",
  },
];

export default function AndStandardsPage() {
  return (
    <main className="min-h-screen bg-[#F3F0EB] text-[#4A433D]">
      <Header />
      <header className="mx-auto max-w-[1240px] px-5 pb-16 pt-36 md:px-16 md:pb-24 md:pt-48 lg:px-10 xl:px-16">
        <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
          ANTNEST DESIGN
        </p>
        <h1 className="mt-6 text-4xl font-light tracking-[-0.035em] md:text-[56px]">
          AND STANDARD
        </h1>
      </header>

      <section className="mx-auto grid max-w-[1240px] gap-16 px-5 pb-32 md:px-16 md:pb-48 lg:grid-cols-2 lg:gap-12 lg:px-10 xl:gap-16 xl:px-16">
        {standards.map((standard) => (
          <article key={standard.number}>
            <Link
              href={standard.href}
              className="group block rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB]"
            >
              <Image
                src={standard.image}
                width={standard.width}
                height={standard.height}
                alt={standard.alt}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full"
              />
              <div className="mt-6 border-t border-[#675B56]/25 pt-5">
                <p className="text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">
                  AND STANDARD {standard.number}
                </p>
                <h2 className="mt-4 text-2xl font-light leading-[1.3] tracking-[-0.025em] break-keep md:text-3xl">
                  {standard.title}
                </h2>
                <p className="mt-4 max-w-[560px] text-sm leading-7 text-neutral-600 break-keep md:text-[15px]">
                  {standard.description}
                </p>
                <p className="mt-5 inline-block border-b border-[#675B56]/40 pb-1 text-sm transition-colors group-hover:border-[#675B56] md:text-base">
                  STANDARD {standard.number} 읽기 →
                </p>
              </div>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
