import Link from "next/link";

export default function Contact() {
  return (
    <section id="contact" className="w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-16 text-center">
        <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-6">
          Contact
        </p>

        <h2 className="text-4xl md:text-7xl font-light leading-[1.08] break-keep mb-8">
          공간에 대한 고민을
          <br />
          함께 나누어 보세요
        </h2>

        <p className="text-sm md:text-lg leading-8 md:leading-9 text-neutral-600 break-keep mb-10">
          주거 인테리어부터 건축 프로젝트까지,
          <br className="hidden md:block" />
          공간에 대한 고민을 함께 나누고 가장 적합한 방향을 제안합니다.
        </p>

        <Link
          href="/consultation"
          className="inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 text-xs md:text-sm tracking-[0.2em] transition duration-500"
          style={{
            backgroundColor: "#4A433D",
            color: "#F3F0EB",
          }}
        >
          프로젝트 상담 신청
        </Link>
      </div>
    </section>
  );
}