import { ProjectImage, SectionHeading } from "./ProjectLayout";
import type { Project } from "../../data/projects";

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t border-neutral-300 pt-5">
      <p className="uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-neutral-400 mb-5">
        {title}
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="text-[13px] md:text-sm leading-6 text-neutral-600 break-keep"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PrivateHouse({ project }: { project: Project }) {
  const gallery = project.gallery ?? [];

  const exterior = gallery[0];
  const stair = gallery[1];
  const hall = gallery[2];
  const livingRoom = gallery[3];
  const windows = gallery[4];
  const fireplace = gallery[5];
  const kitchen = gallery[6];

  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-40">
        <div className="space-y-6">
          {[
            "이 집은 두 아이와 아내를 둔 한 아빠가 청라에 정착하기 위해 지은 첫 단독주택입니다.",
            "오랫동안 가족이 머물 집이었기에, 계획의 중심에는 건축주의 취향만큼이나 가족의 생활 방식이 놓였습니다.",
            "북미에서 유학생활을 했던 아내의 취향을 적극적으로 반영해 클래식한 비례와 웨인스코팅 디테일, 높은 층고의 거실, 넓은 창이 있는 생활 공간을 하나의 주거 경험으로 구성했습니다.",
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

      {exterior && (
        <section className="mb-28 md:mb-44">
          <SectionHeading
            eyebrow="Architecture"
            title="청라에 자리 잡은 첫 단독주택"
            description="외관은 붉은 벽돌과 징크 지붕, 석재가든이 만드는 단단한 인상을 중심으로 계획했습니다. 좌우 대칭에 가까운 입면과 깊이감 있는 진입부는 가족의 첫 단독주택이 오래 기억될 수 있는 장면을 만듭니다."
          />

          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <ProjectImage
              src={exterior}
              alt={`${project.title} 외관`}
              ratio="aspect-[16/10]"
            />

            <div className="max-w-4xl ml-auto mt-12 md:mt-16">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                건물은 단순히 면적을 확보하는 방식이 아니라, 정착의 감각을
                만드는 집으로 계획했습니다. 마당에서 현관으로 이어지는 축,
                벽돌 입면의 질감, 밤에 켜지는 외부 조명은 집에 도착하는
                순간의 분위기를 완성합니다.
              </p>
            </div>
          </div>
        </section>
      )}

      {(stair || hall) && (
        <section className="mb-28 md:mb-44">
          <SectionHeading
            eyebrow="Arrival"
            title="현관에서 생활 영역을 정리하는 계단실"
            description="1층은 현관에 들어서자마자 안방, 계단, 거실이 바로 노출되지 않도록 별도의 계단실을 구획했습니다. 계단실은 이동 동선이면서 동시에 집의 첫 인상을 만드는 완충 공간으로 작동합니다."
          />

          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-end">
              {stair && (
                <ProjectImage
                  src={stair}
                  alt={`${project.title} 계단실`}
                  ratio="aspect-[4/5]"
                  quality={82}
                />
              )}

              {hall && (
                <ProjectImage
                  src={hall}
                  alt={`${project.title} 홀과 계단실`}
                  ratio="aspect-[4/5]"
                  quality={82}
                  className="md:translate-y-12"
                />
              )}
            </div>

            <div className="max-w-4xl ml-auto mt-16 md:mt-24">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                높은 벽면의 웨인스코팅과 우드 계단, 해링본 타일은 북미 주거
                공간의 클래식한 분위기를 차분하게 담아냅니다. 바닥은 오래
                지속되고 관리가 쉬운 재질을 중심으로 구성해, 장식성과 생활의
                편안함이 함께 유지되도록 정리했습니다.
              </p>
            </div>
          </div>
        </section>
      )}

      {(livingRoom || windows) && (
        <section className="mb-28 md:mb-44">
          <SectionHeading
            eyebrow="Living Room"
            title="높은 층고와 큰 창이 만드는 가족의 중심"
            description="거실은 넓은 면적과 높은 층고를 바탕으로 가족이 함께 머무는 중심 공간으로 계획했습니다. 큰 창에는 살라맨더 시스템창호를 적용해 개방감과 단열 성능을 함께 고려했습니다."
          />

          <div className="max-w-7xl mx-auto px-8 md:px-16">
            {livingRoom && (
              <ProjectImage
                src={livingRoom}
                alt={`${project.title} 거실`}
                ratio="aspect-[16/10]"
                className="mb-8 md:mb-10"
              />
            )}

            {windows && (
              <ProjectImage
                src={windows}
                alt={`${project.title} 거실 대형 창호`}
                ratio="aspect-[4/5]"
                quality={82}
                className="max-w-5xl mx-auto"
              />
            )}

            <div className="max-w-4xl ml-auto mt-12 md:mt-16 space-y-5 md:space-y-6">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                거실과 주방 전체에는 대리석 바닥을 시공해 넓은 공간이 하나의
                생활 영역으로 읽히도록 했습니다. 밝은 바닥은 창을 통해 들어온
                빛을 부드럽게 받아내고, 높은 층고의 개방감을 더 크게
                느끼게 합니다.
              </p>

              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                큰 창은 집의 인상을 만드는 요소이지만, 단독주택에서는 단열과
                기밀 성능이 함께 따라와야 합니다. 살라맨더 시스템창호는 넓은
                개구부를 유지하면서 겨울철 실내 환경을 안정적으로 만드는
                중요한 선택이었습니다.
              </p>
            </div>
          </div>
        </section>
      )}

      {fireplace && (
        <section className="mb-28 md:mb-44">
          <SectionHeading
            eyebrow="Fireplace"
            title="높은 거실을 따뜻하게 만드는 벽난로"
            description="거실에는 석재패널로 마감한 벽난로를 계획했습니다. 높은 층고의 단독주택에서도 겨울의 생활감이 차갑게 느껴지지 않도록, 시각적인 중심과 난방의 보조 기능을 함께 고려했습니다."
          />

          <div className="max-w-5xl mx-auto px-8 md:px-16">
            <ProjectImage
              src={fireplace}
              alt={`${project.title} 벽난로와 석재패널`}
              ratio="aspect-[4/5]"
              quality={82}
            />
          </div>
        </section>
      )}

      {kitchen && (
        <section className="mb-28 md:mb-44">
          <SectionHeading
            eyebrow="Kitchen"
            title="보이는 것은 덜고, 보조주방의 역할은 키운 주방"
            description="주방은 밖으로 드러나는 요소를 꼭 필요한 것만 남기고 정리했습니다. 조리와 수납의 일부 기능은 보조주방으로 나누어, 메인 주방과 다이닝 공간이 단정하게 유지되도록 계획했습니다."
          />

          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <ProjectImage
              src={kitchen}
              alt={`${project.title} 주방과 다이닝`}
              ratio="aspect-[16/10]"
              className="mb-12 md:mb-16"
            />

            <div className="grid md:grid-cols-12 gap-10 md:gap-14">
              <div className="md:col-span-5">
                <h3 className="text-2xl md:text-4xl font-light leading-[1.2] break-keep">
                  기능은 깊게,
                  <br />
                  장면은 단정하게
                </h3>
              </div>

              <div className="md:col-span-6 md:col-start-7 space-y-5 md:space-y-6">
                <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                  키친바흐 주방가구와 서브제로 냉장고는 주방의 중심 벽면 안에
                  안정적으로 정리했습니다. 가전과 수납이 한 면으로 정돈되면서,
                  식탁이 놓인 다이닝 공간은 가족이 함께 머무는 장면으로
                  남습니다.
                </p>

                <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                  메인 주방은 보여지는 공간으로 단정하게 유지하고, 보조주방은
                  실제 조리와 정리의 역할을 담당하도록 나누었습니다. 단독주택의
                  생활 규모에 맞춰 주방의 기능을 한 곳에 몰아두지 않은
                  계획입니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
        <div className="border-t border-neutral-300 pt-10 md:pt-12">
          <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
            Material & Detail
          </p>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-14 md:mb-16">
            <div className="md:col-span-5">
              <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                오래 머무는 집을 위한
                <br />
                견고한 선택
              </h2>
            </div>

            <div className="md:col-span-6 md:col-start-7 space-y-5 md:space-y-6">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                이 집의 재료는 장식보다 생활의 지속성을 기준으로 선택했습니다.
                석재패널과 대리석 바닥, 징크 지붕은 단독주택의 구조적
                인상을 만들고, 해링본 타일과 웨인스코팅, 벽난로는 가족이
                머무는 실내에 차분한 클래식함을 더합니다.
              </p>

              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                살라맨더 시스템창호, 키친바흐 주방가구, 서브제로 냉장고처럼
                직접 사용하는 제품들은 집의 분위기뿐 아니라 일상의 편안함과
                유지 관리까지 고려해 선정했습니다.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            <FeatureList
              title="Material"
              items={["석재패널", "징크 지붕", "대리석 바닥", "해링본 타일", "웨인스코팅"]}
            />

            <FeatureList title="Comfort" items={["벽난로", "살라맨더 시스템창호"]} />

            <FeatureList
              title="Kitchen"
              items={["서브제로 냉장고", "키친바흐 주방가구", "보조주방 기능 강화"]}
            />
          </div>
        </div>
      </section>
    </>
  );
}
