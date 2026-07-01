"use client";

import Image from "next/image";
import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "ABOUT", href: "/about" },
  { label: "PROJECTS", href: "/projects" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const isHeroState = isHome && !scrolled && !menuOpen;
  const menuColor = isHeroState ? "#F3F0EB" : "#4A433D";

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);

    if (!isHome) return;

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 z-50 w-full">
      <div
        className={
          isHeroState
            ? "absolute inset-0 bg-transparent transition-all duration-500"
            : "absolute inset-0 bg-[#F3F0EB]/92 backdrop-blur-md border-b border-black/5 transition-all duration-500"
        }
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-16 py-4 flex justify-between items-center">
        <Link href="/" className="shrink-0 block" onClick={handleLogoClick}>
          {isHome ? (
            <span className="relative block">
              <Image
                src="/logo-hero-white.png"
                alt="ANTNEST DESIGN"
                width={620}
                height={180}
                priority
                className={`w-[150px] md:w-[220px] h-auto transition-all duration-500 ${
                  isHeroState
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 absolute left-0 top-0 pointer-events-none"
                }`}
              />

              <Image
                src="/logo.png"
                alt="ANTNEST DESIGN"
                width={420}
                height={120}
                className={`w-[92px] md:w-[118px] h-auto transition-all duration-500 ${
                  isHeroState
                    ? "opacity-0 scale-95 absolute left-0 top-0 pointer-events-none"
                    : "opacity-100 scale-100"
                }`}
              />
            </span>
          ) : (
            <Image
              src="/logo.png"
              alt="ANTNEST DESIGN"
              width={420}
              height={120}
              className="w-[92px] md:w-[118px] h-auto transition-all duration-500"
            />
          )}
        </Link>

        <nav
          className="hidden md:flex items-center text-[11px] md:text-[13px] tracking-[0.22em]"
          style={{ columnGap: "clamp(42px, 7vw, 110px)" }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative font-medium transition whitespace-nowrap"
                style={{ color: menuColor }}
              >
                {item.label}
                <span
                  className={`absolute left-0 -bottom-2 h-px bg-current transition-all duration-500 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden text-[10px] tracking-[0.28em] font-medium transition-colors duration-500"
          style={{ color: menuColor }}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
      </div>

      <div
        className={
          menuOpen
            ? "md:hidden absolute top-full left-0 w-full bg-[#F3F0EB]/98 backdrop-blur-md border-t border-black/5 transition-all duration-500 opacity-100 translate-y-0"
            : "md:hidden absolute top-full left-0 w-full bg-[#F3F0EB]/98 backdrop-blur-md border-t border-black/5 transition-all duration-500 opacity-0 -translate-y-3 pointer-events-none"
        }
      >
        <nav className="px-6 py-7">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-4 text-sm tracking-[0.28em] border-b border-black/5 last:border-b-0 transition ${
                  isActive
                    ? "text-[#4A433D] font-medium"
                    : "text-[#4A433D]/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}