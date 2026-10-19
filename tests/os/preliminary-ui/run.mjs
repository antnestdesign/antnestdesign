import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { startPreview } from "./preview.mjs";
import { TEST_ESTIMATE_ID } from "../fixtures/estimates.js";

const bundled = createRequire(resolve(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/__preliminary_ui__.cjs"));
const { chromium } = bundled("playwright");
const preview = await startPreview();
const artifacts = resolve("tests/os/preliminary-ui/artifacts");
mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { syntheticOnly: true, productionRequests: 0, cases: [] };
try {
  for (const role of ["admin", "manager", "staff"]) for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: "block" });
    const errors = [];
    await context.route("**/*", route => {
      if (new URL(route.request().url()).origin === preview.origin) return route.continue();
      report.productionRequests++;
      return route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const failures = [];
    page.on("response", response => { if (response.status() >= 400) failures.push({ path: new URL(response.url()).pathname, status: response.status() }); });
    await page.goto(`${preview.origin}/os?role=${role}`, { waitUntil: "domcontentloaded" });
    try { await page.locator("#appShell.app-locked").waitFor({ state: "detached", timeout: 10000 }); }
    catch { throw new Error(JSON.stringify({ errors, failures, stage: "synthetic bootstrap" })); }
    try { await page.locator("#projectSearchResults").selectOption(TEST_ESTIMATE_ID, { timeout: 10000 }); }
    catch { throw new Error(JSON.stringify({ errors, failures, options: await page.locator("#projectSearchResults").innerHTML(), stage: "synthetic project list" })); }
    await page.locator("#loadProjectButton").click();
    await page.waitForFunction(() => document.getElementById("clientTotal").textContent === "3,770,000원");
    const values = () => page.locator("#client input, #client select").evaluateAll(nodes => nodes.map(node => [node.id, node.value, node.checked, node.disabled]));
    const before = await values();
    assert.equal(before.length, 145);
    const quoteBefore = await page.locator("#quoteRows").innerHTML();
    const buttons = page.locator(".preliminary-detail-button");
    assert.equal(await buttons.count(), 9);
    assert.equal(await page.locator(".preliminary-trade-detail:visible").count(), 0);
    assert.equal(await page.locator("#clientTotal").evaluate(node => node.previousElementSibling.textContent), "저장 견적 총액");
    assert.equal(await page.locator(".preliminary-amount-source:visible").count(), 7);
    assert.equal(await page.locator(".preliminary-source-notice:visible").count(), 1);
    assert.equal(await page.locator(".excluded-work:visible").count(), 0);
    const topLayout = await page.evaluate(() => ({
      topbarHeight: Math.round(document.querySelector(".topbar").getBoundingClientRect().height),
      firstTradeTop: Math.round(document.querySelector(".preliminary-trade").getBoundingClientRect().top + scrollY),
      repeatedIdentityVisible: getComputedStyle(document.querySelector(".preliminary-identity-repeat")).display !== "none",
    }));
    if (width === 375) {
      assert(topLayout.topbarHeight < 200);
      assert(topLayout.firstTradeTop < 900);
      assert.equal(topLayout.repeatedIdentityVisible, false);
    } else assert.equal(topLayout.repeatedIdentityVisible, true);
    await page.screenshot({ path: resolve(artifacts, `${role}-${width}-overview.png`), fullPage: true });
    for (let index = 0; index < 9; index++) {
      await buttons.nth(index).focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".preliminary-trade-detail:visible").count(), 1);
      const overflow = await page.evaluate(() => {
        const root = document.getElementById("client");
        return { document: document.documentElement.scrollWidth > innerWidth + 1,
          controls: [...root.querySelectorAll("input,select,button")].filter(node => node.getClientRects().length && node.getBoundingClientRect().right > innerWidth + 1).map(node => node.id || node.textContent) };
      });
      assert.deepEqual(overflow, { document: false, controls: [] }, `${role}/${width}/trade ${index} overflow`);
    }
    assert.deepEqual(await values(), before);
    assert.equal(await page.locator("#quoteRows").innerHTML(), quoteBefore);
    assert.equal(await page.locator("#clientTotal").textContent(), "3,770,000원");
    await page.screenshot({ path: resolve(artifacts, `${role}-${width}-detail.png`), fullPage: true });
    if (role === "staff") {
      assert.equal(await page.locator("#internalDetailRows").count(), 0);
      assert(!/직접원가|원가 합계|마진율|예상마진/.test(await page.locator("#client").innerText()));
    }
    await page.locator(".preliminary-actions button:last-child").click();
    assert.equal(await page.locator("body").getAttribute("data-synthetic-print"), "ready");
    assert.equal(await page.locator("#printQuoteSheet tbody tr").count(), 8);
    assert(!/직접원가|내부 원가|마진율/.test(await page.locator("#printQuoteSheet").textContent()));
    assert.deepEqual(errors, []);
    report.cases.push({ role, width, inputs: 145, trades: 9, keyboard: "PASS", navigationDataExact: true,
      savedSourceMismatch: "EXPLICIT", ...topLayout, overflow: 0, pageErrors: 0, print: "PASS" });
    await context.close();
  }
  assert.equal(report.productionRequests, 0);
  assert.equal(preview.writes.filter(write => write.path !== "/api/os/estimates/preview").length, 0);
  report.result = "PASS";
  writeFileSync(resolve(artifacts, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); await preview.close(); }
