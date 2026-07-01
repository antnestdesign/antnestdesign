import Link from "next/link";
import Header from "../components/Header";
import BackToTop from "../components/BackToTop";

export default function ContactPage() {
  const process = [
    [
      "01",
      "상담 및 현장미팅",
      "프로젝트의 성격, 예산, 일정, 생활방식에 대해 이야기를 나눕니다.",
    ],
    [
      "02",
      "공간 분석 및 설계 제안",
      "공간의 조건과 요구사항을 바탕으로 방향을 정리하고 설계안을 제안합니다.",
    ],
    [
      "03",
      "계약 및 공사 일정 협의",
      "제안 내용과 견적을 확인한 뒤 계약과 공사 일정을 확정합니다.",
    ],
    [
      "04",
      "시공 및 현장 관리",
      "설계 의도가 현장에서 구현될 수 있도록 공정과 디테일을 관리합니다.",
    ],
    [
      "05",
      "완공 및 사후관리",
      "완공 후 공간을 함께 확인하고 필요한 사후관리를 진행합니다.",
    ],
  ];

  const contactInfo = (
    <div className="space-y-3 md:space-y-2.5">
      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1">
              Phone
            </p>
            <a
              href="tel:0323216909"
              className="text-lg md:text-[22px] font-light"
            >
              032.321.6909
            </a>
          </div>

          <div>
            <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1">
              Fax
            </p>
            <p className="text-lg md:text-[22px] font-light">032.321.6895</p>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1">
          Email
        </p>
        <a
          href="mailto:antnestdesign@naver.com"
          className="text-base md:text-[19px] font-light break-all"
        >
          antnestdesign@naver.com
        </a>
      </div>

      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1">
          Location
        </p>
        <p className="text-[12px] md:text-[13px] leading-5 md:leading-[1.65] text-neutral-600 break-keep">
          인천 서구 중봉대로 612번길 10-20
          <br />
          506호 (청라동, 청라프라자1)
        </p>
      </div>

      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1">
          Company
        </p>
        <p className="text-[12px] md:text-[13px] leading-5 md:leading-[1.6] text-neutral-600 break-keep">
          주식회사 앤트네스트디자인 · 대표자 이민영
          <br />
          사업자등록번호 149-85-03105
        </p>
      </div>
    </div>
  );

  return (
    <main className="min-h-[100svh] md:h-[100svh] overflow-visible md:overflow-hidden bg-[#F3F0EB] text-[#4A433D]">
      <Header />

      <section className="min-h-[100svh] md:h-[100svh] max-w-7xl mx-auto px-6 md:px-16 pt-24 md:pt-0 pb-20 md:pb-0">
        <div className="md:h-full md:pt-20 md:pb-8 flex items-start md:items-center">
          <div className="grid md:grid-cols-12 gap-8 md:gap-16 w-full">
            <div className="md:col-span-5">
              <p className="uppercase tracking-[0.35em] text-[9px] md:text-[10px] text-neutral-500 mb-3 md:mb-4">
                Contact
              </p>

              <h1 className="text-[26px] md:text-[54px] font-light leading-[1.08] break-keep mb-4 md:mb-5">
                공간에 대한
                <br />
                고민을 함께
                <br />
                나누어 보세요
              </h1>

              <p className="text-[12px] md:text-[14px] leading-6 md:leading-7 text-neutral-600 break-keep max-w-lg mb-6 md:mb-6">
                주거 인테리어부터 건축 프로젝트까지, 공간에 대한 고민을 함께
                나누고 가장 적합한 방향을 제안합니다.
              </p>

              <div className="hidden md:block">{contactInfo}</div>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <p className="uppercase tracking-[0.35em] text-[9px] md:text-[10px] text-neutral-500 mb-3 md:mb-4">
                Process
              </p>

              <div className="space-y-2 md:space-y-3">
                {process.map(([num, title, description]) => (
                  <div
                    key={num}
                    className="border-t border-neutral-300 pt-2.5 md:pt-3"
                  >
                    <div className="grid grid-cols-[38px_1fr] md:grid-cols-[58px_1fr] gap-3 md:gap-5">
                      <p className="text-[22px] md:text-4xl font-light leading-none">
                        {num}
                      </p>

                      <div>
                        <h2 className="text-[13px] md:text-xl font-light mb-1 break-keep">
                          {title}
                        </h2>

                        <p className="text-[10px] md:text-[13px] leading-[1.55] md:leading-6 text-neutral-600 break-keep">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 md:mt-14 flex justify-center">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center px-7 md:px-9 py-3.5 md:py-4 text-[11px] md:text-sm tracking-[0.2em]"
                  style={{
                    backgroundColor: "#4A433D",
                    color: "#F3F0EB",
                  }}
                >
                  프로젝트 상담 신청
                </Link>
              </div>

              <div className="block md:hidden mt-10">{contactInfo}</div>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
    </main>
  );
}