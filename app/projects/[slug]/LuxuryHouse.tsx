import { ProjectImage, SectionHeading } from "./ProjectLayout";
import type { Project } from "../../data/projects";

function FeatureList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
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

export default function LuxuryHouse({ project }: { project: Project }) {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-40">
        <div className="space-y-6">
          {[
            "이 집의 시작은 화려한 고급주택을 짓기 위한 계획이 아니었습니다.",
            "건축주는 오랜 시간 가족을 위해 살아오신 부모님께 앞으로의 삶을 선물하고 싶었습니다.",
            "편안하게 이동할 수 있는 동선, 시간이 지나도 변하지 않는 견고한 자재, 가족 모두가 자연스럽게 모일 수 있는 공간. 모든 계획은 부모님의 일상에서 시작되었습니다.",
            "이 프로젝트는 건축이 아니라, 감사의 마음을 공간으로 완성하는 과정이었습니다.",
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

      <section className="mb-28 md:mb-44">
        <SectionHeading
          eyebrow="Architecture"
          title="현무암과 조적타일로 완성한 견고한 입면"
          description="외관은 현무암과 조적타일, 벽돌이 만들어내는 묵직한 질감을 중심으로 계획했습니다. 유리난간은 시야를 열어주면서도 건축의 수평성을 강조하고, 각기 다른 재료들은 하나의 건축 언어 안에서 자연스럽게 연결되도록 설계했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/luxury-house/01-hero.webp"
            alt={`${project.title} 외관`}
            ratio="aspect-[16/9]"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              과시적인 디자인보다 오래 보아도 질리지 않는 비례를 목표로
              했습니다. 단단한 재료가 만들어내는 수평성과 깊이는 주택 전체의
              인상을 결정하는 중요한 요소였습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-44">
        <SectionHeading
          eyebrow="Arrival"
          title="부모님의 앞으로를 생각한 공간"
          description="처음부터 전용 엘리베이터를 계획했습니다. 현재뿐 아니라 앞으로의 시간을 생각하면 계단보다 편안한 이동이 더 중요하다고 판단했습니다. 긴 복도와 넓은 홀은 이동을 위한 공간이 아니라, 집에 들어서는 순간부터 여유를 느끼도록 계획된 공간입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/luxury-house/02-1f-ev-hall.webp"
            alt={`${project.title} 1층 엘리베이터 홀`}
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-end">
            <ProjectImage
              src="/projects/luxury-house/03-hall.webp"
              alt={`${project.title} 메인 홀`}
              ratio="aspect-[4/5]"
            />

            <ProjectImage
              src="/projects/luxury-house/06-1f-upstair.webp"
              alt={`${project.title} 계단 홀`}
              ratio="aspect-[4/5]"
              className="md:translate-y-12"
            />
          </div>

          <ProjectImage
            src="/projects/luxury-house/07-2f-ec-hall.webp"
            alt={`${project.title} 2층 홀`}
            ratio="aspect-[16/10]"
            className="mt-20 md:mt-28"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              높은 층고와 간접조명은 시선의 흐름을 자연스럽게 위로 이끌며,
              공간 전체의 깊이를 만들어냅니다. 이 집의 동선은 단순한 이동이
              아니라, 공간을 천천히 경험하는 과정으로 계획되었습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-44">
        <SectionHeading
          eyebrow="Living Room"
          title="8m 층고가 만드는 압도적인 공간감"
          description="거실은 이 주택의 중심이자 가족이 가장 오래 머무는 공간입니다. 8m에 이르는 높은 층고는 시선을 자연스럽게 위로 이끌며, 일반적인 주거 공간에서는 경험하기 어려운 압도적인 개방감을 만들어냅니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/luxury-house/05-living-room.webp"
            alt={`${project.title} 8m 층고 거실`}
            ratio="aspect-[16/9]"
            className="mb-12 md:mb-16"
          />

          <div className="grid md:grid-cols-12 gap-10 md:gap-14">
            <div className="md:col-span-7">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                거실 중심을 이루는 대형 박판타일 벽면은 공간에 깊이감과
                묵직한 존재감을 더하고, 대형 샹들리에와 벽난로, 전면 통창으로
                유입되는 자연광이 어우러져 시간의 흐름에 따라 다양한 표정을
                만들어냅니다.
              </p>

              <p className="mt-5 md:mt-6 text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                이 거실은 단순히 넓은 공간이 아니라, 부모님과 자녀, 손주까지
                온 가족이 함께 모여 일상을 나누고 추억을 쌓을 수 있도록 계획된
                집의 중심입니다.
              </p>
            </div>

            <div className="md:col-span-4 md:col-start-9">
              <FeatureList
                title="Key Features"
                items={[
                  "8m 층고",
                  "대형 박판타일 벽면",
                  "대형 샹들리에",
                  "벽난로",
                  "전면 통창",
                  "자연광 중심 설계",
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-44">
        <SectionHeading
          eyebrow="Kitchen"
          title="하이엔드 사양으로 완성한 중심 주방"
          description="주방은 단순히 조리를 위한 공간이 아니라, 가족이 하루 중 가장 오래 머무는 공간으로 계획했습니다. 훈증무늬목의 깊은 질감과 맞춤 제작된 풀사이즈 아일랜드를 중심으로 디자인과 사용성을 함께 고려했습니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/luxury-house/04-kitchen.webp"
            alt={`${project.title} 하이엔드 주방`}
            ratio="aspect-[16/10]"
            className="mb-12 md:mb-16"
          />

          <div className="grid md:grid-cols-12 gap-10 md:gap-14">
            <div className="md:col-span-5">
              <h3 className="text-2xl md:text-4xl font-light leading-[1.2] break-keep">
                보이는 마감부터
                <br />
                보이지 않는 하드웨어까지
              </h3>
            </div>

            <div className="md:col-span-6 md:col-start-7 space-y-5 md:space-y-6">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                Sub-Zero 냉장고와 와인셀러, Miele 빌트인 가전, Palmex 후드,
                Hansgrohe 수전, Blum 레일과 힌지까지 사용되는 모든 설비는
                기능성과 내구성을 기준으로 선정했습니다.
              </p>

              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                고급주방은 단순히 브랜드의 나열이 아니라, 오래 사용해도
                불편함이 적고 관리가 쉬우며, 가족의 일상에 자연스럽게 스며드는
                완성도에서 결정된다고 생각했습니다.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 mt-16 md:mt-20">
            <FeatureList
              title="Material"
              items={[
                "훈증무늬목 마감",
                "맞춤 제작 풀사이즈 아일랜드",
                "맞춤 제작 수납장",
              ]}
            />

            <FeatureList
              title="Appliance"
              items={[
                "Sub-Zero 냉장고",
                "Sub-Zero 와인셀러",
                "Miele 빌트인 가전",
                "Palmex 후드",
                "Hansgrohe 수전",
              ]}
            />

            <FeatureList
              title="Hardware"
              items={["Blum 힌지", "Blum 서랍 시스템", "프리미엄 수납 하드웨어"]}
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-44">
        <SectionHeading
          eyebrow="Private Leisure"
          title="집 안에서 누리는 여유"
          description="생활과 휴식은 분리되지 않습니다. 지하에는 프라이빗 스크린골프장을, 실내에는 사계절 이용 가능한 수영장을 계획했습니다. 운동과 휴식이 일상 속으로 자연스럽게 이어지는 공간입니다."
        />

        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectImage
            src="/projects/luxury-house/08-b1-screengolf.webp"
            alt={`${project.title} 지하 스크린골프장`}
            ratio="aspect-[16/10]"
            className="mb-8 md:mb-10"
          />

          <ProjectImage
            src="/projects/luxury-house/09-swimming-pool.webp"
            alt={`${project.title} 실내 수영장`}
            ratio="aspect-[16/9]"
          />

          <div className="max-w-4xl ml-auto mt-12 md:mt-16">
            <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              고급주택은 넓은 면적보다 삶의 질을 높여주는 공간의 경험에서
              완성된다고 생각했습니다. 가족과 손님이 함께 시간을 보낼 수 있는
              공간이면서도, 일상의 쉼을 위한 장소가 되도록 구성했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
        <div className="border-t border-neutral-300 pt-10 md:pt-12">
          <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
            Architecture of Everyday Life
          </p>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                오래 머물고 싶은
                <br />
                집을 짓는 일
              </h2>
            </div>

            <div className="md:col-span-6 md:col-start-7 space-y-5 md:space-y-6">
              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                이 프로젝트는 더 큰 집을 짓기 위한 건축이 아니었습니다.
                부모님의 앞으로의 삶을 위한 집, 그리고 가족 모두가 오래 머무를
                수 있는 집을 만드는 과정이었습니다.
              </p>

              <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                ANTNEST DESIGN은 공간의 크기보다, 그 안에서 살아갈 사람의
                시간을 먼저 생각합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}