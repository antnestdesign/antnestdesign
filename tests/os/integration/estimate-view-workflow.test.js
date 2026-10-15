import { describe, expect, test } from "vitest";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs, flushAsyncWork } from "../helpers/os-harness.js";
import { mutations } from "../helpers/network.js";

describe("Phase 3D real application role presentation and print orchestration", () => {
  for (const role of ["admin", "manager", "staff"]) {
    test(`${role}: read, edit controls, delete visibility and customer print remain unchanged`, async () => {
      const fixture = latestEstimate();
      const database = createEstimateDatabase(fixture);
      const before = structuredClone(database.row);
      const { main, storage } = await mountOs(database, testProfile(role));
      main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
      await flushAsyncWork();
      expect(document.getElementById("clientTotal").textContent).toBe("3,770,000원");
      expect(document.getElementById("demolitionFurnitureM").disabled).toBe(false);
      expect(document.querySelectorAll("[data-delete-estimate]").length).toBe(role === "admin" ? 1 : 0);
      const detailButton = document.querySelector("[data-toggle-internal-estimate]");
      if (role === "staff") {
        expect(detailButton).toBeNull();
        expect(document.getElementById("internalDetailRows")).toBeNull();
        expect(document.querySelector(".admin-estimate-diagnostics")).toBeNull();
      } else {
        expect(detailButton).not.toBeNull();
        detailButton.click();
        await flushAsyncWork();
        const panel = document.querySelector(".admin-estimate-detail-panel");
        expect(panel).not.toBeNull();
        expect(panel.textContent).toContain("2,900,000원");
        expect(panel.textContent).toContain("870,000원");
        expect(panel.querySelector(".admin-estimate-diagnostics")).toBeNull();
        panel.querySelector("[data-toggle-internal-trade]").click();
        await flushAsyncWork();
        expect(document.querySelector(".admin-trade-detail")).not.toBeNull();
        document.querySelector("[data-toggle-internal-estimate]").click();
        await flushAsyncWork();
        expect(document.querySelector(".admin-estimate-detail-panel")).toBeNull();
      }
      document.getElementById("printQuoteButton").click();
      const print = document.getElementById("printQuoteSheet");
      expect(print.textContent).toContain(fixture.projectName);
      expect(print.textContent).toContain("3,770,000원");
      expect(print.textContent).not.toMatch(/직접원가|내부 원가|마진율|구버전 견적 원가 누락/);
      expect(print.querySelectorAll("thead th")).toHaveLength(2);
      expect(print.querySelectorAll("tbody tr")).toHaveLength(fixture.customerQuote.groups.length);
      for (const group of fixture.customerQuote.groups) for (const item of group.items) expect(print.textContent).not.toContain(item.name);
      if (role === "admin") {
        document.getElementById("printAdminDetailButton").click();
        expect(print.querySelectorAll("thead th")).toHaveLength(7);
        for (const item of fixture.internalDetails) expect(print.textContent).toContain(item.item);
        document.getElementById("printQuoteButton").click();
        expect(print.querySelectorAll("thead th")).toHaveLength(2);
      } else if (role === "staff") {
        document.getElementById("staffPrintClientQuoteButton").click();
        expect(print.querySelectorAll("thead th")).toHaveLength(2);
      } else {
        expect(document.getElementById("printAdminDetailButton")).toBeNull();
      }
      expect(database.row).toStrictEqual(before);
      expect(mutations()).toEqual([]);
    });
  }
});
