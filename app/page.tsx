import Header from "./components/Header";
import Hero from "./components/Hero";
import Approach from "./components/Approach";
import Manifesto from "./components/Manifesto";
import Residential from "./components/Residential";
import Architecture from "./components/Architecture";
import Experience from "./components/Experience";
import Process from "./components/Process";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="h-[100svh] overflow-y-auto scroll-smooth snap-y snap-mandatory bg-[#F3F0EB] text-[#4A433D]">
      <Header />

      <section className="h-[100svh] snap-start overflow-hidden">
        <Hero />
      </section>

      <section className="h-[100svh] snap-start overflow-hidden flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-16 pt-20 md:pt-0 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-32">
            <Approach />
            <Manifesto />
          </div>
        </div>
      </section>

      <section className="h-[100svh] snap-start overflow-hidden bg-white">
        <div className="h-full flex items-center">
          <Residential />
        </div>
      </section>

      <section className="h-[100svh] snap-start overflow-hidden flex items-center">
        <Architecture />
      </section>

      <section className="h-[100svh] snap-start overflow-hidden flex items-center bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-16 pt-20 md:pt-0 w-full">
          <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-7 md:gap-24">
            <Experience />
            <Process />
          </div>
        </div>
      </section>

      <section className="h-[100svh] snap-start overflow-hidden flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Contact />
        </div>
        <Footer />
      </section>
    </main>
  );
}