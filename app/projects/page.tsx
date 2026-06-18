"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";

const projects = [
  {
    slug: "apartment-a",
    title: "준공 28년차 아파트 A",
    category: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "37평형",
    image: "/home/apartment-a.jpg",
  },
  {
    slug: "apartment-b",
    title: "9년차 아파트 B",
    category: "Residential",
    type: "Apartment Renovation",
    year: "2025",
    area: "34평형",
    image: "/home/apartment-b.jpg",
  },
  {
    slug: "luxury-house",
    title: "고급주택 신축공사",
    category: "Architecture",
    type: "Luxury House",
    year: "2022",
    area: "600㎡",
    image: "/home/luxury-house.jpg",
  },
  {
    slug: "private-house",
    title: "단독주택 신축공사",
    category: "Architecture",
    type: "Private House",
    year: "2018",
    area: "390㎡",
    image: "/home/private-house.jpg",
  },
  {
    slug: "commercial-house",
    title: "상가주택 신축공사",
    category: "Architecture",
    type: "Commercial House",
    year: "2017",
    area: "983㎡",
    image: "/home/commercial-house.jpg",
  },
  {
    slug: "officetel",
    title: "오피스텔 + 상가 신축공사",
    category: "Architecture",
    type: "Mixed-use Development",
    year: "2013",
    area: "20,497㎡",
    image: "/home/officetel.jpg",
  },
];

export default function ProjectsPage() {
  const [active, setActive] = useState(projects[0]);

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] h-screen overflow-hidden flex flex-col">
      <Header />

      <section className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-6 md:px-16 pt-24 md:pt-28 pb-4">
        <div className="grid md:grid-cols-[0.88fr_1.12fr] gap-8 md:gap-16 h-full min-h-0">
          <div className="flex flex-col min-h-0">
            <div className="mb-5 md:mb-6">
              <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-2">
                Projects
              </p>

              <h1 className="text-3xl md:text-5xl font-light leading-none">
                Selected Works
              </h1>
            </div>

            <div className="flex-1 min-h-0">
              {projects.map((project, index) => {
                const isActive = active.slug === project.slug;

                return (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    onMouseEnter={() => setActive(project)}
                    onFocus={() => setActive(project)}
                    className="group grid grid-cols-[28px_1fr_auto] md:grid-cols-[42px_1fr_auto] gap-4 items-center border-b border-neutral-300 py-2.5 md:py-3"
                  >
                    <span
                      className={
                        isActive
                          ? "text-xs md:text-sm text-[#4A433D]"
                          : "text-xs md:text-sm text-neutral-400"
                      }
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isActive
                              ? "w-1.5 h-1.5 rounded-full bg-[#4A433D] opacity-100 transition"
                              : "w-1.5 h-1.5 rounded-full bg-[#4A433D] opacity-0 transition group-hover:opacity-100"
                          }
                        />

                        <h2
                          className={
                            isActive
                              ? "text-base md:text-xl font-light translate-x-1 transition duration-500"
                              : "text-base md:text-xl font-light transition duration-500 group-hover:translate-x-1"
                          }
                        >
                          {project.title}
                        </h2>
                      </div>

                      <p className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-1 ml-3.5">
                        {project.type}
                      </p>
                    </div>

                    <span
                      className={
                        isActive
                          ? "text-[10px] md:text-xs text-[#4A433D]"
                          : "text-[10px] md:text-xs text-neutral-400"
                      }
                    >
                      {project.year}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex flex-col min-h-0">
            <Link
              href={`/projects/${active.slug}`}
              className="group relative flex-1 min-h-0 overflow-hidden bg-[#d8d1ca]"
            >
              <Image
                key={active.image}
                src={active.image}
                alt={active.title}
                fill
                priority
                className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute left-8 top-8 right-8 flex justify-between text-white/75 text-[11px] tracking-[0.25em] uppercase">
                <span>{active.category}</span>
                <span>{active.area}</span>
              </div>

              <div className="absolute left-8 bottom-8 text-white">
                <p className="uppercase tracking-[0.3em] text-[10px] mb-3 text-white/70">
                  Current Selection
                </p>

                <h3 className="text-4xl font-light mb-3">{active.title}</h3>

                <div className="flex gap-6 text-sm text-white/75">
                  <span>{active.type}</span>
                  <span>{active.year}</span>
                </div>
              </div>
            </Link>

            <div className="pt-3 flex justify-between text-xs text-neutral-500 tracking-[0.25em] uppercase">
              <span>Hover to Preview</span>
              <span>Click to Open</span>
            </div>
          </div>
        </div>
      </section>

      <MiniFooter />
    </main>
  );
}