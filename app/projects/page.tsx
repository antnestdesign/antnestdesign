import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "../../data/projects";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project =
    projects[slug as keyof typeof projects];

  if (!project) {
    notFound();
  }

  return (
    <main className="bg-[#F3F0EB] text-[#4A433D] min-h-screen">

      {/* Header */}

      <header className="pt-10">
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center">

          <Link
            href="/projects"
            className="tracking-[0.25em] text-sm"
          >
            ← PROJECTS
          </Link>

          <Link
            href="/"
            className="tracking-[0.25em] text-lg"
          >
            AND
          </Link>

        </div>
      </header>

      {/* Intro */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 pt-24 pb-24">

        <p className="uppercase tracking-[0.4em] text-xs text-neutral-500 mb-6">
          {project.category}
        </p>

        <h1 className="text-5xl md:text-8xl font-light leading-none mb-10">
          {project.title}
        </h1>

        <div className="flex gap-10 text-neutral-500">
          <span>{project.area}</span>
          <span>{project.year}</span>
        </div>

      </section>

      {/* Hero */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[16/9] bg-[#d8d2cb] flex items-center justify-center">
          HERO IMAGE
        </div>

      </section>

      {/* Overview */}

      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-48">

        <p className="text-xl leading-[2.2] text-neutral-700">
          {project.overview}
        </p>

      </section>

      {/* IMAGE 01 */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[16/10] bg-[#d8d2cb] flex items-center justify-center">
          IMAGE 01
        </div>

      </section>

      {/* IMAGE 02 */}

      <section className="max-w-5xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
          IMAGE 02
        </div>

      </section>

      {/* IMAGE 03 + 04 */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">

        <div className="grid md:grid-cols-2 gap-10">

          <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
            IMAGE 03
          </div>

          <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
            IMAGE 04
          </div>

        </div>

      </section>

      {/* IMAGE 05 */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[16/10] bg-[#d8d2cb] flex items-center justify-center">
          IMAGE 05
        </div>

      </section>

      {/* IMAGE 06 */}

      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
          IMAGE 06
        </div>

      </section>

      {/* IMAGE 07 */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32">

        <div className="aspect-[16/10] bg-[#d8d2cb] flex items-center justify-center">
          IMAGE 07
        </div>

      </section>

      {/* IMAGE 08 + 09 */}

      <section className="max-w-7xl mx-auto px-8 md:px-16 mb-48">

        <div className="grid md:grid-cols-2 gap-10">

          <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
            IMAGE 08
          </div>

          <div className="aspect-[4/5] bg-[#d3ccc5] flex items-center justify-center">
            IMAGE 09
          </div>

        </div>

      </section>

      {/* Project Information */}

      <section className="max-w-5xl mx-auto px-8 md:px-16 border-t border-neutral-300 pt-20 pb-40">

        <div className="grid md:grid-cols-2 gap-16">

          <div>

            <p className="uppercase tracking-[0.3em] text-xs">
              Project Information
            </p>

          </div>

          <div className="space-y-6">

            <div className="flex justify-between">
              <span>Type</span>
              <span>{project.category}</span>
            </div>

            <div className="flex justify-between">
              <span>Area</span>
              <span>{project.area}</span>
            </div>

            <div className="flex justify-between">
              <span>Year</span>
              <span>{project.year}</span>
            </div>

            <div className="flex justify-between">
              <span>Status</span>
              <span>Completed</span>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}