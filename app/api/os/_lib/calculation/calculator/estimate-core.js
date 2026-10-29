import { bathroomRates } from "../rates/bathroom.js";
import { kitchenRates } from "../rates/kitchen.js";
import { doorRates } from "../rates/door.js";
import { finishMaterialRates } from "../rates/finish.js";
import { miscRates } from "../rates/misc.js";
import { bathroomDetails } from "./bathroom.js";
import { kitchenDetails } from "./kitchen.js";
import { doorDetails } from "./door.js";
import { wallpaperMaterialDetails, wallpaperSupplyDetail, filmMaterialDetail } from "./finish.js";
import { miscDetails } from "./misc.js";
import { ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS } from "../estimate-inputs.js";
export { ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS };
import { COST_ITEM_DEFINITIONS } from "../../../../../../public/os-app/src/cost-item-definitions.js";
export { COST_ITEM_DEFINITIONS };

export function createEstimateCalculation(options = {}) {
const rates = options.rates ?? structuredClone({
  lowerPerJa: 120000,
  upperPerJa: 90000,
  islandPerJa: 180000,
  homebarStorageBaseJa: 3,
  homebarBuildPerJa: 210000,
  tallPerJa: 130000,
  storagePerJa: 130000,
  fridgeLaundryPerJa: 90000,
  shoePerJa: 80000,
  pantryPerJa: 65000,
  pantryDrawer: 270000,
  builtInPerJa: 160000,
  hangerPerJa: 90000,
  riceCabinetPerUnit: 560000,
  endPanelShallow: 90000,
  endPanelDeep: 130000,
  drawer: 60000,
  bachmannOutlet: 160000,
  lightingPerCabinetUnit: 240000,
  t3LightingUnit: 50000,
  standardLighting: {
    downlight: 10000,
    square: 35000,
    cylinder: 30000,
    t3PerM: 10000,
    bedWallLight: 200000,
  },
  demolition: {
    floorPerPyeong: 30000,
    decoTilePerPyeong: 15000,
    furniturePerJa: 25000,
    bathroomWaterproof: 800000,
    ceilingPerPyeong: 160000,
    elevatorProtect: 200000,
    elevatorProtectRemoval: 50000,
    permit: 200000,
    consent: 150000,
  },
  electrical: {
    workerDay: 300000,
    helperDay: 250000,
    under10YearsDays: 6,
    over10YearsDays: 8,
    wiring: 600000,
    standardSwitch: 400000,
  },
  finish: {
    tileWorkerDay: 350000,
    tileHelperDay: 280000,
    tileGrout: 350000,
    wallpaperWorkerDay: 300000,
    wallpaperMaterialPerPyeong: 10000,
    filmWorkerDay: 280000,
    flooringPerPyeong: 150000,
    silicone: 450000,
    elasticBase: 650000,
    elasticExtraRoom: 250000,
  },
  carpentry: {
    workerDay: 300000,
    machineDay: 150000,
    lifting: 200000,
    subsidiary: 150000,
    curtainBoxDaysPerTwo: 1,
    cofferNewDays: 2,
    cofferChangeDays: 1.5,
    artwallDaysPerM: 0.3,
    hiddenDoorDays: 1,
    lineLightDaysPerM: 0.1,
    indirectLightDays: 0.1,
    ceilingFanUnit: 500000,
    dropCeilingDays: 0.5,
    moldingDays: 2,
    baseboardDays: 1,
    boardWidth: 2400,
    boardHeight: 1200,
    studSpacing: 450,
    studPieceLength: 3600,
    studPiecesPerBundle: 12,
    wasteFactor: 1.15,
    drywallSheet: 4500,
    mdfSheet: 12500,
    plywoodSheet: 30000,
    studBundle: 22000,
  },
  countertop: {
    himacs: { label: "하이막스", costPerM: 220000 },
    khanstone: { label: "칸스톤", costPerM: 360000, slabCost: 1500000, factoryCost: 700000, installCost: 900000 },
    ceramic: { label: "세라믹", costPerM: 520000, slabCost: 1500000, factoryCost: 700000, installCost: 900000 },
    epPanel: { label: "EP판", costPerM: 130000 },
    none: { label: "없음", costPerM: 0 },
  },
  bathroom: bathroomRates,
  kitchen: kitchenRates,
  door: doorRates,
  finishMaterial: finishMaterialRates,
  misc: miscRates,
});

const floorThousand = (value) => Math.floor(value / 1000) * 1000;

const customerWon = (value) => `${floorThousand(value).toLocaleString("ko-KR")}원`;

const mmToM = (mm) => mm / 1000;

const mmText = (mm) => `${Math.round(mm).toLocaleString("ko-KR")}mm`;

const quantityText = (value, suffix) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${suffix}`;
};

const mText = (meters) => mmText(meters * 1000);

const jaRounded = (mm) => (mm <= 0 ? 0 : Math.ceil(mm / 300));

const sellPrice = (cost, margin, correction = 0) => (cost * (1 + margin)) * (1 + correction);

const markupRate = (profit, cost) => (cost > 0 ? profit / cost : 0);

const epUnitPrice = (depth) => (depth === "shallow" ? rates.endPanelShallow : rates.endPanelDeep);

const epDepthLabel = (depth) => (depth === "shallow" ? "400mm 이하" : "400mm 초과");

const slabMaterials = new Set(["khanstone", "ceramic"]);

const isSlabMaterial = (material) => slabMaterials.has(material);

const slabBaseCost = (material) =>
  rates.countertop[material].slabCost + rates.countertop[material].factoryCost + rates.countertop[material].installCost;

function countertopCost(material, billingM) {
  if (isSlabMaterial(material)) return slabBaseCost(material);
  return billingM * rates.countertop[material].costPerM;
}

function countertopQuantity(material, billingM) {
  if (isSlabMaterial(material)) return "1장 + 가공/시공";
  return mText(billingM);
}

function makeDetail({ group, item, input, quantity, unitPrice, cost, margin, correction = 0, customerRevenue: fixedCustomerRevenue }) {
  const hasFixedCustomerRevenue = Number.isFinite(Number(fixedCustomerRevenue));
  const revenue = hasFixedCustomerRevenue ? Number(fixedCustomerRevenue) : sellPrice(cost, margin, correction);
  const customerRevenue = hasFixedCustomerRevenue ? Number(fixedCustomerRevenue) : floorThousand(revenue);
  return {
    group,
    item,
    input,
    quantity,
    unitPrice,
    cost,
    correction,
    revenue,
    customerRevenue,
    profit: customerRevenue - cost,
  };
}

function addDetail(details, config) {
  if (config.cost <= 0 && !(Number(config.customerRevenue) > 0)) return;
  details.push(makeDetail(config));
}

function addModuleDetails(details, items, margin, correction) {
  for (const item of items.filter(Boolean)) {
    addDetail(details, {
      ...item,
      margin,
      correction,
    });
  }
}

function addT3Detail(details, { group, label, units, margin, corrections }) {
  if (units <= 0) return;
  addDetail(details, {
    group,
    item: `${label} 간접조명(T3)`,
    input: `${units}라인`,
    quantity: `${units}라인`,
    unitPrice: rates.t3LightingUnit,
    cost: units * rates.t3LightingUnit,
    margin,
    correction: corrections.option,
  });
}

function addStorageDetails(details, { group, label, enabled, mm, depth, endPanels, bodyUnitPrice, lightingUnits, t3Units, margin, corrections }) {
  if (!enabled || mm <= 0) return 0;
  const ja = jaRounded(mm);
  addDetail(details, {
    group,
    item: `${label} 몸통`,
    input: mmText(mm),
    quantity: `${ja}자`,
    unitPrice: bodyUnitPrice,
    cost: ja * bodyUnitPrice,
    margin,
    correction: corrections.base,
  });
  addDetail(details, {
    group,
    item: `${label} EP`,
    input: `${endPanels}장 / ${epDepthLabel(depth)}`,
    quantity: `${endPanels}장`,
    unitPrice: epUnitPrice(depth),
    cost: endPanels * epUnitPrice(depth),
    margin,
    correction: corrections.option,
  });
  if (lightingUnits > 0) {
    addDetail(details, {
      group,
      item: `${label} 라인조명`,
      input: `${lightingUnits}통`,
      quantity: `${lightingUnits}통`,
      unitPrice: rates.lightingPerCabinetUnit,
      cost: lightingUnits * rates.lightingPerCabinetUnit,
      margin,
      correction: corrections.option,
    });
  }
  addT3Detail(details, { group, label, units: t3Units, margin, corrections });
  return ja;
}

function addUnitDetail(details, { group, item, enabled, input, quantity, unitPrice, units, margin, correction }) {
  if (!enabled || units <= 0) return;
  addDetail(details, {
    group,
    item,
    input,
    quantity,
    unitPrice,
    cost: units * unitPrice,
    margin,
    correction,
  });
}

function islandSideFinishCalc(material, count, sideLengthM) {
  if (count <= 0) return { quantity: "0개", cost: 0 };
  if (material === "himacs") {
    const billingM = 0.9 * count;
    return {
      quantity: `${count}개 / ${mText(billingM)}`,
      cost: billingM * rates.countertop.himacs.costPerM,
    };
  }
  if (isSlabMaterial(material)) {
    return {
      quantity: `${count}개 / 1판 + 가공/시공`,
      cost: slabBaseCost(material),
    };
  }
  const billingM = sideLengthM * count;
  return {
    quantity: `${count}개 / ${mText(billingM)}`,
    cost: billingM * rates.countertop.epPanel.costPerM,
  };
}

const quoteGroupLabels = {
  demolition: "철거",
  electrical: "전기/조명",
  standardLighting: "전기/조명",
  bathroom: "욕실",
  tile: "욕실",
  kitchen: "가구",
  door: "도어/창호",
  misc: "기타",
  wallpaper: "도배",
  film: "필름",
  flooring: "바닥",
  silicone: "마감",
  elastic: "마감",
  carpentry: "목공",
  base: "가구",
  island: "가구",
  homebar: "가구",
  shoe: "가구",
  fridgeLaundry: "가구",
  pantry: "가구",
  builtIn: "가구",
  hanger: "가구",
};

const quoteGroupOrder = ["철거", "욕실", "전기/조명", "목공", "가구", "도배", "필름", "바닥", "마감", "도어/창호", "기타"];

const flooringSheetGradeOptions = options.flooringSheetGradeOptions ?? structuredClone({
  t18: { label: "1.8T", unitPrice: 27000 },
  t20: { label: "2T", unitPrice: 36000 },
  t22: { label: "2.2T", unitPrice: 46000 },
  t32: { label: "3.2T", unitPrice: 73000 },
  t45: { label: "4.5T", unitPrice: 90000 },
  t50: { label: "5T", unitPrice: 100000 },
});

const flooringWoodGradeOptions = options.flooringWoodGradeOptions ?? structuredClone({
  editone: { label: "LX 에디톤급", unitPrice: 150000 },
  standard: { label: "일반마루", unitPrice: 100000 },
});

const customerItemNames = {
  "마루철거": "바닥 철거",
  "화장실 철거 방수": "욕실 철거 및 방수",
  "타일 기공": "타일 시공",
  "타일 조공": "타일 시공",
  "타일 메지": "줄눈 마감",
  "욕실 포세린 타일 자재+잡자재": "AND표준 포세린 타일",
  "도기·수전·장식장·악세사리 기본세트": "AND표준 욕실 도기 및 수전",
  "도기·수전·장식장·악세사리 기본세트(AND 실속)": "AND실속 욕실 도기 및 수전",
  "도기·수전·장식장·악세사리 기본세트(AND 고급)": "AND고급 욕실 도기 및 수전",
  "도기·수전·장식장·악세사리 설치비": "욕실 도기 및 수전 시공",
  "휴젠트 옵션": "휴젠트 설치비",
  "AND 표준설비 설치비": "주방 설비 시공",
  "싱크볼(깜포르떼960 기준)": "싱크볼(깜포르떼960급)",
  "싱크수전(라우체급 기준)": "싱크수전(라우체급)",
  "후드(하츠 아일랜드 후드 기준)": "후드(하츠 아일랜드 후드급)",
  "전기 인건비": "전기 시공",
  "전기 배선비(전선/후렉시블)": "배선 자재",
  "AND 표준 콘센트 스위치(르그랑 급)": "AND표준 콘센트·스위치",
  "목공 인건비": "목공 시공",
  "목공 기계품": "장비 사용",
  "목공 양중": "자재 운반",
  MDF: "MDF 자재",
  "다루끼": "각재",
  "도배 인건비": "도배 시공",
  "도배지(베스띠급)": "벽지(AND표준 베스띠급)",
  "도배지(디아망급)": "벽지(AND표준 디아망급)",
  "도배지(디아망 포티스급)": "벽지(AND표준 디아망 포티스급)",
  "공용부 도배지(베스띠급)": "공용부 벽지(베스띠급)",
  "공용부 도배지(디아망급)": "공용부 벽지(디아망급)",
  "공용부 도배지(디아망 포티스급)": "공용부 벽지(디아망 포티스급)",
  "각방 도배지(베스띠급)": "각방 벽지(베스띠급)",
  "각방 도배지(디아망급)": "각방 벽지(디아망급)",
  "각방 도배지(디아망 포티스급)": "각방 벽지(디아망 포티스급)",
  "필름 인건비": "필름 시공",
  "필름 자재(우드 무늬)": "필름(AND표준 우드)",
  "바닥 시공(장판 1.8T)": "장판(1.8T)",
  "바닥 시공(장판 2T)": "장판(2T)",
  "바닥 시공(장판 2.2T)": "장판(2.2T)",
  "바닥 시공(장판 3.2T)": "장판(3.2T)",
  "바닥 시공(장판 4.5T)": "장판(4.5T)",
  "바닥 시공(장판 5T)": "장판(5T)",
  "바닥 시공(LX 에디톤급)": "마루(LX 에디톤급)",
  "바닥 시공(일반마루)": "마루(일반마루)",
  "바닥 시공": "바닥(AND표준 마루)",
  "일반 폐기물": "폐기물 처리",
  "입주청소": "준공 청소",
  "기존 배관 청소": "기존 배관 청소",
};

function customerItemName(item) {
  if (customerItemNames[item]) return customerItemNames[item];
  return item
    .replace("몸통", "제작")
    .replace("냉장고 및 세탁기장", "냉장고장")
    .replace("옷장(붙박이장)", "붙박이장")
    .replace(/\bEP(?!판)\b/g, "EP판");
}

const groupTotalFromDetails = (details, group) =>
  details.filter((item) => item.group === group).reduce((sum, item) => sum + item.revenue, 0);

const floorDemolitionLabel = (material) => ({
  wood: "마루 철거",
  vinyl: "장판 철거",
  decoTile: "데코타일 철거",
}[material] || "바닥 철거");

const floorDemolitionUnitPrice = (material) => ({
  wood: rates.demolition.floorPerPyeong,
  vinyl: 0,
  decoTile: rates.demolition.decoTilePerPyeong,
}[material] || 0);

const wallpaperDays = (preset, baseCoat) => {
  const table = {
    p20: baseCoat ? 6 : 5,
    p30: baseCoat ? 7 : 6,
    p40: baseCoat ? 11 : 9,
    p50: baseCoat ? 15 : 11,
  };
  return table[preset] || 0;
};

const wallpaperLabel = (preset) => ({
  p20: "20평대",
  p30: "30평대",
  p40: "40평대",
  p50: "50평 이상",
}[preset] || "미선택");

const filmDays = (preset) => ({
  p20: 6,
  p30: 9,
  p40: 12,
  p50: 15,
}[preset] || 0);

const filmLabel = (preset) => ({
  p20: "20평대",
  p30: "30평대",
  p40: "40평대",
  p50: "50평 이상",
}[preset] || "미선택");

const boardArea = () => rates.carpentry.boardWidth * rates.carpentry.boardHeight;

const boardCountWithWaste = (rawCount) => (rawCount <= 0 ? 0 : Math.ceil(rawCount * rates.carpentry.wasteFactor));

const carpentryCofferDays = (type) => ({
  new: rates.carpentry.cofferNewDays,
  change: rates.carpentry.cofferChangeDays,
}[type] || 0);

function carpentryLaborDays(state) {
  const ceilingWorkDays = state.carpentryCurtainBoxEnabled
    ? (
      (state.carpentryCurtainBoxUnits / 2) * rates.carpentry.curtainBoxDaysPerTwo +
      carpentryCofferDays(state.carpentryCofferType) +
      state.carpentryDropCeilingUnits * rates.carpentry.dropCeilingDays +
      state.carpentryIndirectLightUnits * rates.carpentry.indirectLightDays +
      mmToM(state.carpentryLineLightM) * rates.carpentry.lineLightDaysPerM
    )
    : 0;

  return (
    ceilingWorkDays +
    mmToM(state.carpentryArtwallM) * rates.carpentry.artwallDaysPerM +
    mmToM(state.carpentryPartitionM) * rates.carpentry.artwallDaysPerM +
    state.carpentryHiddenDoorUnits * rates.carpentry.hiddenDoorDays +
    (state.carpentryMoldingEnabled ? rates.carpentry.moldingDays : 0) +
    (state.carpentryBaseboardEnabled ? rates.carpentry.baseboardDays : 0)
  );
}

function carpentryMaterialCounts(state) {
  const wallLength = state.carpentryArtwallM;
  const partitionLength = state.carpentryPartitionM;
  const wallArea = wallLength * state.carpentryCeilingHeight;
  const partitionArea = partitionLength * state.carpentryCeilingHeight;
  const artwallBoards = wallArea > 0 ? Math.ceil(wallArea / boardArea()) : 0;
  const partitionBoards = partitionArea > 0 ? Math.ceil(partitionArea / boardArea()) * 2 : 0;
  const totalWallBoards = artwallBoards + partitionBoards;
  const plywoodBase = state.carpentryTvUnits * 2;
  const mdfBase = Math.max(0, artwallBoards - plywoodBase) + partitionBoards;
  const verticalStuds = wallLength > 0 ? Math.ceil(wallLength / rates.carpentry.studSpacing) : 0;
  const partitionVerticalStuds = partitionLength > 0 ? Math.ceil(partitionLength / rates.carpentry.studSpacing) : 0;
  const wallStudLength = (wallLength * 2) + (state.carpentryCeilingHeight * verticalStuds);
  const partitionStudLength = ((partitionLength * 2) + (state.carpentryCeilingHeight * partitionVerticalStuds)) * 2;
  const studLength = wallStudLength + partitionStudLength;
  const studBundleLength = rates.carpentry.studPieceLength * rates.carpentry.studPiecesPerBundle;
  return {
    totalWallBoards,
    artwallBoards,
    partitionBoards,
    mdfBase,
    plywoodBase,
    mdf: boardCountWithWaste(mdfBase),
    plywood: boardCountWithWaste(plywoodBase),
    drywall: 0,
    studLength,
    studLengthWithWaste: studLength * rates.carpentry.wasteFactor,
    studBundles: studLength > 0 ? Math.ceil((studLength * rates.carpentry.wasteFactor) / studBundleLength) : 0,
    verticalStuds,
    partitionVerticalStuds,
    wallStudLength,
    partitionStudLength,
  };
}

function hasCarpentryWork(state, laborDays, materials) {
  return laborDays > 0 ||
    materials.mdf > 0 ||
    materials.plywood > 0 ||
    materials.drywall > 0 ||
    materials.studBundles > 0 ||
    state.carpentryCeilingFanUnits > 0;
}

function calculate(state) {
  const margin = state.targetMargin;
  const details = [];

  const lowerJa = state.baseEnabled ? jaRounded(state.lowerCabinetM) : 0;
  const upperJa = state.baseEnabled ? jaRounded(state.upperCabinetM) : 0;
  const tallJa = state.baseEnabled ? jaRounded(state.tallCabinetM) : 0;
  const islandJa = state.islandEnabled ? jaRounded(state.islandM) : 0;
  const homebarJa = state.homebarEnabled ? jaRounded(state.homebarM) : 0;
  const shoeJa = state.shoeEnabled ? jaRounded(state.shoeM) : 0;
  const fridgeLaundryJa = state.fridgeLaundryEnabled ? jaRounded(state.fridgeLaundryM) : 0;
  const pantryJa = state.pantryEnabled ? jaRounded(state.pantryM) : 0;
  const builtInJa = state.builtInEnabled ? jaRounded(state.builtInM) : 0;
  const hangerJa = state.hangerEnabled ? jaRounded(state.hangerM) : 0;
  const islandCounter = rates.countertop[state.islandCountertop];
  const islandSideFinish = rates.countertop[state.islandSideFinish];
  const baseCounter = rates.countertop[state.baseCountertop];
  const homebarCounter = rates.countertop[state.homebarCountertop];
  const homebarMidway = rates.countertop[state.homebarMidway];
  const baseCounterBillingM = state.lowerCabinetM > 0 ? Math.max(1, mmToM(state.lowerCabinetM)) : 0;
  const homebarStorageJa = rates.homebarStorageBaseJa;
  const homebarExtraJa = Math.max(0, homebarJa - homebarStorageJa);
  const homebarCounterActualMm = homebarExtraJa * 300;
  const homebarCounterBillingM = homebarCounterActualMm > 0 ? Math.max(1, mmToM(homebarCounterActualMm)) : 0;
  const islandCounterMultiplier = state.islandCountertop === "himacs" && state.islandDepthMm > 720 ? 2 : 1;
  const islandCounterBillingM = mmToM(state.islandM) * islandCounterMultiplier;
  const islandSideLengthM = state.islandM > 3000 ? 0.9 : Math.max(0, mmToM(state.islandDepthMm));
  const islandSideCalc = islandSideFinishCalc(state.islandSideFinish, state.islandSideFinishCount, islandSideLengthM);

  if (state.baseEnabled) {
    addDetail(details, {
      group: "base",
      item: "하부장",
      input: mmText(state.lowerCabinetM),
      quantity: `${lowerJa}자`,
      unitPrice: rates.lowerPerJa,
      cost: lowerJa * rates.lowerPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "상부장",
      input: mmText(state.upperCabinetM),
      quantity: `${upperJa}자`,
      unitPrice: rates.upperPerJa,
      cost: upperJa * rates.upperPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "키큰장",
      input: mmText(state.tallCabinetM),
      quantity: `${tallJa}자`,
      unitPrice: rates.tallPerJa,
      cost: tallJa * rates.tallPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "밥솥장",
      input: `${state.riceCabinetUnits}통`,
      quantity: `${state.riceCabinetUnits}통`,
      unitPrice: rates.riceCabinetPerUnit,
      cost: state.riceCabinetUnits * rates.riceCabinetPerUnit,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "상하부장 EP",
      input: `${state.baseEndPanels}장 / ${epDepthLabel(state.baseEpDepth)}`,
      quantity: `${state.baseEndPanels}장`,
      unitPrice: epUnitPrice(state.baseEpDepth),
      cost: state.baseEndPanels * epUnitPrice(state.baseEpDepth),
      margin,
      correction: state.corrections.option,
    });
    if (state.baseCountertopEnabled && state.lowerCabinetM > 0) {
      addDetail(details, {
        group: "base",
        item: `상하부장 상판(${baseCounter.label})`,
        input: `하부장 ${mmText(state.lowerCabinetM)}`,
        quantity: countertopQuantity(state.baseCountertop, baseCounterBillingM),
        unitPrice: isSlabMaterial(state.baseCountertop) ? slabBaseCost(state.baseCountertop) : baseCounter.costPerM,
        cost: countertopCost(state.baseCountertop, baseCounterBillingM),
        margin,
        correction: state.corrections.countertop,
      });
    }
    if (state.baseLightingUnits > 0) {
      addDetail(details, {
        group: "base",
        item: "상하부장 라인조명",
        input: `${state.baseLightingUnits}통`,
        quantity: `${state.baseLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.baseLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "base",
      label: "상하부장",
      units: state.baseT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  if (state.islandEnabled && state.islandM > 0) {
    addDetail(details, {
      group: "island",
      item: "아일랜드 몸통",
      input: mmText(state.islandM),
      quantity: `${islandJa}자`,
      unitPrice: rates.islandPerJa,
      cost: islandJa * rates.islandPerJa,
      margin,
      correction: state.corrections.island,
    });
    addDetail(details, {
      group: "island",
      item: `아일랜드 상판(${islandCounter.label})`,
      input: `${mmText(state.islandM)} x ${mmText(state.islandDepthMm)}`,
      quantity: isSlabMaterial(state.islandCountertop) ? countertopQuantity(state.islandCountertop, islandCounterBillingM) : `${mText(mmToM(state.islandM))}${islandCounterMultiplier > 1 ? " x 2" : ""}`,
      unitPrice: isSlabMaterial(state.islandCountertop) ? slabBaseCost(state.islandCountertop) : islandCounter.costPerM,
      cost: countertopCost(state.islandCountertop, islandCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "island",
      item: `아일랜드 좌우마감재(${islandSideFinish.label})`,
      input: state.islandSideFinish === "epPanel" ? `각 ${mmText(islandSideLengthM * 1000)}` : "900mm 기준",
      quantity: islandSideCalc.quantity,
      unitPrice: isSlabMaterial(state.islandSideFinish) ? slabBaseCost(state.islandSideFinish) : islandSideFinish.costPerM,
      cost: islandSideCalc.cost,
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "island",
      item: "아일랜드 서랍",
      input: `${state.islandDrawers}개`,
      quantity: `${state.islandDrawers}개`,
      unitPrice: rates.drawer,
      cost: state.islandDrawers * rates.drawer,
      margin,
      correction: state.corrections.option,
    });
    if (state.islandRiceCabinetEnabled) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 밥솥장 추가",
        input: "1개",
        quantity: "1개",
        unitPrice: rates.drawer,
        cost: rates.drawer,
        margin,
        correction: state.corrections.option,
      });
    }
    if (state.islandBachmannOutletEnabled) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 바흐만 2구 콘센트",
        input: "1개",
        quantity: "1개",
        unitPrice: rates.bachmannOutlet,
        cost: rates.bachmannOutlet,
        margin,
        correction: state.corrections.option,
      });
    }
    if (state.islandLightingUnits > 0) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 라인조명",
        input: `${state.islandLightingUnits}통`,
        quantity: `${state.islandLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.islandLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "island",
      label: "아일랜드",
      units: state.islandT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  if (state.homebarEnabled && state.homebarM > 0) {
    addDetail(details, {
      group: "homebar",
      item: "홈바장 키큰수납장",
      input: mmText(state.homebarM),
      quantity: `${homebarStorageJa}자`,
      unitPrice: rates.homebarBuildPerJa,
      cost: homebarStorageJa * rates.homebarBuildPerJa,
      margin,
      correction: state.corrections.homebar,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 상하부장",
      input: mmText(state.homebarM),
      quantity: `${homebarExtraJa}자`,
      unitPrice: rates.homebarBuildPerJa,
      cost: homebarExtraJa * rates.homebarBuildPerJa,
      margin,
      correction: state.corrections.homebar,
    });
    addDetail(details, {
      group: "homebar",
      item: `홈바장 상판(${homebarCounter.label})`,
      input: `상하부장 ${mmText(homebarCounterActualMm)}`,
      quantity: countertopQuantity(state.homebarCountertop, homebarCounterBillingM),
      unitPrice: isSlabMaterial(state.homebarCountertop) ? slabBaseCost(state.homebarCountertop) : homebarCounter.costPerM,
      cost: countertopCost(state.homebarCountertop, homebarCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "homebar",
      item: `홈바장 미드웨이(${homebarMidway.label})`,
      input: `상하부장 ${mmText(homebarCounterActualMm)}`,
      quantity: countertopQuantity(state.homebarMidway, homebarCounterBillingM),
      unitPrice: isSlabMaterial(state.homebarMidway) ? slabBaseCost(state.homebarMidway) : homebarMidway.costPerM,
      cost: countertopCost(state.homebarMidway, homebarCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 서랍",
      input: `${state.homebarDrawers}개`,
      quantity: `${state.homebarDrawers}개`,
      unitPrice: rates.drawer,
      cost: state.homebarDrawers * rates.drawer,
      margin,
      correction: state.corrections.option,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 EP",
      input: `${state.homebarEndPanels}장 / ${epDepthLabel(state.homebarEpDepth)}`,
      quantity: `${state.homebarEndPanels}장`,
      unitPrice: epUnitPrice(state.homebarEpDepth),
      cost: state.homebarEndPanels * epUnitPrice(state.homebarEpDepth),
      margin,
      correction: state.corrections.option,
    });
    if (state.homebarLightingUnits > 0) {
      addDetail(details, {
        group: "homebar",
        item: "홈바장 라인조명",
        input: `${state.homebarLightingUnits}통`,
        quantity: `${state.homebarLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.homebarLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "homebar",
      label: "홈바장",
      units: state.homebarT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  addStorageDetails(details, {
    group: "shoe",
    label: "신발장",
    enabled: state.shoeEnabled,
    mm: state.shoeM,
    depth: state.shoeDepth,
    endPanels: state.shoeEndPanels,
    bodyUnitPrice: state.shoeDepth === "shallow" ? rates.shoePerJa : rates.tallPerJa,
    lightingUnits: state.shoeLightingUnits,
    t3Units: state.shoeT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "fridgeLaundry",
    label: "냉장고 및 세탁기장",
    enabled: state.fridgeLaundryEnabled,
    mm: state.fridgeLaundryM,
    depth: state.fridgeLaundryDepth,
    endPanels: state.fridgeLaundryEndPanels,
    bodyUnitPrice: rates.fridgeLaundryPerJa,
    lightingUnits: state.fridgeLaundryLightingUnits,
    t3Units: state.fridgeLaundryT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "pantry",
    label: "팬트리장",
    enabled: state.pantryEnabled,
    mm: state.pantryM,
    depth: state.pantryDepth,
    endPanels: state.pantryEndPanels,
    bodyUnitPrice: rates.pantryPerJa,
    lightingUnits: 0,
    t3Units: 0,
    margin,
    corrections: state.corrections,
  });
  addUnitDetail(details, {
    group: "pantry",
    item: "팬트리장 하부서랍장",
    enabled: state.pantryEnabled,
    input: `${state.pantryDrawerUnits}개`,
    quantity: `${state.pantryDrawerUnits}개`,
    unitPrice: rates.pantryDrawer,
    units: state.pantryDrawerUnits,
    margin,
    correction: state.corrections.option,
  });
  addStorageDetails(details, {
    group: "builtIn",
    label: "옷장(붙박이장)",
    enabled: state.builtInEnabled,
    mm: state.builtInM,
    depth: state.builtInDepth,
    endPanels: state.builtInEndPanels,
    bodyUnitPrice: rates.builtInPerJa,
    lightingUnits: state.builtInLightingUnits,
    t3Units: state.builtInT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "hanger",
    label: "옷장(헹거장)",
    enabled: state.hangerEnabled,
    mm: state.hangerM,
    depth: state.hangerDepth,
    endPanels: 0,
    bodyUnitPrice: rates.hangerPerJa,
    lightingUnits: state.hangerLightingUnits,
    t3Units: state.hangerT3Units,
    margin,
    corrections: state.corrections,
  });

  addUnitDetail(details, {
    group: "demolition",
    item: floorDemolitionLabel(state.demolitionFloorMaterial),
    enabled: state.demolitionFloorEnabled,
    input: `${state.areaPyeong}평`,
    quantity: `${state.areaPyeong}평`,
    unitPrice: floorDemolitionUnitPrice(state.demolitionFloorMaterial),
    units: state.areaPyeong,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "가구 철거(폐기물 포함)",
    enabled: state.demolitionFurnitureEnabled,
    input: mmText(state.demolitionFurnitureM),
    quantity: `${jaRounded(state.demolitionFurnitureM)}자`,
    unitPrice: rates.demolition.furniturePerJa,
    units: jaRounded(state.demolitionFurnitureM),
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "화장실 철거 방수",
    enabled: state.demolitionBathroomEnabled,
    input: `${state.demolitionBathroomUnits}개소`,
    quantity: `${state.demolitionBathroomUnits}개소`,
    unitPrice: rates.demolition.bathroomWaterproof,
    units: state.demolitionBathroomUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "천장철거(폐기물 포함)",
    enabled: state.demolitionCeilingEnabled,
    input: `${state.areaPyeong}평`,
    quantity: `${state.areaPyeong}평`,
    unitPrice: rates.demolition.ceilingPerPyeong,
    units: state.areaPyeong,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "E/V 보양",
    enabled: state.demolitionElevatorProtectEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.elevatorProtect,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "E/V 보양 철거",
    enabled: state.demolitionElevatorProtectRemovalEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.elevatorProtectRemoval,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "행위허가",
    enabled: state.demolitionPermitEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.permit,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "동의서",
    enabled: state.demolitionConsentEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.consent,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  const electricalDays = state.electricalAgeType === "under10" ? rates.electrical.under10YearsDays : rates.electrical.over10YearsDays;
  addUnitDetail(details, {
    group: "electrical",
    item: `전기 인건비(${state.electricalAgeType === "under10" ? "준공 10년 이하" : "준공 10년 이상"})`,
    enabled: state.electricalEnabled,
    input: `${electricalDays}품`,
    quantity: `${electricalDays}품`,
    unitPrice: rates.electrical.workerDay,
    units: electricalDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "electrical",
    item: "전기 배선비(전선/후렉시블)",
    enabled: state.electricalEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.electrical.wiring,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND 표준 콘센트 스위치(르그랑 급)",
    enabled: state.standardSwitchEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.electrical.standardSwitch,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 다운라이트",
    enabled: state.standardLightingEnabled,
    input: `${state.standardDownlightUnits}개`,
    quantity: `${state.standardDownlightUnits}개`,
    unitPrice: rates.standardLighting.downlight,
    units: state.standardDownlightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 사각매입등",
    enabled: state.standardLightingEnabled,
    input: `${state.standardSquareLightUnits}개`,
    quantity: `${state.standardSquareLightUnits}개`,
    unitPrice: rates.standardLighting.square,
    units: state.standardSquareLightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 실린더등",
    enabled: state.standardLightingEnabled,
    input: `${state.standardCylinderLightUnits}개`,
    quantity: `${state.standardCylinderLightUnits}개`,
    unitPrice: rates.standardLighting.cylinder,
    units: state.standardCylinderLightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 간접조명(T3)",
    enabled: state.standardLightingEnabled,
    input: `${state.standardT3M}m`,
    quantity: `${state.standardT3M}m`,
    unitPrice: rates.standardLighting.t3PerM,
    units: state.standardT3M,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 침대 벽등",
    enabled: state.standardLightingEnabled && state.standardBedWallLightEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.standardLighting.bedWallLight,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "tile",
    item: "타일 기공",
    enabled: state.tileEnabled,
    input: `${state.tileBathroomUnits}칸 x 3품`,
    quantity: `${state.tileBathroomUnits * 3}품`,
    unitPrice: rates.finish.tileWorkerDay,
    units: state.tileBathroomUnits * 3,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "타일 조공",
    enabled: state.tileEnabled,
    input: `${state.tileBathroomUnits}칸 x 1품`,
    quantity: `${state.tileBathroomUnits}품`,
    unitPrice: rates.finish.tileHelperDay,
    units: state.tileBathroomUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "타일 메지",
    enabled: state.tileEnabled && state.tileGroutEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.finish.tileGrout,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "조적벽 타일 기공 추가",
    enabled: state.bathroomEnabled,
    input: `${state.bathroomMasonryWallUnits}개`,
    quantity: `${state.bathroomMasonryWallUnits}품`,
    unitPrice: rates.finish.tileWorkerDay,
    units: state.bathroomMasonryWallUnits,
    margin,
    correction: state.corrections.option,
  });

  addModuleDetails(details, bathroomDetails(state, rates.bathroom), margin, state.corrections.option);

  const wallpaperUnitDays = wallpaperDays(state.wallpaperPreset, state.wallpaperBaseCoatEnabled);
  addUnitDetail(details, {
    group: "wallpaper",
    item: "도배 인건비",
    enabled: state.wallpaperEnabled,
    input: `${wallpaperLabel(state.wallpaperPreset)}${state.wallpaperBaseCoatEnabled ? " / 초배 포함" : ""}`,
    quantity: `${wallpaperUnitDays}품`,
    unitPrice: rates.finish.wallpaperWorkerDay,
    units: wallpaperUnitDays,
    margin,
    correction: state.corrections.option,
  });
  addModuleDetails(details, [
    ...wallpaperMaterialDetails(state, rates.finishMaterial),
    wallpaperSupplyDetail(state, rates.finishMaterial),
  ], margin, state.corrections.option);

  const filmUnitDays = filmDays(state.filmPreset);
  addUnitDetail(details, {
    group: "film",
    item: "필름 인건비",
    enabled: state.filmEnabled,
    input: filmLabel(state.filmPreset),
    quantity: `${filmUnitDays}품`,
    unitPrice: rates.finish.filmWorkerDay,
    units: filmUnitDays,
    margin,
    correction: state.corrections.option,
  });
  addModuleDetails(details, [filmMaterialDetail(state, rates.finishMaterial)], margin, state.corrections.option);

  const flooringType = state.flooringMaterialType === "sheet" ? "sheet" : "wood";
  const flooringGrade = flooringType === "sheet"
    ? flooringSheetGradeOptions[state.flooringSheetGrade] || flooringSheetGradeOptions.t20
    : flooringWoodGradeOptions[state.flooringWoodGrade] || flooringWoodGradeOptions.editone;
  const flooringLabel = flooringType === "sheet" ? `장판 ${flooringGrade.label}` : flooringGrade.label;
  addUnitDetail(details, {
    group: "flooring",
    item: `바닥 시공(${flooringLabel})`,
    enabled: state.flooringEnabled,
    input: `${state.flooringArea}평 · ${flooringLabel}`,
    quantity: `${state.flooringArea}평`,
    unitPrice: flooringGrade.unitPrice,
    units: state.flooringArea,
    margin,
    correction: state.corrections.option,
  });

  addModuleDetails(details, kitchenDetails(state, rates.kitchen), margin, state.corrections.option);
  addModuleDetails(details, doorDetails(state, rates.door), margin, state.corrections.option);
  addModuleDetails(details, miscDetails(state, rates.misc), margin, state.corrections.option);

  addUnitDetail(details, {
    group: "silicone",
    item: "실리콘",
    enabled: state.siliconeEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.finish.silicone,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "elastic",
    item: "탄성 기본 2개소",
    enabled: state.elasticEnabled,
    input: "기본 2개소",
    quantity: "1식",
    unitPrice: rates.finish.elasticBase,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "elastic",
    item: "탄성 추가 개소",
    enabled: state.elasticEnabled,
    input: `${state.elasticExtraRooms}개소`,
    quantity: `${state.elasticExtraRooms}개소`,
    unitPrice: rates.finish.elasticExtraRoom,
    units: state.elasticExtraRooms,
    margin,
    correction: state.corrections.option,
  });

  const carpentryRawDays = carpentryLaborDays(state);
  const carpentryDays = Math.ceil(carpentryRawDays);
  const carpentryMaterials = carpentryMaterialCounts(state);
  const carpentryActive = hasCarpentryWork(state, carpentryRawDays, carpentryMaterials);
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 인건비",
    enabled: carpentryRawDays > 0,
    input: `산출 ${quantityText(carpentryRawDays, "품")} / 올림`,
    quantity: quantityText(carpentryDays, "품"),
    unitPrice: rates.carpentry.workerDay,
    units: carpentryDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 기계품",
    enabled: carpentryRawDays > 0,
    input: `산출 ${quantityText(carpentryRawDays, "품")} / 올림`,
    quantity: `${carpentryDays}일`,
    unitPrice: rates.carpentry.machineDay,
    units: carpentryDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 부자재",
    enabled: carpentryActive,
    input: "자동 포함",
    quantity: "1식",
    unitPrice: rates.carpentry.subsidiary,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 양중",
    enabled: carpentryActive,
    input: "자동 포함",
    quantity: "1식",
    unitPrice: rates.carpentry.lifting,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "실링팬 보강",
    enabled: true,
    input: `${state.carpentryCeilingFanUnits}개`,
    quantity: `${state.carpentryCeilingFanUnits}개`,
    unitPrice: rates.carpentry.ceilingFanUnit,
    units: state.carpentryCeilingFanUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "MDF",
    enabled: carpentryMaterials.mdf > 0,
    input: `벽체 ${Math.max(0, carpentryMaterials.artwallBoards - carpentryMaterials.plywoodBase)}장 + 가벽 양면 ${carpentryMaterials.partitionBoards}장 / 15% 할증`,
    quantity: `${carpentryMaterials.mdf}장`,
    unitPrice: rates.carpentry.mdfSheet,
    units: carpentryMaterials.mdf,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "합판",
    enabled: carpentryMaterials.plywood > 0,
    input: `TV ${state.carpentryTvUnits}개 x 2장 / 15% 할증`,
    quantity: `${carpentryMaterials.plywood}장`,
    unitPrice: rates.carpentry.plywoodSheet,
    units: carpentryMaterials.plywood,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "다루끼",
    enabled: carpentryMaterials.studBundles > 0,
    input: `벽체 ${mmText(carpentryMaterials.wallStudLength)} + 가벽 ${mmText(carpentryMaterials.partitionStudLength)} / 15% 할증`,
    quantity: `${carpentryMaterials.studBundles}묶음`,
    unitPrice: rates.carpentry.studBundle,
    units: carpentryMaterials.studBundles,
    margin,
    correction: state.corrections.option,
  });

  const directCost = details.reduce((sum, item) => sum + item.cost, 0);
  const rawRevenue = details.reduce((sum, item) => sum + item.revenue, 0) + state.adjustment;
  const customerRevenue = floorThousand(Math.max(0, rawRevenue));
  const profit = customerRevenue - directCost;
  const actualMargin = markupRate(profit, directCost);
  const targetRevenue = directCost * (1 + margin);
  const discountRoom = Math.max(0, customerRevenue - targetRevenue);
  const groupTotal = (group) => groupTotalFromDetails(details, group);
  const usesStoneSlab =
    (state.baseEnabled && state.baseCountertopEnabled && state.lowerCabinetM > 0 && isSlabMaterial(state.baseCountertop)) ||
    (state.islandEnabled && state.islandM > 0 && (
      isSlabMaterial(state.islandCountertop) ||
      (isSlabMaterial(state.islandSideFinish) && state.islandSideFinishCount > 0)
    )) ||
    (state.homebarEnabled && state.homebarM > 0 && (
      isSlabMaterial(state.homebarCountertop) ||
      isSlabMaterial(state.homebarMidway)
    ));

  const quoteLines = [
    { process: "상하부장", description: state.baseEnabled ? "상하부장 선택" : "미선택", revenue: groupTotal("base") },
    { process: "아일랜드", description: state.islandEnabled && state.islandM > 0 ? "아일랜드 선택" : "미선택", revenue: groupTotal("island") },
    { process: "홈바장", description: state.homebarEnabled && state.homebarM > 0 ? "홈바장 선택" : "미선택", revenue: groupTotal("homebar") },
    { process: "신발장", description: state.shoeEnabled && state.shoeM > 0 ? "신발장 선택" : "미선택", revenue: groupTotal("shoe") },
    { process: "냉장고장", description: state.fridgeLaundryEnabled && state.fridgeLaundryM > 0 ? "냉장고 및 세탁기장 선택" : "미선택", revenue: groupTotal("fridgeLaundry") },
    { process: "팬트리장", description: state.pantryEnabled && state.pantryM > 0 ? "팬트리장 선택" : "미선택", revenue: groupTotal("pantry") },
    { process: "붙박이장", description: state.builtInEnabled && state.builtInM > 0 ? "붙박이장 선택" : "미선택", revenue: groupTotal("builtIn") },
    { process: "헹거장", description: state.hangerEnabled && state.hangerM > 0 ? "헹거장 선택" : "미선택", revenue: groupTotal("hanger") },
    { process: "철거", description: "철거 및 인허가", revenue: groupTotal("demolition") },
    { process: "전기", description: "전기 시공", revenue: groupTotal("electrical") },
    { process: "AND표준 조명", description: "조명 및 콘센트·스위치", revenue: groupTotal("standardLighting") },
    { process: "욕실", description: "욕실 공사", revenue: groupTotal("bathroom") },
    { process: "타일", description: "타일(AND표준 포세린)", revenue: groupTotal("tile") },
    { process: "주방설비", description: "주방 부속/기기", revenue: groupTotal("kitchen") },
    { process: "도어/창호", description: "도어 및 창호", revenue: groupTotal("door") },
    { process: "기타", description: "기타 공정", revenue: groupTotal("misc") },
    { process: "도배", description: state.wallpaperEnabled ? wallpaperLabel(state.wallpaperPreset) : "미선택", revenue: groupTotal("wallpaper") },
    { process: "필름", description: state.filmEnabled ? filmLabel(state.filmPreset) : "미선택", revenue: groupTotal("film") },
    { process: "바닥", description: state.flooringEnabled ? `${state.flooringArea}평` : "미선택", revenue: groupTotal("flooring") },
    { process: "마감", description: "실리콘", revenue: groupTotal("silicone") },
    { process: "마감", description: "탄성", revenue: groupTotal("elastic") },
    { process: "목공", description: "목공 공사", revenue: groupTotal("carpentry") },
    {
      process: "창호",
      description: "별도 실측 후 견적",
      revenue: 0,
      amountText: state.doorWindowEnabled && state.windowNoticeEnabled ? "별도 실측 후 견적" : "",
    },
  ].filter((line) => line.revenue > 0 || line.amountText);

  if (state.adjustment !== 0) {
    quoteLines.push({
      process: "상담 보정",
      description: "현장 사이즈, 작업 조정, 할인 반영",
      revenue: state.adjustment,
    });
  }
  if (usesStoneSlab) {
    quoteLines.push({
      process: "양중비",
      description: "칸스톤/세라믹 양중비",
      amountText: "현장별 별도",
      revenue: 0,
    });
  }

  const warnings = [];
  if (details.length === 0) {
    warnings.push("선택한 항목이 없습니다.");
  } else if (actualMargin + 0.0001 < margin) {
    warnings.push(`목표 원가 가산율 ${(margin * 100).toFixed(1)}% 미달: 현재 ${(actualMargin * 100).toFixed(1)}%`);
  }
  if (warnings.length === 0) warnings.push("목표 원가 가산율 기준 정상입니다.");

  return {
    state,
    details,
    quoteLines,
    directCost,
    customerRevenue,
    profit,
    actualMargin,
    discountRoom,
    warnings,
    counts: { lowerJa, upperJa, tallJa, islandJa, homebarJa, shoeJa, fridgeLaundryJa, pantryJa, builtInJa, hangerJa },
  };
}

