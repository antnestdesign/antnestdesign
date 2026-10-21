import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-hanwha-kkumegreen-44a";

function Figure({ name, alt, ratio }: { name: string; alt: string; ratio: string }) {
  return <ProjectImage src={`${base}/${name}.webp`} alt={alt} ratio={ratio} />;
}

export default function CheongnaHanwhaKkumegreen44A() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <h2 className="text-3xl md:text-5xl font-light leading-[1.3] break-keep mb-10">깊이 있는 재료, 간결한 동선</h2>
        <div className="space-y-6 text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          <p>짙은 우드와 석재, 브론즈의 차분한 깊이 위에 필요한 빛을 더했습니다. 재료의 존재감은 살리되, 수납과 이동은 일상에 맞게 간결하게 정리한 집입니다.</p>
          <p>벽체 끝까지 이어지는 아일랜드와 홈바, 다이닝과 라운지로 나눈 거실, 한쪽 벽으로 모은 서재 가구. 각 공간의 쓰임을 분명히 하면서 같은 재료와 은은한 조명으로 하나의 흐름을 만들었습니다.</p>
          <p className="text-sm md:text-base text-neutral-500">공급면적 148.48A㎡ · 전용면적 113.75A㎡ (전용률 약 77%) · 44A</p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Entrance & Corridor" title="시선은 열고, 빛은 은은하게" description="좁은 폭과 정면 벽체로 생기는 답답함을 줄이기 위해 간살 없는 유리 중문을 계획했습니다. 안개유리는 시선을 부드럽게 걸러내고, 신발장 하부의 간접등은 발밑에 은은한 빛을 만듭니다. 복도에서는 포인트 벽을 비추는 월워셔와 천장 간접조명으로 공간의 깊이를 이어갑니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <Figure name="02-entry" alt="안개유리 중문과 신발장 하부 간접등을 계획한 현관 디자인 제안" ratio="aspect-[901/1746]" />
          <Figure name="03-corridor" alt="천장 간접조명과 짙은 우드 벽면이 거실로 이어지는 복도 디자인 제안" ratio="aspect-[887/1773]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Kitchen & Home Bar" title="하나의 선으로 정리한 주방" description="벽체 끝까지 길게 이어지는 아일랜드로 주방의 중심을 잡고 수납을 확보했습니다. 상하부 광원을 갖춘 펜던트로 조도를 나누어 직부조명을 줄였습니다. 홈바의 벽면과 상판에는 같은 재료를 사용하고, 브론즈 철제 선반과 간접조명으로 석재의 질감을 살렸습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="07-kitchen" alt="벽체 끝까지 이어지는 석재 아일랜드와 상하부 광원 펜던트의 주방 디자인 제안" ratio="aspect-[1672/941]" />
          <Figure name="04-homebar" alt="같은 석재 벽면과 상판, 브론즈 철제 선반을 연결한 홈바 디자인 제안" ratio="aspect-[1933/813]" />
          <div className="max-w-xl mx-auto">
            <Figure name="08-utility-kitchen" alt="밝은 수납장과 하부 간접조명으로 정돈한 보조주방 디자인 제안" ratio="aspect-[1104/1424]" />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Dining & Lounge" title="함께 쓰는 공간, 서로 다른 머무름" description="거실을 다이닝과 라운지 영역으로 나누고, 러그로 라운지의 경계를 부드럽게 잡았습니다. 식사하는 자리와 편히 쉬는 자리가 한 공간 안에서 자연스럽게 공존합니다. 복도부터 이어지는 포인트 벽의 색감을 유지하면서 빅슬랩과 간접조명을 더해 거실의 중심을 만들었습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="05-kitchen-living-day" alt="주방과 다이닝, 러그로 구분한 라운지가 이어지는 낮 장면 디자인 제안" ratio="aspect-[2020/778]" />
          <Figure name="06-kitchen-living-night" alt="펜던트와 간접조명으로 영역을 나눈 주방 다이닝 라운지 밤 장면 디자인 제안" ratio="aspect-[2016/780]" />
          <Figure name="09-art-wall" alt="짙은 우드와 빅슬랩, 세로 간접조명을 조합한 거실 아트월 디자인 제안" ratio="aspect-[1889/832]" />
          <Figure name="10-living-night" alt="러그와 소파, 빅슬랩 간접조명으로 따뜻하게 구성한 거실 밤 디자인 제안" ratio="aspect-[1672/941]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Study" title="수납 사이에 만든 작은 장면" description="가구를 한쪽 벽으로 모아 이동 공간을 확보하고 서재의 구성을 단순하게 정리했습니다. 키큰장 사이에 진열 공간을 두어 긴 수납 벽면에 변화를 만들고, 홈바와 같은 브론즈 철제 선반을 사용해 공용부의 분위기를 이어갑니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <Figure name="11-study" alt="한쪽 벽에 책상과 수납을 통합하고 브론즈 진열 선반을 배치한 서재 디자인 제안" ratio="aspect-[1526/1031]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Bedroom & Dressing" title="수납은 충분하게, 시야는 편안하게" description="부족한 옷 수납은 벽면 붙박이장으로 보완하고, 침대 헤드보드는 높이를 제한해 답답함을 줄였습니다. 월워셔 다운라이트로 벽면을 비추어 누운 자리의 직접적인 눈부심을 줄입니다. 드레스룸에서 파우더룸과 욕실로 이어지는 개구부에는 거울 슬라이딩도어를 계획해 평소에는 전신거울로 활용하도록 했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="12-bedroom-day" alt="낮은 헤드보드와 짙은 우드 벽면으로 정돈한 안방 낮 디자인 제안" ratio="aspect-[1549/1015]" />
          <Figure name="13-bedroom-night" alt="월워셔와 독서등으로 눈부심을 줄인 안방 밤 디자인 제안" ratio="aspect-[1550/1015]" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Powder Room & Bathroom" title="나란히 놓아 간결해진 동선" description="비내력 날개벽을 철거하는 계획으로 파우더룸과 화장실, 샤워부스를 나란히 배치해 낭비되는 면적을 줄였습니다. 재료분리대와 조적벽으로 건식·습식 영역과 마감의 경계를 분명히 하고, 600×1200 타일과 조적세면대로 일체감을 만들었습니다. 거울과 가구, 천장 조명박스의 간접광으로 필요한 밝기를 확보했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure name="14-powder-bathroom" alt="조적벽으로 재료와 영역을 나누고 파우더룸과 세면공간을 나란히 배치한 디자인 제안" ratio="aspect-[1602/981]" />
          <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-8 md:gap-10 items-center">
            <Figure name="15-bathroom-angle" alt="조적세면대와 수납 선반, 유리 샤워부스로 이어지는 욕실 디자인 제안" ratio="aspect-[1672/941]" />
            <Figure name="16-shower" alt="짙은 석재 타일과 매입 선반, 천장 간접광으로 구성한 샤워 공간 디자인 제안" ratio="aspect-[877/1793]" />
          </div>
        </div>
      </section>
    </>
  );
}
