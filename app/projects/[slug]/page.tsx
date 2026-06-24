import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackToTop from "../../components/BackToTop";
import { projectList, projects } from "../../data/projects";

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
            className="object-cover"
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
        <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          {project.overview}
        </p>
      </section>

      {gallery.length > 0 ? (
        <>
          {gallery[1] && (
            <section className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                <Image
                  src={gallery[1]}
                  alt={`${project.title} 거실 이미지`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {gallery[2] && (
            <section className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                <Image
                  src={gallery[2]}
                  alt={`${project.title} 거실 디테일`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {(gallery[3] || gallery[4]) && (
            <section className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {gallery[3] && (
                  <div className="relative aspect-[16/11] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={gallery[3]}
                      alt={`${project.title} 주방 이미지 1`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {gallery[4] && (
                  <div className="relative aspect-[16/11] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={gallery[4]}
                      alt={`${project.title} 주방 이미지 2`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {gallery[5] && (
            <section className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                <Image
                  src={gallery[5]}
                  alt={`${project.title} 팬트리 이미지`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {gallery[6] && (
            <section className="max-w-4xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                <Image
                  src={gallery[6]}
                  alt={`${project.title} 주방 발코니 이미지`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {gallery[7] && (
            <section className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                <Image
                  src={gallery[7]}
                  alt={`${project.title} 주방 디테일 이미지`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {(gallery[8] || gallery[9]) && (
            <section className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {gallery[8] && (
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={gallery[8]}
                      alt={`${project.title} 주방 디테일 이미지 2`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {gallery[9] && (
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={gallery[9]}
                      alt={`${project.title} 드레스룸 이미지 1`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {gallery[10] && (
            <section className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                <Image
                  src={gallery[10]}
                  alt={`${project.title} 드레스룸 이미지 2`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {gallery[11] && (
            <section className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32">
              <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                <Image
                  src={gallery[11]}
                  alt={`${project.title} 욕실 이미지`}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          )}

          {(gallery[12] || gallery[13]) && (
            <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {gallery[12] && (
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={gallery[12]}
                      alt={`${project.title} 현관 이미지 1`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {gallery[13] && (
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={gallery[13]}
                      alt={`${project.title} 현관 이미지 2`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">
          <div className="aspect-[16/10] bg-[#d8d2cb] flex items-center justify-center text-neutral-500">
            PROJECT IMAGES
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