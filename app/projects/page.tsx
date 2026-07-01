import type { Metadata } from "next";
import ProjectsClient from "./ProjectsClient";

export const metadata: Metadata = {
  title: "Projects | ANTNEST DESIGN",

  description:
    "ANTNEST DESIGN의 주거 인테리어와 건축 프로젝트 포트폴리오를 확인해보세요. 아파트 리모델링, 단독주택, 상가주택 등 다양한 프로젝트를 소개합니다.",

  alternates: {
    canonical: "/projects",
  },

  openGraph: {
    title: "Projects | ANTNEST DESIGN",

    description:
      "주거 인테리어와 건축 프로젝트 포트폴리오",

    url: "https://www.antnestdesign.com/projects",

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

    description:
      "주거 인테리어와 건축 프로젝트 포트폴리오",

    images: ["/og-image.png"],
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}