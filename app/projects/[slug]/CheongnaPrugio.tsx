import Link from "next/link";
import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-prugio";

const images = {
  entryFront: `${base}/02-entry-front.webp`,
  entrySide: `${base}/03-entry-side.webp`,
  pantryClosed: `${base}/04-entry-pantry-closed.webp`,
  pantryOpen: `${base}/05-entry-pantry-open.webp`,
  corridor: `${base}/06-corridor.webp`,
  hiddenDoors: `${base}/07-corridor-hidden-doors.webp`,
  livingDay: `${base}/08-living-room-front-day.webp`,
  livingAngleDay: `${base}/09-living-room-angle-day.webp`,
  livingAngleNight: `${base}/10-living-room-angle-night.webp`,
  kitchenAngle: `${base}/11-kitchen-angle.webp`,
  kitchenSide: `${base}/12-kitchen-side.webp`,
  secondaryKitchen: `${base}/13-secondary-kitchen.webp`,
  commonVanity: `${base}/14-common-dry-vanity.webp`,
  commonBathroom: `${base}/15-common-bathroom.webp`,
  bedroomDay: `${base}/16-master-bedroom-day.webp`,
  bedroomNight: `${base}/17-master-bedroom-night.webp`,
  dressingRoom: `${base}/18-master-dressing-room.webp`,
  masterVanity: `${base}/19-master-dry-vanity.webp`,
  masterBathroom: `${base}/20-master-bathroom.webp`,
  smallBedroom: `${base}/21-small-bedroom-loft-bed.webp`,
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
        <figcaption className="mt-4 text-[13px] md:text-sm leading-7 text-neutral-500 break-keep">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function CheongnaPrugio() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            인천 청라 푸르지오 전용 139.48㎡, 공급 187.38㎡를 위한 인테리어
            디자인 제안입니다. 우드의 온기와 절제된 선을 바탕으로,
            재팬디 스타일이 현관에서 욕실까지 하나의 흐름으로 이어지도록
            전체 공간을 계획했습니다.
          </p>
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            대면형 아일랜드와 별도의 다이닝, 욕실 밖으로 분리한 건식세면대,
            침대 헤드 뒤로 확장한 드레스룸을 통해 생활의 기능을 다시
            배치했습니다. 루버와 히든도어로 면을 정리하고, 간접광과 필요한
            위치의 조명으로 시간에 따라 달라지는 공간의 깊이를 만들었습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry"
          title="선을 정리하고 기능을 감춘 현관"
          description="현관의 수납 기능을 담으면서도 집의 첫인상을 차분하게 유지할 수 있을까. 우드 벽면과 세로 루버로 재료를 정리하고, 잠시 앉아 신발을 신을 수 있는 벤치를 두었습니다. 식재와 낮은 위치의 빛으로 작은 머무름을 만들고, 팬트리 문은 벽면과 같은 마감으로 연결해 닫혔을 때 하나의 면으로 읽히도록 계획했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.entryFront}
              alt="인천 청라 푸르지오 현관 정면 디자인 제안"
              ratio="aspect-[1143/1376]"
              caption="Entry"
            />

            <ProjectFigure
              src={images.entrySide}
              alt="벤치와 식재가 있는 인천 청라 푸르지오 현관 측면 디자인 제안"
              ratio="aspect-[1542/1020]"
              caption="Entry Bench"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.pantryClosed}
              alt="인천 청라 푸르지오 현관 팬트리 문닫힘 디자인 제안"
              ratio="aspect-[1468/1071]"
              caption="Pantry Closed"
            />

            <ProjectFigure
              src={images.pantryOpen}
              alt="인천 청라 푸르지오 현관 팬트리 문열림 디자인 제안"
              ratio="aspect-[1469/1071]"
              caption="Pantry Open"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Hallway"
          title="문과 벽이 하나의 배경이 되는 복도"
          description="복도는 방으로 이동하는 통로이면서 현관과 거실의 재료를 연결하는 공간입니다. 우드 패널과 루버 사이에 히든도어를 배치하고, 천장 가장자리의 간접광이 벽을 따라 이어지도록 계획했습니다. 문틀과 장식의 존재감을 줄여 반복되는 수직선과 빛이 동선의 방향을 드러내도록 했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-[0.65fr_1.35fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.corridor}
              alt="인천 청라 푸르지오 복도 디자인 제안"
              ratio="aspect-[949/1658]"
              caption="Hallway"
            />

            <ProjectFigure
              src={images.hiddenDoors}
              alt="인천 청라 푸르지오 복도측면(히든도어) 디자인 제안"
              ratio="aspect-[1672/941]"
              caption="Hidden Doors"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living Room"
          title="같은 재료, 다른 시간의 거실"
          description={
            <>
              넓은 거실을 많은 조명으로 채우지 않고도 편안한 밝기를 만들 수 있을까.
              우드 천장과 루버 벽면을 중심으로 바탕을 정리하고, 천장 홈에 배치한
              조명과 스탠드로 필요한 위치에 빛을 두었습니다.{" "}
              <Link
                href="/knowledge/and-standards/lighting-natural-light"
                className="border-b border-neutral-300 transition-colors hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              >
                자연광과 인공조명의 밝기 차이
              </Link>
              를 유지해 낮에는 재료의 결이, 밤에는 빛이 머무는 면이 드러나도록
              계획했습니다.
            </>
          }
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
            <ProjectFigure
              src={images.livingDay}
              alt="인천 청라 푸르지오 거실 정면 낮 디자인 제안"
              ratio="aspect-[1870/841]"
              caption="Living Room / Day"
            />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.livingAngleDay}
              alt="인천 청라 푸르지오 거실 대각 낮 디자인 제안"
              ratio="aspect-[1815/867]"
              caption="Day"
            />

            <ProjectFigure
              src={images.livingAngleNight}
              alt="인천 청라 푸르지오 거실 대각 밤 디자인 제안"
              ratio="aspect-[1815/866]"
              caption="Night"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen & Dining"
          title="거실을 향해 열린 주방의 중심"
          description="거실과 대면하는 주방 안에서 조리와 식사의 기능을 어떻게 나눌 것인가. 비내력벽을 철거하는 계획을 바탕으로 대형 아일랜드를 중심에 두고, 식탁은 별도로 배치했습니다. 석재 패턴이 상판과 측면을 감싸는 아일랜드의 양감을 살리고, 벽면 수납과 가전 영역을 정리했습니다. 보조주방에는 별도의 싱크와 조리 공간을 두어 작업을 분산할 수 있도록 했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
            <ProjectFigure
              src={images.kitchenAngle}
              alt="인천 청라 푸르지오 주방 대각 디자인 제안"
              ratio="aspect-[1672/941]"
            />

          <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.kitchenSide}
              alt="인천 청라 푸르지오 주방 측면 디자인 제안"
              ratio="aspect-[1572/1001]"
              caption="Kitchen"
            />

            <ProjectFigure
              src={images.secondaryKitchen}
              alt="인천 청라 푸르지오 보조주방 디자인 제안"
              ratio="aspect-[1020/1542]"
              caption="Secondary Kitchen"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Common Vanity & Bathroom"
          title="세면과 목욕을 분리한 공간"
          description="세면과 목욕을 분리해 각각의 공간을 차분하게 사용할 수 있도록 계획했습니다. 공용욕실 앞에는 두 사람이 함께 사용할 수 있는 건식세면대를 두고, 우드 루버와 거울 주변의 빛으로 공용부의 분위기를 이어갔습니다. 욕실 중앙에는 조적 욕조를 배치하고, 유리 파티션과 간접조명으로 시선과 빛의 흐름을 조절했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.commonVanity}
              alt="인천 청라 푸르지오 공용화장실 앞 건식세면대 디자인 제안"
              ratio="aspect-[1389/1132]"
              caption="Common Dry Vanity"
            />

            <ProjectFigure
              src={images.commonBathroom}
              alt="인천 청라 푸르지오 공용욕실 중앙 조적 욕조와 유리 파티션 디자인 제안"
              ratio="aspect-[1335/1178]"
              caption="Common Bathroom / Masonry Bathtub"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bedroom"
          title="침대 헤드에서 시작되는 공간의 분할"
          description="침실 안에서 휴식과 수납의 영역을 함께 확보할 수 있을까. 침대 헤드 뒤에 분할면을 세워 잠자리를 중심으로 정면을 정리하고, 뒤쪽에는 드레스룸 영역을 확장했습니다. 밝은 패널과 우드 프레임으로 공용부의 재료를 부드럽게 이어가며, 밤에는 헤드 상부와 침대 주변에 낮은 빛이 머물도록 계획했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.bedroomDay}
              alt="인천 청라 푸르지오 안방 낮 디자인 제안"
              ratio="aspect-[1652/952]"
              caption="Day"
            />

            <ProjectFigure
              src={images.bedroomNight}
              alt="인천 청라 푸르지오 안방 밤 디자인 제안"
              ratio="aspect-[1651/953]"
              caption="Night"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing & Vanity"
          title="수납과 세면을 하나의 준비 동선으로"
          description={
            <>
              침대 뒤로 확장한 드레스룸과 기존 드레스룸 위치에 계획한
              건식세면대가 일상의 준비 과정으로 이어집니다.{" "}
              <Link
                href="/knowledge/and-standards/storage-flow"
                className="border-b border-neutral-300 transition-colors hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              >
                수납을 공간의 경계로 사용하되
              </Link>
              , 이동할 수 있는 통로를 함께 남겼습니다. 안방 세면대는 공용
              건식세면대와 같은 우드, 루버, 석재 패턴을 사용해 서로 떨어진
              두 공간의 디자인을 연결했습니다.
            </>
          }
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.dressingRoom}
              alt="인천 청라 푸르지오 안방 드레스룸 분할공간 디자인 제안"
              ratio="aspect-[1120/1404]"
              caption="Dressing Room"
            />

            <ProjectFigure
              src={images.masterVanity}
              alt="인천 청라 푸르지오 안방 세면대 디자인 제안"
              ratio="aspect-[894/1758]"
              caption="Master Dry Vanity"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bathroom"
          title="조적 욕조와 빛으로 정리한 욕실"
          description="안방 욕실은 조적 욕조의 양감과 밝은 석재 패턴을 중심으로 계획했습니다. 욕조 앞에는 단을 두고, 유리 파티션으로 기능을 나누면서 빛이 이어지도록 했습니다. 벽 상부의 간접광이 표면의 깊이를 드러내되 과한 장식이 되지 않도록, 재료와 조명의 수를 절제했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
            <ProjectFigure
              src={images.masterBathroom}
              alt="인천 청라 푸르지오 안방 욕실 디자인 제안"
              ratio="aspect-[1465/1073]"
              caption="Master Bathroom / Masonry Bathtub"
            />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Small Bedroom"
          title="높이를 나누어 확보한 두 가지 기능"
          description="한정된 방 안에서 잠자리와 책상 공간을 함께 확보하기 위해 침대를 상부에 두고, 하부를 작업 공간으로 구성했습니다. 계단과 수납을 한쪽에 모으고, 블랙 프레임과 우드로 구조를 정리했습니다. 면적을 넓히기보다 높이를 나누어 서로 다른 생활 기능이 한 방 안에서 성립하도록 계획했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <div className="max-w-4xl mx-auto">
            <ProjectFigure
              src={images.smallBedroom}
              alt="인천 청라 푸르지오 작은방 디자인 제안"
              ratio="aspect-[1353/1163]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
