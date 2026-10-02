import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-halla-vivaldi";

function Figure({ name, alt, ratio }: { name: string; alt: string; ratio: string }) {
  return <ProjectImage src={`${base}/${name}.webp`} alt={alt} ratio={ratio} />;
}

export default function CheongnaHallaVivaldi() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <h2 className="text-3xl md:text-5xl font-light leading-[1.3] break-keep mb-10">소재와 빛으로 이어지는 집</h2>
        <div className="space-y-6 text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          <p>화이트 광폭마루와 웜화이트 벽지로 차분한 바탕을 만들고, 우드와 석재, 패브릭의 서로 다른 질감을 더했습니다.</p>
          <p>현관에서 시작된 재료의 흐름은 복도와 주방으로 이어지고, 거실과 침실에서는 머무는 방식에 맞춰 빛의 밀도를 달리했습니다. 공간마다 다른 표정을 가지면서도 하나의 집으로 자연스럽게 이어지는 모던 인테리어를 제안합니다.</p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Entrance" title="따뜻하게 맞이하는 첫 장면" description="화이트 타일과 벽지에 우드 필름 가구를 더해 밝고 따뜻한 현관을 구성했습니다. 간살 중문은 정면의 벽체로 향하는 시선을 부드럽게 나누고, 입구에서 복도까지 이어지는 간접조명은 안쪽 공간으로 자연스럽게 이끕니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="02-entry-cabinet" alt="화이트 타일과 우드 신발장, 하부 간접조명으로 구성한 현관 디자인 제안" ratio="aspect-[1504/1046]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Corridor" title="하나의 면으로 이어지는 동선" description="중문에서 이어진 우드 필름과 히든도어로 복도 벽면의 일체감을 만들었습니다. 천장 간접조명으로 은은한 바탕을 잡고 월워셔 다운라이트로 필요한 밝기를 더했습니다. 정면의 매입 실린더 조명은 복도의 끝에 작은 중심을 만듭니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <Figure name="03-entry-door" alt="시선을 분리하는 우드 간살 중문 디자인 제안" ratio="aspect-[890/1768]" />
            <Figure name="04-corridor" alt="우드 히든도어와 코브조명, 복도 끝 실린더 조명을 연결한 복도 디자인 제안" ratio="aspect-[870/1808]" />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Living Room" title="서로 다른 질감이 만나는 라운지" description="복도에서 이어지는 벽지에 패브릭, 빅슬랩 패널, 우드 루버와 석재 받침을 조합해 집의 분위기를 담은 아트월을 만들었습니다. 대형 모듈 소파와 라운지 체어는 편안히 기대고 머무를 수 있는 거실의 중심이 됩니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="05-art-wall" alt="석재와 패브릭, 우드 루버가 어우러진 거실 아트월 디자인 제안" ratio="aspect-[1672/941]" />
          <Figure name="06-living-night" alt="간접조명과 플로어 램프로 아늑하게 구성한 거실 야간 디자인 제안" ratio="aspect-[1672/941]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Kitchen & Dining" title="일상의 배경이 되는 주방" description="복도와 같은 우드 필름을 키큰장과 홈바까지 연결하고, 반대편 냉장고장은 벽지와 자연스럽게 어우러지는 색으로 정리했습니다. 상하부 광원을 갖춘 선형 펜던트로 조명을 간결하게 구성하고, 다이닝의 매입 실린더 조명으로 필요한 자리에 빛을 더했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="07-kitchen-day" alt="웜화이트 냉장고장과 우드 아일랜드로 구성한 주방 낮 디자인 제안" ratio="aspect-[1672/941]" />
          <Figure name="08-kitchen-night" alt="우드 키큰장과 홈바, 선형 펜던트가 이어지는 주방 밤 디자인 제안" ratio="aspect-[1672/941]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Bedroom" title="하루를 내려놓는 침실" description="쿠션 프레임 침대와 패브릭 헤드보드로 부드러운 중심을 만들고, 양쪽의 대칭 구성으로 호텔 객실 같은 차분함을 담았습니다. 천장 조명은 최소화하고 간접조명과 독서등을 중심으로 빛을 나누어, 눈부심을 줄이며 은은하게 쉴 수 있도록 계획했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="09-bedroom-day" alt="패브릭 헤드보드와 대칭형 협탁을 배치한 침실 낮 디자인 제안" ratio="aspect-[1538/1022]" />
          <Figure name="10-bedroom-night" alt="간접조명과 두 개의 독서등으로 빛을 나눈 침실 밤 디자인 제안" ratio="aspect-[1538/1022]" />
          <Figure name="11-bedroom-side" alt="화이트 광폭마루와 우드 도어가 이어지는 침실 측면 디자인 제안" ratio="aspect-[1503/1047]" />
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-10 items-center">
            <Figure name="12-powder-room" alt="원형 간접조명 거울과 우드 가구를 배치한 파우더룸 디자인 제안" ratio="aspect-[1212/1297]" />
            <Figure name="13-dressing-room" alt="우드 마감의 정돈된 수납 벽면으로 구성한 드레스룸 디자인 제안" ratio="aspect-[1516/1038]" />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Bathroom" title="석재와 빛으로 완성한 여백" description="매입등을 줄이고 간접조명을 적극적으로 활용해 석재의 질감이 부드럽게 드러나도록 했습니다. 젠다이와 샤워 공간 벽면에 같은 자재를 연결해 하나의 아트월처럼 구성하고, 리브드 유리로 영역을 나누면서 빛의 흐름은 이어갑니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-10 items-center">
          <Figure name="14-bathroom-front" alt="젠다이와 샤워 벽면에 같은 석재를 연결한 욕실 정면 디자인 제안" ratio="aspect-[1404/1120]" />
          <Figure name="15-bathroom-side" alt="리브드 유리 파티션과 간접조명으로 구성한 욕실 측면 디자인 제안" ratio="aspect-[914/1720]" />
        </div>
      </section>
    </>
  );
}
