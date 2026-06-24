"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";
import { featuredProjects } from "../data/projects";

const MOBILE_PROJECTS_PER_PAGE = 6;

export default function ProjectsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobilePage, setMobilePage] = useState(1);
  const pausedRef = useRef(false);

  const projects = featuredProjects;
  const active = projects[activeIndex];

  const totalMobilePages = Math.ceil(
    projects.length / MOBILE_PROJECTS_PER_PAGE
  );

  const mobileProjects = useMemo(() => {
    const startIndex = (mobilePage - 1) * MOBILE_PROJECTS_PER_PAGE;
    const endIndex = startIndex + MOBILE_PROJECTS_PER_PAGE;

    return projects.slice(startIndex, endIndex);
  }, [projects, mobilePage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleChange = () => {
      setIsDesktop(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || projects.length <= 1) return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;

      setActiveIndex((prev) => (prev + 1) % projects.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isDesktop, projects.length]);

  if (!active) {
    return null;
  }

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen md:h-screen md:overflow-hidden flex flex-col">
      <Header />

      {/* Mobile Layout */}
      <section className="md:hidden flex-1 max-w-7xl mx-auto w-full px-6 pt-24 pb-10">
        <div className="mb-7">
          <p className="uppercase tracking-[0.35em] text-[10px] text-neutral-500 mb-2">
            Projects
          </p>

          <h1 className="text-3xl font-light leading-none">Selected Works</h1>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {mobileProjects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#d8d1ca] mb-3">
                <Image
                  src={project.heroImage}
                  alt={project.title}
                  fill
                  priority={mobilePage === 1 && index < 2}
                  quality={70}
                  sizes="50vw"
                  className="object-cover transition duration-500 group-active:scale-105"
                />

                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute left-3 top-3 right-3 flex justify-between text-white/75 text-[8px] tracking-[0.22em] uppercase">
                  <span>{project.projectGroup}</span>
                  <span>{project.year}</span>
                </div>
              </div>

              <p className="text-[9px] uppercase tracking-[0.22em] text-neutral-500 mb-1">
                {project.type}
              </p>

              <h2 className="text-[13px] font-light leading-[1.35] break-keep">
                {project.title}
              </h2>

              <p className="text-[11px] text-neutral-500 mt-1">
                {project.area}
              </p>
            </Link>
          ))}
        </div>

        {totalMobilePages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalMobilePages }).map((_, index) => {
              const page = index + 1;
              const isActive = mobilePage === page;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setMobilePage(page)}
                  className={`h-8 w-8 border text-[11px] transition ${
                    isActive
                      ? "border-[#4A433D] bg-[#4A433D] text-[#F3F0EB]"
                      : "border-neutral-300 text-neutral-500"
                  }`}
                  aria-label={`Go to project page ${page}`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex justify-between text-[9px] text-neutral-500 tracking-[0.25em] uppercase">
          <span>Portfolio</span>
          <span>Tap to Open</span>
        </div>
      </section>

      {/* Desktop Layout */}
      <section
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        className="hidden md:block flex-1 min-h-0 max-w-7xl mx-auto w-full px-16 pt-28 pb-4"
      >
        <div className="grid md:grid-cols-[0.82fr_1.18fr] gap-16 h-full min-h-0">
          <div className="flex flex-col min-h-0 order-1">
            <div className="mb-6">
              <p className="uppercase tracking-[0.35em] text-xs text-neutral-500 mb-2">
                Projects
              </p>

              <h1 className="text-5xl font-light leading-none">
                Selected Works
              </h1>
            </div>

            <div className="flex-1 min-h-0">
              {projects.map((project, index) => {
                const isActive = activeIndex === index;

                return (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    className="group grid grid-cols-[42px_1fr_auto] gap-4 items-center border-b border-neutral-300 py-3"
                  >
                    <span
                      className={
                        isActive
                          ? "text-sm text-[#4A433D]"
                          : "text-sm text-neutral-400"
                      }
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`block h-px transition-all duration-500 ${
                            isActive ? "w-7 bg-[#4A433D]" : "w-2 bg-neutral-300"
                          }`}
                        />

                        <h2
                          className={
                            isActive
                              ? "text-xl font-light translate-x-1 transition duration-500"
                              : "text-xl font-light transition duration-500 group-hover:translate-x-1"
                          }
                        >
                          {project.title}
                        </h2>
                      </div>

                      <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 mt-1 ml-9">
                        {project.type}
                      </p>
                    </div>

                    <span
                      className={
                        isActive
                          ? "text-xs text-[#4A433D]"
                          : "text-xs text-neutral-400"
                      }
                    >
                      {project.year}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col min-h-0 order-2">
            <Link
              href={`/projects/${active.slug}`}
              className="group relative flex-1 min-h-0 overflow-hidden bg-[#d8d1ca]"
            >
              <Image
                key={`${active.slug}-${active.heroImage}`}
                src={active.heroImage}
                alt={active.title}
                fill
                priority={activeIndex === 0}
                quality={78}
                sizes="58vw"
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute left-8 top-8 right-8 flex justify-between text-white/75 text-[11px] tracking-[0.25em] uppercase">
                <span>{active.projectGroup}</span>
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
              <span>Auto Preview</span>
              <span>Click to Open</span>
            </div>
          </div>
        </div>
      </section>

      <MiniFooter />
    </main>
  );
}