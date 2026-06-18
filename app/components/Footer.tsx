export default function Footer() {
  return (
    <footer className="bg-[#2E2A26] text-white">
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-7 md:py-8 grid md:grid-cols-4 gap-6 md:gap-8 items-start">
        <div>
          <h3 className="text-2xl tracking-[0.25em] mb-2">AND</h3>

          <p className="text-white/60 text-sm">
            Architecture of Everyday Life
          </p>
        </div>

        <div className="text-xs md:text-sm text-white/70 leading-7">
          <p className="text-white/45 text-[10px] tracking-[0.28em] uppercase mb-1">
            Company
          </p>
          <p>주식회사 앤트네스트디자인</p>
          <p>대표자 : 이민영</p>
          <p>사업자등록번호 : 149-85-03105</p>
        </div>

        <div className="text-xs md:text-sm text-white/70 leading-7">
          <p className="text-white/45 text-[10px] tracking-[0.28em] uppercase mb-1">
            Contact
          </p>
          <p>TEL : 032-321-6909</p>
          <p>FAX : 032-321-6895</p>
          <p className="whitespace-nowrap">antnestdesign@naver.com</p>
        </div>

        <div className="text-xs md:text-sm text-white/70 leading-7 md:text-right">
          <p className="text-white/45 text-[10px] tracking-[0.28em] uppercase mb-1">
            Address
          </p>
          <p>인천 서구 중봉대로 612번길 10-20</p>
          <p>506호 (청라동, 청라프라자1)</p>
        </div>
      </div>
    </footer>
  );
}