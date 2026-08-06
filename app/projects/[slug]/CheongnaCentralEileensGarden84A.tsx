import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-central-eileens-garden-84a";

const images = {
  kitchenConceptAOverview: `${base}/01-hero.webp`,
  livingTvWall: `${base}/03-living-tv-wall.webp`,
  entryCorridor: `${base}/04-entry-corridor.webp`,
  entryVanity: `${base}/05-entry-vanity.webp`,
  hallway: `${base}/06-hallway.webp`,
  dressingVanity: `${base}/07-dressing-vanity.webp`,
  masterBedroomDay: `${base}/08-master-bedroom-day.webp`,
  masterBedroomNight: `${base}/09-master-bedroom-night.webp`,
  masterBedroomSideDay: `${base}/10-master-bedroom-side-day.webp`,
  masterBedroomSideNight: `${base}/11-master-bedroom-side-night.webp`,
  studyBedroomOverview: `${base}/12-study-bedroom-overview.webp`,
  studyBedroomVanity: `${base}/13-study-bedroom-vanity.webp`,
  diningRoomOverview: `${base}/14-dining-room-overview.webp`,
  diningRoom: `${base}/15-dining-room.webp`,
  kitchenOverviewPanorama: `${base}/16-kitchen-overview-panorama.webp`,
  kitchenFrontClosed: `${base}/17-kitchen-front-closed.webp`,
  kitchenFrontOpen: `${base}/18-kitchen-front-open.webp`,
  kitchenIslandReverse: `${base}/19-kitchen-island-reverse.webp`,
  kitchenIsland: `${base}/20-kitchen-island.webp`,
  utilityKitchen: `${base}/21-utility-kitchen.webp`,
  dressingRoomStorage: `${base}/22-dressing-room-storage.webp`,
  bathroomOverview: `${base}/23-bathroom-overview.webp`,
  bathroomPerspective: `${base}/24-bathroom-perspective.webp`,
};

function ImageNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-[13px] md:text-sm leading-7 text-neutral-500 break-keep">
      {children}
    </p>
  );
}

function ProjectFigure({
  src,
  alt,
  ratio,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  ratio: string;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <ProjectImage src={src} alt={alt} ratio={ratio} />
      <ImageNote>{caption}</ImageNote>
    </figure>
  );
}

