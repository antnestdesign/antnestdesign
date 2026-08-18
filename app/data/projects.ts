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
  thumbnailImage?: string;
  thumbnailObjectPosition?: string;
  heroAspectRatio?: string;
  hideProjectInformation?: boolean;
  location?: string;
  designScope?: string;
  constructionScope?: string;
  overview: string;
  gallery: string[];
  beforeImages: string[];
  featured: boolean;
  featuredOrder: number;
  status: string;
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
    heroImage: "/projects/apartment-a/01-hero.webp",
    overview:
      "부부와 초등학생 자녀가 거주하는 아파트로 부족한 수납 문제 해결과 생활 동선 개선을 중심으로 계획한 프로젝트입니다.",
    gallery: [
      "/projects/apartment-a/01-hero.webp",
      "/projects/apartment-a/02-living-room-overview.webp",
      "/projects/apartment-a/03-living-room-detail.webp",
      "/projects/apartment-a/04-kitchen-overview.webp",
      "/projects/apartment-a/05-kitchen-island.webp",
      "/projects/apartment-a/06-kitchen-pantry.webp",
      "/projects/apartment-a/07-utility-room.webp",
      "/projects/apartment-a/08-kitchen-detail.webp",
      "/projects/apartment-a/09-kitchen-detail-02.webp",
      "/projects/apartment-a/10-dressing-room-overview.webp",
      "/projects/apartment-a/11-dressing-room-detail.webp",
      "/projects/apartment-a/12-bathroom.webp",
      "/projects/apartment-a/13-entrance-overview.webp",
      "/projects/apartment-a/14-entrance-detail.webp",
    ],
    beforeImages: [
      "/projects/apartment-a/15-before-living-room.webp",
      "/projects/apartment-a/16-before-kitchen.webp",
      "/projects/apartment-a/17-before-bedroom.webp",
      "/projects/apartment-a/18-before-balcony.webp",
    ],
    featured: true,
    featuredOrder: 1,
    status: "Completed",
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
    images: 19,
    heroImage: "/projects/apartment-b/12-kitchen-front.webp",
    overview:
      "부부와 어린 두 아이의 생활을 중심으로 주방, 거실, 서재, 안방 동선을 다시 설계한 가족 중심 리모델링 프로젝트입니다.",
    gallery: [
      "/projects/apartment-b/07-entrance.webp",
      "/projects/apartment-b/08-corridor-view-01.webp",
      "/projects/apartment-b/09-corridor-view-02.webp",
      "/projects/apartment-b/10-living-room-overview.webp",
      "/projects/apartment-b/11-living-room-evening.webp",
      "/projects/apartment-b/12-kitchen-front.webp",
      "/projects/apartment-b/19-kitchen-island.webp",
      "/projects/apartment-b/18-study-homebar.webp",
      "/projects/apartment-b/13-master-bedroom.webp",
      "/projects/apartment-b/14-master-entry.webp",
      "/projects/apartment-b/15-dressing-room.webp",
      "/projects/apartment-b/16-master-bathroom.webp",
      "/projects/apartment-b/17-common-bathroom.webp",
    ],
    beforeImages: [
      "/projects/apartment-b/01-before-living.webp",
      "/projects/apartment-b/02-before-kitchen.webp",
      "/projects/apartment-b/03-before-corridor.webp",
      "/projects/apartment-b/04-before-common-bathroom.webp",
      "/projects/apartment-b/05-before-master-entry.webp",
      "/projects/apartment-b/06-construction.webp",
    ],
    featured: true,
    featuredOrder: 2,
    status: "Completed",
    residentialFeatured: true,
    residentialOrder: 2,
  },

  "antnest-design-office": {
    title: "인천 청라 AND OFFICE",
    cardTitle: "인천 청라 AND OFFICE",
    category: "Commercial Interior",
    projectGroup: "Commercial",
    type: "Office Interior",
    year: "2026",
    area: "110㎡",
    images: 13,
    heroImage: "/projects/antnest-design-office/01-hero-meeting-lounge.webp",
    thumbnailImage: "/projects/antnest-design-office/02-lounge.webp",
    heroAspectRatio: "4 / 3",
    location: "인천 청라",
    designScope: "전체 인테리어",
    constructionScope: "전체 철거 후 시공",
    overview:
      "인천 청라에 새롭게 문을 연 ANTNEST DESIGN의 사무실입니다. 전체 철거 후 회의, 협업, 개인 업무가 한 층 안에서 이어지도록 공간을 다시 구성했습니다.",
    gallery: [
      "/projects/antnest-design-office/04-entry-corridor.webp",
      "/projects/antnest-design-office/05-glass-corridor-work-lounge.webp",
      "/projects/antnest-design-office/06-glass-corridor-symmetry.webp",
      "/projects/antnest-design-office/12-corridor-to-workspace-final.webp",
      "/projects/antnest-design-office/07-meeting-room.webp",
      "/projects/antnest-design-office/02-lounge.webp",
      "/projects/antnest-design-office/08-lounge-seating.webp",
      "/projects/antnest-design-office/09-private-office.webp",
      "/projects/antnest-design-office/10-display-storage-detail.webp",
      "/projects/antnest-design-office/11-individual-office.webp",
    ],
    beforeImages: [
      "/projects/antnest-design-office/before-existing-space-wide.webp",
      "/projects/antnest-design-office/before-demolition.webp",
    ],
    featured: true,
    featuredOrder: 3,
    status: "Completed",
  },

  "cheongna-central-eileens-garden-84a": {
    title: "인천 청라 센트럴에일린의뜰 84A",
    cardTitle: "인천 청라 센트럴에일린의뜰 84A",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "84A",
    images: 24,
    heroImage:
      "/projects/cheongna-central-eileens-garden-84a/02-living-room.webp",
    thumbnailImage:
      "/projects/cheongna-central-eileens-garden-84a/02-living-room.webp",
    heroAspectRatio: "2000 / 1100",
    overview:
      "인천 청라 센트럴에일린의뜰 84A를 위한 인테리어 디자인 제안입니다. 같은 평면 안에서 공용 공간과 개인 공간의 흐름을 정리하고, 아일랜드의 방향과 보조주방 구성에 따라 달라지는 두 가지 주방 계획을 함께 제안했습니다.",
    gallery: [
      "/projects/cheongna-central-eileens-garden-84a/01-hero.webp",
      "/projects/cheongna-central-eileens-garden-84a/03-living-tv-wall.webp",
      "/projects/cheongna-central-eileens-garden-84a/04-entry-corridor.webp",
      "/projects/cheongna-central-eileens-garden-84a/05-entry-vanity.webp",
      "/projects/cheongna-central-eileens-garden-84a/06-hallway.webp",
      "/projects/cheongna-central-eileens-garden-84a/07-dressing-vanity.webp",
      "/projects/cheongna-central-eileens-garden-84a/08-master-bedroom-day.webp",
      "/projects/cheongna-central-eileens-garden-84a/09-master-bedroom-night.webp",
      "/projects/cheongna-central-eileens-garden-84a/10-master-bedroom-side-day.webp",
      "/projects/cheongna-central-eileens-garden-84a/11-master-bedroom-side-night.webp",
      "/projects/cheongna-central-eileens-garden-84a/12-study-bedroom-overview.webp",
      "/projects/cheongna-central-eileens-garden-84a/13-study-bedroom-vanity.webp",
      "/projects/cheongna-central-eileens-garden-84a/14-dining-room-overview.webp",
      "/projects/cheongna-central-eileens-garden-84a/15-dining-room.webp",
      "/projects/cheongna-central-eileens-garden-84a/16-kitchen-overview-panorama.webp",
      "/projects/cheongna-central-eileens-garden-84a/17-kitchen-front-closed.webp",
      "/projects/cheongna-central-eileens-garden-84a/18-kitchen-front-open.webp",
      "/projects/cheongna-central-eileens-garden-84a/19-kitchen-island-reverse.webp",
      "/projects/cheongna-central-eileens-garden-84a/20-kitchen-island.webp",
      "/projects/cheongna-central-eileens-garden-84a/21-utility-kitchen.webp",
      "/projects/cheongna-central-eileens-garden-84a/22-dressing-room-storage.webp",
      "/projects/cheongna-central-eileens-garden-84a/23-bathroom-overview.webp",
      "/projects/cheongna-central-eileens-garden-84a/24-bathroom-perspective.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 4,
    status: "Design Proposal / Rendering",
    residentialFeatured: true,
    residentialOrder: 3,
  },

  "cheongna-hanwha-kkumegreen-39a": {
    title: "인천 청라 한화꿈에그린 39A",
    cardTitle: "인천 청라 한화꿈에그린 39A",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "39A",
    images: 16,
    heroImage:
      "/projects/cheongna-hanwha-kkumegreen-39a/04-kitchen-dining-overview-panorama.webp",
    thumbnailImage:
      "/projects/cheongna-hanwha-kkumegreen-39a/01-hero.webp",
    thumbnailObjectPosition: "30% center",
    heroAspectRatio: "1926 / 816",
    overview:
      "인천 청라 한화꿈에그린 39A를 위한 아파트 인테리어 디자인 제안입니다. 3Bay 구조의 제한된 주방 폭과 부족한 안방 수납을 다이닝 재배치와 침대 헤드 가벽 뒤 드레스룸 확장으로 해결하고, 인더스트리얼 모던의 디자인 언어로 공간 전체를 연결했습니다.",
    gallery: [
      "/projects/cheongna-hanwha-kkumegreen-39a/04-kitchen-dining-overview-panorama.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/14-entry-sliding-door.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/13-entry-storage.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/12-entry-corridor.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/01-hero.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/02-living-dining-night.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/03-living-room-sofa.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/05-kitchen-island.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/11-study-room-overview.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/07-master-bedroom-day.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/08-master-bedroom-night.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/09-master-bedroom-dressing-room-extension.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/10-dressing-room-storage.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/06-dressing-vanity.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/15-bathroom-overview.webp",
      "/projects/cheongna-hanwha-kkumegreen-39a/16-bathroom-shower.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 5,
    status: "Design Proposal / Rendering",
    residentialFeatured: true,
    residentialOrder: 4,
  },

  "cheongna-hoban-4-33a": {
    title: "인천 청라 호반4차 33A",
    cardTitle: "인천 청라 호반4차 33A",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "33A",
    images: 10,
    heroImage: "/projects/cheongna-hoban-4-33a/01-hero.webp",
    overview:
      "인천 청라 호반4차 33A 실제 평면을 기준으로 계획한 인테리어 디자인 제안입니다. 거실과 주방을 하나의 열린 생활 공간으로 정리하고, 현관은 신발장과 팬트리 영역을 확장해 벤치가 있는 수납공간으로 구성했으며, 안방은 장으로 분할해 드레스룸 공간을 확장했습니다.",
    gallery: [
      "/projects/cheongna-hoban-4-33a/01-hero.webp",
      "/projects/cheongna-hoban-4-33a/02-living-room.webp",
      "/projects/cheongna-hoban-4-33a/03-living-kitchen.webp",
      "/projects/cheongna-hoban-4-33a/04-corridor.webp",
      "/projects/cheongna-hoban-4-33a/05-master-room.webp",
      "/projects/cheongna-hoban-4-33a/06-dressing-room.webp",
      "/projects/cheongna-hoban-4-33a/07-dressing-detail.webp",
      "/projects/cheongna-hoban-4-33a/08-entry-storage.webp",
      "/projects/cheongna-hoban-4-33a/09-bathroom.webp",
      "/projects/cheongna-hoban-4-33a/10-kitchen.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 7,
    status: "Rendering Proposal",
    residentialFeatured: true,
    residentialOrder: 6,
  },

  "cheongna-lynn-strauss": {
    title: "인천 청라 린 스트라우스 41평",
    cardTitle: "인천 청라 린 스트라우스 41평",
    category: "Residential Interior",
    projectGroup: "Residential",
    type: "Apartment Renovation",
    year: "2026",
    area: "41평",
    images: 13,
    heroImage: "/projects/cheongna-lynn-strauss/01-hero.webp",
    thumbnailImage: "/projects/cheongna-lynn-strauss/02-living-room.webp",
    heroAspectRatio: "2048 / 486",
    overview:
      "인천 청라 린 스트라우스 41평을 위한 인테리어 디자인 제안입니다. 넓은 면과 통합된 수납, 자연광을 닮은 조명 계획을 중심으로 거실과 주방, 드레스룸, 욕실의 흐름을 정리했습니다.",
    gallery: [
      "/projects/cheongna-lynn-strauss/02-living-room.webp",
      "/projects/cheongna-lynn-strauss/03-living-window.webp",
      "/projects/cheongna-lynn-strauss/04-dressing-vanity.webp",
      "/projects/cheongna-lynn-strauss/05-dressing-room.webp",
      "/projects/cheongna-lynn-strauss/06-entry-corridor.webp",
      "/projects/cheongna-lynn-strauss/07-master-bedroom-night.webp",
      "/projects/cheongna-lynn-strauss/08-master-bedroom-day.webp",
      "/projects/cheongna-lynn-strauss/09-kitchen.webp",
      "/projects/cheongna-lynn-strauss/10-kitchen-storage.webp",
      "/projects/cheongna-lynn-strauss/11-entry.webp",
      "/projects/cheongna-lynn-strauss/12-master-bathroom.webp",
      "/projects/cheongna-lynn-strauss/13-master-bathroom-detail.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 6,
    status: "Concept Proposal",
    residentialFeatured: true,
    residentialOrder: 5,
  },

  "luxury-house": {
    title: "화성 효행구 고급주택 신축공사",
    cardTitle: "화성 효행구 고급주택 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Luxury House",
    year: "2022",
    area: "600㎡",
    images: 4,
    heroImage: "/projects/luxury-house/01-hero.webp",
    overview:
      "조적타일, 현무암, 유리난간으로 구성된 외부와 높은 층고의 거실, 대형 박판타일, 초대형 샹들리에, 훈증무늬목 주방이 어우러진 고급주택 신축 프로젝트입니다.",
    gallery: [
      "/projects/luxury-house/01-hero.webp",
      "/projects/luxury-house/02-hall.webp",
      "/projects/luxury-house/03-living-room.webp",
      "/projects/luxury-house/04-kitchen.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 8,
    status: "Completed",
  },

  "private-house": {
    title: "인천 청라 단독주택 신축공사",
    cardTitle: "인천 청라 단독주택 신축공사",
    category: "Architecture",
    projectGroup: "Architecture",
    type: "Private House",
    year: "2018",
    area: "390㎡",
    images: 7,
    heroImage: "/projects/private-house/01-hero.webp",
    overview:
      "두 아이와 아내를 둔 한 아빠가 청라에 정착하기 위해 지은 첫 단독주택입니다. 북미 유학생활을 했던 아내의 취향을 반영해 클래식한 비례와 웨인스코팅, 높은 층고의 거실, 살라만더 시스템창호와 벽난로를 중심으로 계획했습니다.",
    gallery: [
      "/projects/private-house/01-hero.webp",
      "/projects/private-house/02-stair.webp",
      "/projects/private-house/03-hall.webp",
      "/projects/private-house/04-living-room.webp",
      "/projects/private-house/05-windows.webp",
      "/projects/private-house/06-art-wall.webp",
      "/projects/private-house/07-kitchen.webp",
    ],
    beforeImages: [],
    featured: true,
    featuredOrder: 9,
    status: "Completed",
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
    heroImage: "/home/commercial-house.webp",
    overview:
      "1~2층 상가, 3~4층 주거공간으로 구성된 상가주택 신축 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 10,
    status: "Completed",
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
    heroImage: "/home/officetel.webp",
    overview:
      "226실 규모의 오피스텔과 18개 상가를 포함한 대규모 복합건축 프로젝트.",
    gallery: [],
    beforeImages: [],
    featured: true,
    featuredOrder: 11,
    status: "Completed",
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
