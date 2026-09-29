import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/ent-clinic";

function Figure({ name, alt, ratio }: { name: string; alt: string; ratio: string }) {
  return <ProjectImage src={`${base}/${name}.webp`} alt={alt} ratio={ratio} />;
}

export default function EntClinic() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <h2 className="text-3xl md:text-5xl font-light leading-[1.3] break-keep mb-10">
          병원이 호텔 같을 순 없을까?
        </h2>
        <div className="space-y-6 text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          <p>병원을 찾는 사람도 잠시 손님처럼 환대받을 수는 없을까. 이 프로젝트는 그 질문에서 출발했습니다.</p>
          <p>접수와 대기, 진료와 회복으로 이어지는 공간에 호텔의 차분한 분위기와 머무름의 감각을 담았습니다. 의료 공간의 기능을 바탕으로, 기다리는 시간과 치료 전후의 경험을 조금 더 편안하게 만드는 이비인후과를 제안합니다.</p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Reception" title="접수대를 리셉션처럼" description="천장으로 펼쳐지는 우드 루버가 방문객을 맞이하며 접수 공간의 중심을 만듭니다. 뒤편의 커튼은 빛을 부드럽게 걸러내고, 카운터 아래의 은은한 조명은 따뜻한 첫인상을 더합니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <Figure name="05-reception-front" alt="커튼의 확산광과 우드 루버로 구성한 이비인후과 리셉션 디자인 제안" ratio="aspect-[1573/1000]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Lounge" title="대기실을 라운지처럼" description="일렬로 늘어선 의자 대신 소파와 낮은 테이블을 배치해 대기 공간에 머무를 수 있는 자리를 마련했습니다. 진료실 앞에는 벽면 안으로 들어간 벤치를 두어, 이동하는 흐름과 기다리는 자리가 자연스럽게 이어지도록 계획했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <Figure name="04-corridor-bench" alt="진료실과 수액실 사이 우드 루버 대기 벤치 디자인 제안" ratio="aspect-[1672/941]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Light & Circulation" title="빛을 따라 자연스럽게" description="진료실로 이어지는 복도 양쪽에 선형 코브조명을 길게 연결해 이동 방향을 잡았습니다. 진료실·주사실·수액실로 향하는 고객 동선에 맞춰 필요한 위치에 빛을 더함으로써, 공간을 따라 자연스럽게 이동하도록 계획했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <Figure name="10-corridor-lounge" alt="복도 양쪽 선형 코브조명으로 동선을 안내하는 이비인후과 디자인 제안" ratio="aspect-[1654/951]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Examination & Treatment" title="진료 공간은 명료하게" description="진료실은 자연광을 조절하는 블라인드와 밝고 정돈된 마감으로 구성했습니다. 호흡기 치료 공간까지 같은 재료와 조명의 흐름을 이어가되, 각 공간에 필요한 장비와 좌석을 중심으로 기능을 분명하게 계획했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <Figure name="02-examination-room" alt="진료 장비와 상담 테이블을 배치한 이비인후과 진료실 디자인 제안" ratio="aspect-[1463/1075]" />
          <Figure name="08-respiratory-treatment" alt="네 개의 치료 좌석으로 구성한 호흡기 치료 공간 디자인 제안" ratio="aspect-[1381/1139]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Private Rest" title="수액실을 객실처럼" description="커튼 너머 나만의 자리에서 편안히 기대거나 누워 쉬는 시간. 부드러운 조명과 따뜻한 재료로, 수액을 맞는 동안에도 객실에 머무는 듯한 아늑함을 담았습니다. 리클라이너와 침상이 있는 자리를 각각 마련해 휴식의 방식을 나눴습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <Figure name="07-infusion-cubicles" alt="커튼으로 구분한 두 개의 리클라이너 수액 공간 디자인 제안" ratio="aspect-[1320/1191]" />
            <Figure name="09-infusion-side" alt="테이블 조명과 세면대를 갖춘 수액실 측면 디자인 제안" ratio="aspect-[1477/1065]" />
          </div>
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-10 items-center">
            <Figure name="06-recovery-bed" alt="우드 헤드월과 개별 조명을 갖춘 침상형 수액실 디자인 제안" ratio="aspect-[948/1659]" />
            <Figure name="03-recovery-side" alt="침상과 세면대가 배치된 개별 휴식 공간 측면 디자인 제안" ratio="aspect-[1287/1222]" />
          </div>
        </div>
      </section>
    </>
  );
}