function groupedCustomerItems(details, lines) {
  const groups = new Map();
  const ensureGroup = (label) => {
    if (!groups.has(label)) groups.set(label, { label, total: 0, items: [] });
    return groups.get(label);
  };
  const addCustomerItem = (group, name, amount, amountText = customerWon(amount)) => {
    const displayAmount = floorThousand(Number(amount) || 0);
    const existing = group.items.find((item) => item.name === name && item.amountText !== "현장별 별도");
    if (existing && displayAmount > 0) {
      existing.amount += displayAmount;
      existing.amountText = customerWon(existing.amount);
      return;
    }
    group.items.push({ name, amount: displayAmount, amountText });
  };

  for (const detail of details.filter((item) => item.revenue > 0)) {
    const group = ensureGroup(quoteGroupLabels[detail.group] || detail.group);
    addCustomerItem(group, customerItemName(detail.item), detail.customerRevenue ?? detail.revenue);
  }

  for (const line of lines.filter((item) => item.amountText)) {
    const group = ensureGroup(line.process === "양중비" ? "기타" : line.process);
    addCustomerItem(group, line.description || line.process, 0, line.amountText);
  }

  for (const line of lines.filter((item) => item.process === "상담 보정" && item.revenue !== 0)) {
    const group = ensureGroup("기타");
    addCustomerItem(group, line.description, line.revenue);
  }

  return quoteGroupOrder
    .map((label) => groups.get(label))
    .filter(Boolean)
    .map((group) => {
      const total = group.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return {
        ...group,
        total,
        totalText: customerWon(total),
      };
    });
}

