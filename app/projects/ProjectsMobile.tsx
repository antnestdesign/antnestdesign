"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";
import { featuredProjects } from "../data/projects";

const PROJECTS_PER_PAGE = 5;

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
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

export default function ProjectsMobile() {
  const [currentPage, setCurrentPage] = useState(1);

  const projects = featuredProjects;
  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);

  const pagedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    return projects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);
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