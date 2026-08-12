import { ProjectImage, SectionHeading } from "./ProjectLayout";

const base = "/projects/antnest-design-office";

type ProjectFigureProps = {
  src: string;
  alt: string;
  caption: string;
  ratio?: string;
  quality?: number;
};

function ProjectFigure({
  src,
  alt,
  caption,
  ratio = "aspect-[4/3]",
  quality,
}: ProjectFigureProps) {
  return (
    <figure>
      <ProjectImage src={src} alt={alt} ratio={ratio} quality={quality} />
      <figcaption className="mt-3 text-xs leading-6 text-neutral-500 md:text-sm break-keep">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function AntnestDesignOffice() {
  return (
    <>
      <section className="max-w-5xl mx-auto px-8 md:px-16 mb-28 md:mb-40">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <p className="md:col-span-3 uppercase tracking-[0.35em] text-[10px] md:text-xs text-neutral-500">
            Project Overview
          </p>

          <div className="md:col-span-8 md:col-start-5 space-y-7 text-[15px] md:text-lg leading-8 md:leading-9 text-neutral-700 break-keep">
            <p>
              인천 청라에 새롭게 문을 연 ANTNEST DESIGN의 사무실입니다. 전체 철거 후 회의,
              협업, 개인 업무가 한 층 안에서 자연스럽게 이어지도록 공간을 다시 구성했습니다.
            </p>
            <p>
              유리 파티션으로 복도와 각 실의 시선을 연결하고, 회의실과 라운지를 하나의 중심
              공간으로 배치했습니다. 개인 업무실에는 수납과 조명을 함께 계획해 집중할 수 있는
              환경을 정리했습니다.
            </p>
            <p className="border-l border-neutral-400 pl-6 text-xl md:text-3xl font-light leading-[1.45] text-neutral-800">
              열린 시선과 분명한 업무 구획.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Existing Space"
          title="기존 공간에서 시작한 재구성"
          description="기존 사무실의 개방형 평면과 설비 조건을 확인하고, 전체 철거 후 새로운 동선과 업무 구획을 구성했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-8 md:space-y-12">
          <ProjectFigure
            src={`${base}/before-demolition.webp`}
            alt="전체 철거 전 기존 집기 철거를 준비하는 사무실"
            caption="전체 철거 전 기존 사무실의 모습."
            ratio="aspect-[4/3]"
            quality={82}
          />
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <ProjectFigure
              src={`${base}/before-existing-space-wide.webp`}
              alt="전체 철거 후 비워진 사무실 공간"
              caption="전체 철거 후 새로운 계획을 준비하는 비워진 공간."
              ratio="aspect-[4/3]"
              quality={82}
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Entrance & Circulation"
          title="브랜드에서 업무공간으로 이어지는 진입"
          description="AND 사인과 간접조명이 있는 진입부에서 유리 파티션 복도로 자연스럽게 이어집니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <ProjectFigure
            src={`${base}/04-entry-corridor.webp`}
            alt="AND 로고와 식재, 간접조명이 있는 사무실 진입 복도"
            caption="AND 사인과 식재가 보이는 사무실 진입 복도."
          />
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Transparent Boundary"
          title="시선을 막지 않는 경계"
          description="유리 파티션으로 복도와 각 업무실을 구분하면서도 빛과 시선이 이어지도록 했습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-8 md:space-y-12">
          <ProjectFigure
            src={`${base}/06-glass-corridor-symmetry.webp`}
            alt="양쪽 유리 파티션 사이로 이어지는 사무실 내부 복도"
            caption="양쪽 유리 파티션 사이로 이어지는 내부 복도."
          />
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <ProjectFigure
              src={`${base}/05-glass-corridor-work-lounge.webp`}
              alt="유리벽 너머 라운지와 업무공간이 함께 보이는 사무실 동선"
              caption="유리벽 너머 라운지와 업무공간이 함께 보이는 동선."
            />
            <ProjectFigure
              src={`${base}/12-corridor-to-workspace-final.webp`}
              alt="복도 끝 업무공간으로 이어지는 유리 파티션 동선"
              caption="업무공간으로 이어지는 복도와 유리 파티션."
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Meeting & Lounge"
          title="회의와 대화, 휴식이 이어지는 중심 공간"
          description="회의 테이블과 라운지를 인접하게 배치해 공식 회의와 짧은 대화, 휴식이 한 영역 안에서 이어집니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-8 md:space-y-12">
          <ProjectFigure
            src={`${base}/07-meeting-room.webp`}
            alt="대형 테이블과 벽면 모니터를 배치한 회의실"
            caption="대형 테이블과 모니터를 배치한 회의실."
          />
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <ProjectFigure
              src={`${base}/02-lounge.webp`}
              alt="소파와 검은 가죽 라운지 체어, 플로어 램프가 있는 라운지"
              caption="소파와 라운지 체어, 작품을 배치한 휴게 공간."
            />
            <ProjectFigure
              src={`${base}/08-lounge-seating.webp`}
              alt="액자와 라운지 가구가 보이는 동일한 라운지의 다른 조도 장면"
              caption="같은 라운지를 조도를 달리해 담은 장면."
            />
          </div>
        </div>
      </section>

      <section className="mb-28 md:mb-40">
        <SectionHeading
          eyebrow="Private Workspace"
          title="집중을 위한 개인 업무공간"
          description="개인 업무실은 책상과 수납을 중심으로 구성하고, 다크 우드와 간접조명으로 공용 공간과 다른 분위기를 만들었습니다."
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-8 md:space-y-12">
          <ProjectFigure
            src={`${base}/09-private-office.webp`}
            alt="다크 우드 수납장과 데스크가 있는 개인 업무실"
            caption="다크 우드 수납과 데스크로 구성한 개인 업무실."
          />
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <ProjectFigure
              src={`${base}/10-display-storage-detail.webp`}
              alt="간접조명 수납장과 벽면 TV가 있는 개인 업무실"
              caption="간접조명 수납장과 TV가 보이는 개인 업무실의 한 면."
            />
            <ProjectFigure
              src={`${base}/11-individual-office.webp`}
              alt="블라인드 창과 데스크를 배치한 개별 업무실"
              caption="블라인드 창과 데스크를 배치한 개별 업무실."
            />
          </div>
        </div>
      </section>
    </>
  );
}
