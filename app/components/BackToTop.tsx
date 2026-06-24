"use client";

import { useEffect, useState } from "react";

type BackToTopProps = {
  targetId?: string;
  threshold?: number;
};

export default function BackToTop({
  targetId,
  threshold = 500,
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targetElement = targetId ? document.getElementById(targetId) : null;

    const getScrollTop = () => {
      if (targetElement) {
        return targetElement.scrollTop;
      }

      return window.scrollY;
    };

    const handleScroll = () => {
      setVisible(getScrollTop() > threshold);
    };

    handleScroll();

    if (targetElement) {
      targetElement.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        targetElement.removeEventListener("scroll", handleScroll);
      };
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [targetId, threshold]);

  const scrollToTop = () => {
    const targetElement = targetId ? document.getElementById(targetId) : null;

    if (targetElement) {
      targetElement.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 bg-[#675B56]/90 text-[#F3F0EB] shadow-lg backdrop-blur-sm transition-all duration-500 hover:bg-[#4A433D] ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <span className="text-lg md:text-xl leading-none">↑</span>
    </button>
  );
}