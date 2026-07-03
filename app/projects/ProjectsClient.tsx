"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";
import { featuredProjects } from "../data/projects";

const PROJECTS_PER_PAGE = 5;

function Pagination({
  currentPage,
  totalPages,
  onChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: totalPages }).map((_, index) => {
        const page = index + 1;
        const isActive = currentPage === page;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            className={`h-8 w-8 border text-[11px] transition ${
              isActive
                ? "border-[#4A433D] bg-[#4A433D] text-[#F3F0EB]"
                : "border-neutral-300 text-neutral-500 hover:border-[#4A433D] hover:text-[#4A433D]"
            }`}
            aria-label={`Go to project page ${page}`}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}

function MobileProjects() {
  const [currentPage, setCurrentPage] = useState(1);

  const projects = featuredProjects;
  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);

  const pagedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    const endIndex = startIndex + PROJECTS_PER_PAGE;

    return projects.slice(startIndex, endIndex);
  }, [projects, currentPage]);

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen flex flex-col">
      <Header />

      <section className="flex-1 max-w-7xl mx-auto w-full px-6 pt-24 pb-10">
        <div className="mb-7">
          <p className="uppercase tracking-[0.35em] text-[10px] text-neutral-500 mb-2">
            Projects
          </p>

          <h1 className="text-3xl font-light leading-none">Selected Works</h1>

          <p className="mt-4 max-w-[28rem] text-[13px] leading-6 text-neutral-500 break-keep">
            앤트네스트디자인은 청라를 기반으로 아파트 리모델링, 단독주택,
            상가주택 등 삶의 방식에 맞춘 주거 공간과 건축 프로젝트를
            진행합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {pagedProjects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              prefetch={false}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#d8d1ca] mb-3">
                <Image
                  src={project.heroImage}
                  alt={project.title}
                  fill
                  priority={currentPage === 1 && index < 2}
                  quality={68}
                  sizes="50vw"
                  className="object-cover"
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
          className="justify-center mt-10"
        />

        <div className="mt-10 flex justify-between text-[9px] text-neutral-500 tracking-[0.25em] uppercase">
          <span>Portfolio</span>
          <span>
            Page {currentPage} / {totalPages}
          </span>
        </div>
      </section>

      <MiniFooter />
    </main>
  );
}

function DesktopProjects() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  const projects = featuredProjects;
  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);

  const pagedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    const endIndex = startIndex + PROJECTS_PER_PAGE;

    return projects.slice(startIndex, endIndex);
  }, [projects, currentPage]);

  const active = pagedProjects[activeIndex];

  if (!active) {
    return null;
  }

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] h-screen overflow-hidden flex flex-col">
      <Header />

      <section className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-16 pt-28 pb-4">
        <div className="grid grid-cols-[0.82fr_1.18fr] gap-16 h-full min-h-0">
          <div className="flex flex-col min-h-0 order-1">
            <div className="mb-5">
              <p className="uppercase tracking-[0.35em] text-xs text-neutral-500 mb-2">
                Projects
              </p>

              <h1 className="text-5xl font-light leading-none">
                Selected Works
              </h1>

              <p className="mt-4 max-w-[31rem] text-[13px] leading-6 text-neutral-500 break-keep">
                앤트네스트디자인은 청라를 기반으로 아파트 리모델링,
                단독주택, 상가주택 등 삶의 방식에 맞춘 주거 공간과 건축
                프로젝트를 진행합니다.
              </p>
            </div>

            <div className="flex-1 min-h-0">
              {pagedProjects.map((project, index) => {
                const isActive = activeIndex === index;
                const displayNumber =
                  (currentPage - 1) * PROJECTS_PER_PAGE + index + 1;

                return (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    prefetch={false}
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
                      {String(displayNumber).padStart(2, "0")}
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
                              ? "text-xl font-light translate-x-1 transition duration-500 break-keep"
                              : "text-xl font-light transition duration-500 group-hover:translate-x-1 break-keep"
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

            <div className="pt-8 flex items-center justify-between">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onChange={(page) => {
                  setActiveIndex(0);
                  setCurrentPage(page);
                }}
              />

              <p className="text-[10px] text-neutral-500 tracking-[0.25em] uppercase">
                Page {currentPage} / {totalPages}
              </p>
            </div>
          </div>

          <div className="flex flex-col min-h-0 order-2">
            <Link
              href={`/projects/${active.slug}`}
              prefetch={false}
              className="group relative flex-1 min-h-0 overflow-hidden bg-[#d8d1ca]"
            >
              <Image
                src={active.heroImage}
                alt={active.title}
                fill
                priority={currentPage === 1 && activeIndex === 0}
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

                <h3 className="text-4xl font-light mb-3 break-keep">
                  {active.title}
                </h3>

                <div className="flex gap-6 text-sm text-white/75">
                  <span>{active.type}</span>
                  <span>{active.year}</span>
                </div>

                <p className="mt-4 max-w-[34rem] text-sm leading-6 text-white/75 break-keep">
                  {active.overview}
                </p>
              </div>
            </Link>

            <div className="pt-3 flex justify-between text-xs text-neutral-500 tracking-[0.25em] uppercase">
              <span>Preview</span>
              <span>Click to Open</span>
            </div>
          </div>
        </div>
      </section>

      <MiniFooter />
    </main>
  );
}

export default function ProjectsClient() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      setIsDesktop(query.matches);
      setMounted(true);
    };

    update();

    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  if (!mounted) {
    return <MobileProjects />;
  }

  return isDesktop ? <DesktopProjects /> : <MobileProjects />;
}
