import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import BackToTop from "../../../components/BackToTop";
import { projects } from "../../../data/projects";

const path = "/knowledge/and-standards/material-composition";
const canonicalUrl = `https://www.antnestdesign.com${path}`;
const pageTitle =
  "재료는 관계 속에서 완성됩니다 | AND STANDARD 04 | ANTNEST DESIGN";
const description =
  "좋은 공간은 좋은 재료를 많이 사용하는 것으로 완성되지 않습니다. 재료의 위계와 비율, 질감, 반복, 경계와 빛의 관계를 실제 주거 프로젝트를 통해 설명합니다.";

const halla = projects["cheongna-halla-vivaldi"];
const lakepark = projects["cheongna-the-sharp-lakepark"];
const hanwha = projects["cheongna-hanwha-kkumegreen-39a"];
const prugio = projects["cheongna-prugio"];
const apartmentB = projects["apartment-b"];

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description,
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title: pageTitle,
    description,
    url: canonicalUrl,
    type: "article",
    locale: "ko_KR",
    images: [
      {
        url: "https://www.antnestdesign.com/projects/cheongna-halla-vivaldi/05-art-wall.webp",
        width: 1672,
        height: 941,
        alt: "패브릭과 빅슬랩, 우드 루버와 석재를 하나의 관계로 구성한 청라 한라비발디 거실 아트월",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description,
    images: [
      "https://www.antnestdesign.com/projects/cheongna-halla-vivaldi/05-art-wall.webp",
    ],
  },
};

type FigureProps = {
  src: string;
  width: number;
  height: number;
  project: string;
  status: string;
  caption: string;
  alt: string;
  priority?: boolean;
};

function Figure({
  src,
  width,
  height,
  project,
  status,
  caption,
  alt,
  priority = false,
}: FigureProps) {
  return (
    <figure>
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 1040px"
        priority={priority}
        className="h-auto w-full"
      />
      <figcaption className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 md:text-xs">
          {project} · {status}
        </p>
        <p className="mt-2 text-[13px] leading-6 text-neutral-600 break-keep md:text-sm md:leading-7">
          {caption}
        </p>
      </figcaption>
    </figure>
  );
}

