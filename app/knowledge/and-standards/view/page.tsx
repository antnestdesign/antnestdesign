import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import BackToTop from "../../../components/BackToTop";
import { projects } from "../../../data/projects";

const path = "/knowledge/and-standards/view";
const canonicalUrl = `https://www.antnestdesign.com${path}`;
const pageTitle =
  "공간은 보이는 방식으로 경험됩니다 | AND STANDARD 03 · VIEW | ANTNEST DESIGN";
const description =
  "공간은 면적과 구조만으로 경험되지 않습니다. 첫 장면, 시야의 끝, 공간의 관계와 전환을 통해 ANTNEST DESIGN이 공간을 바라보는 기준을 소개합니다.";
const socialImage =
  "https://www.antnestdesign.com/projects/apartment-b/08-corridor-view-01.webp";

const apartmentB = projects["apartment-b"];
const privateHouse = projects["private-house"];
const luxuryHouse = projects["luxury-house"];
const hoban4 = projects["cheongna-hoban-4-33a"];
const hanwha = projects["cheongna-hanwha-kkumegreen-39a"];

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description,
  alternates: { canonical: path },
  robots: { index: true, follow: true },
  openGraph: {
    title: pageTitle,
    description,
    url: canonicalUrl,
    siteName: "ANTNEST DESIGN",
    locale: "ko_KR",
    type: "article",
    images: [
      {
        url: socialImage,
        width: 1086,
        height: 1448,
        alt: "현관에서 거실까지 열린 시야를 보여주는 동탄역 모아미래도 복도",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description,
    images: [socialImage],
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
  className?: string;
  imageClassName?: string;
  imageStageClassName?: string;
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
  className = "",
  imageClassName = "",
  imageStageClassName = "",
  priority = false,
}: FigureProps) {
  const image = (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 760px"
      priority={priority}
      className={`h-auto w-full ${imageClassName}`}
    />
  );

  return (
    <figure className={className}>
      {imageStageClassName ? (
        <div className={imageStageClassName}>{image}</div>
      ) : (
        image
      )}
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
    <div className="mt-10 border-t border-[#675B56]/25 pt-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">
        PROJECT · {status}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex rounded-sm border-b border-[#675B56]/40 pb-1 text-sm leading-7 text-[#4A433D] transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base"
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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto mb-32 max-w-[1240px] px-5 md:mb-48 md:px-16 lg:px-10 xl:px-16">
      {children}
    </section>
  );
}

const evidenceCanvas = "mx-auto w-full max-w-[1040px]";
const evidencePair = `${evidenceCanvas} grid gap-12 md:grid-cols-2 md:items-start md:gap-8`;
const evidenceSingle = "mx-auto w-full max-w-[660px]";
const widePairStage = "md:flex md:h-[300px] md:items-end";
const widePairImage =
  "md:h-full md:w-full md:object-contain md:object-left md:object-bottom";
const portraitPairStage =
  "md:flex md:h-[480px] md:items-end lg:h-[680px]";
const portraitPairImage =
  "md:h-full md:w-full md:object-contain md:object-left md:object-bottom";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "공간은 보이는 방식으로 경험됩니다",
  description,
  image: {
    "@type": "ImageObject",
    url: socialImage,
    width: 1086,
    height: 1448,
  },
  inLanguage: "ko-KR",
  author: {
    "@type": "Organization",
    name: "ANTNEST DESIGN",
    url: "https://www.antnestdesign.com",
  },
  publisher: {
    "@type": "Organization",
    name: "ANTNEST DESIGN",
    url: "https://www.antnestdesign.com",
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
      name: "VIEW",
      item: canonicalUrl,
    },
  ],
};

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function ViewStandardPage() {
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
            AND STANDARD 03 · VIEW
          </p>
          <h1 className="max-w-[900px] text-4xl font-light leading-[1.18] tracking-[-0.035em] break-keep md:text-[56px] md:leading-[1.12]">
            공간은 보이는 방식으로 경험됩니다
          </h1>
          <div className="mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
            <p>
              우리는 공간을 면적과 구조로 설명하지만, 실제로 집에 들어서는 순간
              가장 먼저 경험하는 것은 평면도가 아닙니다.
            </p>
            <p>
              어떤 장면을 마주하는지, 시야가 어디에서 멈추는지, 서로 다른 공간이
              어떤 관계로 보이는지가 공간의 인상을 만듭니다.
            </p>
            <p>그래서 AND는 형태만 계획하지 않습니다.</p>
            <p className="text-xl font-light text-[#4A433D]">
              사람이 그 안에서 무엇을 보고, 공간을 어떻게 이해하게 될 것인지까지
              함께 봅니다.
            </p>
            <p>
              시야를 무조건 멀리 열거나 모든 영역을 하나로 만드는 것이 목적은
              아닙니다.
            </p>
            <p className="text-xl font-light text-[#4A433D]">
              그 공간에 필요한 시선의 질서를 찾는 것.
            </p>
            <p>이번 STANDARD는 그 판단에 관한 이야기입니다.</p>
          </div>
        </header>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="01" title="무엇이 먼저 보여야 하는지부터 정합니다" />
            <Copy>
              <p>공간의 인상은 안으로 들어서는 순간부터 시작됩니다.</p>
              <p>
                현관에서 거실이 바로 보이는 집도 있고, 하나의 영역을 지나
                생활공간을 만나게 되는 집도 있습니다.
              </p>
              <p>어느 쪽이 더 좋은 방식이라고 정해져 있는 것은 아닙니다.</p>
              <p>중요한 것은 이 집에서 처음 마주해야 할 장면이 무엇인가입니다.</p>
              <p>
                동탄역 모아미래도에서는 현관과 거실 사이를 가로막던 경계를
                덜어냈습니다.
              </p>
              <p>
                집에 들어섰을 때 가까운 구조물에서 시야가 막히기보다 거실까지
                자연스럽게 열리도록 하면서 첫인상도 달라졌습니다.
              </p>
              <p>
                청라 단독주택에서는 반대로 생활영역이 현관에서 바로 노출되지
                않도록 계단실을 사이에 두었습니다.
              </p>
              <p>
                집 전체를 입구에서 한꺼번에 펼쳐 보이기보다 먼저 하나의 공간을
                마주하도록 한 계획입니다.
              </p>
              <p>한쪽에서는 열었고, 다른 한쪽에서는 한 번 걸렀습니다.</p>
              <p>결과는 다르지만 출발점은 같습니다.</p>
              <p>
                첫 장면은 얼마나 많이 보여줄 것인가가 아니라, 무엇을 보여줄
                것인가를 선택하는 문제입니다.
              </p>
            </Copy>
          </div>

          <div className={`${evidencePair} mt-14`}>
            <div>
              <Figure
                src="/projects/apartment-b/08-corridor-view-01.webp"
                width={1086}
                height={1448}
                project={apartmentB.title}
                status={apartmentB.status}
                caption="현관에서 거실까지 열린 시야."
                alt="현관에서 거실까지 시야가 이어지는 동탄역 모아미래도 복도"
                imageStageClassName={portraitPairStage}
                imageClassName={portraitPairImage}
                priority
              />
              <ProjectLink status={apartmentB.status} href="/projects/apartment-b">
                동탄역 모아미래도에서 현관과 거실의 관계 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/private-house/02-stair.webp"
                width={1098}
                height={1433}
                project={privateHouse.title}
                status={privateHouse.status}
                caption="생활영역보다 먼저 마주하는 계단실."
                alt="현관과 생활영역 사이에서 먼저 마주하는 청라 단독주택 계단실"
                imageStageClassName={portraitPairStage}
                imageClassName={portraitPairImage}
              />
              <ProjectLink status={privateHouse.status} href="/projects/private-house">
                청라 단독주택에서 첫 장면을 구성한 방식 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="02" title="시야의 끝을 어디에 둘지 봅니다" />
            <Copy>
              <p>공간 안에 섰을 때 우리는 모든 곳을 동시에 보지 않습니다.</p>
              <p>
                벽과 문, 복도와 홀의 관계에 따라 시야는 어느 지점에서 멈추기도
                하고 그 너머로 계속 이어지기도 합니다.
              </p>
              <p>
                그래서 공간의 크기만큼 중요한 것이 바라보았을 때 어디까지 볼 수
                있는가입니다.
              </p>
              <p>
                효행구 고급주택의 메인 홀은 가까운 벽 하나에서 시야가 끝나지
                않습니다.
              </p>
              <p>
                홀과 그 너머의 공간이 연속해서 놓이면서 한 위치에서 건물 안쪽까지
                여러 영역을 함께 인식할 수 있습니다.
              </p>
              <p>여기서 중요한 것은 단순히 복도가 길다는 사실이 아닙니다.</p>
              <p>
                공간을 바라보았을 때 시야의 끝이 어디에 놓이는지에 따라 같은
                이동공간도 전혀 다르게 받아들여질 수 있다는 점입니다.
              </p>
              <p>
                가까운 면에서 바로 끝나는 공간도 필요하고, 그 너머까지 시야를
                이어주는 공간도 필요합니다.
              </p>
              <p>우리는 평면의 거리만 보는 것이 아니라,</p>
              <p>
                사람이 그 자리에 섰을 때 시야가 어디에서 멈추게 될 것인지까지
                함께 봅니다.
              </p>
            </Copy>
          </div>

          <div className={`${evidenceSingle} mt-14`}>
            <Figure
              src="/projects/luxury-house/03-hall.webp"
              width={1086}
              height={1448}
              project={luxuryHouse.title}
              status={luxuryHouse.status}
              caption="홀 너머까지 이어지는 시야."
              alt="홀을 지나 건물 안쪽까지 시야가 이어지는 효행구 고급주택"
            />
            <ProjectLink status={luxuryHouse.status} href="/projects/luxury-house">
              효행구 고급주택에서 홀과 공간의 연결 보기 →
            </ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="03" title="공간의 연결은 벽보다 관계에서 시작됩니다" />
            <Copy>
              <p>
                서로 붙어 있는 공간이라고 해서 반드시 하나처럼 느껴지는 것은
                아닙니다.
              </p>
              <p>
                경계가 없어도 가구와 벽면, 주요 요소가 서로 다른 방향을 바라보고
                있다면 거실과 주방, 다이닝은 여전히 각각의 영역으로 분리되어 보일
                수 있습니다.
              </p>
              <p>
                청라 호반4차에서는 거실과 주방을 따로 보기보다 전체 생활공간의
                관계를 먼저 보았습니다.
              </p>
              <p>
                TV월과 소파, 아일랜드, 주방 후면이 서로 다른 기능을 가지면서도
                같은 방향과 질서 안에 놓이도록 구성했습니다.
              </p>
              <p>
                각각의 요소가 독립적으로 앞에 나서기보다 하나의 공간 구성 안에서
                서로 관계를 맺도록 한 것입니다.
              </p>
              <p>청라 한화꿈에그린에서는 다이닝과 거실의 관계를 다시 보았습니다.</p>
              <p>
                다이닝을 주방에만 종속된 자리로 두지 않고 거실의 생활영역으로
                가져오면서, 식사를 위한 공간과 거실이 서로 마주하고 함께 사용되는
                장면을 만들었습니다.
              </p>
              <p>
                호반4차가 여러 요소의 방향과 질서를 맞춘 계획이라면,
                한화꿈에그린은 어떤 공간들이 서로 관계를 맺어야 하는가를 다시 본
                계획입니다.
              </p>
              <p>공간을 연결한다는 것은 단순히 경계를 없애는 일이 아닙니다.</p>
              <p>
                서로 다른 기능이 함께 놓였을 때 어떤 관계를 만드는가까지 설계해야
                합니다.
              </p>
            </Copy>
          </div>

          <div
            className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[43fr_57fr] md:items-start md:gap-8`}
          >
            <div>
              <Figure
                src="/projects/cheongna-hoban-4-33a/03-living-kitchen.webp"
                width={1672}
                height={941}
                project={hoban4.title}
                status={hoban4.status}
                caption="하나의 관계로 계획한 거실과 주방."
                alt="거실 TV월과 주방 아일랜드가 하나의 방향으로 이어지는 청라 호반4차 렌더링"
                imageStageClassName={widePairStage}
                imageClassName={widePairImage}
              />
              <ProjectLink
                status={hoban4.status}
                href="/projects/cheongna-hoban-4-33a"
              >
                청라 호반4차에서 거실과 주방의 관계 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src={hanwha.heroImage}
                width={1926}
                height={816}
                project={hanwha.title}
                status={hanwha.status}
                caption="거실의 생활영역으로 확장한 다이닝."
                alt="다이닝과 거실의 생활영역을 함께 구성한 청라 한화꿈에그린 렌더링"
                imageStageClassName={widePairStage}
                imageClassName={widePairImage}
              />
              <ProjectLink
                status={hanwha.status}
                href="/projects/cheongna-hanwha-kkumegreen-39a"
              >
                청라 한화꿈에그린에서 다이닝과 거실의 관계 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="04" title="시선이 향하는 면에는 이유가 있어야 합니다" />
            <Copy>
              <p>
                공간에는 여러 벽과 가구가 존재하지만 모두를 같은 비중으로
                바라보지는 않습니다.
              </p>
              <p>
                어느 위치에 들어섰을 때 자연스럽게 마주하게 되는 면이 있고, 그
                주변에서 전체 구성을 받쳐주는 요소가 있습니다.
              </p>
              <p>
                그래서 중요한 것은 무엇을 더 강조할 것인가보다 사람이 자연스럽게
                어느 방향을 바라보게 할 것인가입니다.
              </p>
              <p>
                효행구 고급주택의 거실에서는 큰 공간을 여러 개의 장식적인 요소로
                나누기보다 거실에 들어섰을 때 마주하는 큰 벽면을 하나의 기준으로
                삼았습니다.
              </p>
              <p>
                벽난로와 주변 요소도 각각 독립된 장면을 만들기보다 그 방향 안에서
                함께 구성됩니다.
              </p>
              <p>청라 호반4차에서도 거실의 TV월이 같은 역할을 합니다.</p>
              <p>
                TV라는 기능 때문에 벽이 필요한 것이 아니라, 열린 거실과 주방
                안에서 사람이 자연스럽게 바라보게 되는 면을 분명하게 두고 그
                주변의 관계를 정리했습니다.
              </p>
              <p>두 공간의 규모는 다르지만 판단은 같습니다.</p>
              <p>
                공간 안에서 자연스럽게 향하게 되는 시선에는 설계의 이유가 있어야
                합니다.
              </p>
            </Copy>
          </div>

          <div
            className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[30fr_70fr] md:items-start md:gap-8`}
          >
            <div>
              <Figure
                src="/projects/luxury-house/05-living-room.webp"
                width={1086}
                height={1448}
                project={luxuryHouse.title}
                status={luxuryHouse.status}
                caption="거실의 방향을 만드는 큰 벽면."
                alt="큰 벽면이 거실의 중심 방향을 만드는 효행구 고급주택"
                imageStageClassName={portraitPairStage}
                imageClassName={portraitPairImage}
              />
              <ProjectLink status={luxuryHouse.status} href="/projects/luxury-house">
                효행구 고급주택에서 거실의 중심면 보기 →
              </ProjectLink>
            </div>
            <div>
              <Figure
                src="/projects/cheongna-hoban-4-33a/02-living-room.webp"
                width={1672}
                height={940}
                project={hoban4.title}
                status={hoban4.status}
                caption="열린 공간에서 시선이 향하는 TV월."
                alt="열린 거실에서 시선이 TV월로 향하도록 계획한 청라 호반4차 렌더링"
                imageStageClassName={portraitPairStage}
                imageClassName={portraitPairImage}
              />
              <ProjectLink
                status={hoban4.status}
                href="/projects/cheongna-hoban-4-33a"
              >
                청라 호반4차에서 거실의 중심 방향 보기 →
              </ProjectLink>
            </div>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="05" title="공간 사이에는 전환이 필요합니다" />
            <Copy>
              <p>집 안의 모든 공간이 같은 방식으로 이어질 필요는 없습니다.</p>
              <p>
                현관에서 거실로, 공용공간에서 개인공간으로 이동할 때처럼 공간의
                성격이 달라지는 지점에서는 그 변화를 받아들이는 중간 영역이
                필요할 수 있습니다.
              </p>
              <p>
                청라 단독주택에서는 현관과 생활영역 사이에 계단실과 홀을
                두었습니다.
              </p>
              <p>
                하나의 영역을 지나면 곧바로 다른 공간이 맞닿는 것이 아니라, 중간
                공간을 거치며 집의 성격이 자연스럽게 바뀝니다.
              </p>
              <p>여기서 계단실과 홀은 단순한 이동통로에 머물지 않습니다.</p>
              <p>
                현관과 가족의 생활공간 사이에서 서로 다른 성격의 공간을 연결하는
                전환의 영역으로 작동합니다.
              </p>
              <p>전환은 무언가를 감추기 위해 만드는 장치가 아닙니다.</p>
              <p>
                서로 다른 공간이 바로 충돌하지 않고 자연스럽게 이어질 수 있도록
                관계를 조절하는 것입니다.
              </p>
              <p>집은 하나의 성격을 가진 공간이 계속 반복되는 곳이 아닙니다.</p>
              <p>
                서로 다른 공간 사이의 변화까지 자연스럽게 받아들일 수 있어야
                합니다.
              </p>
            </Copy>
          </div>

          <div className={`${evidenceSingle} mt-14`}>
            <Figure
              src="/projects/private-house/03-hall.webp"
              width={1059}
              height={1409}
              project={privateHouse.title}
              status={privateHouse.status}
              caption="경계를 지나 만나는 다음 공간."
              alt="문과 홀을 지나 다음 공간을 마주하는 청라 단독주택의 전환 영역"
            />
            <ProjectLink status={privateHouse.status} href="/projects/private-house">
              청라 단독주택에서 공간 사이의 전환 보기 →
            </ProjectLink>
          </div>
        </Section>

        <section className="mx-auto max-w-[960px] px-5 pb-32 text-center md:px-16 md:pb-48">
          <p className="text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">
            CONCLUSION
          </p>
          <h2 className="mt-6 text-3xl font-light leading-[1.25] tracking-[-0.03em] break-keep md:text-[44px]">
            결국 공간을 보는 방식까지 설계합니다
          </h2>
          <div className="mx-auto mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
            <p>공간은 벽과 면적만으로 경험되지 않습니다.</p>
            <p>
              처음 마주하는 장면, 시야가 멈추는 곳, 서로 다른 공간의 관계와
              바라보게 되는 방향이 공간을 이해하는 방식을 만듭니다.
            </p>
            <p>그래서 AND는 형태를 만드는 데서 멈추지 않습니다.</p>
            <p className="text-xl font-light text-[#4A433D]">
              그 안에서 무엇을 보고, 공간을 어떻게 이해하게 될 것인지까지
              설계합니다.
            </p>
            <p>정해진 하나의 방법이 있는 것은 아닙니다.</p>
            <p className="text-xl font-light text-[#4A433D]">
              중요한 것은 그 공간에 필요한 시선의 질서를 찾는 것입니다.
            </p>
            <p>우리가 설계하는 것은 보이는 장면 하나가 아니라,</p>
            <p className="text-xl leading-9 text-[#4A433D]">
              공간을 바라보는 방식입니다.
            </p>
          </div>
        </section>
      </article>
      <BackToTop />
    </main>
  );
}
