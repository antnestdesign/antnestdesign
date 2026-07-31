import type { Metadata } from "next";
import Image from "next/image";
import Header from "../../../components/Header";
import BackToTop from "../../../components/BackToTop";

const path = "/knowledge/and-standards/lighting-natural-light";
const canonicalUrl = `https://www.antnestdesign.com${path}`;
const description =
  "ANTNEST DESIGN이 생각하는 좋은 주거 조명의 기준. 자연광의 경험을 닮은 빛과 생활 장면, 재료와 공간의 깊이를 함께 설계하는 방법을 소개합니다.";
const imageRoot = path;

export const metadata: Metadata = {
  title: "조명은 자연광을 닮아야 합니다 | AND STANDARD",
  description,
  alternates: { canonical: path },
  openGraph: {
    title: "조명은 자연광을 닮아야 합니다 | AND STANDARD",
    description,
    url: canonicalUrl,
    type: "article",
    images: [
      {
        url: `${canonicalUrl}/09-dongtan-living-night-final.webp`,
        width: 1448,
        height: 1086,
        alt: "필요한 영역의 빛만 남겨 낮과 다른 깊이를 만든 동탄 아파트 거실",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "조명은 자연광을 닮아야 합니다 | AND STANDARD",
    description,
    images: [`${canonicalUrl}/09-dongtan-living-night-final.webp`],
  },
};

type FigureProps = {
  src: string;
  width: number;
  height: number;
  place: string;
  caption: string;
  priority?: boolean;
};

function Figure({
  src,
  width,
  height,
  place,
  caption,
  priority = false,
}: FigureProps) {
  return (
    <figure>
      <Image
        src={`${imageRoot}/${src}`}
        alt={caption}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, 80vw"
        priority={priority}
        className="h-auto w-full"
      />
      <figcaption>
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 md:text-xs">
          {place}
        </p>
        <p className="mt-2 text-[13px] leading-6 text-neutral-600 break-keep md:text-sm md:leading-7">
          {caption}
        </p>
      </figcaption>
    </figure>
  );
}

type ChapterProps = {
  number: string;
  title: string;
  paragraphs: string[];
  emphasis?: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
};

function Chapter({
  number,
  title,
  paragraphs,
  emphasis,
  children,
  last = false,
}: ChapterProps) {
  return (
    <section
      className={`mx-auto max-w-7xl px-5 md:px-16 ${
        last ? "pb-32 md:pb-48" : "mb-28 md:mb-40"
      }`}
    >
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <p className="mb-5 text-[10px] font-medium tracking-[0.28em] text-neutral-500 md:text-xs">
            {number}
          </p>
          <h2 className="text-3xl font-light leading-[1.12] tracking-[-0.025em] text-[#4A433D] break-keep md:text-5xl">
            {title}
          </h2>
        </div>
        <div className="space-y-5 md:col-span-6 md:col-start-7 md:space-y-6">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-[15px] leading-7 text-neutral-600 break-keep md:text-base md:leading-8"
            >
              {paragraph}
            </p>
          ))}
          {emphasis && (
            <p className="mt-10 border-l border-[#675B56]/60 pl-5 text-xl font-light leading-[1.7] text-[#675B56] break-keep md:mt-14 md:pl-7 md:text-2xl">
              {emphasis}
            </p>
          )}
        </div>
      </div>
      <div className="mt-12 md:mt-20">{children}</div>
    </section>
  );
}

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "조명은 자연광을 닮아야 합니다",
  description,
  image: `${canonicalUrl}/09-dongtan-living-night-final.webp`,
  author: { "@type": "Organization", name: "ANTNEST DESIGN" },
  publisher: { "@type": "Organization", name: "ANTNEST DESIGN" },
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
      item: canonicalUrl,
    },
  ],
};

