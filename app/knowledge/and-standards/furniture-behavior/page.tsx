import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import BackToTop from "../../../components/BackToTop";
import { projects } from "../../../data/projects";

const path = "/knowledge/and-standards/furniture-behavior";
const canonicalUrl = `https://www.antnestdesign.com${path}`;
const pageTitle = "가구는 머무는 방식을 만듭니다 | AND STANDARD 05 | ANTNEST DESIGN";
const description =
  "가구의 방향과 위치, 거리와 관계는 사람의 시선과 자세, 머무는 시간을 바꿉니다. 주거·의료·업무 공간의 실제 프로젝트를 통해 가구가 행동을 만드는 방식을 설명합니다.";
const socialImage =
  "https://www.antnestdesign.com/projects/cheongna-the-sharp-lakepark/02-living-room-front-night.webp";

const lakepark = projects["cheongna-the-sharp-lakepark"];
const clinic = projects["ent-clinic"];
const office = projects["antnest-design-office"];
const hanwha = projects["cheongna-hanwha-kkumegreen-39a"];
const prugio = projects["cheongna-prugio"];

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
    type: "article",
    locale: "ko_KR",
    images: [{
      url: socialImage,
      width: 1672,
      height: 941,
      alt: "소파와 라운지체어가 서로 마주 보는 청라 더샵레이크파크 거실 디자인 제안",
    }],
  },
  twitter: { card: "summary_large_image", title: pageTitle, description, images: [socialImage] },
};

type FigureProps = {
  src: string;
  width: number;
  height: number;
  project: string;
  status: string;
  caption: string;
  alt: string;
  sizes?: string;
  imageClassName?: string;
  imageStageClassName?: string;
  priority?: boolean;
};

function Figure({ src, width, height, project, status, caption, alt, sizes = "(max-width: 768px) 100vw, 50vw", imageClassName = "h-auto w-full", imageStageClassName = "", priority = false }: FigureProps) {
  const image = <Image src={src} width={width} height={height} alt={alt} sizes={sizes} priority={priority} className={imageClassName} />;
  return (
    <figure>
      {imageStageClassName ? <div className={imageStageClassName}>{image}</div> : image}
      <figcaption className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 md:text-xs">
          {project} · {status}
        </p>
        <p className="mt-2 text-[13px] leading-6 text-neutral-600 break-keep md:text-sm md:leading-7">{caption}</p>
      </figcaption>
    </figure>
  );
}

