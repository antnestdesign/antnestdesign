"use client";

import { useEffect } from "react";
import Header from "../components/Header";

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

export default function ConsultationPage() {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://tally.so/widgets/embed.js"]'
    );

    if (existingScript) {
      window.Tally?.loadEmbeds();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    script.onload = () => {
      window.Tally?.loadEmbeds();
    };

    document.body.appendChild(script);
  }, []);

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen">
      <Header />

      <section className="max-w-7xl mx-auto px-6 md:px-16 pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="grid md:grid-cols-[0.72fr_1.28fr] gap-8 md:gap-20">
          <div className="md:sticky md:top-28 h-fit">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4 md:mb-6">
              Project Inquiry
            </p>

            <h1 className="text-[34px] md:text-6xl font-light leading-[1.08] break-keep mb-5 md:mb-8">
              공간에 대한
              <br />
              고민을
              <br />
              들려주세요.
            </h1>

            <p className="text-[13px] md:text-lg leading-7 md:leading-9 text-neutral-600 break-keep max-w-md">
              남겨주신 내용을 확인한 뒤,
              프로젝트 성격에 맞는 상담 방향을 안내드립니다.
            </p>
          </div>

          <div className="relative bg-transparent md:bg-white/35 md:border md:border-neutral-200 overflow-visible">
            <iframe
              data-tally-src="https://tally.so/embed/obxPqb?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="1200"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="AND 프로젝트 상담 신청"
              className="block w-full border-0"
            />
          </div>
        </div>
      </section>
    </main>
  );
}