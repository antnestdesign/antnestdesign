import Link from "next/link";
import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-hanwha-kkumegreen-39a";

const images = {
  livingDiningDay: `${base}/01-hero.webp`,
  livingDiningNight: `${base}/02-living-dining-night.webp`,
  livingRoomSofa: `${base}/03-living-room-sofa.webp`,
  kitchen: `${base}/05-kitchen-island.webp`,
  dressingVanity: `${base}/06-dressing-vanity.webp`,
  masterBedroomDay: `${base}/07-master-bedroom-day.webp`,
  masterBedroomNight: `${base}/08-master-bedroom-night.webp`,
  dressingRoomExtension: `${base}/09-master-bedroom-dressing-room-extension.webp`,
  dressingRoomStorage: `${base}/10-dressing-room-storage.webp`,
  studyRoom: `${base}/11-study-room-overview.webp`,
  entryCorridor: `${base}/12-entry-corridor.webp`,
  entryStorage: `${base}/13-entry-storage.webp`,
  entrySlidingDoor: `${base}/14-entry-sliding-door.webp`,
  bathroomOverview: `${base}/15-bathroom-overview.webp`,
  bathroomShower: `${base}/16-bathroom-shower.webp`,
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
}: {
  src: string;
  alt: string;
  ratio: string;
  caption?: string;
}) {
  return (
    <figure>
      <ProjectImage src={src} alt={alt} ratio={ratio} />
      {caption && <ImageNote>{caption}</ImageNote>}
    </figure>
  );
}

