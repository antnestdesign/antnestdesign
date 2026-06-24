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

  const overviewParagraphs = isApartmentA
    ? [
        "부부와 초등학생 자녀가 거주하는 37평형 아파트로, 2베이 구조가 가진 수납과 동선의 한계를 정리하는 데 중점을 둔 프로젝트입니다.",
        "기존 공간에서 턱없이 부족했던 수납을 보완하기 위해 주방, 현관, 안방의 기능을 다시 나누고, 가족의 일상이 더 단정하게 유지될 수 있는 구조로 계획했습니다.",
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

      {isApartmentA && gallery.length > 0 ? (
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