"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const projects = [
  {
    title: "화성 효행구 고급주택 신축공사",
    href: "/projects/luxury-house",
    image: "/home/luxury-house.webp",
    meta: "600㎡ · 2022",
  },
  {
    title: "인천 청라 단독주택 신축공사",
    href: "/projects/private-house",
    image: "/home/private-house.webp",
    meta: "390㎡ · 2018",
  },
  {
    title: "화성 병점구 상가주택 신축공사",
    href: "/projects/commercial-house",
    image: "/home/commercial-house.webp",
    meta: "983㎡ · 2017",
  },
  {
    title: "인천 청라 오피스텔 + 상가 신축공사",
    href: "/projects/officetel",
    image: "/home/officetel.webp",
    meta: "20,497㎡ · 2013",
  },
];

export default function Architecture() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);
  const active = projects[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;

      setActiveIndex((prev) => (prev + 1) % projects.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      className="max-w-7xl mx-auto px-6 md:px-16 pt-6 md:pt-0 w-full"
    >
      <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-5 md:gap-[clamp(3rem,6vw,5rem)] items-center">
        <div className="md:pr-6">
          <p className="uppercase tracking-[0.32em] text-[9px] md:text-xs mb-3 md:mb-[clamp(1rem,3svh,1.5rem)]">
            Architecture Experience
          </p>

          <h2 className="text-2xl md:text-[clamp(2.65rem,4.8vw,3.75rem)] font-light leading-[1.08] mb-4 md:mb-[clamp(1rem,3svh,2rem)] break-keep tracking-[-0.02em]">
            건축 경험은
            <br />
            공간을 바라보는
            <br />
            깊이를 만듭니다
          </h2>

          <p className="hidden md:block text-[clamp(1rem,1.35vw,1.125rem)] leading-[1.8] text-neutral-600 max-w-md break-keep">
            주택, 상가주택, 복합건축물 시공 경험을 바탕으로 공간을 더 깊이
            이해하고 설계합니다.
          </p>
        </div>

        <Link href={active.href} className="group block md:pl-2">
          <div className="relative h-[180px] md:h-[clamp(300px,43svh,440px)] overflow-hidden bg-[#d8d1ca]">
            {projects.map((project, index) => (
              <Image
                key={project.image}
                src={project.image}
                alt={project.title}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 55vw"
                quality={78}
                className={`object-cover transition-all duration-[600ms] ease-in-out ${
                  activeIndex === index
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-[1.02]"
                } group-hover:scale-105`}
              />
            ))}
          </div>
        </Link>
      </div>

      <div className="mt-4 md:mt-[clamp(0.875rem,2.4svh,2rem)] grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-[clamp(1.25rem,3vw,2rem)]">
        {projects.map((project, index) => {
          const isActive = activeIndex === index;

          return (
            <Link
              key={project.title}
              href={project.href}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onTouchStart={() => setActiveIndex(index)}
              className="group border-b border-neutral-300 py-2 md:py-0 md:pb-[clamp(0.5rem,1.6svh,0.875rem)]"
            >
              <div className="hidden md:block relative md:h-[clamp(52px,7.5svh,80px)] overflow-hidden bg-[#d8d1ca] mb-[clamp(0.5rem,1.5svh,0.75rem)]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="25vw"
                  quality={70}
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`block h-px transition-all duration-500 ${
                    isActive ? "w-8 bg-[#4A433D]" : "w-3 bg-neutral-300"
                  }`}
                />

                <div>
                  <span className="block text-[10px] md:text-xs text-neutral-500 mb-0.5 md:mb-[clamp(0.25rem,0.9svh,0.5rem)]">
                    {project.meta}
                  </span>

                  <span
                    className={`block text-[11px] md:text-[clamp(0.9rem,1.25vw,1.125rem)] font-light leading-snug transition break-keep ${
                      isActive ? "text-[#4A433D]" : "text-[#4A433D]/65"
                    }`}
                  >
                    {project.title}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}