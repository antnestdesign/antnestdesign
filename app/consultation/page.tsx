import Header from "../components/Header";

export default function ConsultationPage() {
  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen">
      <Header />

      <section className="max-w-7xl mx-auto px-6 md:px-16 pt-24 md:pt-28 pb-10">
        <div className="grid md:grid-cols-[0.75fr_1.25fr] gap-10 md:gap-20">

          <div className="md:sticky md:top-28 h-fit">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-6">
              Project Inquiry
            </p>

            <h1 className="text-4xl md:text-6xl font-light leading-[1.08] break-keep mb-8">
              공간에 대한
              <br />
              고민을
              <br />
              들려주세요.
            </h1>

            <p className="text-sm md:text-lg leading-8 md:leading-9 text-neutral-600 break-keep max-w-md">
              남겨주신 내용을 확인한 뒤,
              프로젝트 성격에 맞는 상담 방향을 안내드립니다.
            </p>
          </div>

          <div className="bg-white/40 border border-neutral-200">
            <iframe
              src="https://tally.so/r/obxPqb?transparentBackground=1"
              className="w-full h-[760px] md:h-[900px] border-0"
              title="AND 프로젝트 상담 신청"
            />
          </div>

        </div>
      </section>
    </main>
  );
}