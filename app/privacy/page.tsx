import Header from "../components/Header";
import MiniFooter from "../components/MiniFooter";

export default function PrivacyPage() {
  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen">
      <Header />

      <section className="max-w-5xl mx-auto px-6 md:px-16 pt-28 md:pt-36 pb-20">
        <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-6">
          Privacy Policy
        </p>

        <h1 className="text-3xl md:text-6xl font-light leading-[1.08] mb-10">
          개인정보처리방침
        </h1>

        <div className="space-y-10 text-[13px] md:text-base leading-7 md:leading-8 text-neutral-700 break-keep">
          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              1. 개인정보의 수집 항목
            </h2>
            <p>
              주식회사 앤트네스트디자인은 프로젝트 상담 신청 및 문의 응대를
              위하여 이름, 연락처, 이메일, 프로젝트 위치, 예산, 공사 예정 시기,
              상담 내용 등의 개인정보를 수집할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              2. 개인정보의 이용 목적
            </h2>
            <p>
              수집한 개인정보는 프로젝트 상담, 견적 및 일정 안내, 문의 응대,
              서비스 제공을 위한 연락 목적으로만 이용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <p>
              개인정보는 상담 종료일로부터 1년간 보관 후 지체 없이 파기합니다.
              다만 관계 법령에 따라 보관이 필요한 경우 해당 법령이 정한 기간
              동안 보관할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p>
              회사는 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 법령에
              따라 요구되는 경우에는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              5. 개인정보 처리 위탁
            </h2>
            <p>
              회사는 상담 신청 접수를 위하여 Tally Technologies, Inc.의 폼
              서비스를 이용할 수 있습니다. 해당 서비스는 상담 신청 정보의 접수
              및 전달을 위해 사용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              6. 개인정보의 파기
            </h2>
            <p>
              보유 기간이 경과하거나 이용 목적이 달성된 개인정보는 복구 또는
              재생이 불가능한 방법으로 지체 없이 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              7. 개인정보 관련 문의
            </h2>
            <p>
              개인정보와 관련한 문의는 아래 연락처를 통해 접수하실 수 있습니다.
            </p>

            <div className="mt-5 border-t border-neutral-300 pt-5 text-neutral-600">
              <p>주식회사 앤트네스트디자인</p>
              <p>대표자 : 이민영</p>
              <p>전화 : 032-321-6722</p>
              <p>이메일 : antnestdesign@naver.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg md:text-2xl font-light mb-4">
              8. 시행일
            </h2>
            <p>본 개인정보처리방침은 2026년 6월 19일부터 시행됩니다.</p>
          </section>
        </div>
      </section>

      <MiniFooter />
    </main>
  );
}