export default function CheongnaCentralEileensGarden84A() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            인천 청라 센트럴에일린의뜰 84A를 위한 인테리어 디자인
            제안입니다.
            현관에서 거실과 주방, 침실로 이어지는 흐름을 정돈하고, 수납과
            생활 기능이 공간의 배경으로 이어지도록 계획했습니다.
          </p>

          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            주방은 같은 평면의 두 가지 구성을 보여줍니다. A안은 다이닝과
            아일랜드, 키큰장을 함께 구성하고, B안은 다이닝과 메인 주방에
            문으로 구분된 보조주방이 이어집니다.
          </p>
        </div>

        <div className="mt-14 md:mt-16 border-l border-neutral-300 pl-6 md:pl-8">
          <p className="text-2xl md:text-4xl font-light leading-[1.45] break-keep">
            같은 집, 두 가지 주방의 해석.
          </p>

          <p className="mt-4 text-base md:text-xl leading-8 md:leading-9 text-neutral-600 break-keep">
            생활의 중심을 어디에 두는지에 따라 아일랜드의 방향과 보조 공간의
            관계를 다르게 구성했습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Shared Space"
          title="거실의 공용 공간"
          description="큰 창을 마주한 거실과 TV 벽, 낮은 수납장이 함께 보이는 장면입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <ProjectFigure
            src={images.livingTvWall}
            alt="청라 센트럴에일린의뜰 84A 거실 TV 벽"
            ratio="aspect-[1949/1100]"
            caption="창에서 들어오는 빛과 낮은 수납장이 이어지는 거실 TV 벽."
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry & Hallway"
          title="현관과 복도의 전환"
          description="현관은 수납장과 격자문, 조명이 만드는 깊이를 중심으로 구성하고, 복도는 공용 공간으로 갈수록 밝아지는 흐름을 유지했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-3 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.entryCorridor}
              alt="수납장 사이로 이어지는 청라 센트럴에일린의뜰 현관"
              ratio="aspect-[958/1980]"
              caption="수납장 사이에서 격자문으로 이어지는 현관 동선."
            />

            <ProjectFigure
              src={images.entryVanity}
              alt="조명 거울과 벤치가 있는 청라 센트럴에일린의뜰 현관"
              ratio="aspect-[1600/1702]"
              caption="조명 거울과 벤치가 놓인 현관 수납 구간."
              className="md:mt-20"
            />

            <ProjectFigure
              src={images.hallway}
              alt="거실 방향으로 이어지는 청라 센트럴에일린의뜰 복도"
              ratio="aspect-[1100/2000]"
              caption="현관에서 거실 방향으로 길게 이어지는 복도."
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Room"
          title="마주 보는 두 벽의 수납"
          description="화장대가 있는 벽과 전면 수납장이 있는 벽을 마주 보게 구성해, 같은 드레스룸 안에서 준비와 보관 기능이 나뉘어 작동하도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.dressingVanity}
              alt="청라 센트럴에일린의뜰 드레스룸 화장대 벽"
              ratio="aspect-[2000/1125]"
              caption="화장대와 수납장을 함께 배치한 드레스룸 한쪽 벽."
            />

            <ProjectFigure
              src={images.dressingRoomStorage}
              alt="청라 센트럴에일린의뜰 드레스룸 전면 수납장"
              ratio="aspect-[2000/1125]"
              caption="화장대 맞은편에 이어지는 드레스룸 전면 수납장."
              className="md:mt-16"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Private Rooms"
          title="안방의 낮과 밤, 수납을 더한 작은방"
          description="안방은 정면과 측면을 각각 낮과 야간 장면으로 구성해 같은 공간의 변화를 보여줍니다. 작은방은 침대와 책상, 화장대와 수납을 한 공간 안에 정리했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-12 md:space-y-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.masterBedroomDay}
              alt="청라 센트럴에일린의뜰 안방 정면 낮 장면"
              ratio="aspect-[2000/1100]"
              caption="안방 정면의 낮 장면."
            />

            <ProjectFigure
              src={images.masterBedroomNight}
              alt="청라 센트럴에일린의뜰 안방 정면 야간 장면"
              ratio="aspect-[2000/1100]"
              caption="같은 안방 정면의 야간 장면."
              className="md:mt-16"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.masterBedroomSideDay}
              alt="청라 센트럴에일린의뜰 안방 측면 낮 장면"
              ratio="aspect-[2000/1100]"
              caption="같은 안방 측면의 낮 장면."
            />

            <ProjectFigure
              src={images.masterBedroomSideNight}
              alt="청라 센트럴에일린의뜰 안방 측면 야간 장면"
              ratio="aspect-[2000/1100]"
              caption="같은 안방 측면의 야간 장면."
              className="md:mt-16"
            />
          </div>

          <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.studyBedroomOverview}
              alt="침대와 책상이 함께 있는 청라 센트럴에일린의뜰 작은방"
              ratio="aspect-[1736/1100]"
              caption="침대와 책상, 수납을 한 공간에 배치한 작은방 전경."
            />

            <ProjectFigure
              src={images.studyBedroomVanity}
              alt="수납장과 화장대가 있는 청라 센트럴에일린의뜰 작은방"
              ratio="aspect-[1375/1100]"
              caption="작은방 반대편의 화장대와 수납장."
              className="md:mt-16"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen Concept A"
          title="개방감과 수납을 확장한 주방"
          description="A안은 다이닝과 아일랜드, 벽면 수납과 키큰장이 함께 보이는 구성입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-12 md:space-y-16">
          <ProjectFigure
            src={images.kitchenConceptAOverview}
            alt="청라 센트럴에일린의뜰 주방 A안 전체 장면"
            ratio="aspect-[4000/1179]"
            caption="다이닝과 아일랜드가 함께 보이는 주방 A안의 전체 장면."
          />

          <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.diningRoomOverview}
              alt="다이닝과 창가 수납이 보이는 청라 센트럴에일린의뜰 주방 A안"
              ratio="aspect-[2000/1100]"
              caption="주방 A안에 포함된 다이닝과 창가 수납."
            />

            <ProjectFigure
              src={images.kitchenIslandReverse}
              alt="아일랜드와 키큰장이 보이는 청라 센트럴에일린의뜰 주방 A안"
              ratio="aspect-[1501/1100]"
              caption="아일랜드와 키큰장이 함께 보이는 주방 A안."
              className="md:mt-16"
            />
          </div>

          <div className="max-w-5xl mx-auto">
            <ProjectFigure
              src={images.kitchenIsland}
              alt="다른 방향에서 바라본 청라 센트럴에일린의뜰 주방 A안 아일랜드"
              ratio="aspect-[1283/1100]"
              caption="다른 방향에서 바라본 주방 A안의 아일랜드."
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen Concept B"
          title="다이닝과 분리형 보조주방이 이어지는 주방"
          description="B안은 다이닝과 메인 주방, 문으로 구분된 보조주방이 이어지는 구성입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-12 md:space-y-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.diningRoom}
              alt="청라 센트럴에일린의뜰 주방 B안에 포함된 다이닝 공간"
              ratio="aspect-[1299/1100]"
              caption="주방 B안에 포함된 창가 다이닝 공간."
            />

            <ProjectFigure
              src={images.kitchenOverviewPanorama}
              alt="다이닝과 메인 주방이 이어지는 청라 센트럴에일린의뜰 주방 B안"
              ratio="aspect-[4000/1179]"
              caption="다이닝에서 메인 주방까지 이어지는 B안의 전체 장면."
              className="md:mt-16"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.kitchenFrontClosed}
              alt="보조주방 문이 닫힌 청라 센트럴에일린의뜰 주방 B안"
              ratio="aspect-[2000/1100]"
              caption="보조주방 문이 닫힌 주방 B안."
            />

            <ProjectFigure
              src={images.kitchenFrontOpen}
              alt="보조주방 문이 열린 청라 센트럴에일린의뜰 주방 B안"
              ratio="aspect-[2000/1100]"
              caption="보조주방으로 이어지는 문이 열린 주방 B안."
              className="md:mt-16"
            />
          </div>

          <div className="max-w-5xl mx-auto">
            <ProjectFigure
              src={images.utilityKitchen}
              alt="청라 센트럴에일린의뜰 주방 B안의 분리형 보조주방"
              ratio="aspect-[1391/1100]"
              caption="주방 B안에 포함된 분리형 보조주방."
            />
          </div>
        </div>
      </section>

      <section className="mb-32 md:mb-40">
        <SectionHeading
          eyebrow="Bathroom"
          title="같은 욕실을 바라보는 두 시점"
          description="세면대와 양변기, 샤워 공간의 관계가 한눈에 보이는 정면과 출입구 쪽에서 깊이를 확인하는 시점을 함께 구성했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.bathroomOverview}
              alt="청라 센트럴에일린의뜰 욕실 정면 전경"
              ratio="aspect-[1500/1588]"
              caption="세면대와 양변기, 샤워 공간이 함께 보이는 욕실 정면."
            />

            <ProjectFigure
              src={images.bathroomPerspective}
              alt="출입구에서 바라본 청라 센트럴에일린의뜰 욕실"
              ratio="aspect-[1500/2000]"
              caption="출입구 쪽에서 같은 욕실의 깊이를 바라본 시점."
              className="md:mt-20"
            />
          </div>
        </div>
      </section>
    </>
  );
}