const PIPE_CLEANING_ITEM_NAME = "기존 배관 청소";

let PIPE_CLEANING_AMOUNT = options.pipeCleaningAmount ?? 300000;

function cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function applyPipeCleaningToCustomerQuote(quote, enabled) {
  const nextQuote = cloneJson(quote) || {};
  const groups = Array.isArray(nextQuote.groups) ? nextQuote.groups : [];
  let miscGroup = groups.find((group) => group.label === "기타");
  if (!miscGroup && enabled) {
    miscGroup = { label: "기타", total: 0, totalText: customerWon(0), items: [] };
    groups.push(miscGroup);
  }
  if (miscGroup) {
    const items = Array.isArray(miscGroup.items) ? miscGroup.items : [];
    miscGroup.items = enabled
      ? [
        ...items.filter((item) => item.name !== PIPE_CLEANING_ITEM_NAME),
        { name: PIPE_CLEANING_ITEM_NAME, amount: PIPE_CLEANING_AMOUNT, amountText: customerWon(PIPE_CLEANING_AMOUNT) },
      ]
      : items.filter((item) => item.name !== PIPE_CLEANING_ITEM_NAME);
    miscGroup.total = miscGroup.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    miscGroup.totalText = customerWon(miscGroup.total);
  }
  nextQuote.groups = quoteGroupOrder
    .map((label) => groups.find((group) => group.label === label))
    .filter((group) => group && Array.isArray(group.items) && group.items.length);
  nextQuote.total = nextQuote.groups.reduce((sum, group) => sum + (Number(group.total) || 0), 0);
  nextQuote.totalText = customerWon(nextQuote.total);
  return nextQuote;
}

