import Image from "next/image";
import Link from "next/link";

export default function MiniFooter() {
  return (
    <footer className="border-t border-neutral-300 bg-[#F3F0EB] text-[#4A433D]">
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 md:py-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <Image
              src="/logo.png"
              alt="ANTNEST DESIGN"
              width={420}
              height={120}
              className="w-[72px] md:w-[92px] h-auto mb-1"
            />

            <p className="text-[9px] md:text-xs text-neutral-500 truncate">
              주식회사 앤트네스트디자인
              <span className="hidden md:inline">
                {" "}
                · 대표자 이민영 · 사업자등록번호 149-85-03105
              </span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-5 text-[9px] md:text-xs tracking-[0.14em] md:tracking-[0.18em] text-neutral-500 whitespace-nowrap text-right">
            <Link href="/privacy" className="hover:text-[#4A433D] transition">
              개인정보처리방침
            </Link>

            <p>© 2026 ANTNEST DESIGN</p>
          </div>
        </div>
      </div>
    </footer>
  );
}