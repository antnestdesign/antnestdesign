/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import styles from "./cheongna-launch.module.css";

const imageBase = "/images/events/cheongna-launch";

export const metadata: Metadata = {
  title: "AND 청라 런칭 이벤트",
  description:
    "청라 런칭 기념으로 선정된 3개 주거 프로젝트를 원가 시공으로 진행합니다. 무료 현장 실측, 실사형 3D 미리보기와 생활 상황별 지원 혜택을 확인하세요.",
  alternates: {
    canonical: "/events/cheongna-launch",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "AND 청라 런칭 이벤트",
    description:
      "청라 런칭 기념 3개 프로젝트 원가 시공과 특별 지원 혜택을 확인하세요.",
    url: "https://www.antnestdesign.com/events/cheongna-launch",
    images: [
      {
        url: `${imageBase}/hero-living.webp`,
        width: 1672,
        height: 941,
        alt: "청라 런칭 이벤트를 상징하는 따뜻한 우드와 석재 중심의 거실",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AND 청라 런칭 이벤트",
    description:
      "청라 런칭 기념 3개 프로젝트 원가 시공과 특별 지원 혜택을 확인하세요.",
    images: [`${imageBase}/hero-living.webp`],
  },
};

const benefits = [
  {
    number: "01",
    icon: "coin",
    title: "원가 시공",
    description: (
      <>
        청라 런칭 기념으로 선정된
        <br />
        3개 프로젝트를 원가 시공으로 진행합니다.
      </>
    ),
  },
  {
    number: "02",
    icon: "ruler",
    title: "무료 현장 실측",
    description: (
      <>
        실제 공간을 확인하고
        <br />
        구조와 공사 범위를 검토합니다.
      </>
    ),
  },
  {
    number: "03",
    icon: "cube",
    title: "실사형 3D 미리보기",
    description: (
      <>
        주요 공간의 설계 방향을
        <br />
        상담 과정에서 미리 확인합니다.
      </>
    ),
  },
  {
    number: "04",
    icon: "home",
    title: "생활 상황별 지원",
    description: (
      <>
        공사 시점과 거주 상황에 맞는
        <br />
        별도 혜택을 제공합니다.
      </>
    ),
  },
];

const standards = [
  {
    src: `${imageBase}/standard-living.webp`,
    alt: "생활 동선을 고려한 넓은 거실 공간",
    caption: "생활 동선에서 시작하는 설계",
  },
  {
    src: `${imageBase}/standard-kitchen.webp`,
    alt: "장식을 줄이고 재료감을 살린 아일랜드 주방",
    caption: "불필요한 장식을 덜어낸 공간",
  },
  {
    src: `${imageBase}/standard-window-living.webp`,
    alt: "창밖 녹지와 빛이 이어지는 거실 공간",
    caption: "재료와 빛이 오래 남는 집",
  },
];

const eligibility = [
  "청라 소재 아파트",
  "전체 또는 이에 준하는 범위의 리모델링",
  "공사 일정과 예산이 구체적인 프로젝트",
  "AND의 디자인 방향과 함께 조율 가능한 프로젝트",
  "완공 후 사진 촬영과 포트폴리오 공개가 가능한 프로젝트",
];

const steps = [
  "이벤트 상담 신청",
  "전화 상담",
  "무료 현장 실측",
  "프로젝트 선정 및 계약",
];

function BenefitIcon({ type }: { type: string }) {
  return (
    <span className={`${styles.benefitIcon} ${styles[type]}`} aria-hidden="true">
      <span />
    </span>
  );
}

export default function CheongnaLaunchPage() {
  return (
    <main className={styles.page} data-event-page="cheongna-launch">
      <Header />

      <section className={styles.hero} aria-labelledby="event-title">
        <img
          src={`${imageBase}/hero-living.webp`}
          alt="청라 런칭 이벤트를 상징하는 따뜻한 우드와 석재 중심의 거실"
          width={1672}
          height={941}
          loading="eager"
          fetchPriority="high"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />

        <div className={`${styles.container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrowLight}>EVENTS / 01</p>
            <h1 id="event-title" className={styles.heroTitle}>
              AND 청라
              <br />
              런칭 이벤트
            </h1>
            <p className={styles.heroLead}>
              청라 런칭 기념,
              <br />
              3개 프로젝트를
              <br />
              원가 시공으로 진행합니다.
            </p>
            <p className={styles.heroNote}>
              AND의 설계와 시공 기준은 그대로 유지합니다.
            </p>
            <Link
              href="/consultation?event=cheongna-launch"
              className={styles.primaryButton}
            >
              <span>이벤트 상담 신청</span>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.introduction} aria-labelledby="introduction-title">
        <div className={`${styles.container} ${styles.introductionGrid}`}>
          <div className={styles.introductionCopy}>
            <h2 id="introduction-title" className={styles.sectionTitle}>
              청라에서 함께 완성할
              <br />
              세 개의 공간을 찾습니다.
            </h2>
            <span className={styles.shortLine} aria-hidden="true" />
            <div className={styles.bodyCopy}>
              <p>ANTNEST DESIGN이 청라에서 새로운 프로젝트를 시작합니다.</p>
              <p>
                AND의 공간적 기준과 방향을 함께 구현할
                <br />
                세 개의 주거 프로젝트를 선정해
                <br />
                원가 시공으로 진행합니다.
              </p>
            </div>
            <p className={styles.eyebrowDark}>CHEONGNA LAUNCH PROJECT</p>
          </div>

          <figure className={styles.introductionImage}>
            <img
              src={`${imageBase}/launch-kitchen.webp`}
              alt="넓은 창과 아일랜드가 있는 절제된 주방 공간"
              width={1586}
              height={992}
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <section className={styles.benefits} aria-labelledby="benefits-title">
        <div className={styles.container}>
          <h2 id="benefits-title" className={styles.benefitsTitle}>
            이벤트 혜택
          </h2>
          <div className={styles.benefitGrid}>
            {benefits.map((benefit) => (
              <article className={styles.benefitItem} key={benefit.number}>
                <BenefitIcon type={benefit.icon} />
                <div className={styles.benefitText}>
                  <p className={styles.benefitNumber}>{benefit.number}</p>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.support} aria-label="생활 상황별 지원">
        <div className={`${styles.container} ${styles.supportGrid}`}>
          <article className={styles.supportCard}>
            <img
              src={`${imageBase}/temporary-home.webp`}
              alt="공사 기간 임시 거주 지원을 표현한 밝은 아파트 거실"
              width={1586}
              height={992}
              loading="lazy"
            />
            <div className={`${styles.supportShade} ${styles.supportShadeLight}`} />
            <div className={`${styles.supportCopy} ${styles.supportCopyDark}`}>
              <p>거주 중 공사</p>
              <h2>
                공사 기간에도,
                <br />
                생활권은 그대로.
              </h2>
              <div>
                현재 거주지와 가까운
                <br />
                동일 생활권에서
                <br />
                기존 주거 조건을 고려한
                <br />
                임시 거주 아파트를 지원합니다.
              </div>
            </div>
          </article>

          <article className={styles.supportCard}>
            <img
              src={`${imageBase}/moving-gift.webp`}
              alt="입주 선물을 표현한 조명과 화병이 놓인 콘솔"
              width={1586}
              height={992}
              loading="lazy"
              className={styles.giftImage}
            />
            <div className={`${styles.supportShade} ${styles.supportShadeDark}`} />
            <div className={`${styles.supportCopy} ${styles.supportCopyLight}`}>
              <p>입주 전 공사</p>
              <h2>
                새로운 생활을 위한,
                <br />
                또 하나의 준비.
              </h2>
              <div>
                임시 거주 아파트 지원에
                <br />
                상응하는 입주 선물을
                <br />
                제공합니다.
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.standard} aria-labelledby="standard-title">
        <div className={styles.container}>
          <div className={styles.standardHeading}>
            <p className={styles.eyebrowDark}>THE STANDARD REMAINS</p>
            <h2 id="standard-title" className={styles.standardTitle}>
              비용의 방식만 달라집니다. 공간을 대하는 기준은 그대로입니다.
            </h2>
          </div>

          <div className={styles.standardGrid}>
            {standards.map((item) => (
              <figure key={item.src} className={styles.standardItem}>
                <div className={styles.standardImageWrap}>
                  <img
                    src={item.src}
                    alt={item.alt}
                    width={1672}
                    height={941}
                    loading="lazy"
                  />
                </div>
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.application} aria-label="모집 대상과 신청 절차">
        <div className={`${styles.container} ${styles.applicationGrid}`}>
          <div className={styles.eligibility}>
            <h2>모집 대상</h2>
            <ul>
              {eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.process}>
            <h2>신청 절차</h2>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <p className={styles.processNote}>
              신청 순서가 아닌 프로젝트의 일정, 범위와
              <br />
              AND의 디자인 방향을 함께 검토해 선정합니다.
            </p>
          </div>

          <aside className={styles.finalCta} aria-labelledby="final-cta-title">
            <div>
              <p>AND 청라 런칭 이벤트</p>
              <h2 id="final-cta-title">
                청라의 세 공간을
                <br />
                기다립니다.
              </h2>
              <div>
                원가 시공과 특별 지원 혜택을
                <br />
                상담에서 자세히 안내합니다.
              </div>
            </div>
            <Link
              href="/consultation?event=cheongna-launch"
              className={styles.ctaButton}
            >
              <span>이벤트 상담 신청</span>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
