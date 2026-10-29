import { detailedLineAmount } from "../../../../../public/os-app/src/detailed-money.js";
import { standardById } from "../../../../../public/os-app/src/detailed-standard-items.js";
import { cleanWorkReview } from "../../../../../public/os-app/src/detailed-work-review.js";
import { priceStamp } from "../../../../../public/os-app/src/detailed-completion.js";
export const TRADES = ["demolition", "electrical", "bathroom", "wallpaper", "film", "flooring", "carpentry", "furniture", "finish"] as const;
type Obj = Record<string, unknown>;
export type Master = { item_code: string; item_name: string; category: string; unit: string; cost_price: number; is_active: boolean };
export type PrivateItem = { costUnit: number | null; costConfigured?: boolean; targetMargin: number; salePolicy?: string; marginOverride?: boolean; masterCode?: string; kind?: string; cost?: number | null; profit?: number | null; marginRate?: number | null; priceApproval?: { stamp: string; reason: string; actor?: string; at?: string; invalidated?: boolean }; tileRule?: { version: string; labor: number; waste: number; boxArea: number; boxCost: number } };
export type PrivateEditor = { policy: { companyMargin: number; tradeMargins: Record<string, number> }; items: Record<string, PrivateItem>; costTotal?: number | null; profit?: number | null; marginRate?: number | null; groups?: Obj[] };
export class EditorValidationError extends Error {}
function fail(message: string): never { throw new EditorValidationError(message); }
function object(value: unknown, keys: string[]): Obj {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) fail("허용되지 않은 편집 정보입니다.");
  return value as Obj;
}
function text(value: unknown, limit = 500, required = false): string {
  if (typeof value !== "string" || value.length > limit || (required && !value.trim())) fail("항목명과 입력 길이를 확인해 주세요.");
  return value;
}
function number(value: unknown, max = 1e9): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) fail("금액·수량은 허용 범위의 0 이상 숫자로 입력해 주세요.");
  return value;
}
function integer(value: unknown): number { const n = number(value); if (!Number.isSafeInteger(n)) fail("금액은 원 단위 정수로 입력해 주세요."); return n; }
function margin(value: unknown) { const n = number(value, .95); return n; }
function array(value: unknown, max: number): unknown[] { if (!Array.isArray(value) || value.length > max) fail("공간 또는 품목 개수를 확인해 주세요."); return value; }
function key(value: unknown): string { const k = text(value, 80, true); if (!/^[a-zA-Z0-9_-]+$/.test(k) || ["__proto__", "constructor", "prototype"].includes(k)) fail("항목 식별자가 올바르지 않습니다."); return k; }
function unique(values: string[]) { if (new Set(values).size !== values.length) fail("공간·품목 식별자가 중복됐습니다."); }
export function emptyEditor() {
  return { version: 1, spaces: ["공용부", "방1", "방2", "방3", "욕실1", "욕실2"].map((name, i) => ({ id: `space-${i}`, name, floorArea: 0, ceilingArea: 0, height: i > 3 ? 2200 : 2400, walls: [], memo: "" })), items: [], addition: 0, discount: 0, separateQuotes: { windows: "undecided", hvac: "undecided" } };
}