function pipeCleaningInternalDetail() {
  return {
    group: "misc",
    item: PIPE_CLEANING_ITEM_NAME,
    input: "1식",
    quantity: "1식",
    unitPrice: PIPE_CLEANING_AMOUNT,
    cost: PIPE_CLEANING_AMOUNT,
    correction: 0,
    revenue: PIPE_CLEANING_AMOUNT,
    customerRevenue: PIPE_CLEANING_AMOUNT,
    profit: 0,
  };
}

function applyExistingPipeCleaningAdjustment(estimate, enabled = false) {
  const next = cloneJson(estimate);
  if (!next?.customerQuote) return null;
  const inputs = { ...(next.inputs || {}) };
  inputs.existingPipeCleaningEnabled = Boolean(enabled);
  next.inputs = inputs;
  next.customerQuote = applyPipeCleaningToCustomerQuote(next.customerQuote, enabled);
  next.total = next.customerQuote.total;
  next.totalText = next.customerQuote.totalText;
  const originalDetails = Array.isArray(next.internalDetails) ? next.internalDetails : [];
  const removedPipeCleaningCost = originalDetails
    .filter((item) => item.item === PIPE_CLEANING_ITEM_NAME)
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const nextDetails = originalDetails.filter((item) => item.item !== PIPE_CLEANING_ITEM_NAME);
  if (enabled) nextDetails.push(pipeCleaningInternalDetail());
  next.internalDetails = nextDetails;
  const baseCostTotal = Number(next.costTotal ?? next.internalSummary?.directCost) || 0;
  const costTotal = baseCostTotal - removedPipeCleaningCost + (enabled ? PIPE_CLEANING_AMOUNT : 0);
  const customerRevenue = Number(next.total) || 0;
  const profit = customerRevenue - costTotal;
  const marginRate = Number((markupRate(profit, costTotal) * 100).toFixed(2));
  next.costTotal = costTotal;
  next.marginRate = marginRate;
  next.internalSummary = {
    ...(next.internalSummary || {}),
    directCost: costTotal,
    customerRevenue,
    profit,
    marginRate,
  };
  return next;
}

