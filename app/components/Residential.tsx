import Image from "next/image";
import Link from "next/link";
import { residentialProjects } from "../data/projects";

export default function Residential() {
  const mainProject = residentialProjects[0];
  const subProject = residentialProjects[1];

  if (!mainProject || !subProject) {
    return null;
  }

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
            가족의 생활 방식과 수납, 동선을 중심으로 오래 머물고 싶은 주거
            공간을 설계합니다.
          </p>
        </div>

        <div className="col-span-12 h-4 md:hidden" />

        <Link
          href={`/projects/${mainProject.slug}`}
          className="group col-span-7 md:col-span-5"
        >
          <div className="relative h-[260px] md:h-[540px] overflow-hidden bg-[#d8d1ca]">
            <Image
              src={mainProject.heroImage}
              alt={mainProject.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>

          <div className="mt-3 md:mt-4">
            <p className="text-[11px] md:text-sm text-neutral-500 mb-1">
              {mainProject.area} · {mainProject.year}
            </p>

            <h3 className="text-base md:text-2xl font-light">
              {mainProject.cardTitle}
            </h3>
          </div>
        </Link>

        <Link
          href={`/projects/${subProject.slug}`}
          className="group col-span-5 md:col-span-3 self-end"
        >
          <div className="relative h-[170px] md:h-[330px] overflow-hidden bg-[#d8d1ca]">
            <Image
              src={subProject.heroImage}
              alt={subProject.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>

          <div className="mt-3 md:mt-4">
            <p className="text-[11px] md:text-sm text-neutral-500 mb-1">
              {subProject.area} · {subProject.year}
            </p>

            <h3 className="text-sm md:text-xl font-light">
              {subProject.cardTitle}
            </h3>
          </div>
        </Link>
      </div>
    </div>
  );
}