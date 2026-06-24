"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
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