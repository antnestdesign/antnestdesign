import Link from "next/link";
import Header from "../components/Header";

export default function ContactPage() {
  const process = [
    {
      num: "01",
      title: "상담 및 현장미팅",
      description:
        "프로젝트의 성격, 예산, 일정, 생활방식에 대해 이야기를 나눕니다.",
    },
    {
      num: "02",
      title: "공간 분석 및 설계 제안",
      description:
        "공간의 조건과 요구사항을 바탕으로 방향을 정리하고 설계안을 제안합니다.",
    },
    {
      num: "03",
      title: "계약 및 공사 일정 협의",
      description:
        "제안 내용과 견적을 확인한 뒤 계약과 공사 일정을 확정합니다.",
    },
    {
      num: "04",
      title: "시공 및 현장 관리",
      description:
        "설계 의도가 현장에서 구현될 수 있도록 공정과 디테일을 관리합니다.",
    },
    {
      num: "05",
      title: "완공 및 사후관리",
      description:
        "완공 후 공간을 함께 확인하고 필요한 사후관리를 진행합니다.",
    },
  ];

  const contactInfo = (
    <div className="space-y-3 md:space-y-4">
      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1 md:mb-1.5">
          Phone
        </p>

        <a
          href="tel:0323216909"
          className="text-xl md:text-2xl font-light hover:opacity-60 transition"
        >
          032.321.6909
        </a>
      </div>

      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1 md:mb-1.5">
          Email
        </p>

        <a
          href="mailto:antnestdesign@naver.com"
          className="text-lg md:text-xl font-light hover:opacity-60 transition"
        >
          antnestdesign@naver.com
        </a>
      </div>

      <div className="border-t border-neutral-300 pt-3 md:pt-3">
        <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-500 mb-1 md:mb-1.5">
          Location
        </p>

        <p className="text-[12px] md:text-sm leading-6 md:leading-6 text-neutral-600 break-keep">
          인천 서구 중봉대로 612번길 10-20
          <br />
          청라프라자1 506호
        </p>
      </div>
    </div>
  );

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen md:h-screen overflow-y-auto md:overflow-hidden">
      <Header />

      <section className="min-h-screen md:h-full max-w-7xl mx-auto px-6 md:px-16 pt-24 md:pt-24 pb-10 md:pb-5 flex flex-col">
        <div className="flex-1 flex items-start pt-3 md:pt-6">
          <div className="grid md:grid-cols-12 gap-8 md:gap-20 w-full">
            <div className="md:col-span-5">
              <p className="uppercase tracking-[0.35em] text-[9px] md:text-[10px] text-neutral-500 mb-3 md:mb-4">
                Contact
              </p>

              <h1 className="text-[28px] md:text-5xl font-light leading-[1.05] md:leading-[1.05] break-keep mb-4 md:mb-5">
                공간에 대한
                <br />
                고민을 함께
                <br />
                나누어 보세요
              </h1>

              <p className="text-[12px] md:text-[15px] leading-6 md:leading-7 text-neutral-600 break-keep max-w-lg mb-7 md:mb-8">
                주거 인테리어부터 건축 프로젝트까지, 공간에 대한 고민을 함께
                나누고 가장 적합한 방향을 제안합니다.
              </p>

              <div className="hidden md:block">{contactInfo}</div>
            </div>

            <div className="md:col-span-6 md:col-start-7 md:pt-6">
              <p className="uppercase tracking-[0.35em] text-[9px] md:text-[10px] text-neutral-500 mb-4 md:mb-5">
                Process
              </p>

              <div className="space-y-3 md:space-y-3">
                {process.map((item) => (
                  <div
                    key={item.num}
                    className="border-t border-neutral-300 pt-3 md:pt-3"
                  >
                    <div className="grid grid-cols-[42px_1fr] md:grid-cols-[56px_1fr] gap-3 md:gap-5">
                      <p className="text-2xl md:text-3xl font-light leading-none">
                        {item.num}
                      </p>

                      <div>
                        <h2 className="text-[14px] md:text-lg font-light mb-1 md:mb-1.5 break-keep">
                          {item.title}
                        </h2>

                        <p className="text-[11px] md:text-[13px] leading-5 md:leading-5 text-neutral-600 break-keep">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 md:mt-7 flex justify-center md:block">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center px-7 md:px-8 py-4 md:py-4 text-xs md:text-[13px] tracking-[0.2em] transition duration-500"
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
    </main>
  );
}