const el = Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id, schema]) => [id, { value: schema.value, checked: schema.value }]));
for (const [id, value] of Object.entries(options.rateValues || {})) el[id] = { value };
const numberValue = (id) => Number(el[id]?.value) || 0;

const integerValue = (id) => Math.max(0, Math.floor(numberValue(id)));

const checkedValue = (id) => Boolean(el[id]?.checked);

const rateValue = (id, fallback) => Number(el[id]?.value) || fallback;

function updateRatesFromAdmin() {
  rates.lowerPerJa = rateValue("rateLowerPerJa", rates.lowerPerJa);
  rates.upperPerJa = rateValue("rateUpperPerJa", rates.upperPerJa);
  rates.islandPerJa = rateValue("rateIslandPerJa", rates.islandPerJa);
  rates.homebarBuildPerJa = rateValue("rateHomebarBuildPerJa", rates.homebarBuildPerJa);
  rates.tallPerJa = rateValue("rateTallPerJa", rates.tallPerJa);
  rates.fridgeLaundryPerJa = rateValue("rateFridgeLaundryPerJa", rates.fridgeLaundryPerJa);
  rates.shoePerJa = rateValue("rateShoePerJa", rates.shoePerJa);
  rates.pantryPerJa = rateValue("ratePantryPerJa", rates.pantryPerJa);
  rates.pantryDrawer = rateValue("ratePantryDrawer", rates.pantryDrawer);
  rates.builtInPerJa = rateValue("rateBuiltInPerJa", rates.builtInPerJa);
  rates.hangerPerJa = rateValue("rateHangerPerJa", rates.hangerPerJa);
  rates.riceCabinetPerUnit = rateValue("rateRiceCabinetPerUnit", rates.riceCabinetPerUnit);
  rates.endPanelShallow = rateValue("rateEndPanelShallow", rates.endPanelShallow);
  rates.endPanelDeep = rateValue("rateEndPanelDeep", rates.endPanelDeep);
  rates.drawer = rateValue("rateDrawer", rates.drawer);
  rates.bachmannOutlet = rateValue("rateBachmannOutlet", rates.bachmannOutlet);
  rates.lightingPerCabinetUnit = rateValue("rateLightingPerCabinetUnit", rates.lightingPerCabinetUnit);
  rates.t3LightingUnit = rateValue("rateT3LightingUnit", rates.t3LightingUnit);
  rates.standardLighting.downlight = rateValue("rateStandardDownlight", rates.standardLighting.downlight);
  rates.standardLighting.square = rateValue("rateStandardSquareLight", rates.standardLighting.square);
  rates.standardLighting.cylinder = rateValue("rateStandardCylinderLight", rates.standardLighting.cylinder);
  rates.standardLighting.t3PerM = rateValue("rateStandardT3PerM", rates.standardLighting.t3PerM);
  rates.standardLighting.bedWallLight = rateValue("rateStandardBedWallLight", rates.standardLighting.bedWallLight);
  rates.countertop.himacs.costPerM = rateValue("rateHimacsPerM", rates.countertop.himacs.costPerM);
  rates.countertop.khanstone.slabCost = rateValue("rateKhanstoneSlab", rates.countertop.khanstone.slabCost);
  rates.countertop.khanstone.factoryCost = rateValue("rateKhanstoneFactory", rates.countertop.khanstone.factoryCost);
  rates.countertop.khanstone.installCost = rateValue("rateKhanstoneInstall", rates.countertop.khanstone.installCost);
  rates.countertop.ceramic.slabCost = rateValue("rateCeramicSlab", rates.countertop.ceramic.slabCost);
  rates.countertop.ceramic.factoryCost = rateValue("rateCeramicFactory", rates.countertop.ceramic.factoryCost);
  rates.countertop.ceramic.installCost = rateValue("rateCeramicInstall", rates.countertop.ceramic.installCost);
  rates.countertop.epPanel.costPerM = rateValue("rateEpPanelPerM", rates.countertop.epPanel.costPerM);
  rates.demolition.floorPerPyeong = rateValue("rateDemolitionFloorPerPyeong", rates.demolition.floorPerPyeong);
  rates.demolition.decoTilePerPyeong = rateValue("rateDemolitionDecoTilePerPyeong", rates.demolition.decoTilePerPyeong);
  rates.demolition.furniturePerJa = rateValue("rateDemolitionFurniturePerJa", rates.demolition.furniturePerJa);
  rates.demolition.bathroomWaterproof = rateValue("rateDemolitionBathroomWaterproof", rates.demolition.bathroomWaterproof);
  rates.demolition.ceilingPerPyeong = rateValue("rateDemolitionCeilingPerPyeong", rates.demolition.ceilingPerPyeong);
  rates.demolition.elevatorProtect = rateValue("rateDemolitionElevatorProtect", rates.demolition.elevatorProtect);
  rates.demolition.elevatorProtectRemoval = rateValue("rateDemolitionElevatorProtectRemoval", rates.demolition.elevatorProtectRemoval);
  rates.demolition.permit = rateValue("rateDemolitionPermit", rates.demolition.permit);
  rates.demolition.consent = rateValue("rateDemolitionConsent", rates.demolition.consent);
  rates.electrical.workerDay = rateValue("rateElectricalWorkerDay", rates.electrical.workerDay);
  rates.electrical.helperDay = rateValue("rateElectricalHelperDay", rates.electrical.helperDay);
  rates.electrical.under10YearsDays = rateValue("rateElectricalUnder10Days", rates.electrical.under10YearsDays);
  rates.electrical.over10YearsDays = rateValue("rateElectricalOver10Days", rates.electrical.over10YearsDays);
  rates.electrical.wiring = rateValue("rateElectricalWiring", rates.electrical.wiring);
  rates.electrical.standardSwitch = rateValue("rateElectricalStandardSwitch", rates.electrical.standardSwitch);
  rates.finish.tileWorkerDay = rateValue("rateTileWorkerDay", rates.finish.tileWorkerDay);
  rates.finish.tileHelperDay = rateValue("rateTileHelperDay", rates.finish.tileHelperDay);
  rates.finish.tileGrout = rateValue("rateTileGrout", rates.finish.tileGrout);
  rates.bathroom.porcelainTileMaterial = rateValue("rateBathroomPorcelainTileMaterial", rates.bathroom.porcelainTileMaterial);
  rates.bathroom.plumbingRelocation = rateValue("rateBathroomPlumbingRelocation", rates.bathroom.plumbingRelocation);
  rates.bathroom.fixtureSet = rateValue("rateBathroomFixtureSet", rates.bathroom.fixtureSet);
  rates.bathroom.fixtureInstall = rateValue("rateBathroomFixtureInstall", rates.bathroom.fixtureInstall);
  rates.bathroom.smcCeiling = rateValue("rateBathroomSmcCeiling", rates.bathroom.smcCeiling);
  rates.bathroom.fanNormal = rateValue("rateBathroomFanNormal", rates.bathroom.fanNormal);
  rates.bathroom.hugentMachine = rateValue("rateBathroomHugentMachine", rates.bathroom.hugentMachine);
  rates.bathroom.hugentInstallExtra = rateValue("rateBathroomHugentInstallExtra", rates.bathroom.hugentInstallExtra);
  rates.bathroom.bathtub = rateValue("rateBathroomBathtub", rates.bathroom.bathtub);
  rates.bathroom.glassBooth = rateValue("rateBathroomGlassBooth", rates.bathroom.glassBooth);
  rates.bathroom.glassPartition = rateValue("rateBathroomGlassPartition", rates.bathroom.glassPartition);
  rates.finish.wallpaperWorkerDay = rateValue("rateWallpaperWorkerDay", rates.finish.wallpaperWorkerDay);
  rates.finishMaterial.wallpaperBesti = rateValue("rateWallpaperBesti", rates.finishMaterial.wallpaperBesti);
  rates.finishMaterial.wallpaperDiamant = rateValue("rateWallpaperDiamant", rates.finishMaterial.wallpaperDiamant);
  rates.finishMaterial.wallpaperFortis = rateValue("rateWallpaperFortis", rates.finishMaterial.wallpaperFortis);
  rates.finishMaterial.wallpaperMaterialPerPyeong = rateValue("rateWallpaperMaterialPerPyeong", rates.finishMaterial.wallpaperMaterialPerPyeong);
  rates.finish.filmWorkerDay = rateValue("rateFilmWorkerDay", rates.finish.filmWorkerDay);
  rates.finish.flooringPerPyeong = rateValue("rateFlooringPerPyeong", rates.finish.flooringPerPyeong);
  flooringSheetGradeOptions.t18.unitPrice = rateValue("rateFlooringSheetT18", flooringSheetGradeOptions.t18.unitPrice);
  flooringSheetGradeOptions.t20.unitPrice = rateValue("rateFlooringSheetT20", flooringSheetGradeOptions.t20.unitPrice);
  flooringSheetGradeOptions.t22.unitPrice = rateValue("rateFlooringSheetT22", flooringSheetGradeOptions.t22.unitPrice);
  flooringSheetGradeOptions.t32.unitPrice = rateValue("rateFlooringSheetT32", flooringSheetGradeOptions.t32.unitPrice);
  flooringSheetGradeOptions.t45.unitPrice = rateValue("rateFlooringSheetT45", flooringSheetGradeOptions.t45.unitPrice);
  flooringSheetGradeOptions.t50.unitPrice = rateValue("rateFlooringSheetT50", flooringSheetGradeOptions.t50.unitPrice);
  flooringWoodGradeOptions.editone.unitPrice = rateValue("rateFlooringPerPyeong", flooringWoodGradeOptions.editone.unitPrice);
  flooringWoodGradeOptions.standard.unitPrice = rateValue("rateFlooringWoodStandard", flooringWoodGradeOptions.standard.unitPrice);
  rates.kitchen.sinkBowl = rateValue("rateKitchenSinkBowl", rates.kitchen.sinkBowl);
  rates.kitchen.faucet = rateValue("rateKitchenFaucet", rates.kitchen.faucet);
  rates.kitchen.hood = rateValue("rateKitchenHood", rates.kitchen.hood);
  rates.kitchen.standardInstall = rateValue("rateKitchenStandardInstall", rates.kitchen.standardInstall);
  PIPE_CLEANING_AMOUNT = rateValue("rateExistingPipeCleaning", PIPE_CLEANING_AMOUNT);
  rates.finish.silicone = rateValue("rateSilicone", rates.finish.silicone);
  rates.finish.elasticBase = rateValue("rateElasticBase", rates.finish.elasticBase);
  rates.finish.elasticExtraRoom = rateValue("rateElasticExtraRoom", rates.finish.elasticExtraRoom);
  rates.carpentry.workerDay = rateValue("rateCarpentryWorkerDay", rates.carpentry.workerDay);
  rates.carpentry.machineDay = rateValue("rateCarpentryMachineDay", rates.carpentry.machineDay);
  rates.carpentry.lifting = rateValue("rateCarpentryLifting", rates.carpentry.lifting);
  rates.carpentry.subsidiary = rateValue("rateCarpentrySubsidiary", rates.carpentry.subsidiary);
  rates.carpentry.ceilingFanUnit = rateValue("rateCarpentryCeilingFanUnit", rates.carpentry.ceilingFanUnit);
  rates.carpentry.drywallSheet = rateValue("rateCarpentryDrywallSheet", rates.carpentry.drywallSheet);
  rates.carpentry.mdfSheet = rateValue("rateCarpentryMdfSheet", rates.carpentry.mdfSheet);
  rates.carpentry.plywoodSheet = rateValue("rateCarpentryPlywoodSheet", rates.carpentry.plywoodSheet);
  rates.carpentry.studBundle = rateValue("rateCarpentryStudBundle", rates.carpentry.studBundle);
}
function readState(inputs = {}) {
  for (const [id, value] of Object.entries(inputs)) {
    if (ESTIMATE_INPUT_SCHEMA[id]) el[id] = { value, checked: value === true };
  }
  updateRatesFromAdmin();
  const demolitionSection = checkedValue("sectionDemolitionEnabled");
  const electricalSection = checkedValue("sectionElectricalEnabled");
  const bathroomSection = checkedValue("sectionBathroomEnabled");
  const wallpaperSection = checkedValue("sectionWallpaperEnabled");
  const filmSection = checkedValue("sectionFilmEnabled");
  const flooringSection = checkedValue("sectionFlooringEnabled");
  const carpentrySection = checkedValue("sectionCarpentryEnabled");
  const furnitureSection = checkedValue("sectionFurnitureEnabled");
  const finishSection = checkedValue("sectionFinishEnabled");
  const kitchenCustomAppliancePrice = numberValue("kitchenCustomAppliancePrice");
  return {
    projectName: el.projectName.value || "상담 프로젝트",
    areaPyeong: numberValue("areaPyeong"),
    clientName: el.clientName.value || "",
    clientPhone: el.clientPhone.value || "",
    status: el.estimateStatus?.value || "견적",
    targetMargin: (numberValue("targetMargin") || 30) / 100,
    baseEnabled: furnitureSection && checkedValue("baseEnabled"),
    lowerCabinetM: numberValue("lowerCabinetM"),
    upperCabinetM: numberValue("upperCabinetM"),
    tallCabinetM: numberValue("tallCabinetM"),
    riceCabinetUnits: numberValue("riceCabinetUnits"),
    baseEndPanels: numberValue("baseEndPanels"),
    baseEpDepth: el.baseEpDepth.value,
    baseCountertopEnabled: checkedValue("baseCountertopEnabled"),
    baseCountertop: el.baseCountertop?.value || "himacs",
    baseLightingUnits: integerValue("baseLightingUnits"),
    baseT3Units: integerValue("baseT3Units"),
    islandEnabled: furnitureSection && checkedValue("islandEnabled"),
    islandM: numberValue("islandM"),
    islandDepthMm: numberValue("islandDepthMm"),
    islandCountertop: el.islandCountertop.value,
    islandSideFinish: el.islandSideFinish.value,
    islandSideFinishCount: Math.min(2, integerValue("islandSideFinishCount")),
    islandDrawers: integerValue("islandDrawers"),
    islandRiceCabinetEnabled: checkedValue("islandRiceCabinetEnabled"),
    islandBachmannOutletEnabled: checkedValue("islandBachmannOutletEnabled"),
    islandLightingUnits: integerValue("islandLightingUnits"),
    islandT3Units: integerValue("islandT3Units"),
    homebarEnabled: furnitureSection && checkedValue("homebarEnabled"),
    homebarM: numberValue("homebarM"),
    homebarCountertop: el.homebarCountertop.value,
    homebarMidway: el.homebarMidway.value,
    homebarDrawers: integerValue("homebarDrawers"),
    homebarEndPanels: integerValue("homebarEndPanels"),
    homebarEpDepth: el.homebarEpDepth.value,
    homebarLightingUnits: integerValue("homebarLightingUnits"),
    homebarT3Units: integerValue("homebarT3Units"),
    shoeEnabled: furnitureSection && checkedValue("shoeEnabled"),
    shoeM: numberValue("shoeM"),
    shoeDepth: el.shoeDepth.value,
    shoeEndPanels: integerValue("shoeEndPanels"),
    shoeLightingUnits: integerValue("shoeLightingUnits"),
    shoeT3Units: integerValue("shoeT3Units"),
    fridgeLaundryEnabled: furnitureSection && checkedValue("fridgeLaundryEnabled"),
    fridgeLaundryM: numberValue("fridgeLaundryM"),
    fridgeLaundryDepth: el.fridgeLaundryDepth.value,
    fridgeLaundryEndPanels: integerValue("fridgeLaundryEndPanels"),
    fridgeLaundryLightingUnits: integerValue("fridgeLaundryLightingUnits"),
    fridgeLaundryT3Units: integerValue("fridgeLaundryT3Units"),
    pantryEnabled: furnitureSection && checkedValue("pantryEnabled"),
    pantryM: numberValue("pantryM"),
    pantryDepth: el.pantryDepth.value,
    pantryEndPanels: integerValue("pantryEndPanels"),
    pantryDrawerUnits: integerValue("pantryDrawerUnits"),
    builtInEnabled: furnitureSection && checkedValue("builtInEnabled"),
    builtInM: numberValue("builtInM"),
    builtInDepth: el.builtInDepth.value,
    builtInEndPanels: integerValue("builtInEndPanels"),
    builtInLightingUnits: integerValue("builtInLightingUnits"),
    builtInT3Units: integerValue("builtInT3Units"),
    hangerEnabled: furnitureSection && checkedValue("hangerEnabled"),
    hangerM: numberValue("hangerM"),
    hangerDepth: el.hangerDepth.value,
    hangerLightingUnits: integerValue("hangerLightingUnits"),
    hangerT3Units: integerValue("hangerT3Units"),
    demolitionFloorEnabled: demolitionSection && checkedValue("demolitionFloorEnabled"),
    demolitionFloorMaterial: el.demolitionFloorMaterial.value,
    demolitionFurnitureEnabled: demolitionSection && checkedValue("demolitionFurnitureEnabled"),
    demolitionFurnitureM: numberValue("demolitionFurnitureM"),
    demolitionBathroomEnabled: demolitionSection && checkedValue("demolitionBathroomEnabled"),
    demolitionBathroomUnits: integerValue("demolitionBathroomUnits"),
    demolitionCeilingEnabled: demolitionSection && checkedValue("demolitionCeilingEnabled"),
    demolitionElevatorProtectEnabled: demolitionSection && checkedValue("demolitionElevatorProtectEnabled"),
    demolitionElevatorProtectRemovalEnabled: demolitionSection && checkedValue("demolitionElevatorProtectRemovalEnabled"),
    demolitionPermitEnabled: demolitionSection && checkedValue("demolitionPermitEnabled"),
    demolitionConsentEnabled: demolitionSection && checkedValue("demolitionConsentEnabled"),
    electricalEnabled: electricalSection && checkedValue("electricalEnabled"),
    electricalAgeType: el.electricalAgeType.value,
    standardLightingEnabled: electricalSection && checkedValue("standardLightingEnabled"),
    standardSwitchEnabled: electricalSection && checkedValue("standardLightingEnabled") && checkedValue("standardSwitchEnabled"),
    standardDownlightUnits: integerValue("standardDownlightUnits"),
    standardSquareLightUnits: integerValue("standardSquareLightUnits"),
    standardCylinderLightUnits: integerValue("standardCylinderLightUnits"),
    standardT3M: numberValue("standardT3M"),
    standardBedWallLightEnabled: electricalSection && checkedValue("standardBedWallLightEnabled"),
    tileEnabled: bathroomSection && checkedValue("tileEnabled"),
    tileBathroomUnits: integerValue("bathroomUnits"),
    tileGroutEnabled: bathroomSection && checkedValue("tileGroutEnabled"),
    bathroomPlumbingRelocationEnabled: bathroomSection && checkedValue("bathroomPlumbingRelocationEnabled"),
    wallpaperEnabled: wallpaperSection,
    wallpaperPreset: el.wallpaperPreset.value,
    wallpaperBaseCoatEnabled: wallpaperSection && checkedValue("wallpaperBaseCoatEnabled"),
    filmEnabled: filmSection,
    filmPreset: el.filmPreset.value,
    flooringEnabled: flooringSection,
    flooringArea: numberValue("flooringArea"),
    flooringMaterialType: el.flooringMaterialType?.value || "wood",
    flooringSheetGrade: el.flooringSheetGrade?.value || "t20",
    flooringWoodGrade: el.flooringWoodGrade?.value || "editone",
    bathroomEnabled: bathroomSection,
    bathroomUnits: integerValue("bathroomUnits"),
    bathroomFixtureGrade: el.bathroomFixtureGrade?.value || "standard",
    bathroomFanType: el.bathroomFanType.value,
    bathroomBathtubUnits: integerValue("bathroomBathtubUnits"),
    bathroomGlassBoothUnits: integerValue("bathroomGlassBoothUnits"),
    bathroomGlassPartitionUnits: integerValue("bathroomGlassPartitionUnits"),
    bathroomMasonryWallUnits: integerValue("bathroomMasonryWallUnits"),
    kitchenEnabled: furnitureSection && (checkedValue("kitchenEnabled") || kitchenCustomAppliancePrice > 0),
    kitchenSinkBowlUnits: integerValue("kitchenSinkBowlUnits"),
    kitchenFaucetUnits: integerValue("kitchenFaucetUnits"),
    kitchenHoodUnits: integerValue("kitchenHoodUnits"),
    kitchenCustomAppliancePrice,
    kitchenStandardInstallEnabled: checkedValue("kitchenStandardInstallEnabled"),
    doorWindowEnabled: carpentrySection,
    middleDoorUnits: integerValue("middleDoorUnits"),
    standardDoorUnits: integerValue("standardDoorUnits"),
    slidingDoorUnits: integerValue("slidingDoorUnits"),
    windowNoticeEnabled: carpentrySection && checkedValue("windowNoticeEnabled"),
    wallpaperMaterialEnabled: wallpaperSection,
    wallpaperPublicMaterialGrade: el.wallpaperPublicMaterialGrade?.value || "diamant",
    wallpaperPublicWallLengthM: numberValue("wallpaperPublicWallLengthM"),
    wallpaperRoomMaterialGrade: el.wallpaperRoomMaterialGrade?.value || "besti",
    wallpaperRoomWallLengthM: numberValue("wallpaperRoomWallLengthM"),
    filmMaterialEnabled: filmSection,
    filmMaterialLengthM: numberValue("filmMaterialLengthM"),
    generalWasteEnabled: finishSection && checkedValue("generalWasteEnabled"),
    interiorProtectionEnabled: finishSection && checkedValue("interiorProtectionEnabled"),
    moveInCleaningEnabled: finishSection && checkedValue("moveInCleaningEnabled"),
    existingPipeCleaningEnabled: finishSection && checkedValue("existingPipeCleaningEnabled"),
    siliconeEnabled: finishSection && checkedValue("siliconeEnabled"),
    elasticEnabled: finishSection && checkedValue("elasticEnabled"),
    elasticExtraRooms: integerValue("elasticExtraRooms"),
    carpentryCurtainBoxEnabled: carpentrySection,
    carpentryCurtainBoxUnits: integerValue("carpentryCurtainBoxUnits"),
    carpentryCofferType: el.carpentryCofferType.value,
    carpentryArtwallM: numberValue("carpentryArtwallM"),
    carpentryPartitionM: numberValue("carpentryPartitionM"),
    carpentryHiddenDoorUnits: integerValue("carpentryHiddenDoorUnits"),
    carpentryLineLightM: numberValue("carpentryLineLightM"),
    carpentryIndirectLightUnits: integerValue("carpentryIndirectLightUnits"),
    carpentryCeilingFanUnits: integerValue("carpentryCeilingFanUnits"),
    carpentryDropCeilingUnits: integerValue("carpentryDropCeilingUnits"),
    carpentryMoldingEnabled: carpentrySection && checkedValue("carpentryMoldingEnabled"),
    carpentryBaseboardEnabled: carpentrySection && checkedValue("carpentryBaseboardEnabled"),
    carpentryCeilingHeight: numberValue("carpentryCeilingHeight") || 2400,
    carpentryTvUnits: integerValue("carpentryTvUnits"),
    adjustment: numberValue("manualAdjustment"),
    corrections: {
      base: correctionValue("baseCorrection"),
      island: correctionValue("islandCorrection"),
      homebar: correctionValue("homebarCorrection"),
      countertop: correctionValue("countertopCorrection"),
      option: correctionValue("optionCorrection"),
    },
  };
}

