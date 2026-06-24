import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://www.antnestdesign.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "ANTNEST DESIGN | Architecture of Everyday Life",

  description:
    "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계합니다. 삶의 방식에 맞는 공간, 오래 머물고 싶은 공간을 만듭니다.",

  alternates: {
    canonical: "/",
  },

  verification: {
    other: {
      "naver-site-verification":
        "c85c4250bab6b25337397d0773ec2c7880a066ce",
    },
  },

  openGraph: {
    title: "ANTNEST DESIGN | Architecture of Everyday Life",
    description:
      "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계합니다.",
    url: siteUrl,
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#organization`,
  name: "ANTNEST DESIGN",
  alternateName: "앤트네스트디자인",
  url: siteUrl,
  image: `${siteUrl}/og-image.png`,
  logo: `${siteUrl}/logo.png`,
  description:
    "건축적 사고와 시공 경험을 바탕으로 주거 인테리어와 건축 프로젝트를 설계하는 인테리어·건축 디자인 스튜디오입니다.",
  telephone: "+82-32-321-6909",
  email: "antnestdesign@naver.com",
  address: {
    "@type": "PostalAddress",
    addressCountry: "KR",
    addressRegion: "인천광역시",
    addressLocality: "서구 청라동",
    streetAddress: "중봉대로 612번길 10-20 청라프라자1 506호",
  },
  areaServed: {
    "@type": "Country",
    name: "대한민국",
  },
  serviceType: [
    "주거 인테리어",
    "아파트 인테리어",
    "건축 설계",
    "시공 관리",
    "상가주택 설계",
    "단독주택 설계",
  ],
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}