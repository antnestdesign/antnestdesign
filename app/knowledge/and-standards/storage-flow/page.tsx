import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import BackToTop from "../../../components/BackToTop";

const path = "/knowledge/and-standards/storage-flow";
const canonicalUrl = `https://www.antnestdesign.com${path}`;
const pageTitle = "수납과 동선 설계 기준 | AND STANDARD 02 | ANTNEST DESIGN";
const description = "수납은 장의 개수가 아니라 생활의 흐름에서 시작합니다. 실제 프로젝트를 통해 물건의 위치, 기능의 관계, 공간의 경계와 가족 동선을 판단하는 ANTNEST DESIGN의 수납·동선 설계 기준을 소개합니다.";

export const metadata: Metadata = {
  title: { absolute: pageTitle }, description,
  alternates: { canonical: path }, robots: { index: true, follow: true },
  openGraph: { title: pageTitle, description, url: canonicalUrl, type: "article", images: [{ url: "https://www.antnestdesign.com/projects/apartment-b/12-kitchen-front.webp", width: 1448, height: 1086, alt: "아일랜드와 큰 수납면을 중심으로 기능을 정리한 동탄역 모아미래도 주방" }] },
  twitter: { card: "summary_large_image", title: pageTitle, description, images: ["https://www.antnestdesign.com/projects/apartment-b/12-kitchen-front.webp"] },
};

type FigureProps = { src: string; width: number; height: number; project: string; status: string; caption: string; alt: string; className?: string; priority?: boolean };
function Figure({ src, width, height, project, status, caption, alt, className = "", priority = false }: FigureProps) {
  return <figure className={className}>
    <Image src={src} width={width} height={height} alt={alt} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px" priority={priority} className="h-auto w-full" />
    <figcaption className="mt-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 md:text-xs">{project} · {status}</p>
      <p className="mt-2 text-[13px] leading-6 text-neutral-600 break-keep md:text-sm md:leading-7">{caption}</p>
    </figcaption>
  </figure>;
}

function ProjectLink({ status, href, children }: { status: string; href: string; children: React.ReactNode }) {
  return <div className="mt-10 border-t border-[#675B56]/25 pt-5">
    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 md:text-xs">PROJECT · {status}</p>
    <Link href={href} className="mt-3 inline-flex rounded-sm border-b border-[#675B56]/40 pb-1 text-sm leading-7 text-[#4A433D] transition-colors hover:border-[#675B56] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#675B56] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F0EB] md:text-base">{children}</Link>
  </div>;
}

function Heading({ number, title }: { number: string; title: string }) {
  return <div><p className="mb-5 text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">{number}</p><h2 className="text-3xl font-light leading-[1.2] tracking-[-0.025em] break-keep md:text-[38px]">{title}</h2></div>;
}
function Copy({ children }: { children: React.ReactNode }) { return <div className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-600 break-keep md:text-base md:leading-[1.9]">{children}</div>; }
const Strong = ({ children }: { children: React.ReactNode }) => <strong className="font-medium text-[#4A433D]">{children}</strong>;
const Section = ({ children }: { children: React.ReactNode }) => <section className="mx-auto mb-32 max-w-[1240px] px-5 md:mb-48 md:px-16 lg:px-10 xl:px-16">{children}</section>;

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: "수납은 생활의 흐름을 설계하는 일입니다", description, image: "https://www.antnestdesign.com/projects/apartment-b/12-kitchen-front.webp", inLanguage: "ko-KR", author: { "@type": "Organization", name: "ANTNEST DESIGN" }, publisher: { "@type": "Organization", name: "ANTNEST DESIGN", logo: { "@type": "ImageObject", url: "https://www.antnestdesign.com/logo.png" } }, mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl } };
const breadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.antnestdesign.com" },
  { "@type": "ListItem", position: 2, name: "AND STANDARD", item: "https://www.antnestdesign.com/knowledge/and-standards" },
  { "@type": "ListItem", position: 3, name: "STORAGE & FLOW", item: canonicalUrl },
] };

