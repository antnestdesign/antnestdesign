import { ProjectImage, SectionHeading } from "./ProjectLayout";

const images = {
  hero: "/projects/cheongna-lynn-strauss/01-hero.webp",
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

function Caption({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 md:mt-6">
      <p className="text-base md:text-xl font-light leading-7 break-keep">
        {title}
      </p>

      <p className="mt-3 text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
        {description}
      </p>
    </div>
  );
}

export default function CheongnaLynnStrauss() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          {[
            "청라 린 스트라우스 41평을 위한 인테리어 디자인 제안입니다.",
            "넓은 면을 깨끗하게 정리하고, 제한된 재료와 절제된 목재 디테일을 사용해 공간 전체가 하나의 흐름으로 이어지도록 계획했습니다. 수납은 벽과 가구 안으로 통합하고, 각각의 요소가 독립적으로 드러나기보다 공간의 배경으로 작동하도록 구성했습니다.",
            "이 집에서 조명은 공간을 과도하게 밝히기 위한 장치가 아닙니다. 조명의 수를 늘리는 대신 필요한 곳에만 빛을 두고, 자연광처럼 부드럽게 번지도록 계획했습니다. 밝은 곳과 어두운 곳의 차이를 지우지 않으면서도 일상에 필요한 편안한 시야를 확보하는 것이 이번 제안의 중요한 기준이었습니다.",
            "조명은 자연광을 닮아야 합니다. 필요한 곳을 밝히되, 공간 전체를 같은 밝기로 만들지 않습니다.",
            "거실과 주방은 시선과 동선이 자연스럽게 이어지는 하나의 생활 공간으로 구성했습니다. 넉넉한 크기의 아일랜드는 조리대이자 식탁으로 기능하며, 드레스룸과 현관, 복도에는 수납을 통합해 공간의 질서를 유지했습니다.",
            "욕실은 짙은 타일과 조적 파티션, 조적 선반, 독립형 욕조를 조합했습니다. 욕조 상부에는 직접 조명 대신 간접광을 배치해 눈부심을 줄이고, 어두운 재료 안에서도 편안하게 머물 수 있는 분위기를 만들었습니다.",
          ].map((paragraph) => (
            <p
              key={paragraph}
              className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living & Kitchen"
          title="자연광을 닮은 빛으로 정돈한 집"
          description="거실과 주방은 시선과 동선이 자연스럽게 이어지는 하나의 생활 공간으로 계획했습니다. 넓은 면과 통합된 수납이 공간의 배경을 만들고, 절제된 목재 디테일이 전체 흐름에 온기를 더합니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.hero}
            alt="청라 린 스트라우스 41평 거실과 주방 인테리어 디자인 제안"
            ratio="aspect-[2048/486]"
          />

          <Caption
            title="거실과 주방"
            description="거실과 주방 사이의 경계를 열어 가족의 생활이 하나의 공간 안에서 자연스럽게 이어지도록 계획했습니다. 넓은 면과 통합된 수납이 공간의 배경을 만들고, 절제된 목재 디테일이 전체 흐름에 온기를 더합니다."
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living Area"
          title="정돈된 거실과 자연광"
          description="장식적인 요소를 더하기보다 벽과 가구의 선을 정리해 거실이 밝고 편안하게 느껴지도록 구성했습니다. 낮 동안의 자연광은 거실의 주된 분위기가 되고, 인공조명은 필요한 곳에만 낮게 머물도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <ProjectImage
                src={images.livingRoom}
                alt="청라 린 스트라우스 41평 거실 TV 벽 디자인 제안"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="정돈된 거실"
                description="장식적인 요소를 더하기보다 벽과 가구의 선을 정리해 거실이 밝고 편안하게 느껴지도록 구성했습니다. TV 벽과 수납은 하나의 큰 면으로 읽히도록 계획해 시각적인 복잡함을 줄였습니다."
              />
            </div>

            <div className="md:translate-y-16">
              <ProjectImage
                src={images.livingWindow}
                alt="자연광이 들어오는 청라 린 스트라우스 거실 디자인"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="자연광이 머무는 공간"
                description="창을 통해 들어오는 자연광이 벽과 천장, 바닥을 따라 부드럽게 번지도록 계획했습니다. 인공조명이 공간 전체를 덮기보다 낮 동안의 자연광이 거실의 주된 분위기를 만듭니다."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Room"
          title="수납과 사용성을 통합한 드레스룸"
          description="드레스룸은 수납량을 확보하면서도 공간이 무겁게 느껴지지 않도록 비례와 분할을 정리했습니다. 화장대와 수납은 독립된 요소가 아니라 하나의 흐름 안에서 사용되도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <div>
              <ProjectImage
                src={images.dressingVanity}
                alt="청라 린 스트라우스 드레스룸 화장대 디자인"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="드레스룸 화장대"
                description="화장대는 드레스룸의 수납 구조 안에 자연스럽게 통합했습니다. 거울과 작업면에 필요한 빛만 부드럽게 전달해 밝기보다 사용자의 편안함에 집중했습니다."
              />
            </div>

            <div className="md:translate-y-16">
              <ProjectImage
                src={images.dressingRoom}
                alt="통합 수납으로 구성한 청라 린 스트라우스 드레스룸"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="정돈된 드레스룸"
                description="수납의 양을 확보하면서도 가구가 공간을 무겁게 채우지 않도록 비례와 분할을 정리했습니다. 반복되는 수납 면과 여유 있는 동선이 차분한 질서를 만듭니다."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entry / Corridor"
          title="밝기가 서서히 전환되는 진입 동선"
          description="현관에서 거실로 이어지는 복도는 단순한 이동 통로가 아니라 집의 밝기와 분위기가 전환되는 공간입니다. 제한된 빛과 차분한 마감으로 내부로 들어오는 과정을 정리했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-10 items-start">
            <div>
              <ProjectImage
                src={images.entryCorridor}
                alt="청라 린 스트라우스 현관에서 거실로 이어지는 복도"
                ratio="aspect-square"
              />

              <Caption
                title="공간을 잇는 복도"
                description="현관에서 거실로 이어지는 복도는 단순한 이동 통로가 아니라 집의 밝기와 분위기가 서서히 전환되는 공간입니다. 깊이에 따라 달라지는 빛을 유지해 공간의 흐름을 자연스럽게 드러냈습니다."
              />
            </div>

            <div className="md:translate-y-20">
              <ProjectImage
                src={images.entry}
                alt="차분한 밝기로 계획한 청라 린 스트라우스 현관"
                ratio="aspect-square"
              />

              <Caption
                title="차분한 현관"
                description="현관은 밝기를 과도하게 높이지 않고 내부 공간으로 들어가는 과정에 맞춰 차분하게 계획했습니다. 어둡게 보이는 부분은 짙은 마감재가 아니라 제한된 빛에 의해 형성된 깊이이며, 거실로 이어질수록 자연스럽게 밝아집니다."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Bedroom"
          title="시간에 따라 달라지는 침실의 빛"
          description="침실은 낮과 밤의 밝기 차이를 지우지 않고, 시간에 따라 다른 분위기가 느껴지도록 계획했습니다. 자연광과 낮은 조도의 조명이 각각의 시간에 맞는 편안함을 만듭니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <ProjectImage
                src={images.masterBedroomNight}
                alt="간접적인 조명으로 계획한 청라 린 스트라우스 침실 야간 장면"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="밤의 침실"
                description="침실의 조명은 공간 전체를 밝히기보다 침대 주변과 필요한 면에만 낮게 머물도록 계획했습니다. 눈부심을 줄인 빛과 깊이 있는 그림자가 하루의 끝을 편안하게 정리합니다."
              />
            </div>

            <div className="md:translate-y-16">
              <ProjectImage
                src={images.masterBedroomDay}
                alt="자연광이 들어오는 청라 린 스트라우스 침실 낮 장면"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="낮의 침실"
                description="낮에는 창으로 들어오는 자연광이 침실의 주된 조명이 됩니다. 침대와 커튼, 벽면을 따라 빛이 부드럽게 번지며 시간에 따라 달라지는 공간의 표정을 만듭니다."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen"
          title="생활의 중심이 되는 아일랜드"
          description="주방은 거실과 시선이 이어지는 열린 구조 안에서 조리와 식사, 수납의 기능을 명확하게 정리했습니다. 아일랜드와 수납벽은 각각의 기능을 드러내기보다 하나의 배경처럼 읽히도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <div>
              <ProjectImage
                src={images.kitchen}
                alt="대형 아일랜드를 중심으로 계획한 청라 린 스트라우스 주방"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="생활의 중심이 되는 아일랜드"
                description="넉넉한 크기의 아일랜드는 조리대와 식탁의 역할을 함께 수행합니다. 주방의 기능을 중심에 모으고 거실과 시선이 이어지도록 해 가족이 자연스럽게 머무는 생활의 중심으로 계획했습니다."
              />
            </div>

            <div className="md:translate-y-16">
              <ProjectImage
                src={images.kitchenStorage}
                alt="냉장고와 수납장을 통합한 청라 린 스트라우스 주방 벽면"
                ratio="aspect-[16/9]"
              />

              <Caption
                title="통합된 주방 수납"
                description="냉장고와 키큰장, 수납장을 하나의 정돈된 벽면으로 구성했습니다. 각각의 기능이 전면으로 드러나지 않도록 통합해 주방 전체가 간결한 배경으로 읽히도록 했습니다."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-32 md:mb-48">
        <SectionHeading
          eyebrow="Master Bathroom"
          title="재료의 깊이와 편안한 밝기"
          description="욕실은 짙은 타일과 조적 파티션, 조적 선반, 독립형 욕조를 조합해 깊이 있는 분위기로 계획했습니다. 직접적인 밝기보다 벽과 천장을 따라 번지는 간접광을 통해 눈부심을 줄였습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.masterBathroom}
            alt="짙은 타일과 독립형 욕조로 계획한 청라 린 스트라우스 욕실"
            ratio="aspect-[16/9]"
          />

          <Caption
            title="재료의 깊이를 살린 욕실"
            description="짙은 타일과 조적 파티션, 조적 선반, 독립형 욕조를 조합해 깊이 있는 욕실을 구성했습니다. 재료의 대비를 강조하면서도 각각의 요소가 하나의 차분한 장면으로 이어지도록 계획했습니다."
          />

          <div className="mt-10 md:mt-14">
            <ProjectImage
              src={images.masterBathroomDetail}
              alt="욕조 상부 간접조명을 적용한 청라 린 스트라우스 욕실"
              ratio="aspect-[16/9]"
            />

            <Caption
              title="눈부심을 줄인 욕조 조명"
              description="욕조 상부에는 직접적인 다운라이트 대신 간접조명을 배치했습니다. 빛이 벽과 천장을 따라 부드럽게 퍼지도록 해 욕조를 사용할 때의 눈부심을 줄이고 편안한 밝기를 만들었습니다."
            />
          </div>
        </div>
      </section>
    </>
  );
}
