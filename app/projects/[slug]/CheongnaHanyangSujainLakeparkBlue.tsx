import Image from "next/image";
import { SectionHeading } from "./ProjectLayout";

const base = "/projects/cheongna-hanyang-sujain-lakepark-blue";
const images = [
  { name: "01-living-front-day", width: 1667, height: 943 },
  { name: "02-entry", width: 1254, height: 1254 },
  { name: "03-corridor", width: 887, height: 1773 },
  { name: "04-kitchen-day", width: 1672, height: 941 },
  { name: "05-kitchen-night", width: 1672, height: 941 },
  { name: "06-utility-kitchen", width: 1277, height: 1231 },
  { name: "07-dining", width: 1507, height: 1044 },
  { name: "08-living-side-day", width: 1672, height: 941 },
  { name: "09-living-side-night", width: 1672, height: 941 },
  { name: "10-living-front-night", width: 1667, height: 943 },
  { name: "11-bedroom-day", width: 1571, height: 1001 },
  { name: "12-bedroom-night", width: 1572, height: 1001 },
  { name: "13-dressing-entry", width: 1473, height: 1068 },
  { name: "14-dressing-mirror", width: 1078, height: 1459 },
  { name: "15-bathroom", width: 1381, height: 1139 },
  { name: "16-bathroom-detail", width: 1347, height: 1168 },
];

function Figure({ index, alt }: { index: number; alt: string }) {
  const image = images[index];
  return <Image src={`${base}/${image.name}.webp`} alt={alt} width={image.width} height={image.height} sizes="(max-width: 768px) 100vw, 1120px" quality={84} className="w-full h-auto" />;
}

export default function CheongnaHanyangSujainLakeparkBlue() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-8 md:px-16 mb-28 md:mb-36">
        <h2 className="text-3xl md:text-5xl font-light leading-[1.3] break-keep mb-10">따뜻한 재료로 기능을 감춘 집</h2>
        <div className="space-y-6 text-lg md:text-xl leading-[2] md:leading-[2.2] text-neutral-700 break-keep">
          <p>필요한 기능은 가구 안으로 정리하고, 따뜻한 재료와 은은한 빛을 일상 가까이에 두었습니다. 우드와 석재, 패브릭의 균형으로 완성하는 웜 미니멀 공간입니다.</p>
          <p>창을 가릴 수 있는 포켓도어 키친, 알파룸을 열어 만든 다이닝, 수납의 끝을 피팅룸처럼 활용한 드레스룸. 생활의 장면을 세심하게 정리하고, 현관부터 욕실까지 같은 온도의 재료와 빛으로 연결했습니다.</p>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Entrance & Corridor" title="들어서는 순간부터 따뜻하게" description="팬트리는 수납 기능에 집중하고, 현관에는 좌석과 오브제를 함께 배치해 작은 아트월을 만들었습니다. 거실로 이어지는 벽체와 천장에는 간접조명을 연결하고, 반대편 다운라이트와 월워셔로 입구의 밝기와 벽면의 표정을 정리했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <Figure index={1} alt="현관 들어서는 순간부터 따뜻하게 디자인 제안" />
          <Figure index={2} alt="현관 복도 들어서는 순간부터 따뜻하게 디자인 제안" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Kitchen" title="필요할 때 열리는 주방" description="창호가 있는 벽면에 포켓도어 키친을 계획했습니다. 사용하지 않을 때는 창과 작업 공간을 가구 안으로 감추어 정돈된 벽면으로 보이도록 했습니다. 깊이를 맞춘 상하부장은 붙박이 가구와 하나로 이어지고, 상하부 광원의 펜던트는 직부조명을 줄이면서 필요한 밝기를 채웁니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure index={3} alt="주방 낮 필요할 때 열리는 주방 디자인 제안" />
          <Figure index={4} alt="주방 밤 필요할 때 열리는 주방 디자인 제안" />
          <div className="max-w-2xl mx-auto"><Figure index={5} alt="보조주방 필요할 때 열리는 주방 디자인 제안" /></div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Dining" title="벽을 덜어내고, 식탁을 들이다" description="기존 알파룸의 벽체를 철거하는 계획으로 주방과 연결되는 다이닝을 구성했습니다. 현관에서 이어지는 벽지와 주방의 우드필름 사이에는 루버를 두어 서로 다른 재료가 자연스럽게 만나는 아트월을 만들었습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure index={6} alt="다이닝 벽을 덜어내고, 식탁을 들이다 디자인 제안" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Living Room" title="스톤의 깊이, 패브릭의 온기" description="빅슬랩 타일로 거실의 중심을 잡고, 우드와 패브릭을 곁들여 스톤의 차가운 물성을 부드럽게 풀었습니다. 낮에는 속커튼을 통과한 빛이 재료의 결을 드러내고, 밤에는 간접조명이 라운지에 차분한 깊이를 더합니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure index={7} alt="거실 측면 낮 스톤의 깊이, 패브릭의 온기 디자인 제안" />
          <Figure index={8} alt="거실 측면 밤 스톤의 깊이, 패브릭의 온기 디자인 제안" />
          <Figure index={9} alt="거실 정면 밤 스톤의 깊이, 패브릭의 온기 디자인 제안" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Bedroom" title="빛을 낮추고, 온기를 남기다" description="루버와 우드를 중심으로 침실의 따뜻한 바탕을 만들었습니다. 직부조명은 이동에 필요한 곳에만 두고, 헤드보드의 간접조명과 독서등으로 누운 자리의 눈부심을 줄였습니다. 빛의 역할을 나누어 하루를 편안하게 마무리하는 공간을 제안합니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-10 md:space-y-14">
          <Figure index={10} alt="침실 낮 빛을 낮추고, 온기를 남기다 디자인 제안" />
          <Figure index={11} alt="침실 밤 빛을 낮추고, 온기를 남기다 디자인 제안" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Dressing Room" title="수납 끝에서 만나는 피팅룸" description="붙박이 가구 끝에 전신거울과 루버를 배치했습니다. 바닥을 향하는 다운라이트로 발밑을 비추어, 옷을 고르고 착장을 확인하는 순간이 작은 피팅룸처럼 느껴지도록 계획했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <Figure index={12} alt="드레스룸 입구 수납 끝에서 만나는 피팅룸 디자인 제안" />
          <Figure index={13} alt="드레스룸 끝 수납 끝에서 만나는 피팅룸 디자인 제안" />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading eyebrow="Bathroom" title="같은 무드 안에서 나뉘는 영역" description="상부장 위아래와 샤워 공간 천장의 간접조명으로 전체 밝기를 확보했습니다. 젠다이의 우드 타일은 집 전체의 따뜻한 분위기를 잇고, 벽면과 샤워 바닥의 빅슬랩 타일은 일체감을 만듭니다. 세면 공간과 샤워부스의 바닥 마감을 달리해 영역의 경계는 시각적으로 분명하게 정리했습니다." />
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <Figure index={14} alt="욕실 같은 무드 안에서 나뉘는 영역 디자인 제안" />
          <Figure index={15} alt="KakaoTalk_20261028_143338317_07 같은 무드 안에서 나뉘는 영역 디자인 제안" />
        </div>
      </section>
    </>
  );
}

