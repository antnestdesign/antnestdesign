// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { describe, expect, test } from "vitest";
import { parse } from "espree";
import { bindApplicationEvents } from "../../../public/os-app/src/application-events.js";
import { createUiShell } from "../../../public/os-app/src/ui-shell.js";
import { shellAccountAuditRuntime, exerciseShellAccountAudit, functionSource } from "../helpers/shell-account-audit-runtime.js";

const golden = JSON.parse(readFileSync(new URL("../fixtures/shell-account-audit-characterization.json", import.meta.url), "utf8"));
const source = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

describe("Phase 3F exact account/audit/shell characterization at cdc2b05", () => {
  for (const { entry, result } of golden.cases) test(entry.name, async () => {
    for (const original of [true, false]) {
      const e = await shellAccountAuditRuntime(golden, entry, original);
      const before = structuredClone(e.state);
      freeze(e.state);
      expect(JSON.parse(JSON.stringify(exerciseShellAccountAudit(e, entry)))).toStrictEqual(result);
      expect(e.state).toStrictEqual(before);
      e.dom.window.close();
    }
  });
});

test("49 authorization, login/password, estimate and mutation orchestration functions are unchanged", () => {
  for (const [name, old] of Object.entries(golden.protectedSources)) expect(functionSource(source, name), name).toBe(old);
});

test("27 business event callbacks preserve bodies except the two customer print entry projections", () => {
  for (const { name, body } of golden.events) {
    const current = functionSource(source, name);
    const ast = parse(current, { ecmaVersion: "latest", sourceType: "module", range: true });
    const expected = ["onPrintQuoteClick", "onStaffQuoteAction"].includes(name)
      ? body.replace("renderPrintQuote(", "renderCustomerSummaryPrint(") : body;
    expect(current.slice(...ast.body[0].body.range), name).toBe(expected);
  }
});

for (const session of [false, true]) test(`bootstrap registration and restore order is identical: session=${session}`, () => {
  function exercise(original) {
    const trace = [];
    const target = id => ({ id, dataset: { tab: id }, addEventListener: type => trace.push(`bind:${id}:${type}`) });
    const elements = Object.fromEntries(["projectSearch", "projectSearchResults", "existingPipeCleaningEnabled", "areaPyeong"].map(id => [id, target(id)]));
    const document = { querySelectorAll: () => [target("client"), target("quote"), target("admin")], getElementById: target, addEventListener: type => trace.push(`bind:document:${type}`) };
    const window = target("window");
    const context = vm.createContext({ document, window, el: elements, console,
      getAuthSession: () => { trace.push("session"); return session; },
      completeLogin: () => { trace.push("complete-login"); return Promise.resolve(); },
      bindApplicationEvents, integerIds: [],
    });
    for (const name of ["repairStaticKoreanLabels", "guardCheckboxLabelClicks", "removeDuplicateManagementCriteriaBlock", "removeLegacyAdminEstimatePanels", "bindPasswordChangeShell", "setAuthenticated", "loadStoredSession"]) context[name] = () => trace.push(name);
    for (const name of [...golden.events.map(e => e.name), "handleTabNavigation", "handleExistingPipeCleaningChanged", "handleBoundEstimateInput", "handleSaveEstimate"]) context[name] = () => {};
    context.uiShell = createUiShell({ document });
    vm.runInContext(original ? golden.initializationSource : functionSource(source, "bootstrap") + "\nbootstrap();", context);
    return trace;
  }
  expect(exercise(false)).toStrictEqual(exercise(true));
});

test("views and event bindings import safely without browser globals or direct API/storage access", () => {
  const modules = ["account-view.js", "audit-view.js", "ui-shell.js", "application-events.js"];
  for (const name of modules) {
    const content = readFileSync(new URL(`../../../public/os-app/src/${name}`, import.meta.url), "utf8");
    expect(content).not.toMatch(/from ["'][^"']*(main|storage|app\/api)|\b(fetch|supabase|localStorage|sessionStorage)\b/);
  }
  const urls = modules.map(name => new URL(`../../../public/os-app/src/${name}`, import.meta.url).href);
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `delete globalThis.window; delete globalThis.document; for (const url of ${JSON.stringify(urls)}) await import(url);`], { encoding: "utf8", timeout: 10000 });
  expect(result.status, result.stderr).toBe(0);
});

test("pipe cleaning binds only its dedicated change handler; regular inputs keep normalization order", () => {
  const listeners = {};
  const trace = [];
  const element = id => ({ id, addEventListener: (type, listener) => { listeners[`${id}:${type}`] = listener; } });
  const elements = Object.fromEntries(["existingPipeCleaningEnabled", "areaPyeong", "projectSearch"].map(id => [id, element(id)]));
  const actions = Object.fromEntries(golden.events.map(e => [e.name, () => {}]));
  actions.onPipeCleaningChanged = () => trace.push("pipe");
  actions.onEstimateInput = input => trace.push(input.id);
  bindApplicationEvents({ document: { getElementById: () => null, addEventListener() {} }, window: { addEventListener() {} }, elements, actions });
  expect(listeners["existingPipeCleaningEnabled:input"]).toBeUndefined();
  listeners["existingPipeCleaningEnabled:change"](); listeners["areaPyeong:input"]();
  expect(trace).toEqual(["pipe", "areaPyeong"]);
  const mainInput = functionSource(source, "handleBoundEstimateInput");
  expect(mainInput.indexOf("normalizeIntegerInput")).toBeLessThan(mainInput.indexOf("syncRateDirtyState"));
  expect(mainInput.indexOf("syncRateDirtyState")).toBeLessThan(mainInput.indexOf("handleEstimateInputChanged"));
});
