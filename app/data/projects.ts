export type Project = {
  title: string;
  cardTitle: string;
  category: string;
  projectGroup: string;
  type: string;
  year: string;
  area: string;
  images: number;
  heroImage: string;
  overview: string;
  gallery: string[];
  beforeImages: string[];
  featured: boolean;
  featuredOrder: number;
  residentialFeatured?: boolean;
  residentialOrder?: number;
};

export const projects: Record<string, Project> = {
  "apartment-a": {
    title: "수원 살구골 현대7단지 37평",
    cardTitle: "수원 살구골 현대7단지 아파트",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "37평형",
    images: 18,
    heroImage: "/projects/apartment-a/01-hero.jpg",
    overview:
      "부부와 초등학생 자녀가 거주하는 아파트로 부족한 수납 문제 해결과 생활 동선 개선을 중심으로 계획한 프로젝트입니다.",
    gallery: [
      "/projects/apartment-a/01-hero.jpg",
      "/projects/apartment-a/02-living-room-overview.jpg",
      "/projects/apartment-a/03-living-room-detail.jpg",
      "/projects/apartment-a/04-kitchen-overview.jpg",
      "/projects/apartment-a/05-kitchen-island.jpg",
      "/projects/apartment-a/06-kitchen-pantry.jpg",
      "/projects/apartment-a/07-utility-room.jpg",
      "/projects/apartment-a/08-kitchen-detail.jpg",
      "/projects/apartment-a/09-kitchen-detail-02.jpg",
      "/projects/apartment-a/10-dressing-room-overview.jpg",
      "/projects/apartment-a/11-dressing-room-detail.jpg",
      "/projects/apartment-a/12-bathroom.jpg",
      "/projects/apartment-a/13-entrance-overview.jpg",
      "/projects/apartment-a/14-entrance-detail.jpg",
    ],
    beforeImages: [
      "/projects/apartment-a/15-before-living-room.jpg",
      "/projects/apartment-a/16-before-kitchen.jpg",
      "/projects/apartment-a/17-before-bedroom.jpg",
      "/projects/apartment-a/18-before-balcony.jpg",
    ],
    featured: true,
    featuredOrder: 1,
    residentialFeatured: true,
    residentialOrder: 1,
  },

  "apartment-b": {
    title: "화성 동탄역 모아미래도 34평",
    cardTitle: "화성 동탄역 모아미래도 아파트",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2025",
    area: "34평형",
    images: 20,
    heroImage: "/home/apartment-b.jpg",
    overview:
      "대형 아일랜드와 보조주방을 계획하여 주방이 집의 중심이 되도록 설계한 가족 중심 리모델링 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 2,
    residentialFeatured: true,
    residentialOrder: 2,
  },

  "luxury-house": {
    title: "화성 효행구 고급주택 신축공사",
    cardTitle: "화성 효행구 고급주택 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Luxury House",
    year: "2022",
    area: "600㎡",
    images: 15,
    heroImage: "/home/luxury-house.jpg",
    overview:
      "스크린골프장과 수영장을 포함한 모던 럭셔리 하우스 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 3,
  },

  "private-house": {
    title: "인천 청라 단독주택 신축공사",
    cardTitle: "인천 청라 단독주택 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Private House",
    year: "2018",
    area: "390㎡",
    images: 15,
    heroImage: "/home/private-house.jpg",
    overview:
      "북미 감성의 고급 단독주택으로 다수의 영화 촬영 협찬이 진행된 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 4,
  },

  "commercial-house": {
    title: "화성 병점구 상가주택 신축공사",
    cardTitle: "화성 병점구 상가주택 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Commercial House",
    year: "2017",
    area: "983㎡",
    images: 15,
    heroImage: "/home/commercial-house.jpg",
    overview:
      "1~2층 상가, 3~4층 주거공간으로 구성된 상가주택 신축 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 5,
  },

  officetel: {
    title: "인천 청라 오피스텔 + 상가 신축공사",
    cardTitle: "인천 청라 오피스텔 + 상가 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Mixed-use Development",
    year: "2013",
    area: "20,497㎡",
    images: 15,
    heroImage: "/home/officetel.jpg",
    overview:
      "226실 규모의 오피스텔과 18개 상가를 포함한 대규모 복합건축 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 6,
  },
};

export const projectList = Object.entries(projects)
  .map(([slug, project]) => ({
    slug,
    ...project,
  }))
  .sort((a, b) => a.featuredOrder - b.featuredOrder);

export const featuredProjects = projectList.filter(
  (project) => project.featured
);

export const residentialProjects = projectList
  .filter((project) => project.residentialFeatured)
  .sort(
    (a, b) =>
      (a.residentialOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.residentialOrder ?? Number.MAX_SAFE_INTEGER)
  );