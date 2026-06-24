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

  const livingOverview = gallery[1];
  const livingDetail = gallery[2];

  const kitchenOverview = gallery[3];
  const kitchenIsland = gallery[4];
  const kitchenDetail = gallery[7];
  const kitchenDetailSecond = gallery[8];

  const pantry = gallery[5];
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

      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-32 md:mb-44">
        <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          {project.overview}
        </p>
      </section>

      {gallery.length > 0 ? (
        <>
          {(livingOverview || livingDetail) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Living Area"
                title="생활의 중심이 되는 공간"
                description="가족이 가장 오래 머무는 거실은 전체 공간의 분위기를 결정하는 중심축으로 정리했습니다."
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
            kitchenIsland ||
            kitchenDetail ||
            kitchenDetailSecond) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Kitchen & Dining"
                title="주방을 하나의 장면으로"
                description="주방 전체, 아일랜드, 디테일 컷을 하나의 흐름으로 묶어 공간의 중심성이 자연스럽게 드러나도록 구성했습니다."
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

              {kitchenIsland && (
                <div className="max-w-6xl mx-auto px-8 md:px-16 mb-8 md:mb-10">
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={kitchenIsland}
                      alt={`${project.title} 주방 아일랜드 이미지`}
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

          {(pantry || utility) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Storage & Utility"
                title="생활을 정리하는 보조 공간"
                description="보이지 않는 수납과 보조 동선은 일상의 편리함을 만드는 중요한 요소로 따로 정리했습니다."
              />

              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                  {pantry && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={pantry}
                        alt={`${project.title} 팬트리 이미지`}
                        fill
                        quality={82}
                        sizes="(max-width: 768px) 100vw, 560px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {utility && (
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden md:translate-y-12">
                      <Image
                        src={utility}
                        alt={`${project.title} 주방 발코니 이미지`}
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

          {(dressingOverview || dressingDetail) && (
            <section className="mb-28 md:mb-40">
              <SectionHeading
                eyebrow="Dressing Room"
                title="수납을 공간의 일부로"
                description="드레스룸은 단순한 보관 공간이 아니라 생활의 동선을 정리하는 기능적 공간으로 계획했습니다."
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
                title="차분하게 정리된 물의 공간"
                description="작은 공간일수록 마감의 정리와 비례가 중요하기 때문에 과한 요소를 덜어내고 단정한 분위기로 구성했습니다."
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
                title="집의 첫 장면"
                description="현관은 외부에서 내부로 전환되는 시작점으로, 전체 프로젝트의 인상을 정리하는 마지막 시퀀스로 배치했습니다."
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

            <h2 className="text-3xl md:text-5xl font-light leading-[1.15] break-keep">
              이전 공간의 조건
            </h2>
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