"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const projects = [
  {
    title: "고급주택 신축공사",
    href: "/projects/luxury-house",
    image: "/home/luxury-house.jpg",
    meta: "600㎡ · 2022",
  },
  {
    title: "단독주택 신축공사",
    href: "/projects/private-house",
    image: "/home/private-house.jpg",
    meta: "390㎡ · 2018",
  },
  {
    title: "상가주택 신축공사",
    href: "/projects/commercial-house",
    image: "/home/commercial-house.jpg",
    meta: "983㎡ · 2017",
  },
  {
    title: "오피스텔 + 상가 신축공사",
    href: "/projects/officetel",
    image: "/home/officetel.jpg",
    meta: "20,497㎡ · 2013",
  },
];

export default function Architecture() {
  const [active, setActive] = useState(projects[0]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-16 pt-10 md:pt-0 w-full">
      <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-6 md:gap-28 items-center">
        <div className="md:pr-10">
          <p className="uppercase tracking-[0.32em] text-[9px] md:text-xs mb-3 md:mb-8">
            Architecture Experience
          </p>

          <h2 className="text-2xl md:text-6xl font-light leading-[1.1] mb-5 md:mb-10 break-keep tracking-[-0.02em]">
            건축 경험은
            <br />
            공간을 바라보는
            <br />
            깊이를 만듭니다
          </h2>

          <p className="hidden md:block text-lg leading-9 text-neutral-600 max-w-md break-keep">
            주택, 상가주택, 복합건축물 시공 경험을 바탕으로 공간을 더 깊이
            이해하고 설계합니다.
          </p>
        </div>

        <Link href={active.href} className="group block md:pl-4">
          <div className="relative h-[190px] md:h-[520px] overflow-hidden bg-[#d8d1ca]">
            <Image
              key={active.image}
              src={active.image}
              alt={active.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
        </Link>
      </div>

      <div className="mt-5 md:mt-12 grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-10">
        {projects.map((project) => (
          <Link
            key={project.title}
            href={project.href}
            onMouseEnter={() => setActive(project)}
            onFocus={() => setActive(project)}
            className="group border-b border-neutral-300 py-3 md:py-0 md:pb-5"
          >
            <div className="hidden md:block relative h-24 overflow-hidden bg-[#d8d1ca] mb-4">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>

            <span className="block text-xs md:text-sm text-neutral-500 mb-1 md:mb-3">
              {project.meta}
            </span>

            <span className="block text-xs md:text-xl font-light leading-snug group-hover:translate-x-1 transition break-keep">
              {project.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}