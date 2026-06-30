import { ProjectImage, SectionHeading } from "./ProjectLayout";

const images = {
  hero: "/projects/cheongna-hoban-4-33a/01-hero.jpg",
  livingRoom: "/projects/cheongna-hoban-4-33a/02-living-room.jpg",
  livingKitchen: "/projects/cheongna-hoban-4-33a/03-living-kitchen.jpg",
  corridor: "/projects/cheongna-hoban-4-33a/04-corridor.jpg",
  masterRoom: "/projects/cheongna-hoban-4-33a/05-master-room.jpg",
  dressingRoom: "/projects/cheongna-hoban-4-33a/06-dressing-room.jpg",
  dressingDetail: "/projects/cheongna-hoban-4-33a/07-dressing-detail.png",
  entryStorage: "/projects/cheongna-hoban-4-33a/08-entry-storage.jpg",
  bathroom: "/projects/cheongna-hoban-4-33a/09-bathroom.jpg",
  kitchen: "/projects/cheongna-hoban-4-33a/10-kitchen.jpg",
};

export default function CheongnaHoban4() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          {[
            "인천 청라 호반4차 33A 실제 평면을 기준으로 계획한 인테리어 디자인 제안입니다.",
            "기존 구조에서 부족하게 느껴질 수 있는 수납과 생활 동선을 다시 정리했습니다. 거실과 주방은 하나의 열린 생활 공간으로 계획하고, 현관은 신발장과 팬트리 영역을 확장해 벤치가 있는 수납공간으로 구성했습니다.",
            "안방은 장을 이용해 침실과 드레스룸 영역을 분리하고, 드레스룸 사용 면적과 수납량을 넓히는 방향으로 계획했습니다. 전체 공간은 차분한 우드톤, 그레이지 계열 벽면, 석재 질감, 낮은 조도의 간접조명으로 연결했습니다.",
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
          eyebrow="Living Area"
          title="거실과 주방이 이어지는 열린 생활 공간"
          description="거실은 대형 창을 통해 들어오는 자연광과 아파트 단지의 풍경을 적극적으로 받아들이는 공간으로 계획했습니다. 우드 마감의 TV 월과 낮은 조도의 간접조명을 통해 시선이 머무는 중심 벽면을 만들고, 주방과 자연스럽게 연결되는 넓은 생활 공간으로 구성했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.livingRoom}
            alt="청라 호반4차 33A 거실 렌더링"
            ratio="aspect-[16/9]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living & Kitchen"
          title="하나의 장면으로 연결한 거실과 주방"
          description="거실과 주방은 별개의 공간처럼 나뉘기보다 하나의 큰 장면으로 읽히도록 구성했습니다. TV 월, 소파, 아일랜드, 후면 주방 수납벽이 같은 축 안에서 연결되도록 계획해 가족의 생활과 식사, 휴식이 자연스럽게 이어지도록 했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.livingKitchen}
            alt="청라 호반4차 33A 거실과 주방 렌더링"
            ratio="aspect-[16/9]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen"
          title="수납 벽면과 아일랜드로 정리한 주방"
          description="주방은 거실과 자연스럽게 이어지는 오픈형 구조 안에서 수납과 조리 동선을 명확하게 정리했습니다. 후면에는 우드톤 수납 벽면을 길게 구성해 가전과 수납을 하나의 면으로 정돈하고, 중앙에는 곡선형 다리의 아일랜드를 배치해 조리, 식사, 대화가 함께 이루어지는 중심 공간으로 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.kitchen}
            alt="청라 호반4차 33A 주방 렌더링"
            ratio="aspect-[16/9]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="border-t border-neutral-300 pt-8 md:pt-10">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Entry Storage
            </p>

            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-5">
                <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep mb-6 md:mb-8">
                  신발장과 팬트리를 확장한
                  <br />
                  벤치형 수납
                </h2>

                <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                  현관은 신발장과 팬트리 영역을 확장해 수납량을 확보하는 데
                  중점을 두었습니다. 단순히 신발만 보관하는 공간이 아니라,
                  외출 전후의 물건을 정리하고 잠시 앉아 신발을 신을 수 있는
                  벤치형 수납으로 계획했습니다. 수납장과 벤치, 하부 간접조명이
                  하나의 면으로 정리되도록 구성해 집에 들어서는 첫 장면을
                  차분하게 만들었습니다.
                </p>
              </div>

              <div className="md:col-span-6 md:col-start-7">
                <ProjectImage
                  src={images.entryStorage}
                  alt="청라 호반4차 33A 현관 신발장 팬트리 확장 수납 렌더링"
                  ratio="aspect-[16/9]"
                  quality={82}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="border-t border-neutral-300 pt-8 md:pt-10">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Corridor
            </p>

            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-5">
                <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep mb-6 md:mb-8">
                  공간의 분위기를
                  <br />
                  이어주는 복도
                </h2>

                <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                  복도와 수납 공간은 단순한 이동 동선이 아니라 집의 분위기가
                  이어지는 시퀀스로 계획했습니다. 벽면과 수납장을 최대한
                  단정하게 정리하고, 우드톤 바닥과 밝은 벽면 마감이 거실,
                  안방, 드레스룸까지 자연스럽게 이어지도록 구성했습니다.
                </p>
              </div>

              <div className="md:col-span-6 md:col-start-7">
                <ProjectImage
                  src={images.corridor}
                  alt="청라 호반4차 33A 복도 렌더링"
                  ratio="aspect-[16/10]"
                  quality={82}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Room"
          title="침실과 수납을 분리한 안방"
          description="안방은 침실과 드레스룸의 기능을 명확히 나누는 데 중점을 두었습니다. 기존 안방 일부를 장으로 분할해 침실 영역과 수납 영역 사이에 자연스러운 경계를 만들고, 침실은 더 차분하게 유지될 수 있도록 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.masterRoom}
            alt="청라 호반4차 33A 안방 렌더링"
            ratio="aspect-[16/9]"
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Room"
          title="장으로 확장한 드레스룸"
          description="이 제안의 핵심은 안방 일부를 장으로 분할해 드레스룸 공간을 기존보다 넓게 사용할 수 있도록 계획한 점입니다. 수납장이 단순히 벽면에 붙는 것이 아니라 공간을 나누는 장치로 작동하도록 구성해, 침실과 수납 영역의 경계를 만들었습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.dressingRoom}
            alt="청라 호반4차 33A 드레스룸 렌더링"
            ratio="aspect-[16/9]"
            quality={82}
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Dressing Detail"
          title="드레스룸 안쪽의 화장대 수납"
          description="드레스룸 내부에는 화장대와 수납장을 함께 계획해 옷, 가방, 작은 생활 물건까지 정리할 수 있도록 구성했습니다. 조명이 들어간 거울과 낮은 톤의 수납장을 사용해 안방과 드레스룸 사이의 분위기가 자연스럽게 이어지도록 했습니다."
        />

        <div className="max-w-5xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.dressingDetail}
            alt="청라 호반4차 33A 드레스룸 화장대 수납 렌더링"
            ratio="aspect-[4/3]"
            quality={82}
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Bathroom"
          title="밝은 석재 질감의 욕실"
          description="욕실은 밝은 석재 질감의 타일과 간접조명을 중심으로 계획했습니다. 세면 공간과 샤워 공간의 기능을 분리하고, 불필요한 장식을 덜어내 작은 공간에서도 차분하고 안정적인 분위기가 유지되도록 구성했습니다."
        />

        <div className="max-w-5xl mx-auto px-8 md:px-16">
          <ProjectImage
            src={images.bathroom}
            alt="청라 호반4차 33A 욕실 렌더링"
            ratio="aspect-square"
            quality={82}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
        <div className="border-t border-neutral-300 pt-10 md:pt-12">
          <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
            Project Point
          </p>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                실제 평면을 기준으로 한
                <br />
                수납과 동선의 재구성
              </h2>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                이 프로젝트는 실제 청라 호반4차 33A 평면을 기준으로, 기존
                구조 안에서 수납과 생활 동선을 어떻게 개선할 수 있는지 검토한
                디자인 제안입니다. 거실과 주방은 열린 생활 공간으로 정리하고,
                현관은 신발장과 팬트리 수납을 확장해 벤치가 있는 수납공간으로
                계획했습니다. 또한 안방은 장으로 분할해 침실과 드레스룸의
                경계를 만들고, 드레스룸 사용 면적과 수납량을 넓혔습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}