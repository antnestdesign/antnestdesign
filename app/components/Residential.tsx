import Image from "next/image";
import Link from "next/link";

export default function Residential() {
  return (
    <div
      id="residential"
      className="max-w-7xl mx-auto px-6 md:px-16 pt-6 md:pt-0 w-full"
    >
      <div className="grid grid-cols-12 gap-4 md:gap-10 items-center">
        <div className="col-span-12 md:col-span-4">
          <p className="uppercase tracking-[0.3em] text-[9px] md:text-xs mb-3 md:mb-5">
            Residential Interior
          </p>

          <h2 className="text-2xl md:text-5xl font-light leading-[1.15] mb-3 md:mb-6">
            Spaces
            <br />
            shaped around
            <br />
            everyday living
          </h2>

          <p className="text-xs md:text-base leading-6 md:leading-7 text-neutral-600">
            가족의 생활 방식과 수납, 동선을 중심으로
            오래 머물고 싶은 주거 공간을 설계합니다.
          </p>
        </div>

        {/* 모바일에서 텍스트와 이미지 간격 확보 */}
        <div className="col-span-12 h-4 md:hidden" />

        <Link
          href="/projects/apartment-a"
          className="group col-span-7 md:col-span-5"
        >
          <div className="relative h-[260px] md:h-[540px] overflow-hidden bg-[#d8d1ca]">
            <Image
              src="/home/apartment-a.jpg"
              alt="준공 28년차 아파트 A"
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>

          <div className="mt-3 md:mt-4">
            <p className="text-[11px] md:text-sm text-neutral-500 mb-1">
              37평형 · 2026
            </p>

            <h3 className="text-base md:text-2xl font-light">
              수원 살구골 현대7단지 아파트
            </h3>
          </div>
        </Link>

        <Link
          href="/projects/apartment-b"
          className="group col-span-5 md:col-span-3 self-end"
        >
          <div className="relative h-[170px] md:h-[330px] overflow-hidden bg-[#d8d1ca]">
            <Image
              src="/home/apartment-b.jpg"
              alt="9년차 아파트 B"
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>

          <div className="mt-3 md:mt-4">
            <p className="text-[11px] md:text-sm text-neutral-500 mb-1">
              34평형 · 2025
            </p>

            <h3 className="text-sm md:text-xl font-light">
              화성 동탄역 모아미래도 아파트
            </h3>
          </div>
        </Link>
      </div>
    </div>
  );
}