const correctionValue = (id) => numberValue(id) / 100;
function effectiveEstimateInputOverrides(state) {
  return {
    demolitionFloorEnabled: state.demolitionFloorEnabled,
    demolitionFurnitureEnabled: state.demolitionFurnitureEnabled,
    demolitionBathroomEnabled: state.demolitionBathroomEnabled,
    demolitionCeilingEnabled: state.demolitionCeilingEnabled,
    demolitionElevatorProtectEnabled: state.demolitionElevatorProtectEnabled,
    demolitionElevatorProtectRemovalEnabled: state.demolitionElevatorProtectRemovalEnabled,
    demolitionPermitEnabled: state.demolitionPermitEnabled,
    demolitionConsentEnabled: state.demolitionConsentEnabled,
    electricalEnabled: state.electricalEnabled,
    standardLightingEnabled: state.standardLightingEnabled,
    standardSwitchEnabled: state.standardSwitchEnabled,
    standardBedWallLightEnabled: state.standardBedWallLightEnabled,
    tileEnabled: state.tileEnabled,
    tileGroutEnabled: state.tileGroutEnabled,
    bathroomPlumbingRelocationEnabled: state.bathroomPlumbingRelocationEnabled,
    wallpaperBaseCoatEnabled: state.wallpaperBaseCoatEnabled,
    kitchenEnabled: state.kitchenEnabled,
    generalWasteEnabled: state.generalWasteEnabled,
    interiorProtectionEnabled: state.interiorProtectionEnabled,
    moveInCleaningEnabled: state.moveInCleaningEnabled,
    existingPipeCleaningEnabled: state.existingPipeCleaningEnabled,
    siliconeEnabled: state.siliconeEnabled,
    elasticEnabled: state.elasticEnabled,
  };
}
return { calculate, floorThousand, mmToM, mmText, quantityText, mText, jaRounded, markupRate, epUnitPrice, epDepthLabel, isSlabMaterial, slabBaseCost, countertopCost, countertopQuantity, addDetail, makeDetail, sellPrice, addModuleDetails, addT3Detail, addStorageDetails, addUnitDetail, islandSideFinishCalc, groupTotalFromDetails, floorDemolitionLabel, floorDemolitionUnitPrice, wallpaperDays, wallpaperLabel, filmDays, filmLabel, carpentryLaborDays, carpentryCofferDays, carpentryMaterialCounts, boardArea, boardCountWithWaste, hasCarpentryWork, groupedCustomerItems, customerWon, customerItemName, applyExistingPipeCleaningAdjustment, cloneJson, applyPipeCleaningToCustomerQuote, pipeCleaningInternalDetail, readState, effectiveEstimateInputOverrides };
}
