import Link from "next/link";
import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-the-sharp-lakepark";

const images = {
  livingFrontNight: base + "/02-living-room-front-night.webp",
  livingSideDay: base + "/03-living-room-side-day.webp",
  livingSideNight: base + "/04-living-room-side-night.webp",
  entryStorage: base + "/05-entry-shoe-storage.webp",
  entryCorridor: base + "/06-entry-corridor.webp",
  hallwayFront: base + "/07-hallway-front.webp",
  hallwayHiddenDoors: base + "/08-hallway-hidden-doors.webp",
  study: base + "/09-study-alpha-room.webp",
  kitchenFront: base + "/10-kitchen-front.webp",
  kitchenSide: base + "/11-kitchen-side.webp",
  secondaryKitchen: base + "/12-secondary-kitchen.webp",
  masterBedroomDay: base + "/13-master-bedroom-day.webp",
  masterBedroomNight: base + "/14-master-bedroom-night.webp",
  masterDressingCorridor: base + "/15-master-dressing-corridor.webp",
  powderRoom: base + "/16-powder-room.webp",
  bathroomFront: base + "/17-bathroom-front.webp",
  bathroomSide: base + "/18-bathroom-side.webp",
};

function ProjectFigure({
  src,
  alt,
  ratio,
  caption,
}: {
  src: string;
  alt: string;
  ratio: string;
  caption?: string;
}) {
  return (
    <figure>
      <ProjectImage src={src} alt={alt} ratio={ratio} />
      {caption && (
        <figcaption className="mt-4 text-[13px] leading-7 text-neutral-500 md:text-sm break-keep">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function CheongnaTheSharpLakepark() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            인천 청라 더샵레이크파크 공급 144.22㎡, 전용 106.89㎡를 위한
            전체 인테리어 디자인 제안입니다. 그레이지와 화이트를 바탕으로
            다크우드를 반복해 각 공간의 깊이와 중심을 정리했습니다.
          </p>
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            매입조명의 수를 줄이고 천장과 벽면의 간접광, 상하향 펜던트와
            스탠드 조명을 필요한 위치에 나누어 배치했습니다. 현관에서
            복도와 서재, 거실로 이어지는 공용부는 열린 시선을 유지하고,
            안방과 욕실은 가벽과 재료의 반복으로 기능을 분리했습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry"
          title="어두운 목재와 열린 시선으로 만든 첫 장면"
          description="현관은 다크우드 필름과 그레이지 타일로 집 전체의 재료를 먼저 보여줍니다. 신발장은 하부를 띄워 간접광과 청소 공간을 확보하고, 슬림 프레임 유리 중문은 현관과 복도를 나누면서도 시선이 막히지 않도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.entryStorage}
              alt="다크우드 신발장과 슬림 프레임 유리 중문이 보이는 인천 청라 더샵레이크파크 현관"
              ratio="aspect-[1212/1297]"
              caption="Entry Storage"
            />
            <ProjectFigure
              src={images.entryCorridor}
              alt="오브제 선반과 복도 진입부가 보이는 인천 청라 더샵레이크파크 현관"
              ratio="aspect-[1514/1039]"
              caption="Entry to Hallway"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Hallway"
          title="남는 공간을 수납과 장면으로 바꾼 복도"
          description={
            <>
              중문을 지나며 생기는 데드스페이스는 벽면 수납으로 채우고,
              모서리는 오브제를 놓는 작은 장면으로 남겼습니다. 매입등 대신
              천장 가장자리의 간접광이 복도에서 거실까지 동선을 이어주도록
              했습니다. 광원이 시야에 직접 들어오지 않는 방식은{" "}
              <Link
                href="/knowledge/and-standards/lighting-natural-light"
                className="border-b border-neutral-300 transition-colors hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              >
                AND의 조명 계획 기준
              </Link>
              과 연결됩니다.
            </>
          }
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-[0.58fr_1.42fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.hallwayFront}
              alt="천장 간접조명과 다크우드 수납이 이어지는 인천 청라 더샵레이크파크 복도"
              ratio="aspect-[944/1665]"
              caption="Hallway"
            />
            <ProjectFigure
              src={images.hallwayHiddenDoors}
              alt="히든도어와 아트워크가 하나의 벽면으로 정리된 인천 청라 더샵레이크파크 복도"
              ratio="aspect-[1672/941]"
              caption="Hidden Doors"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Study"
          title="벽을 덜어내고 시선을 나눈 서재"
          description="기존 알파룸 출입문이 있던 비내력벽을 철거해 복도와 서재 사이의 개방감을 높였습니다. 데스크 앞 유리 파티션은 빛과 공간의 연결은 유지하면서 작업 시선을 분리합니다. 간접조명과 스탠드 조명을 나누어 두어 업무와 휴식에 필요한 밝기를 각각 만들었습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectFigure
            src={images.study}
            alt="유리 파티션 데스크와 라운지 체어가 있는 인천 청라 더샵레이크파크 서재"
            ratio="aspect-[1672/941]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen & Dining"
          title="상하향 빛으로 작업면을 밝힌 주방"
          description="주방은 다크우드 벽면 수납과 긴 아일랜드 식탁이 하나의 중심을 만들도록 구성했습니다. 선형 펜던트의 상향광은 천장을 부드럽게 밝히고 하향광은 조리대와 식탁의 작업 조도를 확보합니다. 매입조명을 최소화하면서도 필요한 면의 밝기를 잃지 않도록 한 계획입니다. 보조주방에는 별도의 싱크와 작업대를 두어 기능을 분산했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <ProjectFigure
            src={images.kitchenFront}
            alt="상하향 펜던트와 긴 아일랜드 식탁이 있는 인천 청라 더샵레이크파크 주방"
            ratio="aspect-[1672/941]"
          />

          <div className="grid md:grid-cols-[1.35fr_0.65fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.kitchenSide}
              alt="다크우드 수납장과 조명 선반이 보이는 인천 청라 더샵레이크파크 주방 측면"
              ratio="aspect-[1641/959]"
              caption="Kitchen Storage"
            />
            <ProjectFigure
              src={images.secondaryKitchen}
              alt="창가 싱크와 다크우드 하부장이 있는 인천 청라 더샵레이크파크 보조주방"
              ratio="aspect-[936/1680]"
              caption="Secondary Kitchen"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living Room"
          title="소파 중심의 거실을 라운지로 바꾸다"
          description="1인, 2인, 3인 라운지 체어와 소파를 마주 보게 배치해 TV를 향한 일반적인 거실보다 대화와 머무름에 가까운 라운지 분위기를 만들었습니다. 기둥과 우드 벽면 상부의 조명은 천장을 향해 빛을 보내, 앉은 시선에서 광원이 직접 보이지 않으면서도 넓은 면이 은은하게 밝아지도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <ProjectFigure
            src={images.livingFrontNight}
            alt="라운지 체어와 소파가 마주 보는 인천 청라 더샵레이크파크 거실 야간 정면"
            ratio="aspect-[1672/941]"
            caption="Living Room / Night"
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.livingSideDay}
              alt="자연광과 다크우드 벽면이 보이는 인천 청라 더샵레이크파크 거실 주간 측면"
              ratio="aspect-[1672/941]"
              caption="Day"
            />
            <ProjectFigure
              src={images.livingSideNight}
              alt="상부 간접조명과 펜던트가 켜진 인천 청라 더샵레이크파크 거실 야간 측면"
              ratio="aspect-[1672/941]"
              caption="Night"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bedroom"
          title="가벽으로 넓힌 수납과 침실의 중심"
          description="넓은 안방은 침대 옆 가벽으로 영역을 나누어 기존 드레스룸의 부족한 수납을 보완했습니다. 침대 헤드에는 대형 세라믹 슬랩을 배치해 방의 중심을 만들고, 야간에는 슬랩 뒤의 간접광이 재료의 윤곽과 깊이를 드러냅니다. 드레스룸 진입 복도에는 콘솔과 낮은 조도를 더해 준비 공간으로 이어지는 장면을 정리했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.masterBedroomDay}
              alt="세라믹 슬랩 헤드보드와 가벽이 있는 인천 청라 더샵레이크파크 안방 낮"
              ratio="aspect-[1672/941]"
              caption="Day"
            />
            <ProjectFigure
              src={images.masterBedroomNight}
              alt="세라믹 슬랩 뒤 간접조명이 켜진 인천 청라 더샵레이크파크 안방 밤"
              ratio="aspect-[1672/941]"
              caption="Night"
            />
          </div>

          <ProjectFigure
            src={images.masterDressingCorridor}
            alt="콘솔과 드레스룸 수납이 보이는 인천 청라 더샵레이크파크 안방 진입 복도"
            ratio="aspect-[1712/919]"
            caption="Dressing Room Access"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Powder Room"
          title="곡선과 간접광으로 만든 파우더룸"
          description="파우더룸은 비정형 곡선 거울과 길게 이어지는 석재 상판으로 작은 공간의 중심을 만들었습니다. 거울 뒤에 숨긴 간접조명은 광원이 직접 드러나지 않도록 벽면에 부드럽게 퍼지며, 우드와 그레이지 마감 사이에 은은한 깊이를 더합니다."
        />

        <div className="max-w-3xl mx-auto px-8 md:px-16">
          <ProjectFigure
            src={images.powderRoom}
            alt="곡선 거울과 부드러운 간접조명이 있는 인천 청라 더샵레이크파크 파우더룸"
            ratio="aspect-[1017/1546]"
          />
        </div>
      </section>

      <section className="mb-32 md:mb-40">
        <SectionHeading
          eyebrow="Bathroom"
          title="재료를 이어 하나의 면으로 만든 욕실"
          description="대형 세라믹 슬랩 벽면과 비슷한 결의 조적세면대를 연결해 욕실 전체가 하나의 재료로 이어지는 듯한 일체감을 만들었습니다. 세면대 하부 선반과 비정형 거울 뒤의 간접광은 수납과 세면 영역을 부드럽게 밝힙니다. 샤워 공간은 벽체로 분리해 시선을 정리하고, 천장 가장자리의 간접광으로 깊이를 더했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-[1.08fr_0.92fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.bathroomFront}
              alt="조적세면대와 비정형 거울이 있는 인천 청라 더샵레이크파크 욕실 정면"
              ratio="aspect-square"
              caption="Vanity"
            />
            <ProjectFigure
              src={images.bathroomSide}
              alt="세라믹 슬랩 벽체와 레인샤워가 있는 인천 청라 더샵레이크파크 욕실 측면"
              ratio="aspect-[1077/1460]"
              caption="Shower"
            />
          </div>
        </div>
      </section>
    </>
  );
}