function ProjectLink({ project, href, children }: { project: typeof lakepark; href: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-[#675B56]/25 pt-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">PROJECT · {project.status}</p>
      <Link href={href} className="mt-3 inline-flex border-b border-[#675B56]/40 pb-1 text-sm leading-7 text-[#4A433D] transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base">
        {children}
      </Link>
    </div>
  );
}

function Heading({ number, title }: { number: string; title: string }) {
  return (
    <div>
      <p className="mb-5 text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">{number}</p>
      <h2 className="text-3xl font-light leading-[1.2] tracking-[-0.025em] break-keep md:text-[38px]">{title}</h2>
    </div>
  );
}

function Copy({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-600 break-keep md:text-base md:leading-[1.9]">{children}</div>;
}

const Strong = ({ children }: { children: React.ReactNode }) => <strong className="font-medium text-[#4A433D]">{children}</strong>;
const Section = ({ children, spacing = "mb-32 md:mb-48" }: { children: React.ReactNode; spacing?: string }) => <section className={`mx-auto max-w-[1240px] px-5 md:px-16 lg:px-10 xl:px-16 ${spacing}`}>{children}</section>;
const evidenceCanvas = "mx-auto w-full max-w-[1040px]";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "가구는 머무는 방식을 만듭니다",
  description,
  image: socialImage,
  inLanguage: "ko-KR",
  author: { "@type": "Organization", name: "ANTNEST DESIGN" },
  publisher: {
    "@type": "Organization",
    name: "ANTNEST DESIGN",
    logo: { "@type": "ImageObject", url: "https://www.antnestdesign.com/logo.png" },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
};
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.antnestdesign.com" },
    { "@type": "ListItem", position: 2, name: "AND STANDARD", item: "https://www.antnestdesign.com/knowledge/and-standards" },
    { "@type": "ListItem", position: 3, name: "FURNITURE / BEHAVIOR", item: canonicalUrl },
  ],
};
function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function FurnitureBehaviorPage() {
  return (
    <main className="min-h-screen bg-[#F3F0EB] text-[#4A433D]">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }} />
      <article>
        <header className="mx-auto max-w-[1240px] px-5 pb-24 pt-36 md:px-16 md:pb-36 md:pt-48 lg:px-10 xl:px-16">
          <p className="mb-7 text-[10px] uppercase tracking-[0.35em] text-neutral-500 md:text-xs">AND STANDARD 05 · FURNITURE / BEHAVIOR</p>
          <h1 className="max-w-[900px] text-4xl font-light leading-[1.18] tracking-[-0.035em] break-keep md:text-[56px] md:leading-[1.12]">가구는 머무는 방식을 만듭니다</h1>
          <div className="mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
            <p>우리는 가구를 공간이 완성된 뒤 채워 넣는 물건으로 생각하기 쉽습니다.</p>
            <p>하지만 소파가 어느 방향을 바라보는지, 의자가 서로 얼마나 떨어져 있는지, 벤치가 어디에 놓이는지에 따라 같은 공간에서도 사람의 행동은 달라집니다.</p>
            <p>그래서 AND는 가구를 공간의 마지막 단계로 보지 않습니다.</p>
            <p><Strong>누가, 무엇을 하고, 누구를 바라보며, 어떤 자세로 얼마나 오래 머물 것인지 먼저 생각합니다.</Strong></p>
            <p>그 뒤에 가구의 종류와 방향, 관계를 정합니다.</p>
            <p>이번 STANDARD는 가구가 사람의 행동과 머무는 방식을 어떻게 만드는지에 대한 이야기입니다.</p>
          </div>
        </header>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="01" title="가구는 시선의 방향을 만듭니다" />
            <Copy>
              <p>거실 가구 배치는 TV와 소파의 위치를 정하는 일에서 끝나지 않습니다.</p>
              <p>사람이 무엇을 바라보고, 누구와 마주할 것인가를 정하는 일입니다.</p>
              <p>청라 더샵레이크파크에서는 여러 좌석을 서로 마주 보게 배치했습니다. 소파와 라운지체어가 낮은 테이블을 중심으로 관계를 맺으며, TV를 향한 일렬 배치와는 다른 머무름을 제안합니다.</p>
              <p>같은 거실에서도 가구가 한 방향을 향하면 함께 화면을 보게 되고, 서로를 향하면 대화가 이루어질 자리가 됩니다.</p>
              <p>어느 한쪽이 언제나 더 좋은 배치는 아닙니다. 그 집에서 어떤 시간을 보내고 싶은지가 먼저입니다.</p>
              <p><Strong>가구의 방향은 곧 사람의 시선 방향입니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14`}>
            <Figure src="/projects/cheongna-the-sharp-lakepark/02-living-room-front-night.webp" width={1672} height={941} project="THE SHARP LAKEPARK · LIVING ROOM" status={lakepark.status} caption="TV보다 사람 사이의 관계를 중심으로 좌석을 마주 보게 구성한 거실." alt="낮은 테이블 주위로 소파와 라운지체어가 서로 마주 보는 청라 더샵레이크파크 거실 디자인 제안" sizes="(max-width: 768px) 100vw, 1040px" priority />
            <ProjectLink project={lakepark} href="/projects/cheongna-the-sharp-lakepark">청라 더샵레이크파크에서 좌석의 관계 보기 →</ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="02" title="자세가 달라지면 머무는 방식도 달라집니다" />
            <Copy>
              <p>같은 의료공간에서도 머무는 시간과 필요한 자세는 다릅니다.</p>
              <p>청라 이비인후과에서는 진료실 앞에 벽면 벤치를 두었습니다. 진료 전 잠시 앉아 기다리는 자리를 공간 안에 마련한 것입니다.</p>
              <p>수액실에는 기대어 머무는 리클라이너와 몸을 눕혀 쉬는 침상을 각각 계획했습니다. 치료 중 머무는 방식에 따라 서로 다른 자리를 제안합니다.</p>
              <p>벤치에서 리클라이너로, 다시 침상으로 이어지는 차이는 가구 종류의 차이만이 아닙니다. 앉고, 기대고, 눕는 자세와 그 자리에서 보내는 시간이 달라집니다.</p>
              <p><Strong>가구는 사람 수를 채우는 좌석이 아니라, 머무는 시간과 자세를 담는 도구입니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 lg:grid-cols-[48fr_30fr_22fr] lg:items-start lg:gap-8`}>
            <Figure src="/projects/ent-clinic/04-corridor-bench.webp" width={1672} height={941} project="ENT CLINIC · CORRIDOR BENCH" status={clinic.status} caption="진료 전 짧게 머무는 시간을 위한 벽면 벤치." alt="진료실 앞 벽면 안에 배치한 청라 이비인후과 대기 벤치 디자인 제안" sizes="(max-width: 1024px) 100vw, 50vw" />
            <Figure src="/projects/ent-clinic/07-infusion-cubicles.webp" width={1320} height={1191} project="ENT CLINIC · INFUSION" status={clinic.status} caption="비교적 긴 치료시간 동안 기대어 머물 수 있는 개별 리클라이너." alt="커튼으로 구분된 자리에서 기대어 머무는 청라 이비인후과 수액실 리클라이너 디자인 제안" sizes="(max-width: 1024px) 100vw, 33vw" />
            <Figure src="/projects/ent-clinic/06-recovery-bed.webp" width={948} height={1659} project="ENT CLINIC · RECOVERY" status={clinic.status} caption="몸을 눕혀 충분히 쉬는 시간이 필요한 침상형 공간." alt="몸을 눕혀 쉬도록 계획한 청라 이비인후과 침상형 회복 공간 디자인 제안" sizes="(max-width: 1024px) 100vw, 25vw" />
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="03" title="가구의 관계가 행동의 전환을 만듭니다" />
            <Copy>
              <p>공식적인 회의와 짧은 대화, 휴식에는 서로 다른 자리가 필요합니다.</p>
              <p>AND OFFICE의 회의실은 큰 테이블을 중심으로 사람들이 마주 보는 공간입니다. 함께 자료를 보고 논의하는 행동을 받아줍니다.</p>
              <p>인접한 라운지에서는 소파와 라운지체어가 더 느슨한 관계를 만듭니다. 테이블을 사이에 둔 회의에서 벗어나 짧게 이야기를 나누거나 잠시 쉬는 자리입니다.</p>
              <p>두 영역을 가까이 두어 회의가 끝난 뒤의 대화와 휴식이 같은 중심 공간 안에서 이어지도록 했습니다.</p>
              <p><Strong>가구의 관계를 가까이 두면 하나의 행동에서 다른 행동으로 자연스럽게 전환할 수 있습니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-2 md:items-start md:gap-8`}>
            <Figure src="/projects/antnest-design-office/07-meeting-room.webp" width={2000} height={1500} project="AND OFFICE · MEETING" status={office.status} caption="큰 테이블을 중심으로 사람들이 서로 마주 보는 공식적인 회의 공간." alt="큰 테이블 양쪽에 좌석을 배치한 인천 청라 AND OFFICE 완공 회의실" />
            <Figure src="/projects/antnest-design-office/02-lounge.webp" width={2000} height={1500} project="AND OFFICE · LOUNGE" status={office.status} caption="소파와 라운지체어가 더 느슨한 대화와 휴식을 만드는 공간." alt="소파와 라운지체어, 낮은 테이블이 함께 놓인 인천 청라 AND OFFICE 완공 라운지" />
          </div>
          <div className={evidenceCanvas}><ProjectLink project={office} href="/projects/antnest-design-office">AND OFFICE에서 회의와 대화, 휴식의 관계 보기 →</ProjectLink></div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="04" title="가구의 위치가 공간의 관계를 바꿉니다" />
            <Copy>
              <p>사람이 앉고 머무는 위치가 달라지면 공간을 사용하는 방식도 달라집니다.</p>
              <p>청라 한화꿈에그린에서는 제한된 주방의 조건을 해결하기 위해 다이닝을 거실 쪽으로 옮겼습니다.</p>
              <p>식탁과 하부장의 위치를 함께 조정하며 소파에 앉는 자리와 식사하는 자리, 주방에서 일하는 자리의 관계를 다시 계획했습니다.</p>
              <p>벽을 새로 세우지 않아도 가구의 위치는 어디에서 식사하고 대화하며 쉬게 될지를 바꿉니다.</p>
              <p><Strong>가구를 옮긴다는 것은 물건 하나의 위치를 바꾸는 것이 아니라, 그 가구를 사용하는 사람의 위치를 바꾸는 일입니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14`}>
            <Figure src="/projects/cheongna-hanwha-kkumegreen-39a/01-hero.webp" width={2000} height={1081} project="HANWHA KKUMEGREEN · LIVING / DINING" status={hanwha.status} caption="식탁과 하부장의 위치를 조정해 식사와 휴식의 관계를 다시 계획한 거실." alt="거실 쪽 식탁과 소파, 주방의 관계가 함께 보이는 청라 한화꿈에그린 디자인 제안" sizes="(max-width: 768px) 100vw, 1040px" />
            <ProjectLink project={hanwha} href="/projects/cheongna-hanwha-kkumegreen-39a">청라 한화꿈에그린에서 식사와 휴식의 자리 보기 →</ProjectLink>
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="05" title="고정해야 할 것과 움직일 수 있어야 할 것을 구분합니다" />
            <Copy>
              <p>모든 가구를 공간에 고정할 필요도, 모든 기능을 이동가구로 해결할 필요도 없습니다.</p>
              <p>청라 푸르지오의 현관에는 벽면과 결합한 벤치를 두었습니다. 신발을 신고 벗는 반복적인 행동을 같은 자리에서 받아주는 계획입니다.</p>
              <p>청라 더샵레이크파크의 거실은 소파와 라운지체어가 관계를 만듭니다. 벽면에 붙여 고정하는 대신 생활 방식과 구성에 따라 좌석의 관계를 바꿀 여지를 남깁니다.</p>
              <p>반복적으로 같은 위치에서 사용하는 기능은 공간에 정착시키고, 생활 변화에 대응해야 하는 부분은 움직일 수 있도록 봅니다.</p>
              <p><Strong>오래 유지되어야 할 기능과 변화할 수 있어야 하는 생활을 구분합니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[1.510784fr_1.776834fr] md:items-start md:gap-8`}>
            <div>
              <Figure src="/projects/cheongna-prugio/refined-v2/03-entry-side.webp" width={1541} height={1020} project="CHEONGNA PRUGIO · ENTRY BENCH" status={prugio.status} caption="신발을 신고 벗는 반복적인 행동을 같은 위치에서 받아주는 고정 벤치." alt="벽면과 결합한 벤치를 배치한 청라 푸르지오 현관 디자인 제안" />
              <ProjectLink project={prugio} href="/projects/cheongna-prugio">청라 푸르지오에서 현관의 머무는 자리 보기 →</ProjectLink>
            </div>
            <Figure src="/projects/cheongna-the-sharp-lakepark/04-living-room-side-night.webp" width={1672} height={941} project="THE SHARP LAKEPARK · LIVING ROOM" status={lakepark.status} caption="생활 방식과 구성에 따라 관계를 바꿀 수 있는 이동 좌석." alt="소파와 이동 가능한 라운지체어가 놓인 청라 더샵레이크파크 거실 측면 디자인 제안" />
          </div>
        </Section>

        <Section>
          <div className="max-w-[760px]">
            <Heading number="06" title="가구는 사람 사이의 거리를 조절합니다" />
            <Copy>
              <p>같은 병원에서도 의자가 누구를 향하는가에 따라 좌석의 관계는 달라집니다.</p>
              <p>청라 이비인후과의 진료실에서는 의사와 환자가 상담 테이블을 사이에 두고 마주 봅니다. 사람과 사람의 대화가 중심이 되는 자리입니다.</p>
              <p>호흡기치료실의 좌석은 서로보다 각각의 치료장비를 향합니다. 같은 공간에 앉아 있어도 각자의 치료에 집중하도록 관계를 나누었습니다.</p>
              <p>서로 이야기해야 하는지, 각자의 활동에 집중해야 하는지에 따라 필요한 가구의 방향과 거리도 다릅니다.</p>
              <p><Strong>가구의 간격과 방향은 사람 사이의 관계를 만듭니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 md:grid-cols-[1.36093fr_1.212467fr] md:items-start md:gap-8`}>
            <Figure src="/projects/ent-clinic/02-examination-room.webp" width={1463} height={1075} project="ENT CLINIC · EXAMINATION" status={clinic.status} caption="대화가 중심이 되는 진료실의 대면 관계." alt="상담 테이블을 중심으로 의사와 환자의 대면 좌석을 계획한 청라 이비인후과 진료실 디자인 제안" />
            <Figure src="/projects/ent-clinic/08-respiratory-treatment.webp" width={1381} height={1139} project="ENT CLINIC · RESPIRATORY TREATMENT" status={clinic.status} caption="각자의 치료에 집중하도록 독립적으로 구성한 좌석 관계." alt="각 좌석이 자신의 치료장비를 향하는 청라 이비인후과 호흡기치료실 디자인 제안" />
          </div>
          <div className={evidenceCanvas}><ProjectLink project={clinic} href="/projects/ent-clinic">청라 이비인후과에서 기다림과 치료의 자리 보기 →</ProjectLink></div>
        </Section>

        <Section spacing="mb-26 md:mb-40">
          <div className="max-w-[760px]">
            <Heading number="07" title="같은 가구도 장소가 달라지면 다른 시간을 담습니다" />
            <Copy>
              <p>소파와 라운지체어, 낮은 테이블은 주거와 의료, 업무공간에 모두 놓일 수 있습니다.</p>
              <p>하지만 그 위에서 이루어지는 시간은 같지 않습니다.</p>
              <p>청라 더샵레이크파크의 거실은 가족과 손님이 생활하며 대화하는 자리입니다.</p>
              <p>청라 이비인후과의 대기 라운지는 진료 전의 기다림을 받아주는 공간입니다. AND OFFICE의 라운지는 업무 사이의 짧은 대화와 휴식을 위한 자리입니다.</p>
              <p>유사한 가구 조합이라도 누가 사용하고 어떤 행동과 이어지는지에 따라 그 장소의 역할이 달라집니다.</p>
              <p><Strong>같은 가구도 어디에 놓이고 어떤 행동과 연결되는가에 따라 다른 장소가 됩니다.</Strong></p>
            </Copy>
          </div>
          <div className={`${evidenceCanvas} mt-14 grid gap-12 lg:grid-cols-3 lg:items-start lg:gap-8`}>
            <Figure src="/projects/cheongna-the-sharp-lakepark/03-living-room-side-day.webp" width={1672} height={941} project="RESIDENTIAL · LIVING ROOM" status={lakepark.status} caption="가족과 손님이 대화하며 머무는 좌석." alt="가족과 손님의 대화를 위한 청라 더샵레이크파크 거실 소파와 라운지체어 디자인 제안" sizes="(max-width: 1024px) 100vw, 33vw" imageStageClassName="lg:aspect-[3/2]" imageClassName="h-auto w-full lg:h-full lg:object-cover lg:object-center" />
            <Figure src="/projects/ent-clinic/01-reception-wide.webp" width={1951} height={806} project="MEDICAL · WAITING LOUNGE" status={clinic.status} caption="진료 전의 기다림을 조금 더 편안하게 만드는 좌석." alt="접수 공간 양옆에 소파와 낮은 테이블을 배치한 청라 이비인후과 대기 라운지 디자인 제안" sizes="(max-width: 1024px) 100vw, 33vw" imageStageClassName="lg:aspect-[3/2]" imageClassName="h-auto w-full lg:h-full lg:object-cover lg:object-right-bottom" />
            <Figure src="/projects/antnest-design-office/08-lounge-seating.webp" width={2000} height={1500} project="WORKPLACE · LOUNGE" status={office.status} caption="업무 사이의 짧은 대화와 휴식을 위한 좌석." alt="업무 사이에 대화하고 쉬도록 소파와 라운지체어를 배치한 인천 청라 AND OFFICE 완공 라운지" sizes="(max-width: 1024px) 100vw, 33vw" imageStageClassName="lg:aspect-[3/2]" imageClassName="h-auto w-full lg:h-full lg:object-cover lg:object-bottom" />
          </div>
        </Section>

        <section className="mx-auto max-w-[1240px] px-5 pb-32 md:px-16 md:pb-48 lg:px-10 xl:px-16">
          <div className="max-w-[760px]">
            <Heading number="CONCLUSION" title="결국 가구보다 사람의 행동을 먼저 봅니다" />
            <Copy>
              <p>소파는 반드시 TV 앞에, 식탁은 반드시 주방 옆에 있어야 한다는 정답은 없습니다. 대기실의 의자도 언제나 일렬로 놓일 필요는 없습니다.</p>
              <p>AND는 누가 사용하는지, 무엇을 하는지, 누구를 바라보는지부터 봅니다.</p>
              <p>어떤 자세로 얼마나 오래 머무는지, 그 행동이 다음 행동으로 어떻게 이어지는지까지 함께 생각합니다.</p>
              <p>그 뒤에 가구의 종류와 위치, 방향과 관계를 정합니다.</p>
            </Copy>
            <p className="mt-14 border-l border-[#675B56]/60 pl-5 text-xl font-light leading-9 text-[#675B56] break-keep md:text-2xl md:leading-10">
              가구를 배치하는 것은 물건의 자리를 정하는 일이 아니라,<br />
              <Strong>그곳에서 이루어질 행동의 자리를 정하는 일입니다.</Strong>
            </p>
            <div className="mt-12 border-t border-[#675B56]/25 pt-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">AND STANDARD 03 · VIEW</p>
              <Link href="/knowledge/and-standards/view" className="mt-3 inline-flex border-b border-[#675B56]/40 pb-1 text-sm leading-7 transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base">공간은 보이는 방식으로 경험됩니다 →</Link>
            </div>
          </div>
        </section>
      </article>
      <BackToTop />
    </main>
  );
}