export default function LightingNaturalLightPage() {
  return (
    <main
      id="standard-scroll-container"
      className="h-[100svh] overflow-y-auto bg-[#F3F0EB] text-[#4A433D]"
    >
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-36 md:px-16 md:pb-36 md:pt-52">
        <p className="mb-6 text-[10px] uppercase tracking-[0.35em] text-neutral-500 md:mb-8 md:text-xs">
          AND STANDARD 01
        </p>
        <h1 className="max-w-5xl text-4xl font-light leading-[1.18] tracking-[-0.035em] break-keep md:text-6xl">
          조명은 자연광을 닮아야 합니다
        </h1>
        <p className="mt-8 max-w-3xl text-base leading-8 text-neutral-600 break-keep md:mt-10 md:text-xl md:leading-[2]">
          매일 아침 따사로운 햇살을 기다리듯,
          <br />
          매일 저녁에는 조명이 새롭게 드러내는 공간을 기다립니다.
        </p>
      </section>

      <Chapter
        number="01"
        title="자연광은 광원을 드러내지 않습니다"
        paragraphs={[
          "자연광은 우리에게 가장 익숙한 빛입니다.",
          "태양을 직접 바라보지 않는 한, 우리는 광원 자체보다 창을 통과해 벽과 천장, 바닥과 가구 위에 머무는 빛을 경험합니다. 자연광은 때로 방향과 그림자를 만들고, 때로는 여러 번 걸러진 부드러운 빛으로 공간을 감쌉니다.",
          "AND가 계획하는 조명도 자연광의 경험을 닮아야 합니다.",
          "등기구가 공간보다 먼저 보이는 것이 아니라, 빛을 통해 공간과 생활을 경험할 수 있어야 합니다. 조명기구의 존재를 과시하기보다 빛이 닿은 면과 그 안에서 이루어지는 일상이 먼저 보여야 합니다.",
        ]}
        emphasis="빛이 공간보다 먼저 보여서는 안 됩니다."
      >
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <Figure
              src="01a-suwon-entrance-natural-light.webp"
              width={1536}
              height={2048}
              place="SUWON APARTMENT · ENTRANCE"
              caption="목재 벽과 바닥 위로 방향과 그림자를 만드는 자연광"
              priority
            />
          </div>
          <div className="md:col-span-7">
            <Figure
              src="01b-karimoku-commons-diffused-light.webp"
              width={2048}
              height={1366}
              place="KARIMOKU COMMONS · TOKYO"
              caption="얇은 커튼을 통과해 가구와 공간을 부드럽게 감싸는 확산광"
            />
          </div>
        </div>
      </Chapter>

      <Chapter
        number="02"
        title="공간 전체를 하나의 빛으로 밝히지 않습니다"
        paragraphs={[
          "하나의 강한 광원이 공간 전체를 빠짐없이 비추는 방식은 단순하고 편리합니다. 하지만 휴식이 중심이 되어야 할 공간에서 광원이 지속적으로 시야에 들어오면 눈의 피로와 불필요한 긴장을 만들 수 있습니다.",
          "공간 전체가 같은 밝기로 채워지면 재료와 가구 사이의 깊이도 흐려집니다. 밝은 면과 어두운 면의 차이가 사라지면서 공간의 볼륨도 평면적으로 보이게 됩니다.",
          "최근 인테리어에서 흔히 사용하는 여러 개의 다운라이트도 공간과 생활의 구분 없이 반복하고 모두 한 번에 켠다면 본질적으로 크게 다르지 않습니다. 등기구의 형태와 비용만 달라졌을 뿐, 공간 전체를 같은 밝기로 채우는 방식은 그대로 남아 있기 때문입니다.",
        ]}
        emphasis={
          <>
            무엇을 밝힐 것인지,
            <br />
            무엇을 어둠 속에 남길 것인지,
            <br />
            그리고 그 공간에서 무엇을 경험하게 할 것인지를 정합니다.
          </>
        }
      >
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 md:gap-8">
          <Figure
            src="02a-uniform-downlight-grid.webp"
            width={706}
            height={413}
            place="COMPARISON · DOWNLIGHT GRID"
            caption="공간과 생활의 구분 없이 반복된 다운라이트"
          />
          <Figure
            src="02b-uniform-ceiling-light.webp"
            width={768}
            height={512}
            place="COMPARISON · CEILING LIGHT"
            caption="하나의 강한 광원으로 공간 전체를 동일하게 밝히는 방식"
          />
        </div>
      </Chapter>

      <Chapter
        number="03"
        title="빛과 어둠은 공간의 볼륨을 만듭니다"
        paragraphs={[
          "어디를 밝히고 어디를 어둠으로 남길 것인지에 정해진 공식은 없습니다.",
          "같은 벽이라도 공간의 중심이 될 수도 있고 배경으로 남을 수도 있습니다. 같은 가구라도 시선을 모아야 할 때가 있고, 조용히 공간 안에 머물러야 할 때가 있습니다.",
          "그 기준은 결국 그 공간에 머무는 사람이 무엇을 보고, 어디로 이동하며, 어떤 시간을 보내게 할 것인지에서 시작됩니다.",
          "그림자는 빛이 부족해서 생기는 결함이 아닙니다. 빛이 머무는 면과 그림자가 남은 면이 함께 존재할 때 벽의 두께와 천장의 높이, 가구의 형태와 공간의 깊이가 더욱 분명하게 드러납니다.",
          "아만도쿄 로비에서는 창을 통해 들어온 자연광이 바닥과 벽에 긴 명암을 만들고, 가구 주변의 낮은 조명이 사람이 머무는 영역을 부드럽게 드러냅니다.",
          "자연광과 인공조명이 서로 다른 높이와 방향에서 겹치면서 높은 천장과 긴 동선, 가구 사이의 깊이가 더욱 극적으로 읽힙니다.",
        ]}
      >
        <div className="mx-auto max-w-4xl">
          <Figure
            src="03-aman-tokyo-lobby.webp"
            width={1080}
            height={1421}
            place="AMAN TOKYO · LOBBY"
            caption="자연광과 실내조명이 서로 다른 높이와 방향에서 만나 공간의 볼륨을 드러냅니다."
          />
        </div>
      </Chapter>

      <Chapter
        number="04"
        title="좋은 조명은 반드시 어두운 조명이 아닙니다"
        paragraphs={[
          "자연광을 닮은 조명이라고 해서 모든 공간을 어둡고 은은하게 만들어야 하는 것은 아닙니다.",
          "주방에서는 조리와 세척, 재료 손질과 수납처럼 서로 다른 활동이 동시에 이루어집니다. 이곳에는 충분한 밝기가 필요합니다. 그러나 단순히 주방 전체가 밝아 보이는 것만으로는 충분하지 않습니다.",
          "주방 중앙의 조명 하나로 공간 전체를 밝히면 사람이 싱크대나 조리대 앞에 섰을 때 자신의 몸이 만드는 그림자가 작업면을 가릴 수 있습니다.",
          "중요한 것은 밝기의 총량이 아니라, 필요한 위치에 빛이 정확하게 도달하는가입니다.",
          "카리모쿠 리서치 센터의 아일랜드 상부 조명은 하나의 등기구 안에서 서로 다른 역할의 빛을 나눕니다.",
          "위쪽으로 향하는 빛은 천장에 반사되어 공간 전체의 기본 밝기를 만들고, 아래쪽으로 향하는 빛은 아일랜드 작업면에 필요한 조도를 확보합니다. 하부 광원 사이의 격벽은 사람이 바라보는 방향으로 빛이 직접 노출되는 것을 줄입니다.",
          "광원을 감춘다는 것은 등기구를 없애는 일이 아닙니다. 필요한 방향으로 빛을 전달하고, 불필요한 방향으로 새어 나오는 빛을 다듬는 일에 가깝습니다.",
        ]}
      >
        <div className="mx-auto max-w-6xl">
          <Figure
            src="04a-suwon-kitchen-task-light.webp"
            width={2048}
            height={1536}
            place="SUWON APARTMENT · KITCHEN"
            caption="상부장 아래에서 손이 움직이는 작업면으로 직접 도달하는 기능광"
          />
        </div>
        <div className="mt-8 grid items-end gap-8 md:mt-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-8">
            <Figure
              src="04b-karimoku-research-kitchen.webp"
              width={2048}
              height={1536}
              place="KARIMOKU RESEARCH CENTER · KITCHEN"
              caption="상부 반사광과 하부 작업광을 함께 사용한 아일랜드 조명"
            />
          </div>
          <div className="md:col-span-4">
            <Figure
              src="04c-karimoku-research-pendant-detail.webp"
              width={1536}
              height={2048}
              place="KARIMOKU RESEARCH CENTER · LIGHTING DETAIL"
              caption="광원의 직접 노출을 줄이며 위와 아래로 역할을 나눈 조명 구조"
            />
          </div>
        </div>
      </Chapter>

      <Chapter
        number="05"
        title="같은 공간도 생활에 따라 달라져야 합니다"
        paragraphs={[
          "같은 공간이라도 머무는 방식과 시간에 따라 필요한 빛은 달라집니다.",
          "아이들이 놀거나 책을 읽는 시간에는 풍부하고 고른 빛이 필요합니다. 반면 휴식을 취하거나 잠들기 전에는 필요한 빛만 남겨 공간의 긴장을 낮추는 편이 좋습니다.",
          "특히 침실에서는 서 있을 때보다 누웠을 때의 시선이 중요합니다. 서 있을 때는 불편하지 않았던 천장의 광원이 침대에 누운 순간 눈앞에 직접 들어올 수 있기 때문입니다.",
          "조명은 평면 위의 위치만이 아니라 사람이 앉고 눕고 이동할 때의 시선까지 함께 고려해야 합니다.",
          "밝은 공간을 원하는 요구를 잘못된 취향이라고 생각하지 않습니다. 그래서 AND는 모든 조명을 한 번에 켜야만 하는 공간이 아니라, 생활 장면에 따라 필요한 빛을 선택할 수 있는 공간을 계획합니다.",
        ]}
      >
        <div className="mx-auto max-w-3xl">
          <Figure
            src="05-dongtan-master-bedroom.webp"
            width={1086}
            height={1448}
            place="DONGTAN APARTMENT · BEDROOM"
            caption="누웠을 때의 시선을 고려해 천장 조명을 줄이고, 벽등과 침대 하부의 간접광으로 필요한 밝기를 만듭니다."
          />
        </div>
      </Chapter>

      <Chapter
        number="06"
        title="좋은 재료와 공간은 좋은 빛을 만났을 때 드러납니다"
        paragraphs={[
          "좋은 재료는 그 자체만으로 완성되지 않습니다.",
          "목재의 결, 돌의 질감, 벽과 바닥이 만나는 깊이는 빛이 어디에서 시작되고 어떤 방향으로 머무는지에 따라 전혀 다르게 드러납니다.",
          "간접조명은 공간에 부드러운 분위기를 만드는 것뿐 아니라, 벽과 천장의 재료를 드러내고 공간 전체에 필요한 기본 밝기를 확보하는 역할도 합니다.",
          "KITTE의 복도에서는 벽 상부를 따라 이어지는 간접광이 목재의 결을 길게 드러내고, 시선을 복도 안쪽으로 이끕니다. 빛의 연속성은 긴 이동 공간의 방향과 깊이도 더욱 분명하게 만듭니다.",
          "다만 모든 밝기를 간접조명만으로 해결할 필요는 없습니다. 이동이나 작업에 더 많은 밝기가 필요한 곳에는 별도의 조명을 더해 기능을 보완하고, 밝은 면과 어두운 면의 차이를 통해 공간의 깊이를 만듭니다.",
        ]}
        emphasis={
          <>
            좋은 재료와 공간은
            <br />
            좋은 빛을 만났을 때 비로소 온전히 드러납니다.
          </>
        }
      >
        <div className="mx-auto max-w-3xl">
          <Figure
            src="06-kitte-marunouchi-wood-corridor.webp"
            width={1151}
            height={2048}
            place="KITTE MARUNOUCHI · TOKYO"
            caption="벽 상부의 간접광이 목재의 결을 드러내고, 필요한 위치의 조명이 복도의 밝기와 방향성을 보완합니다."
          />
        </div>
      </Chapter>

      <Chapter
        number="07"
        title="조명은 공간설계와 함께 시작되어야 합니다"
        paragraphs={[
          "조명계획은 공간설계가 끝난 뒤 천장에 등기구를 배치하는 작업이 아닙니다.",
          "비추고자 하는 공간과 재료, 가구의 위치가 정해져야 빛의 위치와 방향도 결정할 수 있습니다. 식탁의 위치가 정해져야 그 위의 빛을 계획할 수 있고, 침대와 소파의 방향이 정해져야 사람의 시야에 광원이 들어오는지 확인할 수 있습니다.",
          "생활 장면에 따라 조명을 나누어 사용하려면 전기배선과 스위치 구성도 설계 초기부터 함께 검토되어야 합니다.",
          "평면과 가구 배치를 모두 결정한 뒤 남은 천장에 조명 위치를 표시하는 것만으로는 충분하지 않습니다. 공간의 구획과 동선, 재료와 가구, 조명과 스위치는 하나의 계획 안에서 함께 움직여야 합니다.",
          "AND는 가능하면 광원이 사람의 주요 시야에 직접 노출되지 않도록 계획합니다. 그렇다고 모든 등기구를 반드시 감추지는 않습니다.",
          "광원을 숨기기 위해 필요 이상의 구조와 비용을 사용하는 것도 효율적인 설계라고 보기 어렵습니다. 등기구 자체가 공간의 중심을 만들거나 필요한 기능을 해결하고, 공간의 볼륨을 형성하는 분명한 역할이 있다면 드러낼 수 있습니다.",
          "반대로 등기구가 보여야 할 이유가 충분하지 않다면 더 절제된 방식으로 대체합니다.",
        ]}
        emphasis={
          <>
            중요한 것은 등기구의 존재감이 아니라,
            <br />그 빛이 공간과 생활에 남기는 결과입니다.
          </>
        }
      >
        <div className="mx-auto max-w-3xl">
          <Figure
            src="07-hermes-ginza-natural-light.webp"
            width={1535}
            height={2048}
            place="HERMÈS GINZA · TOKYO"
            caption="외피와 보이드, 재료와 이동 동선이 빛의 흐름과 함께 계획된 공간"
          />
        </div>
      </Chapter>

      <Chapter
        number="08"
        title="서로 다른 빛은 공간의 질서를 만듭니다"
        paragraphs={[
          "좋은 조명은 하나의 방식으로 공간 전체를 밝히는 것이 아니라, 서로 다른 빛이 각자의 역할을 나누는 데서 시작됩니다.",
          "아만도쿄 엘리베이터 로비에서는 천장 가장자리의 간접광이 공간 전체의 부드러운 분위기와 기본 밝기를 만듭니다.",
          "벽면을 향해 배치된 빛은 재료와 장식면의 질감을 드러냅니다. 반면 엘리베이터 문 앞 바닥에 모인 빛은 도착해야 할 위치를 자연스럽게 알려주고, 이동의 방향을 안내합니다.",
          "모든 벽과 바닥을 같은 밝기로 채울 필요는 없습니다. 각각의 빛이 무엇을 비추고 어떤 역할을 할 것인지 분명할 때 재료와 동선, 공간의 중심이 자연스럽게 읽힙니다.",
        ]}
        emphasis={
          <>
            빛은 단순히 밝기를 더하는 것이 아니라,
            <br />
            공간을 바라보고 이동하는 순서를 만듭니다.
          </>
        }
      >
        <div className="mx-auto max-w-3xl">
          <Figure
            src="08-aman-tokyo-elevator-lobby.webp"
            width={1536}
            height={2048}
            place="AMAN TOKYO · ELEVATOR LOBBY"
            caption="천장 간접광은 공간의 분위기를 만들고, 벽면을 비추는 빛은 재료를 드러내며, 엘리베이터 앞에 모인 빛은 이동 방향을 안내합니다."
          />
        </div>
      </Chapter>

      <Chapter
        number="09"
        title="밤이 기다려지는 공간"
        paragraphs={[
          "잘 계획된 조명은 단순히 어둠을 밝히는 데서 끝나지 않습니다.",
          "낮에는 창을 통과한 자연광이 공간과 재료를 드러냅니다. 해가 진 뒤에는 우리가 계획한 빛이 벽과 천장, 가구와 일상의 장면을 비추며 낮과는 다른 방식으로 공간의 깊이를 만들어냅니다.",
          "모든 조명을 켜지 않아도 됩니다.",
          "지금 머무는 장소에 필요한 빛, 바라보고 싶은 재료와 가구를 드러내는 빛만 남아도 공간은 충분히 편안할 수 있습니다.",
          "밤의 공간은 낮보다 어두워진 공간이 아닙니다. 계획된 빛을 통해 낮에는 보이지 않았던 또 다른 깊이와 표정이 드러나는 공간입니다.",
        ]}
        last
      >
        <div className="mx-auto max-w-7xl">
          <Figure
            src="09-dongtan-living-night-final.webp"
            width={1448}
            height={1086}
            place="DONGTAN APARTMENT · LIVING ROOM"
            caption="필요한 영역의 빛만 남겨 낮과 다른 깊이를 만든 거실"
          />
        </div>
        <p className="mx-auto mt-20 max-w-4xl text-center text-2xl font-light leading-[1.65] tracking-[-0.025em] text-[#4A433D] break-keep md:mt-28 md:text-4xl">
          매일 아침 따사로운 햇살을 기다리듯,
          <br />
          매일 저녁 해가 질 때에는 조명이 새롭게 드러내는
          <br />
          공간의 깊이와 볼륨을 기대할 수 있기를 바랍니다.
        </p>
      </Chapter>

      <BackToTop targetId="standard-scroll-container" />
    </main>
  );
}
