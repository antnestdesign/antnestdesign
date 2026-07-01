import { ProjectImage, SectionHeading } from "./ProjectLayout";

function SmallBefore({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="max-w-sm mt-8 md:mt-10">
      <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-400 mb-3">
        Before
      </p>

      <ProjectImage src={src} alt={alt} ratio="aspect-[4/3]" quality={72} />
    </div>
  );
}

export default function ApartmentB() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          {[
            "집은 단순히 머무는 공간이 아니라 가족의 하루가 가장 오래 머무는 장소입니다.",
            "이번 프로젝트는 부부와 어린 두 아이가 살아갈 앞으로의 시간을 담기 위해 시작되었습니다.",
            "요리를 좋아하는 아내, 재택근무가 잦은 일상, 함께 성장하는 아이들. 디자인보다 먼저 가족의 생활을 이해하고, 그 생활에 맞춰 공간을 다시 설계했습니다.",
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
          eyebrow="Entrance / Corridor"
          title="경계를 지우고 시선을 연결하다"
          description="기존 중문을 과감히 철거해 현관과 복도의 경계를 없앴습니다. 닫혀 있던 시선은 거실까지 길게 이어지고, 실제 면적의 변화 없이도 집 전체가 한층 넓고 여유롭게 느껴지는 공간을 만들었습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/apartment-b/07-entrance.webp"
            alt="동탄역 모아미래도 현관"
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <ProjectImage
              src="/projects/apartment-b/08-corridor-view-01.webp"
              alt="동탄역 모아미래도 복도 거실 방향"
              ratio="aspect-[4/5]"
            />

            <ProjectImage
              src="/projects/apartment-b/09-corridor-view-02.webp"
              alt="동탄역 모아미래도 복도 현관 방향"
              ratio="aspect-[4/5]"
              className="md:translate-y-12"
            />
          </div>

          <SmallBefore
            src="/projects/apartment-b/06-construction.webp"
            alt="동탄역 모아미래도 현관과 복도 시공 전"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              복도는 더 이상 방을 연결하는 단순한 통로가 아니라, 집 전체의
              흐름을 이어주는 하나의 공간으로 계획했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Living Room"
          title="같은 공간, 달라진 가족의 시간"
          description="거실은 가장 넓은 공간이 아니라 가족이 가장 오래 함께 머무는 공간이어야 한다고 생각했습니다. 활용도가 낮았던 팬트리를 비워내고, 거실과 주방이 하나로 이어지는 시야를 만들었습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/apartment-b/10-living-room-overview.webp"
            alt="동탄역 모아미래도 거실 시공 후"
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <ProjectImage
            src="/projects/apartment-b/11-living-room-evening.webp"
            alt="동탄역 모아미래도 거실 야간 조명"
            ratio="aspect-[16/9]"
          />

          <SmallBefore
            src="/projects/apartment-b/01-before-living.webp"
            alt="동탄역 모아미래도 거실 시공 전"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              이번 프로젝트에서 가장 크게 달라진 것은 면적이 아닙니다. 같은
              공간 안에서 가족이 함께 보내는 시간이 달라졌습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Kitchen"
          title="주방은 가족이 머무는 중심이 되었습니다"
          description="기존 주방은 조리 공간과 수납이 모두 부족했고, 거실에는 활용도가 낮은 팬트리가 자리하고 있었습니다. 우리는 팬트리를 과감히 비우고 주방의 중심에 3m 풀사이즈 아일랜드를 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/apartment-b/12-kitchen-front.webp"
            alt="동탄역 모아미래도 주방 전경"
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <ProjectImage
            src="/projects/apartment-b/19-kitchen-island.webp"
            alt="동탄역 모아미래도 대형 아일랜드"
            ratio="aspect-[16/10]"
          />

          <SmallBefore
            src="/projects/apartment-b/02-before-kitchen.webp"
            alt="동탄역 모아미래도 주방 시공 전"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16 space-y-5 md:space-y-6">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              조리와 식사, 대화와 아이들의 숙제까지. 아일랜드는 단순한
              조리대가 아니라 가족이 가장 오래 머무는 공간이 되었습니다.
            </p>

            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              부족했던 수납은 아일랜드 하부, 냉장고 옆 키큰장, 홈바장으로
              분산하여 생활감은 줄이고 사용성은 높였습니다. 기존 주방 일부는
              보조주방으로 분리해 냄새가 강한 음식이나 많은 조리가 필요한
              요리를 해결할 수 있도록 했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Study"
          title="아이를 바라보며 일할 수 있는 서재"
          description="팬트리를 없애고 그 자리에 작은 서재를 계획했습니다. 재택근무가 많은 아내는 아이들이 거실에서 놀고 있는 모습을 자연스럽게 시야에 두면서도 업무에 집중할 수 있게 되었습니다."
        />

        <div className="max-w-6xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/apartment-b/18-study-homebar.webp"
            alt="동탄역 모아미래도 서재와 홈바"
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <p className="max-w-3xl text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
            공간 하나를 더 만든 것이 아니라, 가족이 서로의 일상을 함께할 수
            있는 새로운 장소를 만든 것입니다. 많은 수납보다 가족이 함께 시간을
            공유할 수 있는 공간을 만드는 것이 더 중요했습니다.
          </p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Master Suite"
          title="가장 사적인 공간은 더욱 깊게"
          description="기존 안방 욕실을 가족 모두가 사용할 수 있는 공용 욕실로 전환하고, 복도까지 드레스룸을 확장해 욕실과 하나의 연속된 공간으로 계획했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/apartment-b/14-master-entry.webp"
            alt="동탄역 모아미래도 안방 입구 시공 후"
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-end">
            <ProjectImage
              src="/projects/apartment-b/13-master-bedroom.webp"
              alt="동탄역 모아미래도 안방"
              ratio="aspect-[4/5]"
            />

            <ProjectImage
              src="/projects/apartment-b/15-dressing-room.webp"
              alt="동탄역 모아미래도 드레스룸"
              ratio="aspect-[4/5]"
              className="md:translate-y-12"
            />
          </div>

          <SmallBefore
            src="/projects/apartment-b/05-before-master-entry.webp"
            alt="동탄역 모아미래도 안방 입구 시공 전"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              침실은 휴식에만 집중할 수 있는 더욱 내밀한 공간이 되었고,
              드레스룸은 여유로운 수납과 편리한 동선을 갖춘 독립적인 공간으로
              완성되었습니다. 특히 아침 출근 시간에는 배우자가 잠든 동안에도
              침실을 지나지 않고 드레스룸에서 옷을 갈아입고, 공용 욕실을 이용한
              뒤 자연스럽게 현관으로 이어질 수 있도록 동선을 설계했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Bathroom"
          title="매일 사용하는 공간의 정리"
          description="욕실은 화려한 소재보다 사용성과 관리의 편안함을 우선했습니다. 차분한 톤의 마감과 간결한 디테일은 시간이 지나도 오래 사용할 수 있는 공간을 목표로 계획되었습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-end">
            <ProjectImage
              src="/projects/apartment-b/16-master-bathroom.webp"
              alt="동탄역 모아미래도 욕실"
              ratio="aspect-[4/5]"
            />

            <ProjectImage
              src="/projects/apartment-b/17-common-bathroom.webp"
              alt="동탄역 모아미래도 공용 욕실"
              ratio="aspect-[4/5]"
              className="md:translate-y-12"
            />
          </div>

          <SmallBefore
            src="/projects/apartment-b/04-before-common-bathroom.webp"
            alt="동탄역 모아미래도 공용 욕실 시공 전"
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
        <div className="border-t border-neutral-300 pt-10 md:pt-12">
          <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
            Lighting
          </p>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                빛은 공간보다
                <br />
                생활을 비춥니다
              </h2>
            </div>

            <div className="md:col-span-6 md:col-start-7 space-y-5 md:space-y-6">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                모든 공간은 2인치 다운라이트와 10구 사각 매입등을 중심으로
                계획했습니다. 거실은 기존 우물천장의 비례를 다시 조정하고
                간접조명을 더해 필요한 조도를 확보했습니다.
              </p>

              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                반대로 침실은 천장 조명을 최소화하고 벽등과 침대 하부
                간접조명을 적용해 눈부심 없이 편안한 분위기를 만들었습니다.
                밝은 공간보다 오래 머물고 싶은 공간을 만드는 것이 이번
                프로젝트의 조명 철학입니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}