export default function StorageFlowPage() {
  return <main className="min-h-screen bg-[#F3F0EB] text-[#4A433D]">
    <Header />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <article>
      <header className="mx-auto max-w-[1240px] px-5 pb-24 pt-36 md:px-16 md:pb-36 md:pt-48 lg:px-10 xl:px-16">
        <p className="mb-7 text-[10px] uppercase tracking-[0.35em] text-neutral-500 md:text-xs">AND STANDARD 02 · STORAGE &amp; FLOW</p>
        <h1 className="max-w-[900px] text-4xl font-light leading-[1.18] tracking-[-0.035em] break-keep md:text-[56px] md:leading-[1.12]">수납은 생활의 흐름을 설계하는 일입니다</h1>
        <div className="mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
          <p>수납은 장을 더 만드는 일로 끝나지 않습니다.</p>
          <p>무엇을 가지고 살고, 어디에서 사용하며, 어떤 순서로 움직이는지.<br />그리고 가족의 서로 다른 생활이 집 안에서 어떻게 겹치는지를 함께 봐야 합니다.</p>
          <p>ANTNEST DESIGN은 수납과 동선을 물건의 양만으로 판단하지 않습니다.</p>
          <p><Strong>좋은 수납은 물건과 행동, 그리고 사람의 관계를 더 자연스럽게 만드는 설계에서 시작합니다.</Strong></p>
        </div>
      </header>

      <Section>
        <div>
          <div className="max-w-[760px]"><Heading number="01" title="수납보다 먼저 생활을 봅니다" /><Copy>
            <p>수납을 계획할 때 가장 먼저 정해야 하는 것은 장의 크기나 개수가 아닙니다.</p>
            <p><Strong>무엇을 가지고 살 것인지, 무엇을 자주 사용하고 무엇이 자리를 많이 차지하는지, 그리고 가족이 집에서 어떤 생활을 하는지를 먼저 봐야 합니다.</Strong></p>
            <p>같은 면적의 집이라도 필요한 수납은 다릅니다.</p>
            <p>요리를 자주 하는 집과 그렇지 않은 집, 계절용품이나 여행가방이 많은 집, 옷을 많이 보관하는 집은 필요한 공간의 위치와 크기가 달라집니다.</p>
            <p>가족의 생활시간과 공간을 사용하는 방식까지 달라지면 같은 평면에서도 계획의 답은 달라질 수 있습니다.</p>
            <p>그래서 AND는 수납을 많이 만드는 것보다 먼저 <Strong>이 집에서 무엇이 더 중요한지를 정합니다.</Strong></p>
            <p>모든 것을 동시에 얻기 어려운 공간이라면 더 그렇습니다.</p>
            <p>하나의 공간을 얻기 위해 다른 공간의 일부를 양보해야 할 수도 있고, 지금까지 당연하게 두었던 기능의 위치를 다시 검토해야 할 수도 있습니다.</p>
            <p>중요한 것은 수납장의 숫자가 아니라, <Strong>그 선택이 실제 생활에서 반복되는 불편을 얼마나 해결하는가</Strong>입니다.</p>
          </Copy></div>
          <div className="mt-14">
            <p className="mb-7 text-xs font-medium tracking-[0.24em] text-neutral-500">SAME PLAN, DIFFERENT PRIORITIES</p>
            <div className="mx-auto grid w-full max-w-[960px] gap-8 md:grid-cols-2 md:items-start">
              <Figure src="/projects/cheongna-central-eileens-garden-84a/01-hero.webp" width={4000} height={1179} project="청라 센트럴에일린의뜰 84A · PLAN A" status="DESIGN PROPOSAL" caption="다이닝과 아일랜드, 벽면 수납과 키큰장을 함께 구성한 A안" alt="다이닝과 아일랜드, 키큰장이 함께 보이는 청라 센트럴에일린의뜰 주방 A안" priority />
              <Figure src="/projects/cheongna-central-eileens-garden-84a/16-kitchen-overview-panorama.webp" width={4000} height={1179} project="청라 센트럴에일린의뜰 84A · PLAN B" status="DESIGN PROPOSAL" caption="다이닝과 메인 주방에 문으로 구분된 보조주방이 이어지는 B안" alt="다이닝과 메인 주방, 분리형 보조주방이 이어지는 청라 센트럴에일린의뜰 주방 B안" />
            </div>
            <Copy><p className="text-xl font-light text-[#4A433D]">같은 평면이라고 같은 답이 나오는 것은 아닙니다.</p><p>A안은 다이닝과 아일랜드, 키큰장을 함께 구성하고, B안은 다이닝과 메인 주방에 문으로 구분된 보조주방이 이어집니다.</p><p>두 안 중 하나가 항상 더 좋은 것은 아닙니다.</p><p><Strong>어떤 계획이 맞는지는 그 집에서 실제로 어떻게 요리하고, 먹고, 머무는지에 따라 달라집니다.</Strong></p></Copy>
            <ProjectLink status="DESIGN PROPOSAL" href="/projects/cheongna-central-eileens-garden-84a">청라 센트럴에일린의뜰에서 두 가지 주방 제안 비교하기 →</ProjectLink>
          </div>
        </div>
        <aside className="mt-20 border-y border-[#675B56]/25 py-10 md:mt-28 md:py-14">
          <p className="text-xs font-medium tracking-[0.24em] text-neutral-500">실제 생활의 우선순위가 공간을 바꾼 사례</p>
          <div className="mt-8 grid gap-9 md:grid-cols-2 lg:grid-cols-4">{[
            ["가장 먼저 해결한 문제", "골프백과 캐리어처럼 부피가 큰 물건을 현관 가까이에 둘 수 있는 수납공간이 부족했습니다."],
            ["AND의 선택", "거실의 일부 공간을 사용해 현관에서 바로 접근할 수 있는 수납영역을 만들었습니다."],
            ["얻은 것", "대형 물건을 집 안쪽까지 옮기지 않고 현관 가까이에서 정리할 수 있는 수납과, 정돈된 거실 중심면을 함께 만들었습니다."],
            ["양보한 것", "새로운 수납영역을 확보한 만큼 거실의 일부 유효공간을 사용했습니다."],
          ].map(([title, body]) => <div key={title}><h3 className="font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-neutral-600 break-keep">{body}</p></div>)}</div>
          <p className="mt-10 max-w-[760px] text-[15px] leading-8 text-neutral-600 break-keep md:text-base">수납을 늘리는 선택에는 때로 다른 공간의 양보가 필요합니다. AND는 무엇이든 최대한 많이 확보하기보다 <Strong>가족에게 반복적으로 발생하는 불편과 그 선택으로 얻는 생활의 가치를 비교합니다.</Strong></p>
          <ProjectLink status="COMPLETED" href="/projects/apartment-a">수원 살구골 현대7단지에서 팬트리와 공간 재구성 보기 →</ProjectLink>
        </aside>
      </Section>

      <Section><div>
        <div className="max-w-[760px]"><Heading number="02" title="물건의 위치는 행동의 순서를 따라야 합니다" /><Copy>
          <p>수납공간이 충분해도 필요한 물건이 행동이 일어나는 곳에서 멀리 떨어져 있다면 생활은 편해지지 않습니다.</p><p>그래서 AND는 수납의 위치를 정할 때 빈 벽부터 찾지 않습니다.</p><p><Strong>그 공간에서 사람이 무엇을 하고, 어떤 순서로 움직이는지를 먼저 봅니다.</Strong></p><p>주방이라면 재료를 꺼내고, 씻고, 손질하고, 조리하는 과정이 반복됩니다.</p><p className="text-xl font-light tracking-[0.08em] text-[#675B56]">냉장 → 세척 → 손질 → 조리</p><p>각 기능의 위치는 이 흐름과 함께 계획되어야 합니다.</p><p>단순히 이동거리를 가장 짧게 만드는 것이 목적은 아닙니다.</p><p>각 작업에 필요한 공간과 여러 사람이 함께 사용하는 상황까지 고려해 <Strong>행동이 자연스럽게 이어지는 관계를 만드는 것</Strong>이 중요합니다.</p>
        </Copy></div>
        <div className="mt-14"><Copy><p>이 집은 요리를 자주 하는 가족의 생활을 기준으로 주방의 기능을 배치했습니다.</p><p>사진에서 독자가 봐야 하는 것은 가구의 형태가 아니라 <Strong>각 기능이 어떤 순서로 연결되는가</Strong>입니다.</p><p>이 원칙은 주방에만 적용되지 않습니다. 현관에는 귀가와 외출의 순서가 있고, 드레스룸에는 보관과 준비의 순서가 있습니다.</p><p><Strong>물건을 어디에 둘 것인가를 결정하기 전에, 그 물건을 언제 어떻게 사용하는지를 먼저 봐야 합니다.</Strong></p></Copy>
          <p className="mb-7 mt-12 text-xs font-medium tracking-[0.24em] text-neutral-500">STORAGE FOLLOWS ACTION</p>
          <div className="mx-auto w-full max-w-[960px]"><Figure src="/projects/apartment-b/12-kitchen-front.webp" width={1448} height={1086} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="냉장·보관 영역과 중앙 아일랜드가 실제 사용 흐름 안에서 이어집니다." alt="냉장 수납벽과 중앙 아일랜드가 함께 보이는 동탄역 모아미래도 주방" /></div>
          <div className="mx-auto mt-12 w-full max-w-[960px]"><Figure src="/projects/apartment-b/19-kitchen-island.webp" width={1448} height={1086} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="아일랜드에서 세척과 손질, 조리가 자연스럽게 이어지도록 기능의 관계를 정리했습니다." alt="세척과 조리 기능이 연결된 동탄역 모아미래도 주방 아일랜드" /></div>
          <ProjectLink status="COMPLETED" href="/projects/apartment-b">동탄역 모아미래도에서 주방과 수납 계획 보기 →</ProjectLink>
        </div>
      </div></Section>

      <Section><div className="max-w-[760px]"><Heading number="03" title="공간이 부족하면 기능의 위치부터 다시 봅니다" /><Copy><p>공간이 부족할 때 가장 먼저 떠올리는 방법은 각 요소를 조금씩 줄이는 것입니다.</p><p>수납장을 줄이고, 식탁을 작게 바꾸고, 통로를 좁히면서 필요한 기능을 기존 위치에 모두 남겨두려 합니다.</p><p>하지만 하나의 공간 안에서 여러 기능이 서로 경쟁하고 있다면, 크기를 줄이는 것만으로는 근본적인 문제가 해결되지 않을 수 있습니다.</p><p><Strong>이럴 때 AND는 각각의 기능을 그대로 둔 채 얼마나 줄일 수 있는지를 보기보다, 기능 사이의 관계와 주변 동선까지 함께 놓고 위치를 다시 검토합니다.</Strong></p></Copy></div>
        <div className="mt-14"><div className="grid gap-8 lg:grid-cols-2 lg:gap-20"><Copy><p>기존 주방에서는 조리와 수납뿐 아니라 다이닝, 그리고 주방 옆 방으로 이어지는 이동까지 하나의 영역 안에서 함께 해결해야 했습니다.</p><p>가족이 식탁과 주방을 자연스럽게 오갈 수 있어야 했고, 동시에 주방 옆 방으로 향하는 통로가 가구나 식탁 때문에 방해받지 않아야 했습니다.</p><p>AND는 이 관계를 함께 살펴보면서 <Strong>주방의 기본적인 작업 흐름을 유지할 수 있는 범위 안에서 냉장 기능의 위치를 인접 영역으로 조정했습니다.</Strong></p></Copy><Copy><p>중요한 것은 냉장고를 옮겼다는 사실 자체가 아닙니다.</p><p><Strong>하나의 기능 위치를 바꾸면서 주방의 조리 흐름, 다이닝과의 연결, 그리고 인접한 방으로 이어지는 통로를 함께 정리할 수 있었다는 점입니다.</Strong></p><p>공간이 부족할 때 모든 것을 조금씩 줄이는 것이 항상 답은 아닙니다. <Strong>기능 하나의 위치를 다시 보는 선택이 서로 충돌하던 여러 공간의 관계를 함께 바꿀 수도 있습니다.</Strong></p></Copy></div>
        <p className="mb-7 mt-12 text-xs font-medium tracking-[0.24em] text-neutral-500">RETHINKING POSITION</p><div className="mx-auto grid w-full max-w-[960px] gap-8 md:grid-cols-2 md:items-start">
          <Figure src="/projects/apartment-a/18-before-balcony.webp" width={1050} height={1400} project="수원 살구골 현대7단지 99" status="BEFORE" caption="활용도가 낮았던 기존 인접 영역" alt="기능을 옮기기 전 수원 살구골 현대7단지의 비어 있는 발코니" />
          <Figure src="/projects/apartment-a/07-utility-room.webp" width={1746} height={2400} project="수원 살구골 현대7단지 99" status="COMPLETED" caption="주방의 흐름을 유지하면서 인접 영역으로 기능의 위치를 조정했습니다." alt="냉장 기능과 유틸리티를 인접 영역으로 옮긴 수원 아파트 발코니" />
        </div>
        <div className="mx-auto mt-12 w-full max-w-[960px]"><Figure src="/projects/apartment-a/04-kitchen-overview.webp" width={1800} height={2400} project="수원 살구골 현대7단지 99" status="COMPLETED" caption="조리와 수납, 다이닝과 인접한 방으로 이어지는 흐름을 함께 회복한 본 주방" alt="조리 공간과 식탁, 방으로 향하는 통로가 함께 보이는 수원 아파트 주방" /></div>
        <ProjectLink status="COMPLETED" href="/projects/apartment-a">수원 살구골 현대7단지에서 주방과 다이닝의 관계를 다시 정리한 방식 보기 →</ProjectLink></div>
      </Section>

      <aside className="mx-auto mb-32 max-w-[1060px] px-5 md:mb-48 md:px-16"><div className="border-y border-[#675B56]/30 py-12 md:py-16"><p className="text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">DESIGN NOTE</p><h2 className="mt-5 text-2xl font-light md:text-3xl">좋은 계획은 실제로 구현될 수 있어야 합니다</h2>
        <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:gap-16"><Copy><p>생활에 맞는 좋은 아이디어도 실제 공간의 구조와 설비 조건 안에서 만들어질 수 있어야 합니다.</p><p>설계 단계에서는 잘 보이지 않는 기존 조건들이 공사를 시작하면 공간의 높이와 마감, 가구와 조명의 관계에 영향을 줄 수 있습니다.</p><p><Strong>AND는 이런 조건을 마지막에 감추는 문제가 아니라, 처음부터 공간을 구성하는 하나의 조건으로 봅니다.</Strong></p></Copy><Copy><p>이 주방 역시 기존 천장 안의 조건을 고려하지 않고 계획할 수 있는 공간은 아니었습니다.</p><p>필요한 부분마다 서로 다른 높이를 반복하기보다, 주방 천장을 하나의 영역으로 정리하는 방식을 선택했습니다.</p><p>그 결과 기술적인 조건을 해결하는 동시에 천장의 변화가 주방과 다이닝 영역을 하나의 공간으로 읽히게 합니다.</p></Copy></div>
        <div className="mx-auto mt-10 grid w-full max-w-[960px] gap-8 md:grid-cols-2 md:items-start"><Figure src="/projects/apartment-a/16-before-kitchen.webp" width={1400} height={1050} project="수원 살구골 현대7단지 99" status="BEFORE" caption="기존 주방의 천장과 공간 조건" alt="공사 전 수원 살구골 현대7단지 주방과 기존 천장" /><Figure src="/projects/apartment-a/04-kitchen-overview.webp" width={1800} height={2400} project="수원 살구골 현대7단지 99" status="COMPLETED" caption="천장의 변화를 하나의 영역으로 정리한 주방과 다이닝" alt="천장 영역을 단정하게 정리한 수원 살구골 현대7단지 주방" /></div>
        <p className="mt-10 text-xl font-light leading-8 text-[#675B56] break-keep">좋은 계획은 실제로 만들어졌을 때도 처음의 공간적 의도가 유지되어야 합니다.</p>
      </div></aside>

      <Section><div><div className="max-w-[760px]"><Heading number="04" title="수납은 때로 공간의 경계가 됩니다" /><Copy><p>수납은 보통 남는 벽을 따라 배치하는 가구로 생각하기 쉽습니다.</p><p>하지만 공간을 다시 구성할 때 수납은 물건을 담는 장소보다 더 큰 역할을 할 수 있습니다.</p><p><Strong>수납을 포함한 하나의 구조가 두 영역을 나누고, 시선을 정리하고, 각각의 공간에 서로 다른 성격을 만들 수도 있습니다.</Strong></p><p>침실에서 가장 먼저 보이는 면은 공간의 중심을 만듭니다.</p><p>이 프로젝트에서는 침대 헤드 영역에 새로운 구조를 두고, 그 뒤의 공간에 수납과 준비 기능을 연결했습니다.</p><p>침실에서 바라보면 하나의 정돈된 중심면으로 읽히지만, 반대편에서는 다른 생활기능을 받아들이는 영역이 됩니다.</p><p><Strong>하나의 구조가 침실의 배경인 동시에 두 영역을 구분하는 경계가 되는 것입니다.</Strong></p><p>수납은 반드시 기존 벽을 따라 추가되는 가구일 필요가 없습니다.</p><p><Strong>어디에 놓이고 어떤 관계를 만드느냐에 따라 수납을 포함한 구조 자체가 새로운 공간의 시작과 끝을 만들 수 있습니다.</Strong></p><p>수원 살구골 현대7단지에서도 하나의 구조가 현관에서는 수납의 경계가 되고, 거실에서는 중심면으로 작동했습니다.</p></Copy></div>
        <div className="mt-14"><p className="mb-7 text-xs font-medium tracking-[0.24em] text-neutral-500">STORAGE AS A BOUNDARY</p><div className="mx-auto grid w-full max-w-[960px] gap-8 md:grid-cols-2 md:items-start"><Figure src="/projects/cheongna-hanwha-kkumegreen-39a/07-master-bedroom-day.webp" width={1672} height={1125} project="청라 한화꿈에그린 100A" status="DESIGN PROPOSAL" caption="침실에서는 새로운 구조가 정돈된 중심면으로 읽힙니다." alt="침대 헤드 구조가 침실의 중심면을 만드는 청라 한화꿈에그린 제안" /><Figure src="/projects/cheongna-hanwha-kkumegreen-39a/09-master-bedroom-dressing-room-extension.webp" width={1708} height={1125} project="청라 한화꿈에그린 100A" status="DESIGN PROPOSAL" caption="반대편에서는 수납과 준비 기능을 연결하며 두 영역의 경계가 됩니다." alt="침대 헤드 구조 뒤에 수납과 준비 영역을 연결한 청라 한화꿈에그린 제안" /></div>
          <ProjectLink status="DESIGN PROPOSAL" href="/projects/cheongna-hanwha-kkumegreen-39a">청라 한화꿈에그린에서 침실과 수납공간의 관계 보기 →</ProjectLink>
        </div></div>
      </Section>

      <Section><div><div className="max-w-[760px]"><Heading number="05" title="수납량을 늘려도 공간은 복잡해지지 않아야 합니다" /><Copy><p>필요한 물건과 기능이 많다고 해서 공간까지 복잡하게 보여야 하는 것은 아닙니다.</p><p>필요한 기능이 생길 때마다 작은 가구와 수납을 하나씩 더하면 수납은 늘어나지만 공간에는 수많은 선과 덩어리가 남습니다.</p><p>그래서 AND는 수납의 개수만큼이나 <Strong>많은 기능이 공간 안에서 어떻게 하나의 질서로 읽히는지</Strong>를 봅니다.</p><p><Strong>필요한 수납과 기능이 많아질수록 그것들을 여러 작은 요소로 흩뜨리기보다, 몇 개의 큰 면과 구조 안에서 정리할 필요가 있습니다.</Strong></p><p>이 주방에는 가족의 생활에 필요한 다양한 수납과 가전, 조리 기능이 필요했습니다.</p><p>하지만 각각을 독립적인 가구처럼 드러내기보다 큰 수납면과 아일랜드를 중심으로 기능을 정리했습니다.</p><p>멀리서 공간을 바라보면 먼저 읽히는 것은 여러 개의 작은 수납장이 아니라 <Strong>몇 개의 큰 면과 구조</Strong>입니다.</p><p>아일랜드 역시 다양한 기능을 받아들이지만 외부에서는 하나의 단순한 형태로 인식됩니다.</p><p><Strong>필요한 기능이 많아질수록 더 많이 드러내는 것이 아니라, 더 큰 질서 안에서 정리하는 것이 중요합니다.</Strong></p><p>수납을 늘리는 것이 목적이 되면 공간은 쉽게 복잡해집니다. 하지만 생활에 필요한 기능을 먼저 파악하고 그것을 몇 개의 구조 안에 정리하면, <Strong>수납이 많아도 공간은 단순하게 읽힐 수 있습니다.</Strong></p></Copy></div>
        <div className="mt-14"><p className="mb-7 text-xs font-medium tracking-[0.24em] text-neutral-500">MORE FUNCTION, LESS VISUAL NOISE</p><div className="mx-auto w-full max-w-[960px]"><Figure src="/projects/apartment-b/19-kitchen-island.webp" width={1448} height={1086} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="다양한 기능을 받아들이는 아일랜드를 외부에서는 하나의 단순한 구조로 정리했습니다." alt="아일랜드와 큰 수납면이 단순한 구조로 읽히는 동탄역 모아미래도 주방" /></div><ProjectLink status="COMPLETED" href="/projects/apartment-b">동탄역 모아미래도에서 주방의 수납과 기능을 정리한 방식 보기 →</ProjectLink></div>
      </div></Section>

      <Section><div className="max-w-[760px]"><Heading number="06" title="가족의 생활은 서로를 방해하지 않아야 합니다" /><Copy><p>좋은 동선을 이야기할 때 가장 짧은 거리를 먼저 떠올리기 쉽습니다.</p><p>하지만 집에서는 항상 한 사람만 움직이지 않습니다.</p><p>누군가는 자고 있고, 누군가는 출근을 준비합니다.</p><p>한 사람은 일하고, 다른 사람은 쉬고 있을 수 있습니다.</p><p>그래서 주거공간의 동선은 몇 걸음을 줄이는 문제만으로 판단하기 어렵습니다.</p><p><Strong>좋은 동선은 서로 다른 생활이 같은 공간에서 불필요하게 충돌하지 않도록 만드는 일에 가깝습니다.</Strong></p></Copy></div>
        <div className="mt-14"><div className="max-w-[760px]"><Copy><p>이 집에서는 부부의 생활시간이 달랐습니다.</p><p>한 사람이 잠들어 있는 동안 다른 사람이 씻고, 옷을 고르고, 외출을 준비하는 일이 반복될 수 있었습니다.</p><p>기존 공간에서는 이런 준비 과정이 침실의 생활과 밀접하게 얽혀 있었습니다.</p><p>AND는 공간 사이의 관계를 다시 정리하면서 <Strong>한 번 침실을 나온 뒤에는 준비를 마칠 때까지 침실을 반복해서 지나지 않아도 되는 흐름</Strong>을 만들었습니다.</p><p>침실은 이동을 위한 통로보다 휴식을 위한 공간으로 남기고, 욕실과 드레스 기능은 침실 밖 생활동선에서 이어질 수 있도록 관계를 정리했습니다.</p><p><Strong>한 사람의 준비 과정이 다른 사람의 휴식 공간을 반복해서 가로지르지 않도록 했다는 것.</Strong></p><p>동선의 가치는 이동거리 몇 미터보다 이런 생활의 차이에서 더 분명하게 나타납니다.</p></Copy></div>
          <p className="mb-7 mt-12 text-xs font-medium tracking-[0.24em] text-neutral-500">FLOW BETWEEN PEOPLE</p><div className="mx-auto grid w-full max-w-[960px] gap-8 md:grid-cols-2 md:items-start"><Figure src="/projects/apartment-b/14-master-entry.webp" width={1086} height={1448} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="침실을 나온 뒤 준비 공간으로 이어지는 안방 출입 영역" alt="침실 밖 준비 공간으로 이어지는 동탄역 모아미래도 안방 출입구" /><Figure src="/projects/apartment-b/15-dressing-room.webp" width={1086} height={1448} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="침실을 반복해서 지나지 않고 사용할 수 있도록 관계를 정리한 드레스룸" alt="복도 생활동선과 연결되도록 확장한 동탄역 모아미래도 드레스룸" /></div>
          <ProjectLink status="COMPLETED" href="/projects/apartment-b">동탄역 모아미래도에서 침실과 생활 동선을 재구성한 방식 보기 →</ProjectLink>
        </div>
        <div className="mt-20 border-t border-[#675B56]/25 pt-12 md:mt-28"><div className="max-w-[760px]"><h3 className="text-2xl font-light">일과 휴식도 같은 기준으로 봅니다</h3><Copy><p>같은 프로젝트에서 업무공간 역시 휴식공간 안에 단순히 기능을 더하는 방식으로 해결하지 않았습니다.</p><p>집에서 일하는 시간과 쉬는 시간이 서로 다른 영역에서 이루어질 수 있도록 독립적인 업무공간을 마련했습니다.</p><p>가족의 생활을 모두 가까이 모으는 것이 항상 좋은 것은 아닙니다.</p><p><Strong>때로는 적절히 분리하는 것이 서로의 생활을 더 편하게 만듭니다.</Strong></p></Copy></div><div className="mx-auto mt-12 w-full max-w-[960px]"><Figure src="/projects/apartment-b/18-study-homebar.webp" width={1448} height={1086} project="화성 동탄역 모아미래도 84A" status="COMPLETED" caption="거실과 시선을 연결하면서도 업무와 휴식이 서로 다른 영역에서 이루어지는 독립 서재" alt="거실과 연결되면서 독립된 업무 영역을 이루는 동탄역 모아미래도 서재" /></div></div>
      </Section>

      <section className="mx-auto max-w-[960px] px-5 pb-32 text-center md:px-16 md:pb-48"><p className="text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">CONCLUSION</p><h2 className="mt-6 text-3xl font-light leading-[1.25] tracking-[-0.03em] break-keep md:text-[44px]">결국 수납이 아니라 생활의 질서를 설계합니다</h2><div className="mx-auto mt-10 max-w-[720px] space-y-5 text-[15px] leading-8 text-neutral-600 break-keep md:text-lg md:leading-[1.9]">
        <p>수납계획은 장을 많이 만드는 일에서 시작하지 않습니다.</p><p>먼저 이 집에서 어떤 생활이 이루어지는지를 살펴봅니다.</p><p>필요한 물건과 가족의 우선순위를 파악하고,<br />반복되는 행동에 맞춰 기능의 위치를 정합니다.</p><p>현재 공간에 모두 담기 어렵다면 무엇을 작게 만들 것인지보다 <Strong>기능 사이의 관계와 위치를 다시 봅니다.</Strong></p><p>때로는 수납이 공간을 나누는 경계가 되고,<br />많은 기능은 몇 개의 큰 질서 안에서 정리됩니다.</p><p>그리고 그 모든 판단의 마지막에는 결국 사람이 있습니다.</p><p>한 사람의 움직임이 다른 사람의 휴식을 방해하지 않는지,<br />일과 휴식이 필요 이상으로 뒤섞이지 않는지,<br />매일 반복되는 생활이 자연스럽게 이어지는지를 봅니다.</p><p className="text-xl font-light text-[#4A433D]"><Strong>좋은 수납은 물건을 많이 감추는 기술이 아닙니다.</Strong></p><p>공간 안에서 물건과 행동, 그리고 사람의 관계가 자연스럽게 이어지도록 만드는 일입니다.</p><p>AND가 수납과 동선을 설계하는 이유도 여기에 있습니다.</p><p className="text-xl leading-9 text-[#4A433D]"><Strong>우리가 설계하는 것은 수납장의 개수가 아니라, 그 안에서 이어질 생활의 질서입니다.</Strong></p>
      </div></section>
    </article><BackToTop />
  </main>;
}
