"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProjectHeroProps = {
  src: string;
  alt: string;
  aspectRatio?: string;
  animation?: "pan-horizontal";
  panImageRatio?: number;
};

export default function ProjectHero({
  src,
  alt,
  aspectRatio = "16 / 9",
  animation,
  panImageRatio = 2048 / 486,
}: ProjectHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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

  useEffect(() => {
    if (!isPanHorizontal || !heroRef.current) {
      return;
    }

    const hero = heroRef.current;

    const updatePanDistance = () => {
      const heroRect = hero.getBoundingClientRect();
      const heroWidth = heroRect.width;
      const imageWidth = heroRect.height * panImageRatio;
      const panDistance = Math.max(imageWidth - heroWidth, 0);

      hero.style.setProperty("--hero-pan-image-width", `${imageWidth}px`);
      hero.style.setProperty("--hero-pan-distance", `${panDistance}px`);
    };

    updatePanDistance();

    const resizeObserver = new ResizeObserver(updatePanDistance);
    resizeObserver.observe(hero);

    if (imageRef.current) {
      resizeObserver.observe(imageRef.current);
    }

    window.addEventListener("load", updatePanDistance);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("load", updatePanDistance);
    };
  }, [isPanHorizontal, panImageRatio]);

  return (
    <div
      ref={heroRef}
      className="relative bg-[#d8d2cb] overflow-hidden"
      style={{ aspectRatio }}
    >
      {isPanHorizontal ? (
        <Image
          ref={imageRef}
          src={src}
          alt={alt}
          width={2048}
          height={486}
          priority
          quality={86}
          sizes="(max-width: 768px) 240vw, 2400px"
          className={`absolute left-0 top-0 h-full min-w-full object-cover project-hero-pan ${
            isVisible ? "project-hero-pan-active" : "project-hero-pan-paused"
          }`}
          onLoad={() => {
            const heroRect = heroRef.current?.getBoundingClientRect();
            const heroWidth = heroRect?.width ?? 0;
            const imageWidth = (heroRect?.height ?? 0) * panImageRatio;
            const panDistance = Math.max(imageWidth - heroWidth, 0);

            heroRef.current?.style.setProperty(
              "--hero-pan-image-width",
              `${imageWidth}px`
            );
            heroRef.current?.style.setProperty(
              "--hero-pan-distance",
              `${panDistance}px`
            );
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          priority
          quality={86}
          sizes="(max-width: 768px) 100vw, 1120px"
          className="object-cover"
        />
      )}

      {isPanHorizontal && (
        <style jsx global>{`
          .project-hero-pan {
            width: var(--hero-pan-image-width, 237%) !important;
            height: 100% !important;
            max-width: none !important;
            transform: translate3d(0, 0, 0);
            animation: projectHeroPan 18s ease-in-out infinite alternate;
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
              transform: translate3d(
                calc(var(--hero-pan-distance, 0px) * -1),
                0,
                0
              );
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .project-hero-pan {
              animation: none;
              transform: translate3d(0, 0, 0);
            }
          }
        `}</style>
      )}
    </div>
  );
}
