export default function Process() {
  return (
    <div className="w-full">
      <p className="uppercase tracking-[0.32em] text-[9px] md:text-xs mb-4 md:mb-10">
        Process
      </p>

      <div className="space-y-1.5 md:space-y-7">
        {[
          ["01", "상담 및 현장미팅"],
          ["02", "공간 분석 및 설계 제안"],
          ["03", "계약 및 공사 일정 협의"],
          ["04", "시공 및 현장 관리"],
          ["05", "완공 및 사후관리"],
        ].map(([num, text]) => (
          <div key={num} className="border-b border-neutral-300 pb-2 md:pb-5">
            <div className="flex flex-row justify-between items-baseline gap-4">
              <h3 className="text-[22px] md:text-4xl font-light">{num}</h3>
              <p className="text-[11px] md:text-base break-keep text-right">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}