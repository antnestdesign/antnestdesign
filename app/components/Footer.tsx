export default function Footer() {
  return (
    <footer className="bg-[#2E2A26] text-white">
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-8 grid md:grid-cols-3 gap-8 items-center">

        <div>
          <h3 className="text-2xl tracking-[0.25em] mb-2">
            AND
          </h3>

          <p className="text-white/60 text-sm">
            Architecture of Everyday Life
          </p>
        </div>

        <div className="text-sm text-white/70 leading-7">
          <p>032-321-6909</p>
          <p>antnestdesign@naver.com</p>
        </div>

        <div className="text-sm text-white/70 leading-7 md:text-right">
          <p>인천 서구 중봉대로 612번길 10-20</p>
          <p>506호 (청라동, 청라프라자1)</p>
        </div>

      </div>
    </footer>
  );
}