function ProjectLink({
  status,
  href,
  children,
}: {
  status: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 border-t border-[#675B56]/25 pt-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">
        PROJECT · {status}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex border-b border-[#675B56]/40 pb-1 text-sm leading-7 text-[#4A433D] transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base"
      >
        {children}
      </Link>
    </div>
  );
}

function Heading({ number, title }: { number: string; title: string }) {
  return (
    <div>
      <p className="mb-5 text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">
        {number}
      </p>
      <h2 className="text-3xl font-light leading-[1.2] tracking-[-0.025em] break-keep md:text-[38px]">
        {title}
      </h2>
    </div>
  );
}

function Copy({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-600 break-keep md:text-base md:leading-[1.9]">
      {children}
    </div>
  );
}

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-medium text-[#4A433D]">{children}</strong>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <section className="mx-auto mb-32 max-w-[1240px] px-5 md:mb-48 md:px-16 lg:px-10 xl:px-16">
    {children}
  </section>
);

const evidenceCanvas = "mx-auto w-full max-w-[1040px]";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "재료는 관계 속에서 완성됩니다",
  description,
  image:
    "https://www.antnestdesign.com/projects/cheongna-halla-vivaldi/05-art-wall.webp",
  inLanguage: "ko-KR",
  author: { "@type": "Organization", name: "ANTNEST DESIGN" },
  publisher: {
    "@type": "Organization",
    name: "ANTNEST DESIGN",
    logo: {
      "@type": "ImageObject",
      url: "https://www.antnestdesign.com/logo.png",
    },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.antnestdesign.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "AND STANDARD",
      item: "https://www.antnestdesign.com/knowledge/and-standards",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "MATERIAL / COMPOSITION",
      item: canonicalUrl,
    },
  ],
};

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function MaterialCompositionPage() {
  return (
    <main className="min-h-screen bg-[#F3F0EB] text-[#4A433D]">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <article>
        <header className="mx-auto max-w-[1240px] px-5 pb-24 pt-36 md:px-16 md:pb-36 md:pt-48 lg:px-10 xl:px-16">
          <p className="mb-7 text-[10px] uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            AND STANDARD 04 · MATERIAL / COMPOSITION
          </p>
          <h1 className="max-w-[900px] text-4xl font-light leading-[1.18] tracking-[-0.035em] break-keep md:text-[56px] md:leading-[1.12]">
            재료는 관계 속에서 완성됩니다
          </h1>
          <div className="mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
            <p>우리는 공간을 설명할 때 자주 재료의 이름부터 이야기합니다.</p>
            <p>
              어떤 목재를 사용할지, 어떤 석재를 고를지, 어떤 색의 타일과
              벽지를 조합할지 결정합니다.
            </p>
            <p>하지만 같은 재료를 사용해도 공간의 인상은 전혀 달라질 수 있습니다.</p>
            <p>
              무엇을 배경으로 남기고 무엇을 드러낼지, 같은 재료를 어느 정도의
              면적으로 사용할지, 서로 다른 질감을 어디에서 만나게 할지에 따라
              재료가 공간에서 맡는 역할이 달라지기 때문입니다.
            </p>
            <p>
              그래서 AND는 재료를 하나씩 따로 고르기보다 공간 전체의 관계 안에서
              봅니다.
            </p>
            <p>
              재료의 종류보다 먼저 그 사이의 위계와 비율, 반복과 전환을
              계획합니다.
            </p>
            <p>이번 STANDARD는 무엇을 사용할 것인가보다,</p>
            <p>
              <Strong>재료를 어떻게 관계 맺게 할 것인가에 대한 이야기입니다.</Strong>
            </p>
          </div>
        </header>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="01" title="재료는 하나씩이 아니라 팔레트로 정합니다" />
            <Copy>
              <p>
                재료를 계획할 때 가장 먼저 정해야 하는 것은 특정 목재나 석재의
                이름이 아닙니다.
              </p>
              <p>
                공간 전체가 얼마나 밝거나 어두울 것인지, 따뜻하거나 차분한 인상을
                만들 것인지, 어떤 재료가 중심이 되고 어떤 재료가 배경으로 남을
                것인지를 먼저 봅니다.
              </p>
              <p>
                같은 현관 수납도 밝은 우드와 웜화이트를 함께 사용하면 부드럽고
                가벼운 첫 장면이 될 수 있고, 그레이지와 짙은 우드를 조합하면 더
                깊고 분명한 인상을 만들 수 있습니다.
              </p>
              <p>어느 쪽이 더 좋은 조합이라고 정해져 있는 것은 아닙니다.</p>
              <p>
                중요한 것은 각각의 재료를 따로 좋아해서 선택하는 것이 아니라,
                하나의 공간 안에서 함께 놓였을 때 어떤 관계를 만드는지 보는
                것입니다.
              </p>
              <p>
                재료는 개별적인 샘플의 집합이 아니라,
                <br />
                <Strong>공간 전체를 만드는 하나의 팔레트로 계획합니다.</Strong>
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[1.55fr_1fr] md:items-start md:gap-8`}>
            <div>
              <Figure
                src="/projects/cheongna-halla-vivaldi/02-entry-cabinet.webp"
                width={1504}
                height={1046}
                project="HALLA VIVALDI · ENTRY"
                status={halla.status}
                caption="웜화이트를 배경으로 밝은 우드를 중심재로 사용한 팔레트"
                alt="웜화이트 배경과 밝은 우드 수납으로 구성한 인천 청라 한라비발디 현관 디자인 제안"
                priority
              />
              <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
                청라 한라비발디에서 재료 팔레트 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/cheongna-the-sharp-lakepark/05-entry-shoe-storage.webp"
                width={1212}
                height={1297}
                project="THE SHARP LAKEPARK · ENTRY"
                status={lakepark.status}
                caption="그레이지를 배경으로 다크우드의 대비를 강조한 팔레트"
                alt="그레이지 바닥과 다크우드 수납으로 구성한 인천 청라 더샵레이크파크 현관 디자인 제안"
              />
              <ProjectLink status={lakepark.status} href="/projects/cheongna-the-sharp-lakepark">
                청라 더샵레이크파크에서 재료 팔레트 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="02" title="재료의 수보다 중요한 것은 위계입니다" />
            <Copy>
              <p>
                절제된 공간을 만들기 위해 반드시 적은 종류의 재료만 사용해야 하는
                것은 아닙니다.
              </p>
              <p>
                반대로 사용하는 재료의 종류를 줄였다고 해서 공간이 자연스럽게
                정돈되는 것도 아닙니다.
              </p>
              <p>
                문제는 몇 가지를 사용했는가보다 각각의 재료가 얼마나 강하게
                드러나는가에 있습니다.
              </p>
              <p>모든 재료가 동시에 중심이 되려고 하면 공간은 쉽게 복잡해집니다.</p>
              <p>
                하지만 넓은 배경과 중심이 되는 재료, 그 주변에서 질감이나 깊이를
                더하는 재료의 역할이 구분되어 있다면 서로 다른 여러 재료도 하나의
                장면 안에서 읽힐 수 있습니다.
              </p>
              <p>
                청라 한라비발디의 거실 아트월에는 패브릭, 빅슬랩 패널, 우드 루버와
                석재가 함께 사용됩니다.
              </p>
              <p>
                각각을 독립된 장식으로 나누기보다 하나의 벽면 안에서 서로 다른
                역할을 나누도록 구성했습니다.
              </p>
              <p>
                밝은 바탕은 공간을 받아주고, 큰 면은 중심을 만들며, 반복되는 루버와
                석재는 깊이와 질감을 더합니다.
              </p>
              <p>좋은 재료를 많이 보여주는 것이 목적이 아닙니다.</p>
              <p>
                <Strong>
                  무엇이 먼저 보이고 무엇이 뒤에 남아야 하는지 정하는 것이 먼저입니다.
                </Strong>
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14`}>
            <Figure
              src="/projects/cheongna-halla-vivaldi/05-art-wall.webp"
              width={1672}
              height={941}
              project="HALLA VIVALDI · LIVING ROOM"
              status={halla.status}
              caption="패브릭, 빅슬랩, 우드 루버와 석재를 하나의 아트월 안에서 구성한 거실"
              alt="패브릭과 빅슬랩 패널, 우드 루버와 석재를 하나의 벽면에 구성한 인천 청라 한라비발디 거실 디자인 제안"
            />
            <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
              청라 한라비발디의 거실 아트월 보기 →
            </ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="03" title="같은 재료도 쓰는 비중에 따라 달라집니다" />
            <Copy>
              <p>
                공간의 성격을 바꾸기 위해 매번 새로운 색과 새로운 재료를 추가할
                필요는 없습니다.
              </p>
              <p>
                같은 재료도 차지하는 면적과 주변 재료와의 비율이 달라지면 전혀
                다른 분위기를 만들 수 있습니다.
              </p>
              <p>
                청라 한화꿈에그린의 공용공간에는 월넛과 블랙, 밝은 바닥과 파벽이
                함께 사용됩니다.
              </p>
              <p>
                짙은 재료가 공간의 성격을 만들지만 밝은 면이 충분히 남아 있어
                전체를 무겁게 채우지는 않습니다.
              </p>
              <p>반면 서재에서는 같은 월넛과 블랙의 비중을 높였습니다.</p>
              <p>
                새로운 재료를 더하지 않고도 짙은 재료가 차지하는 면적을 늘려 조금
                더 집중되고 내밀한 공간으로 바꿉니다.
              </p>
              <p>
                재료의 색만큼 중요한 것은 <Strong>얼마나 사용할 것인가</Strong>입니다.
              </p>
              <p>
                같은 팔레트 안에서도 비율을 달리하면 공간마다 서로 다른 성격을
                만들면서 집 전체의 일관성은 유지할 수 있습니다.
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-2 md:items-start md:gap-8`}>
            <Figure
              src="/projects/cheongna-hanwha-kkumegreen-39a/03-living-room-sofa.webp"
              width={2000}
              height={1075}
              project="HANWHA KKUMEGREEN · LIVING ROOM"
              status={hanwha.status}
              caption="밝은 면 사이에 월넛과 블랙, 파벽을 나누어 배치한 공용공간"
              alt="밝은 바닥과 짙은 월넛, 블랙 면을 함께 구성한 인천 청라 한화꿈에그린 거실 디자인 제안"
            />
            <Figure
              src="/projects/cheongna-hanwha-kkumegreen-39a/11-study-room-overview.webp"
              width={1944}
              height={954}
              project="HANWHA KKUMEGREEN · STUDY"
              status={hanwha.status}
              caption="같은 월넛과 블랙의 비중을 높여 더 집중된 분위기로 만든 서재"
              alt="월넛과 블랙의 비중을 높여 집중된 분위기로 계획한 인천 청라 한화꿈에그린 서재 디자인 제안"
            />
          </div>
          <p className="mx-auto mt-10 max-w-[1040px] text-xl font-light leading-8 text-[#675B56] break-keep md:text-2xl md:leading-10">
            같은 재료를 사용해도, 그 비율이 달라지면 공간의 성격도 달라집니다.
          </p>
          <div className={evidenceCanvas}>
            <ProjectLink status={hanwha.status} href="/projects/cheongna-hanwha-kkumegreen-39a">
              청라 한화꿈에그린에서 같은 팔레트의 다른 비율 보기 →
            </ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="04" title="단단한 재료와 부드러운 재료를 함께 봅니다" />
            <Copy>
              <p>재료는 색으로만 경험되지 않습니다.</p>
              <p>
                돌과 세라믹처럼 단단하고 매끄러운 표면, 목재의 결, 패브릭처럼
                부드러운 표면은 비슷한 색을 가지고 있어도 서로 다른 감각을 만듭니다.
              </p>
              <p>
                특히 몸이 오래 머무는 주거공간에서는 눈에 보이는 인상만큼 가까이에서
                느껴지는 재료의 성격도 중요합니다.
              </p>
              <p>
                청라 한라비발디의 침실은 패브릭 헤드보드와 쿠션 프레임으로 침대
                주변에 부드러운 중심을 만들었습니다.
              </p>
              <p>
                반면 청라 더샵레이크파크의 침실은 대형 세라믹 슬랩을 헤드월에 두어
                하나의 단단하고 분명한 면을 중심으로 삼았습니다.
              </p>
              <p>둘 다 차분한 색조의 침실이지만 재료가 만드는 감각은 다릅니다.</p>
              <p>어떤 재료가 더 고급스러운가를 판단하는 것이 아닙니다.</p>
              <p>
                휴식을 위한 침실인지, 구조적인 중심이 필요한 공간인지, 물과 오염을
                자주 마주하는 공간인지에 따라 필요한 표면의 성격은 달라질 수
                있습니다.
              </p>
              <p>그래서 우리는 색을 맞추는 것에서 멈추지 않고,</p>
              <p>
                <Strong>
                  서로 다른 촉감과 표면이 함께 있을 때 어떤 균형을 만드는지도 봅니다.
                </Strong>
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[0.85fr_1fr] md:items-start md:gap-8`}>
            <div>
              <Figure
                src="/projects/cheongna-halla-vivaldi/09-bedroom-day.webp"
                width={1538}
                height={1022}
                project="HALLA VIVALDI · BEDROOM"
                status={halla.status}
                caption="패브릭 헤드보드와 쿠션 프레임으로 부드러운 중심을 만든 침실"
                alt="패브릭 헤드보드와 쿠션 프레임으로 부드러운 중심을 만든 인천 청라 한라비발디 침실 디자인 제안"
              />
              <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
                청라 한라비발디의 침실 재료 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/cheongna-the-sharp-lakepark/13-master-bedroom-day.webp"
                width={1672}
                height={941}
                project="THE SHARP LAKEPARK · BEDROOM"
                status={lakepark.status}
                caption="대형 세라믹 슬랩으로 단단하고 분명한 중심면을 만든 침실"
                alt="대형 세라믹 슬랩을 침대 헤드월 중심에 배치한 인천 청라 더샵레이크파크 침실 디자인 제안"
              />
              <ProjectLink status={lakepark.status} href="/projects/cheongna-the-sharp-lakepark">
                청라 더샵레이크파크의 침실 재료 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="05" title="반복되는 재료가 서로 다른 공간을 연결합니다" />
            <Copy>
              <p>
                집은 여러 개의 방과 기능으로 나뉘지만 각각의 공간이 완전히 다른
                모습으로 존재할 필요는 없습니다.
              </p>
              <p>
                현관에서 보았던 재료가 복도에서 다시 나타나고, 그 흐름이 거실이나
                주방까지 이어지면 서로 떨어진 공간도 같은 집의 일부로 자연스럽게
                읽힙니다.
              </p>
              <p>
                청라 한라비발디에서는 현관과 복도에서 시작된 우드가 주방의 키큰장과
                홈바까지 이어집니다.
              </p>
              <p>
                위치와 기능은 달라지지만 같은 재료가 반복되면서 이동하는 과정 안에
                하나의 흐름을 만듭니다.
              </p>
              <p>그렇다고 모든 공간을 같은 우드로 채우지는 않습니다.</p>
              <p>
                거실에서는 패브릭과 석재가 함께 등장하고, 침실에서는 조금 더
                부드러운 재료가 중심을 만듭니다.
              </p>
              <p>연속성은 모든 공간을 똑같이 만드는 일이 아닙니다.</p>
              <p>
                <Strong>
                  같은 집이라는 관계를 유지하면서 각 공간에 필요한 차이를 남기는
                  것입니다.
                </Strong>
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[0.48fr_1.78fr] md:items-start md:gap-8`}>
            <Figure
              src="/projects/cheongna-halla-vivaldi/04-corridor.webp"
              width={870}
              height={1808}
              project="HALLA VIVALDI · CORRIDOR"
              status={halla.status}
              caption="복도에서 시작된 우드의 반복"
              alt="우드 벽면과 도어가 반복되며 주방으로 이어지는 인천 청라 한라비발디 복도 디자인 제안"
            />
            <Figure
              src="/projects/cheongna-halla-vivaldi/07-kitchen-day.webp"
              width={1672}
              height={941}
              project="HALLA VIVALDI · KITCHEN"
              status={halla.status}
              caption="복도에서 주방의 키큰장과 아일랜드까지 이어지는 재료의 흐름"
              alt="복도의 우드가 키큰장과 아일랜드로 이어지는 인천 청라 한라비발디 주방 디자인 제안"
            />
          </div>
          <div className={evidenceCanvas}>
            <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
              청라 한라비발디에서 복도와 주방의 재료 흐름 보기 →
            </ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="06" title="재료는 공간의 경계를 결정합니다" />
            <Copy>
              <p>공간을 나눈다고 해서 항상 불투명한 벽이 필요한 것은 아닙니다.</p>
              <p>
                어디까지 보여줄 것인지, 어느 정도의 빛을 통과시킬 것인지에 따라
                경계를 만드는 재료도 달라질 수 있습니다.
              </p>
              <p>
                투명한 유리는 서로 다른 영역을 나누면서 시야와 빛을 거의 그대로
                이어줍니다.
              </p>
              <p>
                반투명하거나 표면에 패턴이 있는 유리는 빛은 통과시키면서 시선은 한
                단계 걸러낼 수 있습니다.
              </p>
              <p>
                청라 더샵레이크파크의 서재에서는 유리 파티션을 사용해 복도와
                작업공간 사이의 연결감을 유지했습니다.
              </p>
              <p>
                청라 한라비발디의 욕실에서는 리브드 유리로 샤워 영역을 나누면서
                반대편의 형태와 시선을 부드럽게 걸러냅니다.
              </p>
              <p>두 공간 모두 경계가 필요했지만 필요한 개방의 정도는 달랐습니다.</p>
              <p>재료에는 색과 질감뿐 아니라,</p>
              <p>
                <Strong>
                  얼마나 보여주고 얼마나 가릴 것인가라는 성질도 있습니다.
                </Strong>
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[1.78fr_0.53fr] md:items-start md:gap-8`}>
            <div>
              <Figure
                src="/projects/cheongna-the-sharp-lakepark/09-study-alpha-room.webp"
                width={1672}
                height={941}
                project="THE SHARP LAKEPARK · STUDY"
                status={lakepark.status}
                caption="시야와 빛을 이어주면서 작업공간을 나누는 투명 유리 파티션"
                alt="복도와 작업공간 사이의 시야와 빛을 이어주는 인천 청라 더샵레이크파크 투명 유리 서재 파티션 디자인 제안"
              />
              <ProjectLink status={lakepark.status} href="/projects/cheongna-the-sharp-lakepark">
                청라 더샵레이크파크의 서재 경계 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/cheongna-halla-vivaldi/15-bathroom-side.webp"
                width={914}
                height={1720}
                project="HALLA VIVALDI · BATHROOM"
                status={halla.status}
                caption="빛은 통과시키고 시선은 부드럽게 거르는 리브드 유리"
                alt="샤워 영역의 빛은 통과시키고 시선은 거르는 인천 청라 한라비발디 리브드 유리 욕실 디자인 제안"
              />
              <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
                청라 한라비발디의 욕실 경계 보기 →
              </ProjectLink>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-[1040px] text-xl font-light leading-8 text-[#675B56] break-keep md:text-2xl md:leading-10">
            경계를 만든다는 것은 반드시 공간을 막는다는 뜻이 아닙니다.
          </p>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="07" title="재료는 면을 어디까지 이어갈지 결정합니다" />
            <Copy>
              <p>
                같은 재료를 선택하는 것만큼 중요한 것이 어디에서 시작하고 어디에서
                끝낼 것인가입니다.
              </p>
              <p>
                작은 기능마다 재료가 반복해서 바뀌면 하나의 큰 공간도 여러 조각으로
                나뉘어 보일 수 있습니다.
              </p>
              <p>
                반대로 하나의 면이나 덩어리로 읽혀야 할 곳에서는 재료의 흐름을 이어
                공간을 더 분명하게 만들 수 있습니다.
              </p>
              <p>
                청라 한라비발디 욕실에서는 젠다이에서 샤워 공간의 벽면까지 같은
                석재를 연결해 떨어진 두 기능을 하나의 큰 장면으로 묶었습니다.
              </p>
              <p>
                청라 푸르지오의 주방에서는 석재 패턴이 아일랜드 상판에서 측면까지
                이어지며 가구의 여러 면을 하나의 덩어리처럼 읽히게 합니다.
              </p>
              <p>하나는 벽의 연속성을 만들고,</p>
              <p>다른 하나는 가구의 양감을 만듭니다.</p>
              <p>방법은 다르지만 판단은 같습니다.</p>
              <p>
                <Strong>재료의 경계는 공간의 경계가 되기도 합니다.</Strong>
              </p>
              <p>그래서 필요한 곳에서는 재료를 나누고,</p>
              <p>
                하나로 읽혀야 할 곳에서는 불필요한 전환을 줄입니다.
              </p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[0.71fr_1fr] md:items-start md:gap-8`}>
            <div>
              <Figure
                src="/projects/cheongna-halla-vivaldi/14-bathroom-front.webp"
                width={1404}
                height={1120}
                project="HALLA VIVALDI · BATHROOM"
                status={halla.status}
                caption="젠다이에서 샤워 벽면까지 같은 석재를 이어 하나의 장면으로 묶은 욕실"
                alt="젠다이와 샤워 벽면에 같은 석재를 연결한 인천 청라 한라비발디 욕실 디자인 제안"
              />
              <ProjectLink status={halla.status} href="/projects/cheongna-halla-vivaldi">
                청라 한라비발디의 욕실 재료 연속성 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/cheongna-prugio/refined-v2/11-kitchen-angle.webp"
                width={1672}
                height={941}
                project="CHEONGNA PRUGIO · KITCHEN"
                status={prugio.status}
                caption="석재 패턴을 상판과 측면까지 이어 하나의 덩어리로 읽히게 한 아일랜드"
                alt="석재 패턴을 아일랜드 상판과 측면에 이어 적용한 인천 청라 푸르지오 주방 디자인 제안"
              />
              <ProjectLink status={prugio.status} href="/projects/cheongna-prugio">
                청라 푸르지오의 주방 재료 연속성 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="08" title="재료는 빛을 만났을 때 다르게 보입니다" />
            <Copy>
              <p>재료는 항상 같은 모습으로 존재하지 않습니다.</p>
              <p>
                낮에는 창을 통해 들어오는 자연광이 목재의 결이나 석재의 무늬를
                드러내고, 밤에는 인공조명의 방향과 밝기에 따라 같은 표면이 전혀
                다른 깊이를 갖습니다.
              </p>
              <p>
                무광의 표면과 반사가 있는 표면도 같은 빛을 받았을 때 다르게 보입니다.
              </p>
              <p>
                그래서 재료를 계획할 때는 샘플 자체의 색과 무늬만 보지 않습니다.
              </p>
              <p>
                그 재료가 실제 공간에서 어느 방향의 자연광을 받고, 밤에는 어떤 빛과
                만나게 될 것인지까지 함께 살펴야 합니다.
              </p>
              <p>
                청라 푸르지오 거실에서는 우드 천장과 루버 벽면이 낮에는 자연광
                속에서 재료의 결을 드러냅니다.
              </p>
              <p>
                밤이 되면 빛이 머무는 면과 그림자가 남는 면이 달라지면서 같은 공간의
                깊이도 바뀝니다.
              </p>
              <p>
                조명 계획의 질문이 ‘어떤 등기구를 사용할 것인가’라면, 재료 계획에서의
                질문은 다릅니다.
              </p>
              <p>
                <Strong>이 재료는 어떤 빛을 받을 것인가.</Strong>
              </p>
              <p>재료와 조명은 서로 다른 단계에서 결정되는 일이 아닙니다.</p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[1.06fr_1fr] md:items-start md:gap-8`}>
            <Figure
              src="/projects/cheongna-prugio/refined-v2/08-living-room-front-day.webp"
              width={1870}
              height={841}
              project="CHEONGNA PRUGIO · LIVING ROOM / DAY"
              status={prugio.status}
              caption="자연광 속에서 우드 천장과 루버 벽면의 결이 드러나는 낮"
              alt="자연광이 우드 천장과 루버 벽면의 결을 드러내는 인천 청라 푸르지오 거실 낮 디자인 제안"
            />
            <Figure
              src="/projects/cheongna-prugio/refined-v2/10-living-room-angle-night.webp"
              width={1815}
              height={867}
              project="CHEONGNA PRUGIO · LIVING ROOM / NIGHT"
              status={prugio.status}
              caption="인공조명과 그림자가 같은 재료에 다른 깊이를 만드는 밤"
              alt="인공조명과 그림자가 우드 천장과 루버 벽면에 깊이를 만드는 인천 청라 푸르지오 거실 밤 디자인 제안"
            />
          </div>
          <div className={evidenceCanvas}>
            <ProjectLink status={prugio.status} href="/projects/cheongna-prugio">
              청라 푸르지오에서 빛에 따라 달라지는 재료 보기 →
            </ProjectLink>
            <div className="mt-12 border-t border-[#675B56]/25 pt-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">
                AND STANDARD 01 · LIGHTING
              </p>
              <Link
                href="/knowledge/and-standards/lighting-natural-light"
                className="mt-3 inline-flex border-b border-[#675B56]/40 pb-1 text-sm leading-7 text-[#4A433D] transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base"
              >
                조명은 자연광을 닮아야 합니다 →
              </Link>
            </div>
          </div>
        </Section>

        <aside className="mx-auto mb-32 max-w-[1060px] px-5 md:mb-48 md:px-16">
          <div className="border-y border-[#675B56]/30 py-12 md:py-16">
            <p className="text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">
              COMPLETED PROJECT
            </p>
            <h2 className="mt-5 max-w-[760px] text-2xl font-light leading-[1.3] tracking-[-0.02em] break-keep md:text-3xl">
              좋은 재료는 이미지가 아니라 생활에서 검증됩니다
            </h2>
            <Copy>
              <p>
                재료의 관계를 계획하는 일은 보기 좋은 이미지를 만드는 데서 끝나지
                않습니다.
              </p>
              <p>
                주거공간의 재료는 매일 밟고, 만지고, 닦으며 사용하게 됩니다.
              </p>
              <p>
                현관은 외부의 오염과 가장 먼저 만나는 공간이고, 주방 상판에는 물과
                음식물이 반복해서 닿습니다.
              </p>
              <p>
                욕실은 물과 습기를 견뎌야 하고, 거실과 복도의 바닥은 가족의 일상이
                가장 많이 쌓이는 면입니다.
              </p>
              <p>
                그래서 실제 시공에서는 공간의 인상뿐 아니라 사용 빈도와 관리 방식,
                적용되는 위치까지 함께 판단해야 합니다.
              </p>
              <p>
                동탄역 모아미래도에서는 거실과 주방, 복도의 바닥을 하나의 흐름으로
                연결하고, 주방과 보조주방은 각각의 사용 조건에 맞춰 상판 재료를
                나누었습니다.
              </p>
              <p>
                욕실과 현관 역시 물과 오염을 자주 마주하는 공간이라는 조건을 함께
                고려했습니다.
              </p>
              <p>
                설계 이미지에서 아름다운 재료가 실제 생활에서도 항상 가장 좋은
                선택인 것은 아닙니다.
              </p>
              <p>
                반대로 관리하기 편하다는 이유만으로 공간의 의도와 관계없는 재료를
                선택하는 것도 답은 아닙니다.
              </p>
              <p>AND가 찾는 것은 그 사이의 균형입니다.</p>
              <p>
                공간에서 필요한 인상과 실제 생활의 조건이 함께 성립할 수 있는 선택.
              </p>
              <p>좋은 재료란 반드시 가장 비싼 재료도,</p>
              <p>가장 눈에 띄는 재료도 아닙니다.</p>
              <p>
                <Strong>그 공간의 의도와 그 안에서 살아갈 생활에 맞는 재료입니다.</Strong>
              </p>
            </Copy>
            <div className={`${evidenceCanvas} mt-12 grid gap-12 md:grid-cols-[1.78fr_1fr] md:items-start md:gap-8`}>
              <Figure
                src="/projects/apartment-b/12-kitchen-front.webp"
                width={1448}
                height={1086}
                project="DONGTAN STATION MOA MIRAE-DO · KITCHEN"
                status={apartmentB.status}
                caption="매일 사용하는 조리와 수납의 조건을 실제 생활 안에서 받아들이는 완공 주방"
                alt="실제 시공을 마친 화성 동탄역 모아미래도 주방과 아일랜드"
              />
              <Figure
                src="/projects/apartment-b/17-common-bathroom.webp"
                width={1086}
                height={1448}
                project="DONGTAN STATION MOA MIRAE-DO · BATHROOM"
                status={apartmentB.status}
                caption="물과 습기, 관리 조건을 고려해 완성한 공용욕실"
                alt="실제 시공을 마친 화성 동탄역 모아미래도 공용욕실"
              />
            </div>
            <div className={evidenceCanvas}>
              <ProjectLink status={apartmentB.status} href="/projects/apartment-b">
                동탄역 모아미래도에서 실제 마감과 생활을 위한 선택 보기 →
              </ProjectLink>
            </div>
          </div>
        </aside>

        <section className="mx-auto max-w-[1240px] px-5 pb-32 md:px-16 md:pb-48 lg:px-10 xl:px-16">
          <div className="max-w-[760px]">
            <Heading number="CONCLUSION" title="결국 재료 사이의 관계를 설계합니다" />
            <Copy>
              <p>좋은 공간은 한 가지 좋은 재료만으로 만들어지지 않습니다.</p>
              <p>밝은 면과 어두운 면,</p>
              <p>단단한 표면과 부드러운 표면,</p>
              <p>
                보여주는 재료와 배경으로 남는 재료가 서로 관계를 맺으며 공간의
                인상을 만듭니다.
              </p>
              <p>같은 재료를 반복해 공간을 연결하기도 하고,</p>
              <p>필요한 곳에서는 재료를 바꾸어 경계를 만들기도 합니다.</p>
              <p>빛과 만나 표정이 달라지고,</p>
              <p>
                시간이 지나 생활이 쌓이면서 처음의 선택은 다시 평가됩니다.
              </p>
              <p>그래서 AND는 재료의 이름만 고르지 않습니다.</p>
              <p>어디에, 얼마나, 무엇과 함께 사용할 것인지.</p>
              <p>
                그리고 실제 생활 속에서 어떤 역할을 해야 하는지까지 함께 봅니다.
              </p>
            </Copy>
            <p className="mt-14 border-l border-[#675B56]/60 pl-5 text-xl font-light leading-9 text-[#675B56] break-keep md:text-2xl md:leading-10">
              우리가 설계하는 것은 재료 하나가 아니라,
              <br />
              <Strong>재료 사이의 관계입니다.</Strong>
            </p>
          </div>
        </section>
      </article>
      <BackToTop />
    </main>
  );
}
