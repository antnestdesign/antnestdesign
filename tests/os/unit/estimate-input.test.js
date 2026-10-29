// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "espree";
import { analyze } from "eslint-scope";
import { describe, expect, test } from "vitest";
import { isEstimateInputExcluded, canonicalInputValues } from "../../../public/os-app/src/estimate-input.js";
import { COST_ITEM_DEFINITIONS } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { canonicalCases, exclusionProbeIds } from "../fixtures/estimate-input-cases.js";

const moduleUrl = new URL("../../../public/os-app/src/estimate-input.js", import.meta.url);
const golden = JSON.parse(readFileSync(new URL("../fixtures/estimate-input-characterization.json", import.meta.url), "utf8"));
const policy = Object.fromEntries(structuredClone(COST_ITEM_DEFINITIONS).map((item) => [item.inputId, item]));

function freeze(value, seen = new Set()) {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Reflect.ownKeys(value).forEach((key) => freeze(value[key], seen));
    Object.freeze(value);
  }
  return value;
}

function clone(value, seen = new Map()) {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ("value" in descriptor) descriptor.value = clone(descriptor.value, seen);
    Object.defineProperty(copy, key, descriptor);
  }
  return copy;
}

freeze(policy);

describe("Phase 3B-3 exclusion characterization at a056a2c", () => {
  test("current exclusion map exactly matches captured cost input IDs", () => {
    expect(Object.keys(policy)).toEqual(golden.excludedKeys);
  });

  test.each(golden.excludedKeys)("exact cost input %s remains excluded", (id) => {
    expect(isEstimateInputExcluded(id, policy)).toBe(true);
    expect(isEstimateInputExcluded(id, policy)).toBe(true);
    expect(canonicalInputValues({ [id]: 123, kept: false }, policy)).toBe('{"kept":false}');
  });

  test.each(golden.exclusion)("probe $idLabel preserves $excluded", ({ index, excluded }) => {
    const before = clone(policy);
    expect(isEstimateInputExcluded(exclusionProbeIds[index], policy)).toBe(excluded);
    expect(isEstimateInputExcluded(exclusionProbeIds[index], policy)).toBe(excluded);
    expect(policy).toEqual(before);
  });

  test("lookup remains exact and case-sensitive, not prefix or pattern based", () => {
    expect(isEstimateInputExcluded("rateLowerPerJa", policy)).toBe(true);
    for (const id of ["RateLowerPerJa", "rateLowerPerJaExtra", "prefixrateLowerPerJa", "rateUnknown", " rateLowerPerJa "])
      expect(isEstimateInputExcluded(id, policy)).toBe(false);
  });

  test("existing inherited prototype lookup is retained, not hardened silently", () => {
    expect(Object.hasOwn(policy, "constructor")).toBe(false);
    expect(isEstimateInputExcluded("constructor", policy)).toBe(true);
    expect(isEstimateInputExcluded("__proto__", policy)).toBe(true);
    expect(isEstimateInputExcluded("toJSON", policy)).toBe(false);
  });

  test("policy is explicitly injected without cached or global state", () => {
    const included = freeze(Object.create(null));
    const excluded = freeze({ clientName: true });
    expect(isEstimateInputExcluded("clientName", included)).toBe(false);
    expect(isEstimateInputExcluded("clientName", excluded)).toBe(true);
    expect(isEstimateInputExcluded("clientName", included)).toBe(false);
    expect(canonicalInputValues({ clientName: "synthetic" }, excluded)).toBe("{}");
    expect(canonicalInputValues({ clientName: "synthetic" }, included)).toBe('{"clientName":"synthetic"}');
  });

  test.each([0, false, null, undefined, ""])("falsy policy value %s still means included", (value) => {
    expect(isEstimateInputExcluded("key", { key: value })).toBe(false);
  });
});

