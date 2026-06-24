"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";
import { featuredProjects } from "../data/projects";

export default function ProjectsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);
  const projects = featuredProjects;
  const active = projects[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;

      setActiveIndex((prev) => (prev + 1) % projects.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [projects.length]);

  if (!active) {
    return null;
  }

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen md:h-screen md:overflow-hidden flex flex-col">
      <Header />

      <section
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-6 md:px-16 pt-24 md:pt-28 pb-8 md:pb-4"
      >
        <div className="grid md:grid-cols-[0.82fr_1.18fr] gap-6 md:gap-16 h-full min-h-0">
          <div className="flex flex-col min-h-0 order-2 md:order-1">
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
                const isActive = activeIndex === index;

                return (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onTouchStart={() => setActiveIndex(index)}
                    className="group grid grid-cols-[26px_1fr_auto] md:grid-cols-[42px_1fr_auto] gap-3 md:gap-4 items-center border-b border-neutral-300 py-2 md:py-3"
                  >
                    <span
                      className={
                        isActive
                          ? "text-[10px] md:text-sm text-[#4A433D]"
                          : "text-[10px] md:text-sm text-neutral-400"
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
                              ? "text-[13px] md:text-xl font-light translate-x-1 transition duration-500"
                              : "text-[13px] md:text-xl font-light transition duration-500 group-hover:translate-x-1"
                          }
                        >
                          {project.title}
                        </h2>
                      </div>

                      <p className="text-[8px] md:text-[10px] uppercase tracking-[0.22em] text-neutral-500 mt-1 ml-9">
                        {project.type}
                      </p>
                    </div>

                    <span
                      className={
                        isActive
                          ? "text-[9px] md:text-xs text-[#4A433D]"
                          : "text-[9px] md:text-xs text-neutral-400"
                      }
                    >
                      {project.year}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col min-h-0 order-1 md:order-2">
            <Link
              href={`/projects/${active.slug}`}
              className="group relative h-[310px] md:flex-1 md:min-h-0 overflow-hidden bg-[#d8d1ca]"
            >
              {projects.map((project, index) => (
                <Image
                  key={`${project.slug}-${project.heroImage}`}
                  src={project.heroImage}
                  alt={project.title}
                  fill
                  priority={index === 0}
                  className={`object-cover transition-all duration-[600ms] ease-in-out ${
                    activeIndex === index
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.02]"
                  } group-hover:scale-105`}
                />
              ))}

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute left-5 md:left-8 top-5 md:top-8 right-5 md:right-8 flex justify-between text-white/75 text-[9px] md:text-[11px] tracking-[0.25em] uppercase">
                <span>{active.projectGroup}</span>
                <span>{active.area}</span>
              </div>

              <div className="absolute left-5 md:left-8 bottom-5 md:bottom-8 text-white">
                <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-2 md:mb-3 text-white/70">
                  Current Selection
                </p>

                <h3 className="text-2xl md:text-4xl font-light mb-2 md:mb-3">
                  {active.title}
                </h3>

                <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-white/75">
                  <span>{active.type}</span>
                  <span>{active.year}</span>
                </div>
              </div>
            </Link>

            <div className="pt-3 flex justify-between text-[9px] md:text-xs text-neutral-500 tracking-[0.25em] uppercase">
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