import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackToTop from "../../components/BackToTop";
import { projectList, projects } from "../../data/projects";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-7xl mx-auto px-8 md:px-16 mb-8 md:mb-12">
      <div className="border-t border-neutral-300 pt-8 md:pt-10">
        <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
          {eyebrow}
        </p>

        <div className="grid md:grid-cols-12 gap-5 md:gap-12 items-end">
          <h2 className="md:col-span-5 text-3xl md:text-5xl font-light leading-[1.12] break-keep">
            {title}
          </h2>

          {description && (
            <p className="md:col-span-5 md:col-start-8 text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = projects[slug as keyof typeof projects];

  if (!project) {
    notFound();
  }

  const gallery = project.gallery ?? [];
  const beforeImages = project.beforeImages ?? [];
  const isApartmentA = slug === "apartment-a";
  const isLuxuryHouse = slug === "luxury-house";
  const isPrivateHouse = slug === "private-house";

  const overviewParagraphs = isApartmentA
    ? [
        "부부와 초등학생 자녀가 거주하는 37평형 아파트로, 2베이 구조가 가진 수납과 동선의 한계를 정리하는 데 중점을 둔 프로젝트입니다.",
        "기존 공간에서 턱없이 부족했던 수납을 보완하기 위해 주방, 현관, 안방의 기능을 다시 나누고, 가족의 일상이 더 단정하게 유지될 수 있는 구조로 계획했습니다.",
      ]
    : isLuxuryHouse
      ? [
          "대지 위에 주거, 휴식, 취미 공간이 함께 구성된 고급주택 신축 프로젝트입니다.",
          "넓은 외부 매스와 높은 층고의 내부 공간, 대형 주방과 거실, 수영장과 스크린골프장 등 복합적인 프로그램을 하나의 주거 안에 담아냈습니다.",
          "단순히 규모가 큰 주택이 아니라, 가족의 생활 방식과 여가, 접객, 휴식을 함께 고려한 주거 건축으로 계획되었습니다.",
        ]
      : isPrivateHouse
        ? [
            "붉은 벽돌 외관과 웨인스코팅 중심의 클래식한 실내 디테일이 조화를 이루는 단독주택 신축 프로젝트입니다.",
            "실내는 웨인스코팅 벽면과 계단실, 밝은 바닥 마감, 클래식한 조명 계획을 중심으로 구성했고, 주방은 한샘 키친바흐를 적용해 가족의 일상과 접객이 자연스럽게 이어지는 공간으로 완성했습니다.",
            "아트월과 외벽에는 석재패널을 사용해 주택의 중심 공간과 입면에 묵직한 재료감을 더했습니다.",
          ]
        : [project.overview];

  const livingOverview = gallery[1];
  const livingDetail = gallery[2];

  const kitchenOverview = gallery[3];
  const kitchenWorktop = gallery[4];
  const kitchenStorage = gallery[5];
  const kitchenDetail = gallery[7];
  const kitchenDetailSecond = gallery[8];

  const utility = gallery[6];

  const dressingOverview = gallery[9];
  const dressingDetail = gallery[10];

  const bathroom = gallery[11];

  const entranceOverview = gallery[12];
  const entranceDetail = gallery[13];

  const luxuryExterior = gallery[0];
  const luxuryHall = gallery[1];
  const luxuryLiving = gallery[2];
  const luxuryKitchen = gallery[3];

  const privateExterior = gallery[0];
  const privateStair = gallery[1];
  const privateHall = gallery[2];
  const privateLiving = gallery[3];
  const privateWindow = gallery[4];
  const privateArtWall = gallery[5];
  const privateKitchen = gallery[6];

  const currentProjectIndex = projectList.findIndex(
    (item) => item.slug === slug
  );

  const hasProjectNavigation =
    currentProjectIndex >= 0 && projectList.length > 1;

  const previousProject = hasProjectNavigation
    ? projectList[
        currentProjectIndex === 0
          ? projectList.length - 1
          : currentProjectIndex - 1
      ]
    : null;

  const nextProject = hasProjectNavigation
    ? projectList[
        currentProjectIndex === projectList.length - 1
          ? 0
          : currentProjectIndex + 1
      ]
    : null;

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen">
      <header className="pt-10">
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center">
          <Link href="/projects" className="tracking-[0.25em] text-sm">
            ← PROJECTS
          </Link>

          <Link href="/" className="tracking-[0.25em] text-lg">
            AND
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 md:px-16 pt-24 pb-20 md:pb-24">
        <p className="uppercase tracking-[0.4em] text-xs text-neutral-500 mb-6">
          {project.category}
        </p>

        <h1 className="text-4xl md:text-8xl font-light leading-[1.08] md:leading-none mb-10 break-keep">
          {project.title}
        </h1>

        <div className="flex gap-10 text-neutral-500">
          <span>{project.area}</span>
          <span>{project.year}</span>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-28 md:mb-32">
        <div className="relative aspect-[16/9] bg-[#d8d2cb] overflow-hidden">
          <Image
            src={project.heroImage}
            alt={project.title}
            fill
            priority
            quality={86}
            sizes="(max-width: 768px) 100vw, 1120px"
            className="object-cover"
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <div className="space-y-6">
          {overviewParagraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {isApartmentA && (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-44">
          <div className="border-t border-neutral-300 pt-10 md:pt-12">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Lighting Plan
            </p>

            <div className="grid md:grid-cols-12 gap-8 md:gap-12">
              <div className="md:col-span-5">
                <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                  눈이 편안한
                  <br />
                  조도 계획
                </h2>
              </div>

              <div className="md:col-span-6 md:col-start-7">
                <div className="space-y-5 md:space-y-6">
                  <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                    모든 공간에는 확산형 조명을 배제하고, COB 다운라이트와
                    10구 사각 매입등을 중심으로 조도를 계획했습니다. 각 구획마다
                    간접조명을 함께 배치해 필요한 밝기는 확보하면서도, 광원의
                    직접 노출은 최소화했습니다.
                  </p>

                  <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                    빛이 공간 전체를 균일하게 덮기보다, 벽면과 천장, 가구의
                    선을 따라 부드러운 음영이 생기도록 조정해 오래 머물러도 눈이
                    편안한 분위기를 만들었습니다.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-10">
                  <div className="border-t border-neutral-300 pt-3">
                    <p className="uppercase tracking-[0.25em] text-[8px] md:text-[10px] text-neutral-500 mb-2">
                      Source
                    </p>
                    <p className="text-[11px] md:text-sm leading-5 text-neutral-600 break-keep">
                      COB 다운라이트
                      <br />
                      사각 매입등
                    </p>
                  </div>

                  <div className="border-t border-neutral-300 pt-3">
                    <p className="uppercase tracking-[0.25em] text-[8px] md:text-[10px] text-neutral-500 mb-2">
                      Indirect
                    </p>
                    <p className="text-[11px] md:text-sm leading-5 text-neutral-600 break-keep">
                      구획별
                      <br />
                      간접조명
                    </p>
                  </div>

                  <div className="border-t border-neutral-300 pt-3">
                    <p className="uppercase tracking-[0.25em] text-[8px] md:text-[10px] text-neutral-500 mb-2">
                      Comfort
                    </p>
                    <p className="text-[11px] md:text-sm leading-5 text-neutral-600 break-keep">
                      광원 노출
                      <br />
                      최소화
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isLuxuryHouse && gallery.length > 0 ? (
        <>
          {luxuryExterior && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Exterior"
                title="묵직한 재료감과 투명한 개방감"
                description="외부는 조적타일, 현무암, 유리난간이 조합된 입면으로 구성되었습니다. 묵직한 재료감과 수평으로 긴 매스, 외부 테라스와 난간의 투명감이 함께 어우러지며 주택의 규모감과 개방감을 동시에 만듭니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={luxuryExterior}
                    alt={`${project.title} 외부 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {luxuryLiving && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Living Room"
                title="높은 층고와 초대형 샹들리에"
                description="거실은 높은 층고와 대형 창, 초대형 샹들리에가 중심이 되는 공간입니다. 대형 박판타일로 구성된 메인 월은 공간의 수직적 규모감을 강조하고, 넓은 바닥 면적과 높은 천장이 함께 어우러져 고급주택의 중심 공간다운 인상을 만듭니다."
              />

              <div className="max-w-6xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                  <Image
                    src={luxuryLiving}
                    alt={`${project.title} 거실 이미지`}
                    fill
                    quality={82}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {luxuryKitchen && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Kitchen"
                title="훈증무늬목으로 완성한 주방"
                description="주방은 훈증무늬목을 중심으로 한 깊은 우드톤 마감과 대형 아일랜드가 중심이 되는 공간입니다. 서브제로 냉장고 세트, 팔맥 후드, 넓은 수납 구성과 함께 대형 아일랜드 상판은 칸스톤으로 마감하여 조리와 접객이 동시에 가능한 주방으로 완성했습니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={luxuryKitchen}
                    alt={`${project.title} 주방 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {luxuryHall && (
            <section className="mb-28 md:mb-40">
              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="border-t border-neutral-300 pt-8 md:pt-10">
                  <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
                    Hall / Corridor
                  </p>

                  <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-5">
                      <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep mb-6 md:mb-8">
                        공간을 연결하는
                        <br />
                        내부 시퀀스
                      </h2>

                      <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                        복도와 연결 공간은 단순한 이동 통로가 아니라, 거실과 각
                        실을 연결하는 시퀀스로 구성되었습니다. 밝은 바닥 마감과
                        목재 디테일, 길게 이어지는 시야축을 통해 내부 공간의
                        깊이와 방향성이 드러나도록 했습니다.
                      </p>
                    </div>

                    <div className="md:col-span-6 md:col-start-7">
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={luxuryHall}
                          alt={`${project.title} 홀 이미지`}
                          fill
                          quality={82}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
            <div className="border-t border-neutral-300 pt-10 md:pt-12">
              <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
                Project Point
              </p>

              <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-5">
                  <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                    고급주택 신축에서
                    <br />
                    요구되는 종합성
                  </h2>
                </div>

                <div className="md:col-span-6 md:col-start-7">
                  <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                    이 프로젝트는 단독주택 신축에서 요구되는 구조, 마감, 설비,
                    외부 공간, 특수 프로그램을 종합적으로 다룬 사례입니다.
                    조적타일, 현무암, 유리난간으로 구성된 외부와 높은 층고의
                    거실, 훈증무늬목 주방, 대형 아일랜드, 특수 설비가 함께
                    구성된 복합적인 고급주택으로, 시공 경험과 공간 이해가 함께
                    요구되는 프로젝트였습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : isPrivateHouse && gallery.length > 0 ? (
        <>
          {privateExterior && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Exterior"
                title="붉은 벽돌과 석재패널의 입면"
                description="외부는 붉은 벽돌과 석재패널, 정원과 외부 조명이 함께 어우러진 단독주택으로 구성되었습니다. 도로에서 바라보는 첫인상은 안정감 있고 따뜻하게 느껴지도록 계획했으며, 정원과 진입 동선이 함께 이어지며 단독주택다운 여유를 만듭니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={privateExterior}
                    alt={`${project.title} 외부 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {privateStair && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Stair Hall"
                title="웨인스코팅이 만드는 첫 장면"
                description="계단실은 이 주택의 클래식한 분위기를 가장 선명하게 보여주는 공간입니다. 웨인스코팅 벽면과 우드 계단, 클래식한 조명, 난간 디테일이 함께 구성되며 층간 이동 공간을 단순한 통로가 아닌 하나의 장면으로 완성했습니다."
              />

              <div className="max-w-6xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                  <Image
                    src={privateStair}
                    alt={`${project.title} 계단실 이미지`}
                    fill
                    quality={82}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {privateHall && (
            <section className="mb-28 md:mb-40">
              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="border-t border-neutral-300 pt-8 md:pt-10">
                  <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
                    Hall
                  </p>

                  <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-5">
                      <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep mb-6 md:mb-8">
                        공간을 이어주는
                        <br />
                        클래식한 내부 동선
                      </h2>

                      <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                        홀과 연결 공간은 각 실을 자연스럽게 이어주는 내부 동선의
                        중심입니다. 밝은 바닥 마감과 웨인스코팅 벽면 디테일을
                        통해 공간의 깊이감을 만들고, 주택 내부의 분위기가
                        끊기지 않고 이어지도록 계획했습니다.
                      </p>
                    </div>

                    <div className="md:col-span-6 md:col-start-7">
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={privateHall}
                          alt={`${project.title} 홀 이미지`}
                          fill
                          quality={82}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {privateLiving && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Living Room"
                title="정원과 연결되는 거실"
                description="거실은 정원과 내부 공간이 시각적으로 연결되는 중심 공간입니다. 넓은 창을 통해 자연광이 깊게 들어오고, 밝은 마감과 정돈된 벽면 구성이 어우러져 가족이 함께 머무는 공간의 안정감을 만듭니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={privateLiving}
                    alt={`${project.title} 거실 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {privateWindow && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Window / Garden View"
                title="정원을 실내로 들이는 창"
                description="큰 창은 실내와 외부 정원을 연결하는 중요한 장치로 계획되었습니다. 창을 통해 들어오는 빛과 정원의 풍경이 실내 분위기를 부드럽게 만들며, 단독주택이 가진 여유로운 생활감을 공간 안으로 끌어들입니다."
              />

              <div className="max-w-6xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                  <Image
                    src={privateWindow}
                    alt={`${project.title} 창과 정원 이미지`}
                    fill
                    quality={82}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {privateArtWall && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Art Wall"
                title="석재패널로 정리한 중심 벽면"
                description="아트월은 공간의 시선을 정리하는 중심 요소로 구성되었습니다. 석재패널의 묵직한 재료감과 벽면의 비례, 조명의 분위기를 중심으로 계획해 클래식한 주택의 분위기를 차분하게 이어줍니다."
              />

              <div className="max-w-6xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                  <Image
                    src={privateArtWall}
                    alt={`${project.title} 아트월 이미지`}
                    fill
                    quality={82}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {privateKitchen && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Kitchen"
                title="한샘 키친바흐로 완성한 주방"
                description="주방은 가족의 일상적인 식사와 조리, 수납이 편안하게 이루어질 수 있도록 구성되었습니다. 한샘 키친바흐를 적용해 클래식한 주택의 분위기와 어울리는 주방으로 완성했고, 넓은 작업 동선과 수납 계획을 통해 일상과 접객이 자연스럽게 이어지도록 했습니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={privateKitchen}
                    alt={`${project.title} 주방 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 1120px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
            <div className="border-t border-neutral-300 pt-10 md:pt-12">
              <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
                Project Point
              </p>

              <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-5">
                  <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep">
                    클래식한 분위기와
                    <br />
                    가족 중심의 주거 동선
                  </h2>
                </div>

                <div className="md:col-span-6 md:col-start-7">
                  <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                    이 프로젝트는 외관, 정원, 계단실, 거실, 주방이 하나의 주거
                    분위기로 이어지는 단독주택 사례입니다. 웨인스코팅을 중심으로
                    한 실내 디테일과 석재패널 아트월, 한샘 키친바흐 주방이 함께
                    구성되며, 단독주택 신축에서 필요한 공간 구성과 마감 완성도를
                    보여줍니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : isApartmentA && gallery.length > 0 ? (
        <>
          {(livingOverview || livingDetail) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Living Area"
                title="가족의 시간이 모이는 거실"
                description="거실은 집의 전체 분위기를 결정하는 중심 공간입니다. 과한 장식을 덜어내고 벽면과 마감의 선을 정리해, 가족이 오래 머물러도 차분한 분위기가 유지되도록 계획했습니다."
              />

              {livingOverview && (
                <div className="max-w-7xl mx-auto px-8 md:px-16 mb-10 md:mb-14">
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={livingOverview}
                      alt={`${project.title} 거실 전체 이미지`}
                      fill
                      quality={84}
                      sizes="(max-width: 768px) 100vw, 1120px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {livingDetail && (
                <div className="max-w-5xl mx-auto px-8 md:px-16">
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={livingDetail}
                      alt={`${project.title} 거실 디테일 이미지`}
                      fill
                      quality={82}
                      sizes="(max-width: 768px) 100vw, 760px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {(kitchenOverview ||
            kitchenWorktop ||
            kitchenDetail ||
            kitchenDetailSecond) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Kitchen & Dining"
                title="더 넓고 단정해진 주방"
                description="기존 주방은 수납과 조리 공간이 충분하지 않아 사용성이 제한적이었습니다. 주방의 기능을 다시 배치하고 벽면 수납과 조리 동선을 정리해, 일상적인 식사 준비와 정리가 더 편안한 공간으로 만들었습니다."
              />

              {kitchenOverview && (
                <div className="max-w-7xl mx-auto px-8 md:px-16 mb-8 md:mb-10">
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={kitchenOverview}
                      alt={`${project.title} 주방 전체 이미지`}
                      fill
                      quality={84}
                      sizes="(max-width: 768px) 100vw, 1120px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {kitchenWorktop && (
                <div className="max-w-6xl mx-auto px-8 md:px-16 mb-8 md:mb-10">
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={kitchenWorktop}
                      alt={`${project.title} 주방 조리 동선 이미지`}
                      fill
                      quality={84}
                      sizes="(max-width: 768px) 100vw, 980px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {(kitchenDetail || kitchenDetailSecond) && (
                <div className="max-w-7xl mx-auto px-8 md:px-16">
                  <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                    {kitchenDetail && (
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={kitchenDetail}
                          alt={`${project.title} 주방 디테일 이미지 1`}
                          fill
                          quality={82}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {kitchenDetailSecond && (
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden md:translate-y-16">
                        <Image
                          src={kitchenDetailSecond}
                          alt={`${project.title} 주방 디테일 이미지 2`}
                          fill
                          quality={82}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {kitchenStorage && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Kitchen Storage"
                title="주방을 정돈하는 수납 계획"
                description="주방에 필요한 물건들이 밖으로 드러나지 않도록 수납 계획을 세밀하게 정리했습니다. 자주 사용하는 물건은 쉽게 닿는 곳에, 부피가 큰 물건은 별도의 수납 영역으로 분리해 주방이 항상 단정하게 유지되도록 구성했습니다."
              />

              <div className="max-w-6xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                  <Image
                    src={kitchenStorage}
                    alt={`${project.title} 주방 수납 이미지`}
                    fill
                    quality={84}
                    sizes="(max-width: 768px) 100vw, 980px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {utility && (
            <section className="mb-28 md:mb-40">
              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="border-t border-neutral-300 pt-8 md:pt-10">
                  <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
                    Utility Strategy
                  </p>

                  <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-5">
                      <h2 className="text-3xl md:text-5xl font-light leading-[1.12] break-keep mb-6 md:mb-8">
                        주방을 넓히는
                        <br />
                        과감한 선택
                      </h2>

                      <p className="text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                        냉장고를 주방 안에 두지 않고 주방 발코니 쪽으로
                        이동해, 본 주방에는 더 넓은 수납과 조리 공간을
                        확보했습니다. 기능은 뒤로 정리하고, 가족이 함께
                        사용하는 주방은 더 넓고 단정하게 사용할 수 있도록
                        계획했습니다.
                      </p>
                    </div>

                    <div className="md:col-span-6 md:col-start-7">
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={utility}
                          alt={`${project.title} 주방 발코니 유틸리티 이미지`}
                          fill
                          quality={82}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {(dressingOverview || dressingDetail) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Dressing Room"
                title="안방 수납의 한계를 넘어서"
                description="기존 안방 붙박이장만으로는 가족의 의류와 생활용품을 충분히 수납하기 어려웠습니다. 안방 일부를 새롭게 구획해 별도의 드레스룸을 만들고, 수납량과 사용 동선을 함께 개선했습니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="grid md:grid-cols-[1.08fr_0.92fr] gap-8 md:gap-10 items-end">
                  {dressingOverview && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={dressingOverview}
                        alt={`${project.title} 드레스룸 전체 이미지`}
                        fill
                        quality={82}
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {dressingDetail && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden md:mb-16">
                      <Image
                        src={dressingDetail}
                        alt={`${project.title} 드레스룸 디테일 이미지`}
                        fill
                        quality={82}
                        sizes="(max-width: 768px) 100vw, 520px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {bathroom && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Bathroom"
                title="매일 사용하는 공간의 정리"
                description="욕실은 매일 반복해서 사용하는 공간인 만큼, 과한 장식보다 정돈된 마감과 편안한 사용성에 집중했습니다. 색과 소재를 차분하게 맞추고 불필요한 요소를 줄여, 작지만 안정감 있는 공간으로 구성했습니다."
              />

              <div className="max-w-5xl mx-auto px-8 md:px-16">
                <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                  <Image
                    src={bathroom}
                    alt={`${project.title} 욕실 이미지`}
                    fill
                    quality={82}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              </div>
            </section>
          )}

          {(entranceOverview || entranceDetail) && (
            <section className="mb-32 md:mb-48">
              <SectionHeading
                eyebrow="Entrance"
                title="수납을 숨긴 첫 장면"
                description="현관 좌측에는 새롭게 벽을 세워 넓은 팬트리 수납을 확보했습니다. 거실 쪽에서는 TV가 반매립되는 정돈된 벽면으로 보이고, 신발장 쪽에서는 부족했던 수납을 보완하는 팬트리로 기능하도록 계획했습니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                  {entranceOverview && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={entranceOverview}
                        alt={`${project.title} 현관 전체 이미지`}
                        fill
                        quality={82}
                        sizes="(max-width: 768px) 100vw, 560px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {entranceDetail && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden md:translate-y-12">
                      <Image
                        src={entranceDetail}
                        alt={`${project.title} 현관 디테일 이미지`}
                        fill
                        quality={82}
                        sizes="(max-width: 768px) 100vw, 560px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      ) : gallery.length > 0 ? (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
          <div className="border-t border-neutral-300 pt-12 md:pt-16 mb-10 md:mb-14">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Gallery
            </p>

            <h2 className="text-3xl md:text-5xl font-light leading-[1.15] break-keep">
              프로젝트 이미지
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {gallery.map((image, index) => (
              <div
                key={image}
                className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden"
              >
                <Image
                  src={image}
                  alt={`${project.title} 이미지 ${index + 1}`}
                  fill
                  quality={82}
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">
          <div className="aspect-[16/10] bg-[#d8d2cb] flex flex-col items-center justify-center text-neutral-500">
            <p className="uppercase tracking-[0.3em] text-[10px] md:text-xs mb-3">
              Gallery
            </p>
            <p className="text-sm md:text-base">Project images are preparing.</p>
          </div>
        </section>
      )}

      {beforeImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
          <div className="border-t border-neutral-300 pt-12 md:pt-16 mb-10 md:mb-14">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Before
            </p>

            <div className="grid md:grid-cols-12 gap-5 md:gap-12 items-end">
              <h2 className="md:col-span-5 text-3xl md:text-5xl font-light leading-[1.15] break-keep">
                이전 공간의 조건
              </h2>

              {isApartmentA && (
                <p className="md:col-span-5 md:col-start-8 text-[13px] md:text-base leading-7 md:leading-8 text-neutral-600 break-keep">
                  시공 전 공간은 2베이 구조 특유의 한계로 수납이 턱없이
                  부족했고, 가족의 생활 물건들이 각 공간에 흩어질 수밖에 없는
                  상태였습니다. 기존 구조의 제약을 확인한 뒤, 주방과 현관,
                  안방의 수납 방식을 다시 계획해 생활의 밀도를 정리했습니다.
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {beforeImages.map((image, index) => (
              <div
                key={image}
                className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden"
              >
                <Image
                  src={image}
                  alt={`${project.title} 이전 공간 ${index + 1}`}
                  fill
                  quality={78}
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-8 md:px-16 border-t border-neutral-300 pt-20 pb-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs">
              Project Information
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between gap-8">
              <span>Type</span>
              <span className="text-right">{project.category}</span>
            </div>

            <div className="flex justify-between gap-8">
              <span>Area</span>
              <span className="text-right">{project.area}</span>
            </div>

            <div className="flex justify-between gap-8">
              <span>Year</span>
              <span className="text-right">{project.year}</span>
            </div>

            <div className="flex justify-between gap-8">
              <span>Status</span>
              <span className="text-right">Completed</span>
            </div>
          </div>
        </div>
      </section>

      {previousProject && nextProject && (
        <section className="max-w-7xl mx-auto px-8 md:px-16 pb-40 md:pb-48">
          <div className="border-t border-neutral-300 pt-12 md:pt-16 mb-8 md:mb-10">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Explore More
            </p>

            <h2 className="text-3xl md:text-5xl font-light leading-[1.15] break-keep">
              다른 프로젝트 보기
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            <Link
              href={`/projects/${previousProject.slug}`}
              className="group block"
            >
              <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden mb-4 md:mb-5">
                <Image
                  src={previousProject.heroImage}
                  alt={previousProject.title}
                  fill
                  quality={78}
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/25 transition duration-500 group-hover:bg-black/15" />

                <div className="absolute left-5 md:left-6 top-5 md:top-6 text-white/75 text-[9px] md:text-[10px] tracking-[0.3em] uppercase">
                  Previous Project
                </div>

                <div className="absolute left-5 md:left-6 bottom-5 md:bottom-6 text-white">
                  <span className="text-xl md:text-3xl font-light">←</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">
                    {previousProject.type}
                  </p>

                  <h3 className="text-xl md:text-3xl font-light leading-[1.2] break-keep">
                    {previousProject.title}
                  </h3>
                </div>

                <p className="text-sm text-neutral-500 pt-1 whitespace-nowrap">
                  {previousProject.year}
                </p>
              </div>
            </Link>

            <Link href={`/projects/${nextProject.slug}`} className="group block">
              <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden mb-4 md:mb-5">
                <Image
                  src={nextProject.heroImage}
                  alt={nextProject.title}
                  fill
                  quality={78}
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/25 transition duration-500 group-hover:bg-black/15" />

                <div className="absolute left-5 md:left-6 top-5 md:top-6 text-white/75 text-[9px] md:text-[10px] tracking-[0.3em] uppercase">
                  Next Project
                </div>

                <div className="absolute right-5 md:right-6 bottom-5 md:bottom-6 text-white">
                  <span className="text-xl md:text-3xl font-light">→</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">
                    {nextProject.type}
                  </p>

                  <h3 className="text-xl md:text-3xl font-light leading-[1.2] break-keep">
                    {nextProject.title}
                  </h3>
                </div>

                <p className="text-sm text-neutral-500 pt-1 whitespace-nowrap">
                  {nextProject.year}
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      <BackToTop />
    </main>
  );
}