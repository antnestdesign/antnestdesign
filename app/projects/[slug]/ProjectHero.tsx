"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProjectHeroProps = {
  src: string;
  alt: string;
  aspectRatio?: string;
  animation?: "pan-horizontal";
};

export default function ProjectHero({
  src,
  alt,
  aspectRatio = "16 / 9",
  animation,
}: ProjectHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const isPanHorizontal = animation === "pan-horizontal";

  useEffect(() => {
    if (!isPanHorizontal || !heroRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.08 }
    );

    observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, [isPanHorizontal]);

  return (
    <div
      ref={heroRef}
      className="relative bg-[#d8d2cb] overflow-hidden"
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        quality={86}
        sizes="(max-width: 768px) 100vw, 1120px"
        className={
          isPanHorizontal
            ? `object-cover project-hero-pan ${
                isVisible ? "project-hero-pan-active" : "project-hero-pan-paused"
              }`
            : "object-cover"
        }
      />

      {isPanHorizontal && (
        <style jsx global>{`
          .project-hero-pan {
            width: 112% !important;
            max-width: none !important;
            transform: translate3d(0, 0, 0);
            animation: projectHeroPan 20s ease-in-out infinite alternate;
            will-change: transform;
          }

          .project-hero-pan-active {
            animation-play-state: running;
          }

          .project-hero-pan-paused {
            animation-play-state: paused;
          }

          @keyframes projectHeroPan {
            from {
              transform: translate3d(0, 0, 0);
            }

            to {
              transform: translate3d(-10.714%, 0, 0);
            }
          }

          @media (max-width: 1024px) {
            .project-hero-pan {
              width: 110% !important;
            }

            @keyframes projectHeroPan {
              from {
                transform: translate3d(0, 0, 0);
              }

              to {
                transform: translate3d(-9.091%, 0, 0);
              }
            }
          }

          @media (max-width: 640px) {
            .project-hero-pan {
              width: 107% !important;
            }

            @keyframes projectHeroPan {
              from {
                transform: translate3d(0, 0, 0);
              }

              to {
                transform: translate3d(-6.542%, 0, 0);
              }
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .project-hero-pan {
              width: 100% !important;
              animation: none;
              transform: translate3d(0, 0, 0);
            }
          }
        `}</style>
      )}
    </div>
  );
}
