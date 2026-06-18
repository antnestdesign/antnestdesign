import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://antnestdesign.vercel.app"),

  title: "ANTNEST DESIGN | Architecture of Everyday Life",

  description:
    "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계합니다. 삶의 방식에 맞는 공간, 오래 머물고 싶은 공간을 만듭니다.",

  openGraph: {
    title: "ANTNEST DESIGN | Architecture of Everyday Life",
    description:
      "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계합니다.",
    url: "https://antnestdesign.vercel.app",
    siteName: "ANTNEST DESIGN",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ANTNEST DESIGN",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ANTNEST DESIGN | Architecture of Everyday Life",
    description:
      "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계합니다.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}