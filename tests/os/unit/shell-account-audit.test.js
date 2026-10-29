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

test("unmodified orchestration stays exact; approved server and issued-contract paths retain their guards", () => {
  const changed = {
    leavePasswordChangeFlow: ["await signOut()", "window.location.reload()", "setAuthenticated(false)"],
    enterAuthenticatedApp: ["await loadRateSettings()", "if(canViewSystem()){const config=await loadPrivateEstimateDefaults()", "setAuthenticated(true)", "applyAccessControl()"],
    buildEstimateSnapshot: ["serverCalculation.key!==serverCalculationKey()", "throw new Error", "structuredClone(serverCalculation.snapshot)"],
    applyExistingPipeCleaningAdjustment: ["privateCalculationBody(estimate.id||null)", "body.inputs.existingPipeCleaningEnabled=enabled", "await previewInternalEstimate(body)", "return value.snapshot"],
    loadEstimateIntoUi: ["loadedEstimateBaseline", "renderCustomerQuote", "refresh()"],
    handleSaveEstimate: ["saveEstimateInProgress", "await ensureServerCalculation()", "currentProfile?.role === \"staff\"", "updateEstimate", "saveEstimate"],
    calculateForCurrentEstimate: ["return calculate()"],
    syncLoadedEstimateSnapshot: ["loadedEstimateMatchesCurrentInputs()", "activeQuoteEstimate = loadedEstimateBaseline.estimate", "currentPipeCleaningDerivedEstimate()"],
    saveContractOptionsFromForm: ["contractSourceView.pending", "contractSourceView.source", "canEditContractPackageOptions()", "await saveContractOptions"],
    previewContractPackageFromForm: ["contractSourceView.pending", "canPreviewContractPackage()", "currentPipeCleaningDerivedEstimate()", "action: \"preview\"", "await previewContractPackage"],
    createContractPackageFromForm: ["contractSourceView.pending", "canCreateContractPackage()", "currentPackage?.status === \"CONTRACTED\"", "issued?.linked_package_id", "await confirmContractPackage"],
    refreshContractPackagePanel: ["canViewContractPackage()", "loadContractOptions(estimate.id)", "loadContractPackages(estimate.id)", "await contractSourceView.load(estimate.id)"],
    loadContractPackageToPreview: ["await loadContractPackage(packageId)", "contractSourceView.reset()", "estimateFromContractPackage(contractPackage)", "renderContractPackagePanel"],
  };
  for (const [name, old] of Object.entries(golden.protectedSources)) {
    const current = functionSource(source, name);
    if (!changed[name]) expect(current, name).toBe(old);
    else {
      for (const guard of changed[name]) expect(current, `${name}: ${guard}`).toContain(guard);
      if (["buildEstimateSnapshot", "applyExistingPipeCleaningAdjustment", "loadEstimateIntoUi", "calculateForCurrentEstimate"].includes(name)) expect(current).not.toMatch(/await (updateEstimate|createEstimate)|fetch\(/);
    }
  }
});

test("27 business event callbacks preserve bodies except the two customer print entry projections", () => {
  for (const { name, body } of golden.events) {
    const current = functionSource(source, name);
    const ast = parse(current, { ecmaVersion: "latest", sourceType: "module", range: true });
    if (name === "onLogoutClick") {
      for (const step of ["await signOut()", "contractSourceView.reset()", "serverCalculation=null", "serverCalculationPending=null", "calculationGeneration++", "currentProfile = null", "setAuthenticated(false)"]) expect(current).toContain(step);
      continue;
    }
    if (name === "onInternalPrintClick") {
      expect(current).toContain("if(canViewSystem())");
      expect(current.indexOf("await ensureServerCalculation()")).toBeLessThan(current.indexOf("const estimate = currentEstimateForPrint()"));
      for (const renderer of ["renderAdminDetailPrint(estimate)", "renderAdminInternalPrint(estimate)", "renderPurchaseOrderPrint(estimate)", "window.print()"]) expect(current).toContain(renderer);
      continue;
    }
    if (name === "onPrintQuoteClick") {
      expect(current).toContain("if(canViewSystem())");
      expect(current.indexOf("await ensureServerCalculation()")).toBeLessThan(current.indexOf("renderCustomerSummaryPrint("));
      expect(current).toContain("currentProfile?.role === \"staff\"");
      expect(current).toContain("window.print()");
      expect(current).not.toMatch(/renderAdmin|renderInternal/);
      continue;
    }
    const expected = ["onPrintQuoteClick", "onStaffQuoteAction"].includes(name)
      ? body.replace("renderPrintQuote(", "renderCustomerSummaryPrint(") : body;
    const approved = name === "onSavedEstimateAction"
      ? expected.replace('alert("견적 삭제에 실패했습니다.");', 'alert(error?.message?.startsWith("프로젝트·") ? error.message : "견적 삭제에 실패했습니다.");').replace("renderCustomerQuote(buildEstimateSnapshot(calculate()));", "refresh();")
      : expected;
    expect(current.slice(...ast.body[0].body.range), name).toBe(approved);
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