describe("Phase 3B-3 canonicalization characterization at a056a2c", () => {
  for (const [name, factory] of canonicalCases) {
    test(`${name}: original output/error, immutable input and deterministic repetition`, () => {
      const expected = golden.cases.find((entry) => entry.name === name);
      expect(expected).toBeDefined();
      const input = factory();
      const before = clone(input);
      freeze(input);
      const policyBefore = clone(policy);
      for (let repeat = 0; repeat < 2; repeat += 1) {
        if (expected.error) {
          try {
            canonicalInputValues(input, policy);
            expect.fail("Expected original serialization error");
          } catch (error) {
            expect(error.name).toBe(expected.error);
          }
        } else {
          expect(canonicalInputValues(input, policy)).toBe(expected.output);
        }
      }
      expect(input).toEqual(before);
      expect(policy).toEqual(policyBefore);
    });
  }

  test("plain string/number/boolean/null types survive without parsing, trimming or defaults", () => {
    const inputs = { z: " 33 ", b: false, n: 0, empty: "", nil: null, missing: undefined, negative: -1.5 };
    expect(JSON.parse(canonicalInputValues(inputs, policy))).toEqual({ b: false, empty: "", n: 0, negative: -1.5, nil: null, z: " 33 " });
  });

  test("top-level insertion order is ignored, nested object and array order are not changed", () => {
    expect(canonicalInputValues({ z: 3, a: 1, m: 2 }, policy)).toBe(canonicalInputValues({ m: 2, a: 1, z: 3 }, policy));
    expect(canonicalInputValues({ nested: { z: 3, a: 1 } }, policy)).not.toBe(canonicalInputValues({ nested: { a: 1, z: 3 } }, policy));
    expect(canonicalInputValues({ array: [3, 1, 2] }, policy)).toBe('{"array":[3,1,2]}');
  });

  test("integer keys follow JSON enumeration, not an invented lexical output order", () => {
    expect(canonicalInputValues({ "10": "ten", "2": "two", "1": "one", "01": "leading" }, policy))
      .toBe('{"1":"one","2":"two","10":"ten","01":"leading"}');
  });

  test("undefined differs from false, null, zero and empty string", () => {
    expect(canonicalInputValues({ value: undefined }, policy)).toBe("{}");
    expect(canonicalInputValues({ value: false }, policy)).toBe('{"value":false}');
    expect(canonicalInputValues({ value: null }, policy)).toBe('{"value":null}');
    expect(canonicalInputValues({ value: 0 }, policy)).toBe('{"value":0}');
    expect(canonicalInputValues({ value: "" }, policy)).toBe('{"value":""}');
  });

  test("unknown, legacy and private inputs remain canonical; this is not a staff whitelist", () => {
    const input = { unknownKey: 1, wallpaperMaterialGrade: "legacy", targetMargin: "30", manualAdjustment: -1000, internalMemo: "synthetic", rateLowerPerJa: 999 };
    expect(JSON.parse(canonicalInputValues(input, policy))).toEqual({ internalMemo: "synthetic", manualAdjustment: -1000, targetMargin: "30", unknownKey: 1, wallpaperMaterialGrade: "legacy" });
  });

  test("non-enumerable and inherited input properties do not enter canonical values", () => {
    const input = Object.create({ inherited: 1 });
    Object.defineProperty(input, "hidden", { value: 2 });
    input.own = 3;
    expect(canonicalInputValues(input, policy)).toBe('{"own":3}');
  });

  test("original plain object descriptors and nested references are not changed", () => {
    const nested = freeze({ array: [1, 2], value: null });
    const input = freeze({ nested, excluded: false });
    const before = Object.getOwnPropertyDescriptors(input);
    canonicalInputValues(input, policy);
    expect(Object.getOwnPropertyDescriptors(input)).toEqual(before);
    expect(input.nested).toBe(nested);
  });
});