// Only the server receives this result's internal portion. No cost data is accepted in public rows.
export function calculateEditor(input: unknown, previous: PrivateEditor | undefined, masters: Master[], role: string, changes?: unknown) {
  const e = object(input, ["version", "spaces", "items", "addition", "discount", "separateQuotes", "summary", "preliminaryImport", "workReview"]);
  let workReview;
  if (e.workReview !== undefined) { try { workReview = cleanWorkReview(e.workReview); } catch { fail("공사 확인 기록 형식을 확인해 주세요."); } }
  const importState = e.preliminaryImport === undefined ? undefined : object(e.preliminaryImport, ["sourceId", "mappingVersion", "keys"]);
  const preliminaryImport = importState ? { sourceId: key(importState.sourceId), mappingVersion: text(importState.mappingVersion, 100, true), keys: array(importState.keys, 500).map(k => text(k, 300, true)) } : undefined;
  if (preliminaryImport) unique(preliminaryImport.keys);
  if (e.version !== 1) fail("지원하지 않는 작성본 버전입니다.");
  const privileged = role === "admin" || role === "manager";
  if (!["admin", "manager", "staff"].includes(role)) fail("접근 권한이 없습니다.");
  const c = changes === undefined ? {} : object(changes, ["companyMargin", "tradeMargins", "items", "reprice", "priceApprovals", "revokedPriceApprovals"]);
  if (!privileged && Object.keys(c).length) fail("원가·가격 기준 변경 권한이 없습니다.");
  const policy = structuredClone(previous?.policy || { companyMargin: .25, tradeMargins: {} });
  if (c.companyMargin !== undefined) policy.companyMargin = margin(c.companyMargin);
  if (c.tradeMargins !== undefined) {
    const rates = object(c.tradeMargins, [...TRADES]);
    policy.tradeMargins = Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, margin(v)]));
  }
  const privateChanges = c.items === undefined ? {} : object(c.items, array(e.items, 500).map(i => {
    if (!i || typeof i !== "object" || Array.isArray(i)) fail("품목 형식을 확인해 주세요.");
    return key((i as Obj).id);
  }));
  const reprice = c.reprice === undefined ? [] : array(c.reprice, 500).map(key);
  const spaces = array(e.spaces, 100).map(value => {
    const s = object(value, ["id", "name", "floorArea", "ceilingArea", "height", "walls", "memo"]);
    return { id: key(s.id), name: text(s.name, 100, true), floorArea: number(s.floorArea, 100000), ceilingArea: number(s.ceilingArea, 100000), height: number(s.height, 20000), walls: array(s.walls, 100).map(v => number(v, 100000)), memo: text(s.memo) };
  });
  unique(spaces.map(s => s.id));
  const internal: PrivateEditor = { policy, items: {} };
  const costByTrade: Record<string, number> = {};
  const unknownTrades = new Set<string>();
  const items = array(e.items, 500).map(value => {
    const i = object(value, ["id", "trade", "spaceId", "name", "spec", "unit", "quantity", "saleUnitPrice", "memo", "masterCode", "kind", "basis", "parentId", "excluded", "standardId", "workScope", "spaceIds", "origin", "measurement", "quantityManual", "quantityConfirmation"]);
    const id = key(i.id), trade = text(i.trade, 40);
    if (!(TRADES as readonly string[]).includes(trade)) fail("공정을 확인해 주세요.");
    const spaceId = text(i.spaceId, 80);
    if (spaceId && !spaces.some(s => s.id === spaceId)) fail("연결 공간을 확인해 주세요.");
    const spaceIds = i.spaceIds === undefined ? undefined : array(i.spaceIds, 100).map(key);
    if (spaceIds) { unique(spaceIds); if (spaceId !== (spaceIds[0] || "") || spaceIds.some(id => !spaces.some(s => s.id === id))) fail("시공 대상 공간을 확인해 주세요."); }
    const source = i.origin === undefined ? undefined : object(i.origin, ["key", "sourceId", "mappingVersion", "inputs", "quantity", "unit", "kind", "label"]);
    const origin = source ? { key: text(source.key, 300, true), sourceId: key(source.sourceId), mappingVersion: text(source.mappingVersion, 100, true), inputs: array(source.inputs, 30).map(k => text(k, 100, true)), quantity: number(source.quantity, 100000), unit: text(source.unit, 20, true), kind: text(source.kind, 30, true), label: text(source.label, 500, true) } : undefined;
    const m = i.measurement === undefined ? undefined : object(i.measurement, ["basis", "spaceIds", "value", "stamp", "coverage", "waste", "explanation", "excludeArea"]);
    const measurement = m ? { basis: text(m.basis, 40, true), spaceIds: array(m.spaceIds, 100).map(key), value: number(m.value, 100000), stamp: text(m.stamp, 20000, true), explanation: text(m.explanation, 500), ...(m.coverage === undefined ? {} : { coverage: number(m.coverage, 100000) }), ...(m.waste === undefined ? {} : { waste: number(m.waste, 10) }), ...(m.excludeArea === undefined ? {} : { excludeArea: number(m.excludeArea, 100000) }) } : undefined;
    if (i.quantityManual !== undefined && typeof i.quantityManual !== "boolean") fail("수량 수정 상태를 확인해 주세요.");
    const q = i.quantityConfirmation === undefined ? undefined : object(i.quantityConfirmation, ["method", "quantity", "unit", "stamp", "actor", "at"]);
    if (q && !["keep", "manual", "measured"].includes(String(q.method))) fail("수량 확인 방법을 확인해 주세요.");
    const quantityConfirmation = q ? { method: text(q.method, 20, true), quantity: number(q.quantity, 100000), unit: text(q.unit, 20, true), stamp: text(q.stamp, 22000, true), ...(q.actor === undefined ? {} : { actor: text(q.actor, 80) }), ...(q.at === undefined ? {} : { at: text(q.at, 80) }) } : undefined;
    const masterCode = text(i.masterCode, 100), master = masters.find(m => m.item_code === masterCode);
    const prior = previous?.items?.[id];
    const standardId = i.standardId === undefined ? undefined : text(i.standardId, 100, true);
    const standard = standardId ? standardById(standardId) : undefined;
    const legacySource = standard?.legacySourceCode && prior?.masterCode === standard.legacySourceCode && masterCode === prior.masterCode;
    if (standardId && (!standard || standard.trade !== trade || (masterCode && masterCode !== standard.sourceCode && !legacySource))) fail("표준 품목의 공정과 원가 연결을 확인해 주세요.");
    if (standard && !standard.spaceAllowed && spaceId && !prior) fail("현장 공통 품목은 공간 연결 없이 추가해 주세요.");
    if (masterCode && !master && !prior) fail("활성 원가 품목을 다시 선택해 주세요.");
    const kind = text(i.kind, 20);
    if (!["quantity", "fixed", "tile"].includes(kind) || (kind === "tile" && trade !== "bathroom")) fail("품목 계산 방법을 확인해 주세요.");
    if (standard && (standard.pricing === "tile") !== (kind === "tile")) fail("표준 품목의 원가 산정 방식을 확인해 주세요.");
    const quantity = number(i.quantity, 100000);
    if (Math.abs(quantity - Number(quantity.toFixed(6))) > 1e-10) fail("수량은 소수 여섯 자리까지 입력해 주세요.");
    if (kind === "fixed" && quantity !== 1) fail("정액 품목은 수량 1로 입력해 주세요.");
    if (prior?.masterCode !== undefined && prior.masterCode !== masterCode) fail("기존 품목의 원가 출처는 변경할 수 없습니다. 새 품목으로 추가해 주세요.");
    const registered = master && master.cost_price != null && Number.isSafeInteger(Number(master.cost_price)) && Number(master.cost_price) >= 0;
    const itemPolicy: PrivateItem = prior ? structuredClone(prior) : { costUnit: registered ? integer(Number(master.cost_price)) : null, costConfigured: Boolean(registered), targetMargin: policy.tradeMargins[trade] ?? policy.companyMargin };
    // Only newly added pipe cleaning rows receive this policy. Stored rows keep their pricing history.
    if (!prior && (standard?.salePolicy === "pipe-fixed-v1" || (!standardId && masterCode === "MISC_EXISTING_PIPE_CLEANING"))) {
      itemPolicy.salePolicy = "pipe-fixed-v1"; itemPolicy.targetMargin = 0;
    }
    itemPolicy.masterCode = masterCode; itemPolicy.kind = kind;
    const delta = privateChanges[id] === undefined ? {} : object(privateChanges[id], ["costUnit", "targetMargin", "tileRule"]);
    if (delta.costUnit !== undefined) { itemPolicy.costUnit = integer(delta.costUnit); itemPolicy.costConfigured = true; }
    if (delta.targetMargin !== undefined) { itemPolicy.targetMargin = margin(delta.targetMargin); itemPolicy.marginOverride = true; }
    if (kind === "tile") {
      const baseRule = { version: "tile-20261021-v1", labor: 80000, waste: 1.10, boxArea: 1.44, boxCost: 50000 };
      itemPolicy.tileRule ||= baseRule;
      itemPolicy.costConfigured = true;
      if (delta.tileRule !== undefined) {
        const rule = object(delta.tileRule, ["version", "labor", "waste", "boxArea", "boxCost"]);
        const boxArea = number(rule.boxArea, 100), waste = number(rule.waste, 10);
        if (!boxArea || waste < 1) fail("타일 자재 기준을 확인해 주세요.");
        itemPolicy.tileRule = { version: text(rule.version, 100, true), labor: integer(rule.labor), waste, boxArea, boxCost: integer(rule.boxCost) };
      }
    }
    const excluded = i.excluded === true;
    if (typeof i.excluded !== "boolean") fail("품목 포함 상태를 확인해 주세요.");
    const configured = itemPolicy.costConfigured !== false && (itemPolicy.costUnit !== null || kind === "tile");
    let cost = configured ? detailedLineAmount(quantity, itemPolicy.costUnit ?? 0) : 0;
    if (kind === "tile") {
      const rule = itemPolicy.tileRule!;
      cost = Math.round(quantity * rule.labor + Math.ceil(Number((quantity * rule.waste / rule.boxArea).toFixed(10))) * rule.boxCost);
    }
    const initialCostUnit = kind === "tile" ? quantity > 0 ? cost / quantity : 0 : itemPolicy.costUnit ?? 0;
    const pipeFixed = itemPolicy.salePolicy === "pipe-fixed-v1" && masterCode === "MISC_EXISTING_PIPE_CLEANING";
    let price = i.saleUnitPrice == null ? pipeFixed ? 300000 : Math.round(initialCostUnit / (1 - itemPolicy.targetMargin)) : integer(i.saleUnitPrice);
    if (reprice.includes(id)) {
      if (!configured) fail("원가 미설정 품목은 적용 원가를 확인한 뒤 판매가를 재산정해 주세요.");
      if (!itemPolicy.marginOverride) itemPolicy.targetMargin = pipeFixed ? 0 : policy.tradeMargins[trade] ?? policy.companyMargin;
      price = pipeFixed ? 300000 : Math.round(initialCostUnit / (1 - itemPolicy.targetMargin));
    }
    if (!Number.isSafeInteger(price) || price > 1e9 || !Number.isSafeInteger(cost) || cost > 1e12) fail("품목 단가 또는 원가가 허용 범위를 초과했습니다.");
    const amount = excluded ? 0 : detailedLineAmount(kind === "fixed" ? 1 : quantity, price);
    if (!Number.isSafeInteger(amount) || amount > 1e12) fail("품목 금액이 허용 범위를 초과했습니다.");
    itemPolicy.cost = excluded ? 0 : configured ? cost : null;
    itemPolicy.profit = itemPolicy.cost === null ? null : amount - itemPolicy.cost;
    itemPolicy.marginRate = itemPolicy.profit === null ? null : amount > 0 ? itemPolicy.profit / amount : 0;
    if (!configured && !excluded) unknownTrades.add(trade);
    internal.items[id] = itemPolicy;
    costByTrade[trade] = (costByTrade[trade] || 0) + (excluded ? 0 : cost);
    return { id, trade, spaceId, name: text(i.name, 200, true), spec: text(i.spec), unit: text(i.unit, 20, true), quantity, saleUnitPrice: price, memo: text(i.memo), masterCode, kind, basis: text(i.basis, 100), parentId: text(i.parentId, 80), excluded, amount, ...(standardId ? { standardId } : {}), ...(i.workScope === undefined ? {} : { workScope: text(i.workScope, 200) }), ...(spaceIds ? { spaceIds } : {}), ...(origin ? { origin } : {}), ...(measurement ? { measurement } : {}), ...(i.quantityManual === undefined ? {} : { quantityManual: i.quantityManual }), ...(quantityConfirmation ? { quantityConfirmation } : {}) };
  });
  unique(items.map(i => i.id));
  if (c.revokedPriceApprovals !== undefined && (!Array.isArray(c.revokedPriceApprovals) || c.revokedPriceApprovals.some(id => typeof id !== "string"))) fail("판매가격 확인 상태를 확인해 주세요.");
  // Returning to an old price must not resurrect a previously invalidated approval.
  for (const i of items) {
    const detail = internal.items[i.id], approval = detail.priceApproval;
    if (approval && (approval.stamp !== priceStamp(i, detail) || (c.revokedPriceApprovals as string[] | undefined)?.includes(i.id))) approval.invalidated = true;
  }
  if (c.priceApprovals !== undefined) {
    const approvals = object(c.priceApprovals, items.map(i => i.id));
    for (const [id, value] of Object.entries(approvals)) {
      const i = items.find(i => i.id === id)!, detail = internal.items[id];
      const proof = object(value, ["reason", "stamp"]), reason = text(proof.reason, 500, true);
      if (i.excluded || detail.cost == null || i.amount >= detail.cost) fail("예외 판매가격 확인 대상이 아닙니다. 현재 금액을 확인해 주세요.");
      if (proof.stamp !== priceStamp(i, detail)) fail("승인 대상 금액이 변경됐습니다. 현재 금액을 다시 확인해 주세요.");
      detail.priceApproval = { reason, stamp: priceStamp(i, detail) };
    }
  }
  for (const i of items) if (i.parentId && (!items.some(p => p.id === i.parentId && p.excluded && !p.parentId) || i.parentId === i.id)) fail("분리 품목의 묶음 원가를 제외한 뒤 연결해 주세요.");
  const groups = TRADES.map(trade => ({ trade, total: items.filter(i => i.trade === trade).reduce((sum, i) => sum + i.amount, 0) }));
  const addition = integer(e.addition), discount = integer(e.discount);
  const subtotal = groups.reduce((sum, g) => sum + g.total, 0), rawSupply = subtotal + addition - discount;
  if (rawSupply < 0 || rawSupply > 1e12) fail("할인 후 공급가액을 확인해 주세요.");
  const supply = Math.floor(rawSupply / 1000) * 1000, rounding = supply - rawSupply, vat = Math.round(supply * .1), total = supply + vat;
  const separateQuotes = object(e.separateQuotes, ["windows", "hvac"]);
  for (const value of Object.values(separateQuotes)) if (!["undecided", "included", "excluded"].includes(String(value))) fail("별도견적 상태를 확인해 주세요.");
  if (Object.keys(separateQuotes).length !== 2) fail("별도견적 상태가 필요합니다.");
  const costTotal = Object.values(costByTrade).reduce((sum, v) => sum + v, 0), profit = supply - costTotal;
  if (!Number.isSafeInteger(costTotal) || costTotal > 1e12) fail("원가 총액이 허용 범위를 초과했습니다.");
  internal.costTotal = unknownTrades.size ? null : costTotal; internal.profit = unknownTrades.size ? null : profit; internal.marginRate = unknownTrades.size ? null : supply > 0 ? profit / supply : 0;
  internal.groups = groups.map(g => ({ ...g, cost: unknownTrades.has(g.trade) ? null : costByTrade[g.trade] || 0, profit: unknownTrades.has(g.trade) ? null : g.total - (costByTrade[g.trade] || 0), marginRate: unknownTrades.has(g.trade) ? null : g.total > 0 ? (g.total - (costByTrade[g.trade] || 0)) / g.total : 0 }));
  const originKeys = items.filter(i => i.origin).map(i => i.origin!.key); unique(originKeys);
  const publicEditor = { version: 1, spaces, items, addition, discount, separateQuotes, summary: { groups, subtotal, rawSupply, rounding, supply, vat, total }, ...(preliminaryImport ? { preliminaryImport } : {}), ...(workReview ? { workReview } : {}) };
  return { publicEditor, internal };
}

export function editorInput(saved: unknown): unknown {
  const editor = structuredClone(saved) as { items?: Obj[] };
  editor.items = editor.items?.map(item => { const row = { ...item }; delete row.amount; return row; });
  return editor;
}
