import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { featuredProjects, PROJECTS_PER_PAGE } from "../data/projects";
import ProjectsClient from "./ProjectsClient";

type ProjectsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const totalPages = Math.ceil(featuredProjects.length / PROJECTS_PER_PAGE);

function readPageParam(value: string | string[] | undefined) {
  if (value === undefined) {
    return 1;
  }

  if (Array.isArray(value) || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export async function generateMetadata({
  searchParams,
}: ProjectsPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const requestedPage = readPageParam(page);
  const currentPage =
    requestedPage && requestedPage <= totalPages ? requestedPage : 1;
  const canonical =
    currentPage === 1 ? "/projects" : `/projects?page=${currentPage}`;
  const canonicalUrl = `https://www.antnestdesign.com${canonical}`;

  return {
    title: "Projects",
    description:
      "ANTNEST DESIGN의 주거 인테리어와 건축 프로젝트 포트폴리오를 확인해보세요. 아파트 리모델링, 단독주택, 상가주택 등 다양한 프로젝트를 소개합니다.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Projects | ANTNEST DESIGN",
      description: "주거 인테리어와 건축 프로젝트 포트폴리오",
      url: canonicalUrl,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "ANTNEST DESIGN Projects",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Projects | ANTNEST DESIGN",
      description: "주거 인테리어와 건축 프로젝트 포트폴리오",
      images: ["/og-image.png"],
    },
  };
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { page } = await searchParams;
  const currentPage = readPageParam(page);

  if (currentPage === null || currentPage < 1 || (currentPage === 1 && page)) {
    permanentRedirect("/projects");
  }

  if (currentPage > totalPages) {
    notFound();
  }

  return <ProjectsClient currentPage={currentPage} />;
}
