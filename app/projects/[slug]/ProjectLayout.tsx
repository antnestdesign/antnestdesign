import Image from "next/image";
import Link from "next/link";
import BackToTop from "../../components/BackToTop";
import { projectList, type Project } from "../../data/projects";

type ProjectLayoutProps = {
  slug: string;
  project: Project;
  children: React.ReactNode;
};

export function SectionHeading({
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

export function ProjectImage({
  src,
  alt,
  ratio = "aspect-[16/10]",
  className = "",
  quality = 84,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  quality?: number;
}) {
  return (
    <div
      className={`relative ${ratio} bg-[#d8d2cb] overflow-hidden ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        sizes="(max-width: 768px) 100vw, 1120px"
        className="object-cover"
      />
    </div>
  );
}

export default function ProjectLayout({
  slug,
  project,
  children,
}: ProjectLayoutProps) {
  const currentProjectIndex = projectList.findIndex(
    (item) => item.slug === slug
  );

  const previousProject =
    currentProjectIndex >= 0
      ? projectList[
          currentProjectIndex === 0
            ? projectList.length - 1
            : currentProjectIndex - 1
        ]
      : null;

  const nextProject =
    currentProjectIndex >= 0
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

          <Link href="/" className="shrink-0" aria-label="ANTNEST DESIGN Home">
            <Image
              src="/logo.png"
              alt="ANTNEST DESIGN"
              width={420}
              height={120}
              priority
              className="w-[82px] md:w-[118px] h-auto"
            />
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

      {children}

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
              <span className="text-right">{project.status}</span>
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
            {[previousProject, nextProject].map((item, index) => (
              <Link
                key={item.slug}
                href={`/projects/${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] bg-[#d8d2cb] overflow-hidden mb-4 md:mb-5">
                  <Image
                    src={item.heroImage}
                    alt={item.title}
                    fill
                    quality={78}
                    sizes="(max-width: 768px) 100vw, 560px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/25 transition duration-500 group-hover:bg-black/15" />

                  <div className="absolute left-5 md:left-6 top-5 md:top-6 text-white/75 text-[9px] md:text-[10px] tracking-[0.3em] uppercase">
                    {index === 0 ? "Previous Project" : "Next Project"}
                  </div>

                  <div
                    className={`absolute bottom-5 md:bottom-6 text-white ${
                      index === 0 ? "left-5 md:left-6" : "right-5 md:right-6"
                    }`}
                  >
                    <span className="text-xl md:text-3xl font-light">
                      {index === 0 ? "←" : "→"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">
                      {item.type}
                    </p>

                    <h3 className="text-xl md:text-3xl font-light leading-[1.2] break-keep">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-sm text-neutral-500 pt-1 whitespace-nowrap">
                    {item.year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BackToTop />
    </main>
  );
}