import { test, expect, vi } from "vitest";
import { standardById, STANDARD_ITEMS } from "../../../public/os-app/src/detailed-standard-items.js";
import { standardCatalog } from "../../../app/api/os/projects/_lib/standard-catalog.ts";
import { reviewDetailedItems } from "../../../public/os-app/src/detailed-item-review.js";
import { calculateEditor, emptyEditor, editorInput } from "../../../app/api/os/projects/_lib/editor-model.ts";
import { validateIssuable } from "../../../app/api/os/projects/_lib/versions.ts";
import { mountDetailedEditor } from "../../../public/os-app/src/detailed-editor.js";
const masters = [
  { item_code: "MISC_EXISTING_PIPE_CLEANING", item_name: "기존 배관 청소", category: "마감", unit: "식", cost_price: 300000, is_active: true },
  { item_code: "FLOORING_WOOD_PER_PYEONG", item_name: "바닥(마루) 평단가", category: "바닥", unit: "평", cost_price: 180000, is_active: true },
];
const row = (code, extra = {}) => { const s = standardById(`std-${code}`); return { id: code, trade: s.trade, standardId: s.id, name: s.name, spaceId: "", spec: "", memo: "", unit: s.unit, quantity: 1, saleUnitPrice: null, masterCode: s.sourceCode, kind: s.pricing === "tile" ? "tile" : "quantity", basis: "manual", parentId: "", excluded: false, ...extra }; };
const calc = (items, previous, changes, role = "manager") => calculateEditor({ ...emptyEditor(), items }, previous, masters, role, changes);
const pipe = () => row("MISC_EXISTING_PIPE_CLEANING");
const context = { project_name: "합성 현장", client_name: "합성 고객", address: "합성 주소", customer_undecided: false };

