import { beforeEach, describe, expect, test } from "vitest";
import { clone, latestEstimate, pipeCleaningEstimate } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs } from "../helpers/os-harness.js";
import { mutations } from "../helpers/network.js";

const PIPE = "기존 배관 청소";
let adjust;

beforeEach(async () => {
  const { main } = await mountOs(createEstimateDatabase(latestEstimate()));
  adjust = main.applyExistingPipeCleaningAdjustment;
});

function otherRows(estimate) {
  return {
    internal: estimate.internalDetails.filter((row) => row.item !== PIPE),
    customer: estimate.customerQuote.groups.map((group) => ({
      label: group.label, items: group.items.filter((row) => row.name !== PIPE),
    })),
    otherTotals: estimate.customerQuote.groups.filter((group) => group.label !== "기타"),
  };
}

function verifyPipe(estimate, enabled) {
  expect(estimate.internalDetails.filter((row) => row.item === PIPE)).toHaveLength(enabled ? 1 : 0);
  const customerRows = estimate.customerQuote.groups.flatMap((group) => group.items).filter((row) => row.name === PIPE);
  expect(customerRows).toHaveLength(enabled ? 1 : 0);
  if (enabled) {
    expect(estimate.internalDetails.find((row) => row.item === PIPE)).toMatchObject({
      quantity: "1식", unitPrice: 300000, cost: 300000, customerRevenue: 300000, profit: 0, correction: 0,
    });
    expect(customerRows[0].amount).toBe(300000);
  }
  expect(estimate.internalDetails.reduce((sum, row) => sum + row.cost, 0)).toBe(estimate.costTotal);
  expect(estimate.customerQuote.groups.reduce((sum, group) => sum + group.total, 0)).toBe(estimate.total);
  for (const group of estimate.customerQuote.groups) {
    expect(group.items.reduce((sum, row) => sum + row.amount, 0)).toBe(group.total);
  }
  expect(estimate.customerQuote.total).toBe(estimate.total);
  expect(estimate.internalSummary.customerRevenue).toBe(estimate.total);
  expect(estimate.internalSummary.directCost).toBe(estimate.costTotal);
  expect(estimate.internalSummary.profit).toBe(estimate.total - estimate.costTotal);
  expect(estimate.marginRate).toBe(Number(((estimate.total - estimate.costTotal) / estimate.costTotal * 100).toFixed(2)));
}

describe("P0-3 fixed pipe cleaning", () => {
  test("OFF -> ON adds 300000 to cost and sales, with zero extra profit", () => {
    const base = latestEstimate();
    const result = adjust(base, true);
    expect(result.total).toBe(4070000);
    expect(result.costTotal).toBe(3200000);
    expect(result.internalSummary.profit).toBe(870000);
    expect(result.inputs.existingPipeCleaningEnabled).toBe(true);
    verifyPipe(result, true);
  });

  test("ON -> ON is idempotent", () => {
    const once = adjust(latestEstimate(), true);
    expect(adjust(once, true)).toEqual(once);
    verifyPipe(adjust(once, true), true);
  });

  test("an independently constructed ON fixture is not charged again", () => {
    const existing = pipeCleaningEstimate();
    expect(adjust(existing, true)).toEqual(existing);
  });

  test("ON -> OFF removes only the pipe row and 300000 from each total", () => {
    const enabled = pipeCleaningEstimate();
    const result = adjust(enabled, false);
    expect(result.total).toBe(3770000);
    expect(result.costTotal).toBe(2900000);
    expect(result.internalSummary.profit).toBe(870000);
    expect(otherRows(result)).toEqual(otherRows(enabled));
    expect(result.inputs.existingPipeCleaningEnabled).toBe(false);
    verifyPipe(result, false);
  });

  test("OFF -> ON -> OFF -> ON never accumulates rows or amounts", () => {
    const first = adjust(latestEstimate(), true);
    let result = first;
    for (let cycle = 0; cycle < 12; cycle += 1) {
      result = adjust(adjust(result, false), true);
    }
    expect(result).toEqual(first);
  });

  test("OFF -> OFF does not deduct a missing row", () => {
    const base = latestEstimate();
    expect(adjust(base, false)).toEqual(base);
  });

  test("missing legacy pipe input is false and never adds a charge", () => {
    const base = latestEstimate();
    delete base.inputs.existingPipeCleaningEnabled;
    const result = adjust(base, false);
    expect(result.inputs.existingPipeCleaningEnabled).toBe(false);
    expect(result.total).toBe(3770000);
    expect(result.costTotal).toBe(2900000);
    verifyPipe(result, false);
  });

  test("other trades remain byte-for-byte identical", () => {
    const base = latestEstimate();
    expect(JSON.stringify(otherRows(adjust(base, true)))).toBe(JSON.stringify(otherRows(base)));
  });

  test("source estimate, cached rows and cost snapshot are not mutated", () => {
    const base = latestEstimate();
    const before = clone(base);
    adjust(base, true);
    expect(base).toEqual(before);
    expect(adjust(base, true).costSnapshot).toEqual(before.costSnapshot);
    expect(mutations()).toEqual([]);
  });

  test("saved JSON round-trip preserves rows, totals and profit", () => {
    const saved = adjust(latestEstimate(), true);
    const restored = JSON.parse(JSON.stringify({ estimate_data: saved })).estimate_data;
    expect(restored).toEqual(saved);
    expect(adjust(restored, true)).toEqual(saved);
    verifyPipe(restored, true);
  });
});
