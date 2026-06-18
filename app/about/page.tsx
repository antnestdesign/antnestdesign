import Image from "next/image";
import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";

export default function AboutPage() {
  return (
    <main className="h-[100svh] overflow-y-auto scroll-smooth snap-y snap-mandatory bg-[#F3F0EB] text-[#4A433D]">
      <Header />

      <section className="relative h-[100svh] snap-start overflow-hidden flex flex-col px-6 md:px-16 pt-24 md:pt-28 pb-8 md:pb-10">
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid md:grid-cols-12 gap-5 md:gap-12 items-center">
              <div className="md:col-span-5">
                <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4 md:mb-6">
                  About
                </p>

                <h1 className="text-[clamp(30px,9vw,38px)] md:text-7xl font-light leading-[1.08] break-keep">
                  우리는 공간을
                  <br />
                  꾸미기보다
                  <br />
                  이해하려고 합니다
                </h1>
              </div>

              <div className="md:col-span-3 md:self-start md:pt-28">
                <p className="text-[15px] md:text-2xl font-light leading-[1.55] md:leading-[1.65] break-keep">
                  좋은 공간은 표면이 아니라 구조에서 시작됩니다.
                </p>
              </div>

              <div className="md:col-span-4 md:self-end">
                <div className="border-t border-neutral-300 pt-4 md:pt-8">
                  <p className="text-[12px] md:text-lg leading-6 md:leading-9 text-neutral-600 break-keep mb-3 md:mb-6">
                    공간은 마감재와 가구만으로 완성되지 않습니다.
                  </p>

                  <p className="text-[12px] md:text-lg leading-6 md:leading-9 text-neutral-600 break-keep mb-3 md:mb-6">
                    사람의 생활방식과 동선, 건축의 구조와 비례, 그리고 시간이
                    흐른 뒤의 사용성까지 함께 고려되어야 합니다.
                  </p>

                  <p className="text-[12px] md:text-lg leading-6 md:leading-9 text-neutral-600 break-keep">
                    앤트네스트디자인은 인테리어를 건축과 분리해서 생각하지
                    않습니다.
                    <br />
                    단독주택부터 상가주택, 연면적 20,000㎡ 규모의 복합건축
                    프로젝트까지 공간을 보다 입체적으로 바라보고 설계합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="h-[100svh] snap-start overflow-hidden flex flex-col px-6 md:px-16 pt-20 md:pt-28 border-t border-neutral-300">
        <div className="flex-1 flex items-center pb-4 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid md:grid-cols-12 gap-6 md:gap-20 items-center">
              <div className="md:col-span-5 flex flex-col items-center md:items-start">
                <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-5 md:mb-8 w-full text-center md:text-left">
                  Brand Story
                </p>

                <div className="w-full flex justify-center md:justify-start">
                  <Image
                    src="/logo.png"
                    alt="ANTNEST DESIGN"
                    width={420}
                    height={128}
                    className="w-[180px] md:w-[360px] h-auto"
                    priority
                  />
                </div>

                <p className="mt-5 md:mt-10 text-[17px] md:text-[clamp(22px,2vw,30px)] font-light leading-[1.65] md:leading-[1.65] break-keep max-w-md text-center md:text-left">
                  개미집처럼 견고하고,
                  <br />
                  유기적이며,
                  <br />
                  실용적인 공간을 만듭니다.
                </p>
              </div>

              <div className="md:col-span-7">
                <div className="space-y-5 md:space-y-10">
                  <div className="max-w-2xl">
                    <p className="uppercase tracking-[0.3em] text-[10px] md:text-xs mb-3 md:mb-5">
                      Ant Nest
                    </p>

                    <p className="text-[12px] md:text-lg leading-6 md:leading-9 text-neutral-600 break-keep">
                      ANTNEST DESIGN은 개미집에서 시작되었습니다.
                      <br />
                      개미집은 화려하지 않지만 견고하고, 유기적이며,
                      효율적인 구조를 가지고 있습니다.
                      <br />
                      우리는 그 구조적 태도를 공간에 담아 실제 생활에 맞는
                      공간을 설계합니다.
                    </p>
                  </div>

                  <div className="max-w-2xl md:ml-12 border-t border-neutral-300 pt-4 md:pt-7">
                    <p className="uppercase tracking-[0.3em] text-[10px] md:text-xs mb-3 md:mb-5">
                      Why AND
                    </p>

                    <p className="text-[12px] md:text-lg leading-6 md:leading-9 text-neutral-600 break-keep">
                      AND는 연결을 의미합니다.
                      <br />
                      건축과 인테리어, 설계와 시공, 공간과 사람.
                      <br />
                      좋은 공간은 이 요소들이 자연스럽게 연결될 때 완성된다고
                      믿습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <MiniFooter />
      </section>
    </main>
  );
}