test("pipe starts at cost/sale 300000 and zero profit without changing ordinary pricing", () => {
  const r = calc([pipe(), row("FLOORING_WOOD_STANDARD", { masterCode: "", saleUnitPrice: 200000 })]);
  expect(r.publicEditor.items[0]).toMatchObject({ saleUnitPrice: 300000, amount: 300000 });
  expect(r.internal.items[pipe().id]).toMatchObject({ cost: 300000, profit: 0, marginRate: 0, targetMargin: 0 });
  expect(r.internal.policy.companyMargin).toBe(.25);
  expect(standardCatalog(masters).find(i => i.id === pipe().standardId).saleUnitPrice).toBe(300000);
});
test("pipe cost/quantity changes preserve sale, explicit reprice does not add margin", () => {
  const a = calc([pipe()]); const id = pipe().id;
  const b = calc(editorInput(a.publicEditor).items, a.internal, { items: { [id]: { costUnit: 350000 } } });
  expect(b.publicEditor.items[0].saleUnitPrice).toBe(300000); expect(b.internal.items[id].profit).toBe(-50000);
  const c = calc([{ ...editorInput(b.publicEditor).items[0], quantity: 2, saleUnitPrice: 320000 }], b.internal);
  expect(c.publicEditor.items[0]).toMatchObject({ saleUnitPrice: 320000, amount: 640000 });
  const d = calc(editorInput(c.publicEditor).items, c.internal, { companyMargin: .4, reprice: [id] });
  expect(d.publicEditor.items[0].saleUnitPrice).toBe(300000); expect(d.internal.items[id].targetMargin).toBe(0);
});
test("legacy pipe price and issued validation stay exact without retroactive policy", () => {
  const id = pipe().id, prior = { policy: { companyMargin: .25, tradeMargins: {} }, items: { [id]: { masterCode: id, kind: "quantity", costUnit: 300000, targetMargin: .25 } } };
  const r = calc([pipe()], prior); expect(r.publicEditor.items[0].saleUnitPrice).toBe(400000);
  const saved = { editor: r.publicEditor, internal: r.internal, context };
  expect(validateIssuable(saved)).toEqual(r.publicEditor); expect(r.internal.items[id]).not.toHaveProperty("salePolicy");
});
test("LX generic cost is detached for new rows, direct sale has unknown profit", () => {
  const s = standardCatalog(masters, true).find(i => i.id === "std-FLOORING_WOOD_PER_PYEONG");
  expect(s).toMatchObject({ linked: false, costUnit: null, saleUnitPrice: null, sourceCode: "" });
  const r = calc([row("FLOORING_WOOD_PER_PYEONG", { saleUnitPrice: 250000 })]);
  expect(r.internal).toMatchObject({ costTotal: null, profit: null, marginRate: null });
  expect(r.publicEditor.items[0].saleUnitPrice).toBe(250000);
  expect(() => calc([row("FLOORING_WOOD_PER_PYEONG", { masterCode: "FLOORING_WOOD_PER_PYEONG" })])).toThrow(/연결/);
});
test("legacy LX master and saved prices survive exact recalculation with no live master", () => {
  const code = "FLOORING_WOOD_PER_PYEONG", prior = { policy: { companyMargin: .25, tradeMargins: {} }, items: { [code]: { masterCode: code, costUnit: 180000, targetMargin: .25, kind: "quantity" } } };
  const r = calc([row(code, { masterCode: code, saleUnitPrice: 240000 })], prior);
  expect(validateIssuable({ editor: r.publicEditor, internal: r.internal, context })).toEqual(r.publicEditor);
  expect(r.internal.costTotal).toBe(180000);
});
test("18 old unregistered definitions remain, LX adds one, metadata and units remain stable", () => {
  const ids = ["WALLPAPER_MATERIAL_PER_PYEONG", "FILM_WOOD_ROLL", "MISC_WASTE", "MISC_PROTECTION", "MISC_CLEANING", ...["CURTAIN_BOX", "COFFER", "ARTWALL", "PARTITION", "HIDDEN_DOOR", "LINE_LIGHT", "INDIRECT_LIGHT", "DROP_CEILING", "MOLDING", "BASEBOARD"].map(s => `WOOD_${s}`), ...["MIDDLE", "STANDARD", "SLIDING"].map(s => `INTERIOR_DOOR_${s}`)];
  expect(ids).toHaveLength(18); for (const id of ids) expect(standardCatalog(masters).find(i => i.id === `std-${id}`).linked).toBe(false);
  expect(standardById("std-WALLPAPER_MATERIAL_PER_PYEONG").name).toBe("도배 잡자재 평당");
  expect(STANDARD_ITEMS).toHaveLength(107);
  expect(["WOOD_MACHINE_DAY", "ELEC_BED_WALL_LIGHT", "BATH_FAN_NORMAL", "BATH_HUGENT_MACHINE", "BATH_HUGENT_INSTALL_EXTRA", "LIGHT_LINE_CABINET"].map(c => standardById(`std-${c}`).unit)).toEqual(["품", "식", "칸", "칸", "칸", "통"]);
});
test.each(["PERMIT_CONSTRUCTION", "PERMIT_CONSENT"])("%s is site wide; old space assignment is retained", code => {
  expect(standardById(`std-${code}`)).toMatchObject({ spaceAllowed: false, scope: "현장 공통" });
  expect(() => calc([row(code, { spaceId: "space-1" })])).toThrow(/현장 공통/);
  const prior = { policy: { companyMargin: .25, tradeMargins: {} }, items: { [code]: { costUnit: 1000, masterCode: code, targetMargin: .25 } } };
  expect(calc([row(code, { spaceId: "space-1", saleUnitPrice: 2000 })], prior).publicEditor.items[0].spaceId).toBe("space-1");
});
test.each([
  ["WOOD_LABOR_WORKER", "WOOD_ARTWALL", "목공"], ["TILE_AREA", "TILE_LABOR_WORKER", "비욕실"],
  ["TILE_AREA", "TILE_LABOR_HELPER", "비욕실"], ["TILE_AREA", "BATH_PORCELAIN_TILE_MATERIAL", "비욕실"],
  ["DEMO_BATHROOM_WATERPROOF", "BATH_PORCELAIN_TILE_MATERIAL", "욕실"], ["BATH_GLASS_BOOTH", "BATH_GLASS_PARTITION", "유리"],
  ["FLOORING_SHEET_18T", "FLOORING_WOOD_STANDARD", "바닥"], ["WALLPAPER_ROLL_BESTI", "WALLPAPER_ROLL_DIAMANT", "도배"],
])("review %s + %s is advisory, scope-aware and non-mutating", (a, b, label) => {
  const items = [row(a, { spaceId: "space-1" }), row(b, { spaceId: "space-1" })], before = structuredClone(items);
  const notices = reviewDetailedItems(items); expect(notices).toHaveLength(1); expect(notices[0].message).toContain(label); expect(notices[0].scopeKnown).toBe(false);
  expect(notices[0].message).toContain("확정할 수 없"); expect(items).toEqual(before);
  items[0].workScope = items[1].workScope = "동쪽 벽"; expect(reviewDetailedItems(items)[0].scopeKnown).toBe(true);
  items[1].workScope = "서쪽 벽"; expect(reviewDetailedItems(items)[0]).toMatchObject({ scopeKnown: false });
  items[1].spaceId = "space-2"; expect(reviewDetailedItems(items)).toEqual([]);
  expect(JSON.stringify(notices)).not.toMatch(/costUnit|profit|margin|supplier/);
});
test("work part is optional and survives save input without changing arithmetic", () => {
  const a = calc([pipe()]); expect(a.publicEditor.items[0]).not.toHaveProperty("workScope");
  const b = calc([{ ...editorInput(a.publicEditor).items[0], workScope: "기존 주방 배관" }], a.internal);
  expect(b.publicEditor.summary).toEqual(a.publicEditor.summary); expect(b.publicEditor.items[0].workScope).toBe("기존 주방 배관");
});
test("staff batch cancellation/confirmation, review links and save review do not mutate old rows", () => {
  document.body.innerHTML = '<div id="policy"></div>'; const host = document.getElementById("policy");
  const e = emptyEditor(), request = vi.fn(); const view = mountDetailedEditor({ host, initial: { editor: e }, catalog: [], standards: standardCatalog(masters), request, draftId: "test", readOnly: false, changed: vi.fn(), message: vi.fn() });
  try {
    host.querySelector('[data-editor-trade="flooring"]').click();
    const add = id => { host.querySelector('[data-open-standards]').click(); const c = host.querySelector(`[data-standard-id="std-${id}"]`); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); host.querySelector('[data-standard-add]').click(); };
    add("FLOORING_SHEET_18T"); vi.mocked(confirm).mockReturnValue(false); add("FLOORING_WOOD_STANDARD"); expect(view.collect().editor.items).toHaveLength(1);
    vi.mocked(confirm).mockReturnValue(true); host.querySelector('[data-standard-add]').click(); expect(view.collect().editor.items).toHaveLength(2);
    expect(host.querySelector('[data-item-review]').hidden).toBe(false); expect(host.querySelectorAll('[data-private]')).toHaveLength(0);
    vi.mocked(confirm).mockReturnValue(false); expect(view.confirmReview()).toBe(false); expect(view.collect().editor.items).toHaveLength(2);
  } finally { view.destroy(); }
});