describe("input module pure dependency boundary", () => {
  test("standalone import and execution need no browser, network, core or app state", () => {
    const script = `
      import assert from "node:assert/strict";
      for (const name of ["window", "document", "localStorage", "sessionStorage", "el", "COST_ITEM_BY_INPUT"])
        assert.equal(typeof globalThis[name], "undefined", name);
      globalThis.fetch = () => { throw new Error("Network forbidden"); };
      const { isEstimateInputExcluded, canonicalInputValues } = await import(${JSON.stringify(moduleUrl.href)});
      const policy = { rateLowerPerJa: true };
      assert.equal(isEstimateInputExcluded("rateLowerPerJa", policy), true);
      assert.equal(isEstimateInputExcluded("unknown", policy), false);
      assert.equal(canonicalInputValues({ z: false, a: 0, missing: undefined, rateLowerPerJa: 123 }, policy), '{"a":0,"z":false}');
      assert.equal(canonicalInputValues(undefined, policy), "{}");
      console.log("input pure import PASS");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe("input pure import PASS");
  });

  test("no imports or leaked state; form and restore adapters use the explicit exclusion policy", () => {
    const source = readFileSync(moduleUrl, "utf8");
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
    expect(ast.body.filter((node) => node.type === "ImportDeclaration")).toEqual([]);
    const scope = analyze(ast, { ecmaVersion: 2022, sourceType: "module" });
    expect([...new Set(scope.globalScope.through.map((reference) => reference.identifier.name))].sort()).toEqual(["Boolean", "JSON", "Object"]);
    expect(source).not.toMatch(/\b(document|window|localStorage|sessionStorage|fetch|supabase|storage|COST_ITEM_BY_INPUT|currentProfile|activeQuoteEstimate)\b|\bel\./);
    const names = ["isEstimateInputExcluded", "canonicalInputValues"];
    expect(ast.body.map((node) => node.declaration.id.name)).toEqual(names);
    const main = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
    const mainAst = parse(main, { ecmaVersion: "latest", sourceType: "module" });
    expect(mainAst.body.filter((node) => node.type === "FunctionDeclaration" && names.includes(node.id.name))).toEqual([]);
    const imported = mainAst.body.find((node) => node.type === "ImportDeclaration" && node.source.value === "./estimate-input.js");
    expect(imported.specifiers.map((node) => [node.imported.name, node.local.name])).toEqual([["canonicalInputValues", "canonicalInputValues"]]);
    expect(main).not.toContain("isEstimateInputExcluded(id, COST_ITEM_BY_INPUT)");
    expect(main).toContain("createEstimateRestore({ document, elements: el, excludedInputById: COST_ITEM_BY_INPUT })");
    const restore = readFileSync(new URL("../../../public/os-app/src/estimate-restore.js", import.meta.url), "utf8");
    expect(restore).toContain('import { isEstimateInputExcluded } from "./estimate-input.js"');
    expect(restore.match(/isEstimateInputExcluded\(id, excludedInputById\)/g)).toHaveLength(1);
    expect(main).toContain("collectEstimateFormValues(el, COST_ITEM_BY_INPUT)");
    const form = readFileSync(new URL("../../../public/os-app/src/estimate-form.js", import.meta.url), "utf8");
    const formAst = parse(form, { ecmaVersion: "latest", sourceType: "module" });
    const formImport = formAst.body.find((node) => node.type === "ImportDeclaration" && node.source.value === "./estimate-input.js");
    expect(formImport.specifiers.map((node) => node.imported.name)).toEqual(["isEstimateInputExcluded"]);
    expect(form.match(/isEstimateInputExcluded\(id, excludedInputById\)/g)).toHaveLength(1);
    expect(form).not.toContain("COST_ITEM_BY_INPUT");
    expect(main).toContain("canonicalInputValues(currentEstimateInputValues(), COST_ITEM_BY_INPUT)");
  });

  test("server whitelist remains independent of browser canonicalization", () => {
    const server = readFileSync(new URL("../../../app/api/os/estimates/_lib/estimates.js", import.meta.url), "utf8");
    const storage = readFileSync(new URL("../../../public/os-app/src/storage.js", import.meta.url), "utf8");
    expect(server).not.toContain('estimate-input.js"');
    expect(storage).not.toContain('estimate-input.js"');
    expect(server).not.toMatch(/\b(isEstimateInputExcluded|canonicalInputValues)\b/);
    expect(server).toContain("if (!allowedInputs.has(id)) throw new ApiError(400,");
    expect(storage).toContain("inputs: staffEstimateInputs(estimate.inputs)");
  });
});
