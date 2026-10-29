import { expect, test } from "vitest";
import { calculateEditor, emptyEditor, editorInput } from "../../../app/api/os/projects/_lib/editor-model.ts";
import { editorPublicTotals, publicEditorInput } from "../../../public/os-app/src/detailed-editor.js";
const row = (extra = {}) => ({ id: "item-1", trade: "furniture", spaceId: "", name: "합성 품목", spec: "", unit: "식", quantity: 1, saleUnitPrice: null, memo: "", masterCode: "TEST", kind: "quantity", basis: "manual", parentId: "", excluded: false, ...extra });
const master = [{ item_code: "TEST", item_name: "합성 품목", category: "가구", unit: "식", cost_price: 75000, is_active: true }];
const calc = (rows = [row()], previous, changes, role = "admin", extra = {}) => calculateEditor({ ...emptyEditor(), items: rows, ...extra }, previous, master, role, changes);
test("new prices use 25% gross margin, only final supply is rounded and VAT follows", () => {
  const { publicEditor: e, internal } = calc();
  expect(e.items[0].saleUnitPrice).toBe(100000); expect(e.summary.supply).toBe(100000); expect(e.summary.vat).toBe(10000);
  expect(internal.costTotal).toBe(75000); expect(internal.profit).toBe(25000); expect(internal.marginRate).toBe(.25);
  expect(editorPublicTotals(e)).toEqual(e.summary);
});
test("cost updates preserve unit selling prices, quantity updates use existing selling price", () => {
  const original = calc();
  const input = editorInput(original.publicEditor);
  const updated = calc(input.items, original.internal, { items: { "item-1": { costUnit: 80000 } } });
  expect(updated.publicEditor.summary.total).toBe(110000); expect(updated.internal.costTotal).toBe(80000);
  const changed = calc([{ ...input.items[0], quantity: 2 }], updated.internal);
  expect(changed.publicEditor.items[0].amount).toBe(200000); expect(changed.internal.costTotal).toBe(160000);
});
test("company/trade/item override and explicit reprice never silently replace existing prices", () => {
  const original = calc();
  const input = editorInput(original.publicEditor);
  const policy = { companyMargin: .4, tradeMargins: { furniture: .5 } };
  expect(calc(input.items, original.internal, policy).publicEditor.items[0].saleUnitPrice).toBe(100000);
  expect(calc(input.items, original.internal, { ...policy, reprice: ["item-1"] }).publicEditor.items[0].saleUnitPrice).toBe(150000);
  expect(calc(input.items, original.internal, { items: { "item-1": { targetMargin: .2 } }, reprice: ["item-1"] }).publicEditor.items[0].saleUnitPrice).toBe(93750);
});
test("line rounding once, adjustments, single thousand truncation and VAT", () => {
  const e = calc([row({ quantity: 1.5, saleUnitPrice: 10001 }), row({ id: "item-2", saleUnitPrice: 10001 })], undefined, undefined, "admin", { addition: 500, discount: 200 }).publicEditor;
  expect(e.items.map(i => i.amount)).toEqual([15002, 10001]); expect(e.summary.subtotal).toBe(25003);
  expect(e.summary.rawSupply).toBe(25303); expect(e.summary.rounding).toBe(-303); expect(e.summary.supply).toBe(25000); expect(e.summary.total).toBe(27500);
});
test("decimal half won is rounded exactly in server and visible totals", () => {
  const result = calc([row({ quantity: 1.005, saleUnitPrice: 100 })]).publicEditor;
  expect(result.items[0].amount).toBe(101); expect(editorPublicTotals(result)).toEqual(result.summary);
});
test("non-bathroom tile rule uses exact boxed material and labor, rule is stored", () => {
  const result = calc([row({ kind: "tile", trade: "bathroom", masterCode: "", quantity: 10 })]);
  expect(result.internal.costTotal).toBe(1200000); expect(result.publicEditor.items[0].saleUnitPrice).toBe(160000); expect(result.publicEditor.items[0].amount).toBe(1600000);
  expect(result.internal.items["item-1"].tileRule.version).toBe("tile-20261021-v1");
});
test("zero area tile and fixed zero quantity are handled explicitly", () => {
  expect(calc([row({ kind: "tile", trade: "bathroom", quantity: 0 })]).internal.costTotal).toBe(0);
  expect(() => calc([row({ kind: "fixed", quantity: 2 })])).toThrow();
});
test("bundle must be excluded when child exists and totals do not count both", () => {
  expect(() => calc([row(), row({ id: "child", parentId: "item-1" })])).toThrow();
  const e = calc([row({ excluded: true }), row({ id: "child", parentId: "item-1" })]);
  expect(e.publicEditor.summary.subtotal).toBe(100000); expect(e.internal.costTotal).toBe(75000);
});
test.each(["costUnit", "profit", "supplier", "internalDetails"])("public rows reject private field %s", field => {
  expect(() => calc([row({ [field]: 123 })], undefined, undefined, "staff")).toThrow();
});
test("staff cannot submit internal policy changes and public output never contains internal amounts", () => {
  expect(() => calc(undefined, undefined, { companyMargin: .1 }, "staff")).toThrow();
  const { publicEditor } = calc(undefined, undefined, undefined, "staff");
  expect(JSON.stringify(publicEditor)).not.toMatch(/cost|profit|margin|supplier/i);
});
test.each([NaN, Infinity, -1, "100", 1e20])("reject invalid quantity %s", quantity => expect(() => calc([row({ quantity })])).toThrow());
test("spaces retain independent ceiling area, walls and height, and no source inputs mutate", () => {
  const input = emptyEditor(); input.spaces[0].walls = [2, 3]; input.spaces[0].ceilingArea = 17;
  const before = JSON.stringify(input); const result = calculateEditor(input, undefined, master, "admin");
  expect(JSON.stringify(input)).toBe(before); expect(result.publicEditor.spaces[0].ceilingArea).toBe(17);
  expect(result.publicEditor.spaces[4].height).toBe(2200); expect(result.publicEditor.spaces[0].height).toBe(2400);
});
test("unknown space, duplicate rows, negative supply and prototype keys reject", () => {
  expect(() => calc([row({ spaceId: "missing" })])).toThrow(); expect(() => calc([row(), row()])).toThrow();
  expect(() => calc([], undefined, undefined, "admin", { discount: 1 })).toThrow();
  expect(() => calc([row({ id: "__proto__" })])).toThrow();
});
test("saved projection strips derived row amounts before next save", () => {
  const { publicEditor } = calc(); expect(publicEditorInput(publicEditor)).toEqual(editorInput(publicEditor));
  expect(calc(editorInput(publicEditor).items).publicEditor.summary).toEqual(publicEditor.summary);
});
