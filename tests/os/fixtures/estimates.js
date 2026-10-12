export const TEST_ESTIMATE_ID = "10000000-0000-4000-8000-000000000001";
export const TEST_USER_ID = "20000000-0000-4000-8000-000000000001";
export const TEST_PACKAGE_ID = "30000000-0000-4000-8000-000000000001";
export const TEST_ADDRESS = "테스트시 테스트구 123";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const trades = [
  ["demolition", "철거", "테스트 철거", 100000],
  ["bathroom", "욕실", "테스트 욕실", 700000],
  ["electrical", "전기/조명", "테스트 전기", 200000],
  ["carpentry", "목공", "테스트 목공", 300000],
  ["base", "가구", "테스트 가구", 400000],
  ["wallpaper", "도배", "테스트 벽지", 500000],
  ["flooring", "바닥", "테스트 바닥", 600000],
  ["misc", "기타", "테스트 폐기물", 100000],
];

export function latestEstimate() {
  return {
    id: TEST_ESTIMATE_ID,
    projectName: "SYSTEM_SYNTHETIC_2A",
    clientName: "합성 고객",
    phone: "000-0000-0000",
    address: TEST_ADDRESS,
    areaPyeong: 33,
    status: "견적",
    savedAt: "2026-01-01T00:00:00.000Z",
    total: 3770000,
    totalText: "3,770,000원",
    costTotal: 2900000,
    marginRate: 30,
    inputs: {
      projectName: "SYSTEM_SYNTHETIC_2A",
      clientName: "합성 고객",
      clientPhone: "000-0000-0000",
      areaPyeong: "33",
      targetMargin: "30",
      sectionDemolitionEnabled: true,
      demolitionFurnitureEnabled: true,
      demolitionFurnitureM: "1200",
      existingPipeCleaningEnabled: false,
    },
    costSnapshot: {
      source: "synthetic-fixture",
      capturedAt: "2026-01-01T00:00:00.000Z",
      items: [{ itemCode: "DEMO_CABINET_PER_JA", costPrice: 25000, defaultMarginRate: 0.3 }],
    },
    internalSummary: { directCost: 2900000, customerRevenue: 3770000, profit: 870000, marginRate: 30 },
    internalDetails: trades.map(([group, , item, cost]) => ({
      group, item, input: "합성 입력", quantity: "1식", unitPrice: cost, cost,
      correction: 0, revenue: cost * 1.3, customerRevenue: cost * 1.3, profit: cost * 0.3,
    })),
    customerQuote: {
      projectName: "SYSTEM_SYNTHETIC_2A", clientName: "합성 고객", areaPyeong: 33,
      phone: "000-0000-0000", savedAt: "2026-01-01T00:00:00.000Z", status: "견적",
      total: 3770000, totalText: "3,770,000원",
      groups: trades.map(([, label, name, cost]) => ({
        label, total: cost * 1.3, totalText: `${(cost * 1.3).toLocaleString("ko-KR")}원`,
        items: [{ name, amount: cost * 1.3, amountText: `${(cost * 1.3).toLocaleString("ko-KR")}원` }],
      })),
    },
  };
}

export function legacyFractionalEstimate() {
  const fixture = latestEstimate();
  fixture.inputs.targetMargin = "0.3";
  return fixture;
}

export function pipeCleaningEstimate() {
  const fixture = latestEstimate();
  fixture.inputs.existingPipeCleaningEnabled = true;
  fixture.total = 4070000;
  fixture.totalText = "4,070,000원";
  fixture.costTotal = 3200000;
  fixture.marginRate = 27.19;
  Object.assign(fixture.internalSummary, {
    directCost: 3200000, customerRevenue: 4070000, profit: 870000, marginRate: 27.19,
  });
  fixture.internalDetails.push({
    group: "misc", item: "기존 배관 청소", input: "1식", quantity: "1식",
    unitPrice: 300000, cost: 300000, correction: 0, revenue: 300000,
    customerRevenue: 300000, profit: 0,
  });
  const misc = fixture.customerQuote.groups.find((group) => group.label === "기타");
  misc.items.push({ name: "기존 배관 청소", amount: 300000, amountText: "300,000원" });
  misc.total = 430000;
  misc.totalText = "430,000원";
  fixture.customerQuote.total = fixture.total;
  fixture.customerQuote.totalText = fixture.totalText;
  return fixture;
}

export function internalEstimate() {
  return { ...latestEstimate(), internalMemo: "SYNTHETIC_INTERNAL_ONLY" };
}

export function estimateRow(estimate) {
  return {
    id: estimate.id, project_name: estimate.projectName, client_name: estimate.clientName,
    phone: estimate.phone, address: estimate.address, area_pyeong: estimate.areaPyeong,
    total_price: estimate.total, cost_total: estimate.costTotal, margin_rate: estimate.marginRate,
    estimate_data: clone(estimate), status: estimate.status,
    created_at: estimate.savedAt, updated_at: estimate.savedAt,
  };
}

export function testProfile(role = "admin", overrides = {}) {
  return {
    id: TEST_USER_ID, name: "합성 사용자", email: "synthetic@example.invalid", role,
    is_active: true, must_change_password: false, ...overrides,
  };
}

export function testSession(role = "admin") {
  return {
    access_token: "test-only-access-token",
    user: { id: TEST_USER_ID, email: "synthetic@example.invalid", role },
  };
}
