import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApartmentA from "./ApartmentA";
import ApartmentB from "./ApartmentB";
import AntnestDesignOffice from "./AntnestDesignOffice";
import CheongnaCentralEileensGarden84A from "./CheongnaCentralEileensGarden84A";
import CheongnaHanwhaKkumegreen39A from "./CheongnaHanwhaKkumegreen39A";
import CheongnaHoban4 from "./CheongnaHoban4";
import CheongnaLynnStrauss from "./CheongnaLynnStrauss";
import LuxuryHouse from "./LuxuryHouse";
import PrivateHouse from "./PrivateHouse";
import ProjectLayout from "./ProjectLayout";
import { projects } from "../../data/projects";

const siteUrl = "https://www.antnestdesign.com";

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

type ProjectPageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageParams): Promise<Metadata> {
  const { slug } = await params;

  const project = projects[slug as keyof typeof projects];

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const metadataTitle = project.seo?.title ?? project.title;
  const metadataDescription =
    project.seo?.description ??
    (project.overview ||
      `${project.title} 프로젝트입니다. ANTNEST DESIGN의 ${project.category} 포트폴리오를 확인해보세요.`);

  const projectUrl = `${siteUrl}/projects/${slug}`;

  return {
    title: metadataTitle,
    description: metadataDescription,

    alternates: {
      canonical: `/projects/${slug}`,
    },

    openGraph: {
      title: metadataTitle,
      description: metadataDescription,
      url: projectUrl,
      siteName: "ANTNEST DESIGN",
      locale: "ko_KR",
      type: "article",
      images: [
        {
          url: project.heroImage,
          alt: project.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description: metadataDescription,
      images: [project.heroImage],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageParams) {
  const { slug } = await params;

  const project = projects[slug as keyof typeof projects];

  if (!project) {
    notFound();
  }

  const projectUrl = `${siteUrl}/projects/${slug}`;
  const projectDescription = project.seo?.description ?? project.overview;
  const projectImageUrl = new URL(project.heroImage, siteUrl).toString();

  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${projectUrl}#project`,
    name: project.title,
    description: projectDescription,
    url: projectUrl,
    image: projectImageUrl,
    creator: {
      "@id": `${siteUrl}/#organization`,
    },
    genre: project.category,
    about: project.type,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Area",
        value: project.area,
      },
      {
        "@type": "PropertyValue",
        name: "Type",
        value: project.type,
      },
      {
        "@type": "PropertyValue",
        name: "Year",
        value: project.year,
      },
      {
        "@type": "PropertyValue",
        name: "Status",
        value: project.status,
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: `${siteUrl}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.title,
        item: projectUrl,
      },
    ],
  };

  const hasCustomPage =
    slug === "apartment-a" ||
    slug === "apartment-b" ||
    slug === "antnest-design-office" ||
    slug === "cheongna-central-eileens-garden-84a" ||
    slug === "cheongna-hanwha-kkumegreen-39a" ||
    slug === "cheongna-hoban-4-33a" ||
    slug === "cheongna-lynn-strauss" ||
    slug === "luxury-house" ||
    slug === "private-house";

  return (
    <ProjectLayout slug={slug} project={project}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(creativeWorkJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />
      {slug === "apartment-a" && <ApartmentA project={project} />}
      {slug === "apartment-b" && <ApartmentB />}
      {slug === "antnest-design-office" && <AntnestDesignOffice />}
      {slug === "cheongna-central-eileens-garden-84a" && (
        <CheongnaCentralEileensGarden84A />
      )}
      {slug === "cheongna-hanwha-kkumegreen-39a" && (
        <CheongnaHanwhaKkumegreen39A />
      )}
      {slug === "cheongna-hoban-4-33a" && <CheongnaHoban4 />}
      {slug === "cheongna-lynn-strauss" && <CheongnaLynnStrauss />}
      {slug === "luxury-house" && <LuxuryHouse project={project} />}
      {slug === "private-house" && <PrivateHouse project={project} />}

      {!hasCustomPage && (
        <section className="max-w-7xl mx-auto px-8 md:px-16 mb-32 md:mb-48">
          <div className="border-t border-neutral-300 pt-12 md:pt-16 mb-10 md:mb-14">
            <p className="uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500 mb-4">
              Gallery
            </p>

            <h2 className="text-3xl md:text-5xl font-light leading-[1.15] break-keep">
              프로젝트 이미지
            </h2>
          </div>

          {project.gallery.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              {project.gallery.map((image, index) => (
                <div
                  key={image}
                  className="relative aspect-[4/5] bg-[#d3ccc5] overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${project.title} 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[16/10] bg-[#d8d2cb] flex flex-col items-center justify-center text-neutral-500">
              <p className="uppercase tracking-[0.3em] text-[10px] md:text-xs mb-3">
                Gallery
              </p>
              <p className="text-sm md:text-base">
                Project images are preparing.
              </p>
            </div>
          )}
        </section>
      )}
    </ProjectLayout>
  );
}
