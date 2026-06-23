import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "../../data/projects";

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
          {gallery.slice(1).map((image, index) => {
            const number = index + 2;

            if (number === 2) {
              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 3) {
              return (
                <section
                  key={image}
                  className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 4) {
              const nextImage = gallery[index + 2];

              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={image}
                        alt={`${project.title} 이미지 ${number}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {nextImage && (
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={nextImage}
                          alt={`${project.title} 이미지 ${number + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (number === 5) {
              return null;
            }

            if (number === 6) {
              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 7) {
              return (
                <section
                  key={image}
                  className="max-w-4xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 8) {
              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 9) {
              const nextImage = gallery[index + 2];

              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={image}
                        alt={`${project.title} 이미지 ${number}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {nextImage && (
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={nextImage}
                          alt={`${project.title} 이미지 ${number + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (number === 10) {
              return null;
            }

            if (number === 11) {
              return (
                <section
                  key={image}
                  className="max-w-5xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 12) {
              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-24 md:mb-32"
                >
                  <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} 이미지 ${number}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </section>
              );
            }

            if (number === 13) {
              const nextImage = gallery[index + 2];

              return (
                <section
                  key={image}
                  className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                    <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                      <Image
                        src={image}
                        alt={`${project.title} 이미지 ${number}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {nextImage && (
                      <div className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden">
                        <Image
                          src={nextImage}
                          alt={`${project.title} 이미지 ${number + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (number === 14) {
              return null;
            }

            return null;
          })}
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

      <section className="max-w-5xl mx-auto px-8 md:px-16 border-t border-neutral-300 pt-20 pb-40">
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
    </main>
  );
}