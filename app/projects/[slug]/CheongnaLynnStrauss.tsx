import { ProjectImage, SectionHeading } from "./ProjectLayout";

const images = {
  livingRoom: "/projects/cheongna-lynn-strauss/02-living-room.webp",
  livingWindow: "/projects/cheongna-lynn-strauss/03-living-window.webp",
  dressingVanity: "/projects/cheongna-lynn-strauss/04-dressing-vanity.webp",
  dressingRoom: "/projects/cheongna-lynn-strauss/05-dressing-room.webp",
  entryCorridor: "/projects/cheongna-lynn-strauss/06-entry-corridor.webp",
  masterBedroomNight:
    "/projects/cheongna-lynn-strauss/07-master-bedroom-night.webp",
  masterBedroomDay:
    "/projects/cheongna-lynn-strauss/08-master-bedroom-day.webp",
  kitchen: "/projects/cheongna-lynn-strauss/09-kitchen.webp",
  kitchenStorage: "/projects/cheongna-lynn-strauss/10-kitchen-storage.webp",
  entry: "/projects/cheongna-lynn-strauss/11-entry.webp",
  masterBathroom: "/projects/cheongna-lynn-strauss/12-master-bathroom.webp",
  masterBathroomDetail:
    "/projects/cheongna-lynn-strauss/13-master-bathroom-detail.webp",
};

function ImageNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-[13px] md:text-sm leading-7 text-neutral-500 break-keep">
      {children}
    </p>
  );
}

export default function CheongnaLynnStrauss() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            청라 린 스트라우스 41평을 위한 인테리어 디자인 제안입니다. 넓은
            면과 제한된 재료를 바탕으로 수납과 기능을 공간 안에 통합하고,
            각각의 요소가 입체적으로 드러나기보다 하나의 배경으로 작동하도록
            계획했습니다.
          </p>

          <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
            조명은 사물을 과하게 드러내기보다 필요한 곳에만 빛을 두고,
            자연광처럼 부드럽게 번지도록 구성했습니다. 밝은 곳과 어두운
            곳의 차이를 유지하면서 일상에 필요한 안온한 시야를 만드는 것이
            이번 제안의 중요한 기준이었습니다.
          </p>
        </div>

        <div className="mt-14 md:mt-16 border-l border-neutral-300 pl-6 md:pl-8">
          <p className="text-2xl md:text-4xl font-light leading-[1.45] break-keep">
            조명은 자연광을 닮아야 합니다.
          </p>

          <p className="mt-4 text-base md:text-xl leading-8 md:leading-9 text-neutral-600 break-keep">
            필요한 곳을 밝히되, 공간 전체를 같은 밝기로 만들지 않습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living & Kitchen"
          title="거실과 주방"
          description="거실과 주방은 하나의 생활 공간으로 이어지도록 계획했습니다. 벽과 가구의 선을 정리하고, 낮에는 자연광이 공간의 주된 분위기가 되도록 구성했습니다. 평면형 아일랜드와 통합 수납은 기능을 드러내기보다 공간의 배경으로 작동합니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid gap-8 md:gap-10">
            <ProjectImage
              src={images.livingRoom}
              alt="청라 린 스트라우스 41평 거실 TV 벽 디자인 제안"
              ratio="aspect-[16/9]"
            />

            <ProjectImage
              src={images.livingWindow}
              alt="자연광이 들어오는 청라 린 스트라우스 거실 디자인"
              ratio="aspect-[16/9]"
            />

            <ProjectImage
              src={images.kitchen}
              alt="대형 아일랜드를 중심으로 계획한 청라 린 스트라우스 주방"
              ratio="aspect-[16/9]"
            />

            <ProjectImage
              src={images.kitchenStorage}
              alt="냉장고와 수납장을 통합한 청라 린 스트라우스 주방 벽면"
              ratio="aspect-[16/9]"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry"
          title="현관과 복도"
          description="현관에서 거실로 이어지는 과정은 집의 밝기와 분위기가 서서히 전환되는 흐름으로 계획했습니다. 어두운 부분은 짙은 마감색이 아니라 제한된 빛이 만든 깊이이며, 안으로 들어갈수록 자연스럽게 밝아집니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-10 items-start">
            <div>
              <ProjectImage
                src={images.entry}
                alt="차분한 밝기로 계획한 청라 린 스트라우스 현관"
                ratio="aspect-square"
              />

              <ImageNote>제한된 빛이 만든 깊이를 유지한 현관.</ImageNote>
            </div>

            <ProjectImage
              src={images.entryCorridor}
              alt="청라 린 스트라우스 현관에서 거실로 이어지는 복도"
              ratio="aspect-square"
              className="md:translate-y-20"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Room"
          title="드레스룸"
          description="화장대와 수납을 하나의 구조 안에 통합하고, 충분한 수납량과 안온한 동선이 함께 유지되도록 비례와 분할을 정리했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <ProjectImage
              src={images.dressingVanity}
              alt="청라 린 스트라우스 드레스룸 화장대 디자인"
              ratio="aspect-[16/9]"
            />

            <ProjectImage
              src={images.dressingRoom}
              alt="통합 수납으로 구성한 청라 린 스트라우스 드레스룸"
              ratio="aspect-[16/9]"
              className="md:translate-y-16"
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bedroom"
          title="침실의 낮과 밤"
          description="낮에는 자연광이 공간의 주된 조명이 되고, 밤에는 침대 주변과 필요한 면에만 빛이 머물도록 계획했습니다. 서로 다른 시간대의 밝기를 통해 침실의 차분한 변화를 보여줍니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <ProjectImage
                src={images.masterBedroomDay}
                alt="자연광이 들어오는 청라 린 스트라우스 침실 낮 장면"
                ratio="aspect-[16/9]"
              />

              <ImageNote>
                낮에는 자연광이 침실의 주된 조명이 됩니다.
              </ImageNote>
            </div>

            <div className="md:translate-y-16">
              <ProjectImage
                src={images.masterBedroomNight}
                alt="간접적인 조명으로 계획한 청라 린 스트라우스 침실 야간 장면"
                ratio="aspect-[16/9]"
              />

              <ImageNote>
                밤에는 필요한 곳에만 낮은 빛이 머무릅니다.
              </ImageNote>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-32 md:mb-40">
        <SectionHeading
          eyebrow="Master Bathroom"
          title="재료의 깊이를 살린 욕실"
          description="짙은 톤과 조적 패턴, 조적 선반, 입체적인 구조를 조합해 깊이 있는 욕실을 구성했습니다. 욕조 상부에는 직접 조명 대신 간접광을 배치해 눈부심을 줄였습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.masterBathroom}
            alt="짙은 톤과 입체적인 구조로 계획한 청라 린 스트라우스 욕실"
            ratio="aspect-[16/9]"
          />

          <div className="mt-8 md:mt-10">
            <ProjectImage
              src={images.masterBathroomDetail}
              alt="욕조 상부 간접조명이 적용된 청라 린 스트라우스 욕실"
              ratio="aspect-[16/9]"
            />

            <ImageNote>
              욕조 상부의 간접광은 눈부심을 줄이고 안온한 밝기를 만듭니다.
            </ImageNote>
          </div>
        </div>
      </section>
    </>
  );
}
