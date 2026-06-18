"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";
  const showTextLogo = isHome && !scrolled && !menuOpen;
  const darkHeader = !isHome || scrolled || menuOpen;

  useEffect(() => {
    const main = document.querySelector("main");

    const handleScroll = () => {
      if (!main) return;
      setScrolled(main.scrollTop > 80);
    };

    main?.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      main?.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logoColor = darkHeader ? "#4A433D" : "#FFFFFF";
  const subColor = darkHeader
    ? "rgba(74,67,61,0.6)"
    : "rgba(255,255,255,0.85)";
  const menuColor = darkHeader ? "#4A433D" : "#FFFFFF";

  const navItems = [
    { href: "/projects", label: "PROJECTS" },
    { href: "/about", label: "ABOUT" },
    { href: "/contact", label: "CONTACT" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div
        className={
          darkHeader
            ? "absolute inset-0 bg-[#F3F0EB]/85 backdrop-blur-md border-b border-black/5 transition-all duration-500"
            : "absolute inset-0 bg-transparent transition-all duration-500"
        }
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-16 py-4 flex justify-between items-center">
        <Link href="/" className="shrink-0">
          {showTextLogo ? (
            <div className="flex flex-col items-center leading-none">
              <span
                className="text-2xl md:text-3xl font-light tracking-[0.24em] transition-all duration-500"
                style={{ color: logoColor }}
              >
                AND
              </span>

              <span
                className="mt-1 text-[7px] md:text-[9px] tracking-[0.28em] transition-all duration-500 whitespace-nowrap"
                style={{ color: subColor }}
              >
                ANTNEST DESIGN
              </span>
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="ANTNEST DESIGN"
              width={420}
              height={120}
              priority
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
          className="md:hidden text-[10px] tracking-[0.28em] font-medium transition"
          style={{ color: menuColor }}
        >
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
      </div>

      <div
        className={
          menuOpen
            ? "md:hidden absolute top-full left-0 w-full bg-[#F3F0EB]/95 backdrop-blur-md border-t border-black/5 transition-all duration-500 opacity-100 translate-y-0"
            : "md:hidden absolute top-full left-0 w-full bg-[#F3F0EB]/95 backdrop-blur-md border-t border-black/5 transition-all duration-500 opacity-0 -translate-y-3 pointer-events-none"
        }
      >
        <nav className="px-6 py-7">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
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