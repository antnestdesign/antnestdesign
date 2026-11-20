import Image from "next/image";
import { SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-exllu-tower";
const sections = [
  {
    eyebrow: "Living Room",
    title: "깊이가 다른 벽을 하나로",
    description: "단차가 있던 거실 벽을 우드 아트월로 정리하고, 안방 문은 히든도어로 계획해 벽면이 한 면처럼 이어지도록 했습니다. 아치형 니치와 세로 루버로 표정을 더하고, 기둥 옆 비어 있던 코너에는 작은 테이블과 펜던트를 두었습니다.",
    images: [
      { name: "02-living-artwall", alt: "아치형 니치와 세로 루버 선반을 둔 거실 아트월" },
      { name: "03-living-day", alt: "속커튼으로 낮빛을 거른 소파와 라운지체어" },
      { name: "04-living-night", alt: "펜던트 조명이 코너를 밝히는 밤의 거실" },
    ],
  },
  {
    eyebrow: "Kitchen & Dining",
    title: "높이를 달리한 두 상판",
    description: "공간이 넉넉하지 않은 주방에는 밝은 석재 상판의 아일랜드에 한 단 낮은 식탁을 맞붙였습니다. 조리와 식사의 자리를 한곳에 모으고, 다크 우드로 마감해 화이트와 밝은 우드가 주를 이루는 집에 차분한 대비를 주었습니다.",
    images: [
      { name: "05-kitchen-living-night", alt: "매입 조명을 켠 주방과 거실 전경" },
      { name: "06-kitchen-day", alt: "석재 아일랜드에 우드 식탁을 맞붙인 주방의 낮" },
      { name: "07-kitchen-night", alt: "조리대에 빛을 모은 주방의 밤" },
    ],
  },
  {
    eyebrow: "Entrance & Corridor",
    title: "발밑에서 거실까지",
    description: "복도의 기존 아트월에 우드 루버와 간접조명을 더했습니다. 유리 중문 너머로 그 벽면이 보여 현관에서부터 집의 분위기가 이어집니다. 수납장 아래의 간접등은 발밑을 밝혀 직접 조명 사용을 줄여 줍니다.",
    images: [
      { name: "08-entry", alt: "양쪽 수납장 아래에 간접조명을 둔 현관과 유리 중문" },
      { name: "09-entry-corridor", alt: "거실 창으로 시선이 이어지는 현관 복도" },
      { name: "10-living-corridor", alt: "거실 아트월과 주방 사이에서 바라본 복도" },
    ],
  },
  {
    eyebrow: "Bedroom",
    title: "침실 안의 작은 티타임",
    description: "라디에이터가 자리를 차지하던 안방 창가에 벤치와 작은 테이블을 두어 차 한 잔 마실 자리를 마련했습니다. 낮에는 블라인드 사이로 빛이 들고, 밤에는 우드 헤드보드 옆과 창가의 간접조명이 은은하게 공간을 밝힙니다.",
    images: [
      { name: "11-bedroom-day", alt: "블라인드 사이로 낮빛이 드는 안방과 창가 벤치" },
      { name: "12-bedroom-night", alt: "헤드보드 옆과 창 상부 간접조명을 켠 안방" },
      { name: "13-bedroom-closet", alt: "끝을 둥글게 마감한 안방 붙박이장과 선반" },
      { name: "14-bedroom-passage", alt: "안방 수납에서 이어지는 통로" },
    ],
  },
  {
    eyebrow: "Dressing Room",
    title: "수납 옆에 마련한 파우더 공간",
    description: "붙박이장으로 수납을 확보하고, 기둥 옆 벽면에는 상부장과 우드 상판을 짜 넣어 파우더 공간을 마련했습니다. 상부장 아래와 붙박이장 하부의 간접조명이 손이 닿는 자리와 발밑을 은은하게 비춥니다.",
    images: [
      { name: "15-dressing-room", alt: "블라인드와 벤치, 붙박이장이 있는 드레스룸" },
      { name: "16-dressing-mirror", alt: "창을 비추는 아치형 전신거울과 우드 상판" },
    ],
  },
  {
    eyebrow: "Bathroom",
    title: "빛은 통하고 시선은 가리는",
    description: "작은 욕실은 모루 유리 파티션으로 샤워 공간과 세면 공간을 나눴습니다. 유리의 세로결은 시선을 가리면서도 빛은 통과시키고, 파티션 양쪽의 마감을 달리해 두 영역의 경계를 분명히 했습니다.",
    images: [
      { name: "17-bathroom", alt: "세로결 유리 파티션과 벽걸이 세면대, 거울장 조명이 있는 욕실" },
    ],
  },
];

export default function CheongnaExlluTower() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <h2 className="text-3xl md:text-5xl font-light leading-[1.3] break-keep mb-10">화이트와 우드가 만나는 집</h2>
        <p className="text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          화이트와 밝은 우드를 바탕으로 북유럽 인테리어의 담백한 분위기를 담았습니다. 두 면의 창에서 들어오는 자연광은 거실과 주방을 함께 밝히고, 주방의 다크 우드는 밝은 공간에 깊이를 더합니다. 기둥 옆 코너와 안방 창가처럼 쓰임이 애매했던 자리에는 잠시 머물 곳을 마련했습니다.
        </p>
      </section>

      {sections.map(({ eyebrow, title, description, images }) => (
        <section key={eyebrow} className="mb-28 md:mb-40">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10">
            {images.map(({ name, alt }, index) => {
              const wide = images.length % 2 === 1 && index === 0;
              return (
                <Image
                  key={name}
                  src={`${base}/${name}.webp`}
                  alt={alt}
                  width={1672}
                  height={941}
                  sizes={wide ? "(max-width: 768px) 100vw, 1152px" : "(max-width: 768px) 100vw, 556px"}
                  quality={84}
                  className={wide ? "w-full h-auto md:col-span-2" : "w-full h-auto"}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
