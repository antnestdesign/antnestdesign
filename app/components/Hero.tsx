import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      <Image
        src="/home/hero.jpg"
        alt="AND main interior"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative h-full">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-16">
          <div className="h-full flex flex-col justify-center pt-20 md:pt-24">
            <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
              <div className="md:col-span-8">
                <div className="mb-12 md:mb-6">
                  <div className="md:hidden space-y-0.5">
                    <p className="uppercase tracking-[0.55em] text-[10px] text-white/70">
                      Architecture
                    </p>

                    <p className="uppercase tracking-[0.55em] text-[10px] text-white/70">
                      Interior
                    </p>

                    <p className="uppercase tracking-[0.55em] text-[10px] text-white/70">
                      Construction
                    </p>
                  </div>

                  <p className="hidden md:block uppercase tracking-[0.45em] text-xs text-white/70">
                    Architecture · Interior · Construction
                  </p>
                </div>

                <h1 className="text-white text-[42px] md:text-8xl font-light leading-[1.03] md:leading-[1.02] tracking-[-0.03em] md:tracking-[-0.02em]">
                  Architecture
                  <br />
                  of Everyday Life
                </h1>
              </div>

              <div className="md:col-span-4 md:pb-2">
                <p className="text-white/85 leading-7 md:leading-9 text-[15px] md:text-xl font-light break-keep mt-8 md:mt-0">
                  <span className="md:hidden">
                    삶의 방식에 맞는 공간을 설계합니다.
                    <br />
                    오래 머물고 싶은 공간을 만듭니다.
                  </span>

                  <span className="hidden md:inline">
                    건축적 사고와 시공 경험을 바탕으로 삶의 방식에 맞는
                    공간을 설계합니다.
                    <br className="hidden md:block" />
                    화려함보다 오래 머물고 싶은 공간,
                    유행보다 오래 지속되는 공간을 만듭니다.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="text-white/65 text-[10px] md:text-xs tracking-[0.45em]">
          SCROLL
        </span>

        <div className="mt-3 text-white/75 text-3xl md:text-4xl font-extralight leading-none animate-scroll-down">
          ∨
        </div>
      </div>
    </section>
  );
}