export default function CheongnaHanwhaKkumegreen39A() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            인천 청라 한화꿈에그린 100A는 준신축 3Bay 구조에서 주방 폭이
            제한적이고, 안방의 기존 드레스룸만으로는 수납이 부족한 두 가지
            문제에서 출발한 아파트 인테리어 디자인 제안입니다.
          </p>

          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            다이닝을 거실 쪽으로 재배치해 주방의 기능을 회복하고, 침대 헤드
            가벽 뒤에는 새로운 수납 영역을 계획했습니다. 월넛의 깊은 색과
            블랙 프레임, 파벽과 절제된 조명을 반복해 인더스트리얼 모던의
            디자인 언어가 현관부터 욕실까지 이어지도록 구성했습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry & Hallway"
          title="현관에서 시작되는 재료의 흐름"
          description="현관은 월넛 수납과 블랙 프레임 중문, 낮은 위치의 간접조명으로 집 전체의 첫인상을 정리했습니다. 짙은 재료와 밝은 바닥의 대비가 복도를 따라 공용공간까지 이어집니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <ProjectFigure
            src={images.entrySlidingDoor}
            alt="인천 청라 한화꿈에그린 100A 현관의 블랙 프레임 중문과 화분"
            ratio="aspect-[1307/1100]"
          />

          <div className="grid md:grid-cols-[1.4fr_0.6fr] gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.entryStorage}
              alt="월넛 수납장과 하부 간접조명이 보이는 인천 청라 한화꿈에그린 100A 현관"
              ratio="aspect-[1421/1106]"
            />

            <ProjectFigure
              src={images.entryCorridor}
              alt="현관에서 거실 방향으로 이어지는 인천 청라 한화꿈에그린 100A 복도"
              ratio="aspect-[567/1125]"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living & Dining"
          title="다이닝을 옮겨 다시 만든 거실의 경계"
          description={
            <>
              다이닝을 거실 쪽으로 옮기면서도 공용공간의 경계를 흐리지 않을
              수 있을까. 하부장 라인을 다이닝 선에 맞춰 소파 영역과 식사·주방
              영역을 자연스럽게 나누고, 파벽 아트월과 파이프 선반으로 거실의
              인더스트리얼 성격을 더했습니다.{" "}
              <Link
                href="/knowledge/and-standards/lighting-natural-light"
                className="border-b border-neutral-300 transition-colors hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              >
                같은 구도의 낮과 밤
              </Link>
              은 재배치된 두 영역이 조명에 따라 다르게 읽히는 모습을
              보여줍니다. 좁은 주방은 프로그램의 위치를 바꿔 기능을 회복할 수
              있지만, 이동한 기능의 가구선과 경계까지 함께 계획해야 합니다.
            </>
          }
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-12 md:space-y-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.livingDiningDay}
              alt="파벽 아트월과 다이닝 테이블, 소파가 함께 보이는 인천 청라 한화꿈에그린 100A 거실 주간 장면"
              ratio="aspect-[2000/1081]"
              caption="Day"
            />

            <ProjectFigure
              src={images.livingDiningNight}
              alt="다이닝 테이블과 소파가 함께 보이는 인천 청라 한화꿈에그린 100A 거실 야간 장면"
              ratio="aspect-[1706/922]"
              caption="Night"
            />
          </div>

          <ProjectFigure
            src={images.livingRoomSofa}
            alt="파벽 아트월과 파이프 선반, 브라운 소파가 보이는 인천 청라 한화꿈에그린 100A 거실"
            ratio="aspect-[2000/1075]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen"
          title="좁은 주방에서도 기능을 포기하지 않는 방법"
          description="폭이 제한된 3Bay 주방에서도 충분한 수납과 풀사이즈 아일랜드를 함께 확보할 수 있을까. 다이닝 기능을 거실로 분리한 뒤 주방에는 벽면 전체 수납과 가전 영역, 싱크와 조리 공간, 아일랜드가 함께 성립하도록 계획했습니다. 모든 요소를 작게 줄이기보다 프로그램의 위치를 다시 정해 주방 자체의 기능을 회복한 구성입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectFigure
            src={images.kitchen}
            alt="전면 월넛 수납장과 싱크가 있는 아일랜드가 보이는 인천 청라 한화꿈에그린 100A 주방"
            ratio="aspect-[1672/941]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Study"
          title="더 짙은 톤으로 완성한 서재"
          description="서재는 공용부의 월넛과 블랙을 이어가되 두 재료의 비중을 높여 집중된 분위기로 계획했습니다. 벽면 수납과 책상, 라운지 체어가 하나의 짙은 배경 안에서 읽히도록 구성했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectFigure
            src={images.studyRoom}
            alt="월넛 벽면 수납과 책상, 라운지 체어가 보이는 인천 청라 한화꿈에그린 100A 서재"
            ratio="aspect-[1944/954]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bedroom"
          title="가벽 하나로 침실의 역할을 확장하다"
          description="수납을 늘리면서도 침실의 개방감과 양측 통행로를 유지할 수 있을까. 침대 헤드에 새로운 가벽을 세워 정면에는 대형 박판타일로 중심면을 만들고, 뒤쪽에는 추가 수납 공간을 계획했습니다. 주간 장면은 가벽과 양측 동선의 관계를, 야간 장면은 같은 구조에 간접조명이 더해진 변화를 보여줍니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 mb-8 md:mb-10">
          <Link
            href="/knowledge/and-standards/storage-flow"
            className="inline-block border-b border-neutral-300 pb-1 text-[13px] leading-7 text-neutral-600 transition-colors hover:border-neutral-600 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
          >
            수납을 공간의 경계로 사용하는 AND의 설계 기준 →
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.masterBedroomDay}
              alt="침대 헤드 가벽과 양측 통행로가 보이는 인천 청라 한화꿈에그린 100A 안방 주간 장면"
              ratio="aspect-[1672/1125]"
              caption="Day"
            />

            <ProjectFigure
              src={images.masterBedroomNight}
              alt="침대 헤드 가벽 상부 간접조명이 켜진 인천 청라 한화꿈에그린 100A 안방 야간 장면"
              ratio="aspect-[1671/1125]"
              caption="Night"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Room"
          title="수납은 늘리고, 동선은 막지 않도록"
          description="기존 드레스룸만으로 부족했던 수납은 침대 헤드 가벽 뒤쪽으로 확장했습니다. 가벽 양쪽에 통행로를 남겨 침실이 막혀 보이지 않도록 하고, 확장 옷장과 기존 드레스룸, 화장대가 하나의 준비 동선으로 이어지게 계획했습니다. 수납은 장의 개수만이 아니라, 수납을 늘린 뒤 남는 통행폭과 개방감, 실제 이동 동선을 함께 살펴야 합니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-12 md:space-y-16">
          <ProjectFigure
            src={images.dressingRoomExtension}
            alt="조명 선반이 있는 확장 옷장과 양측 통로가 보이는 인천 청라 한화꿈에그린 100A 안방"
            ratio="aspect-[1708/1125]"
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.dressingRoomStorage}
              alt="조명 선반과 서랍이 있는 인천 청라 한화꿈에그린 100A 기존 드레스룸 옷장"
              ratio="aspect-[775/1125]"
              caption="Existing Dressing"
            />

            <ProjectFigure
              src={images.dressingVanity}
              alt="거울 수납장과 서랍장이 보이는 인천 청라 한화꿈에그린 100A 화장대"
              ratio="aspect-[659/956]"
              caption="Vanity"
            />
          </div>
        </div>
      </section>

      <section className="mb-32 md:mb-40">
        <SectionHeading
          eyebrow="Bathroom"
          title="대비를 절제한 욕실"
          description="밝은 벽면과 짙은 바닥, 블랙 프레임을 중심으로 욕실의 대비를 정리했습니다. 첫 장면은 세면대와 양변기, 샤워 공간의 전체 기능을 보여주고, 두 번째 장면은 샤워 수전과 매립 선반, 출입구 방향의 깊이를 보완합니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectFigure
              src={images.bathroomOverview}
              alt="세면대와 양변기, 유리 샤워문이 보이는 인천 청라 한화꿈에그린 100A 욕실"
              ratio="aspect-[668/1125]"
              caption="Overview"
            />

            <ProjectFigure
              src={images.bathroomShower}
              alt="샤워 수전과 매립 선반, 블랙 프레임 출입문이 보이는 인천 청라 한화꿈에그린 100A 욕실"
              ratio="aspect-[733/1125]"
              caption="Detail"
            />
          </div>
        </div>
      </section>
    </>
  );
}
