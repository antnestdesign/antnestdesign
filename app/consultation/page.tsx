import type { Metadata } from "next";
import ConsultationClient from "./ConsultationClient";

export const metadata: Metadata = {
  title: "프로젝트 상담 신청",
  description:
    "ANTNEST DESIGN에 주거 인테리어와 건축 프로젝트 상담을 신청하세요. 공간의 성격, 예산, 일정, 생활방식에 맞는 상담 방향을 안내드립니다.",
  alternates: {
    canonical: "/consultation",
  },
  openGraph: {
    title: "프로젝트 상담 신청 | ANTNEST DESIGN",
    description:
      "주거 인테리어와 건축 프로젝트 상담 신청. 앤트네스트디자인이 프로젝트 성격에 맞는 상담 방향을 안내드립니다.",
    url: "https://www.antnestdesign.com/consultation",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ANTNEST DESIGN Consultation",
      },
    ],
  },
};

export default function ConsultationPage() {
  return <ConsultationClient />;
}
