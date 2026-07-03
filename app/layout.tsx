import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://www.antnestdesign.com";

const siteTitle = "ANTNEST DESIGN | 앤트네스트디자인";

const siteDescription =
  "앤드(AND) · ANTNEST DESIGN은 주거 인테리어와 건축을 설계·시공하는 디자인 스튜디오입니다. 청라를 기반으로 수도권 프로젝트를 진행합니다.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteTitle,
    template: "%s | ANTNEST DESIGN",
  },

  description: siteDescription,

  keywords: [
    "앤트네스트디자인",
    "ANTNEST DESIGN",
    "AND",
    "앤드",
    "앤드인테리어",
    "앤드 인테리어",
    "앤드디자인",
    "앤드 디자인",
    "청라인테리어",
    "송도인테리어",
    "검단인테리어",
    "동탄인테리어",
    "수원인테리어",
    "광교인테리어",
    "아파트인테리어",
    "주거인테리어",
    "아파트리모델링",
    "단독주택",
    "상가주택",
    "건축설계",
    "인테리어디자인",
  ],

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  verification: {
    other: {
      "naver-site-verification":
        "c85c4250bab6b25337397d0773ec2c7880a066ce",
    },
  },

  openGraph: {
    title: siteTitle,
    description: siteDescription,
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
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#organization`,

  name: "ANTNEST DESIGN",

  alternateName: [
    "AND",
    "앤드",
    "앤드 인테리어",
    "앤드 디자인",
    "앤트네스트디자인",
    "주식회사 앤트네스트디자인",
  ],

  legalName: "주식회사 앤트네스트디자인",

  url: siteUrl,

  image: `${siteUrl}/og-image.png`,

  logo: `${siteUrl}/logo.png`,

  description: siteDescription,

  telephone: "+82-32-321-6909",

  email: "antnestdesign@naver.com",

  priceRange: "$$$",

  address: {
    "@type": "PostalAddress",
    addressCountry: "KR",
    addressRegion: "인천광역시",
    addressLocality: "서구 청라동",
    streetAddress: "중봉대로 612번길 10-20 청라프라자1 506호",
  },

  areaServed: [
    "청라",
    "송도",
    "검단",
    "동탄",
    "수원",
    "영통",
    "광교",
    "강남",
    "화성",
    "용인",
    "수도권",
  ],

  serviceType: [
    "주거 인테리어",
    "아파트 인테리어",
    "아파트 리모델링",
    "건축 설계",
    "시공 관리",
    "단독주택",
    "상가주택",
    "고급주택",
  ],

  knowsAbout: [
    "주거 인테리어",
    "아파트 리모델링",
    "고급주택 신축",
    "상가주택 신축",
    "단독주택 신축",
    "건축 설계",
    "인테리어 시공",
    "시공 관리",
  ],

  sameAs: ["https://blog.naver.com/antnestdesign"],
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
