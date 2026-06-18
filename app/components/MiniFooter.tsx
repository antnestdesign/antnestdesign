export default function MiniFooter() {
  return (
    <footer className="border-t border-neutral-300 bg-[#F3F0EB] text-[#4A433D]">
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 md:py-5 flex flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-xl tracking-[0.25em] font-light">
            AND
          </h3>

          <p className="hidden md:block text-sm text-neutral-500 mt-1">
            주식회사 앤트네스트디자인 · 사업자등록번호 : 149-85-03105
          </p>
        </div>

        <p className="text-[9px] md:text-xs tracking-[0.18em] text-neutral-500 whitespace-nowrap">
          © 2026 ANTNEST DESIGN
        </p>
      </div>
    </footer>
  );
}