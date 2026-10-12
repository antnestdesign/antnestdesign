// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "espree";
import { describe, expect, test } from "vitest";
import { won, moneyAmount, rateNumber, escapeHtml } from "../../../public/os-app/src/utils.js";

const utilityUrl = new URL("../../../public/os-app/src/utils.js", import.meta.url);
const names = ["won", "moneyAmount", "rateNumber", "escapeHtml"];

describe("Phase 3B-1 frozen formatting behavior", () => {
  test.each([
    [1234567, "1,234,567원"], [0, "0원"], [-1234, "-1,234원"],
    [1.5, "2원"], [1.49, "1원"], [-1.5, "-1원"], [-0.5, "-0원"],
    ["1234.5", "1,235원"], [null, "0원"], [undefined, "NaN원"],
    ["", "0원"], ["abc", "NaN원"], [NaN, "NaN원"],
    [Infinity, "∞원"], [-Infinity, "-∞원"],
  ])("won(%s) preserves %s", (input, expected) => {
    expect(won(input)).toBe(expected);
    expect(won(input)).toBe(expected);
  });

  test.each([
    [1234567, 1234567], [0, 0], [-1234, -1234],
    [1.5, 2], [1.49, 1], [-1.5, -1], [-0.5, -0],
    ["1234.5", 1235], [null, 0], [undefined, 0],
    ["", 0], ["abc", 0], [NaN, 0], [Infinity, Infinity], [-Infinity, -Infinity],
  ])("moneyAmount(%s) preserves %s", (input, expected) => {
    expect(moneyAmount(input)).toBe(expected);
    expect(moneyAmount(input)).toBe(expected);
  });

  test.each([
    [0.3, 0.3], [0, 0], [-0.3, -0.3], [0.12345, 0.12345],
    ["0.3", 0.3], ["1234.5", 1234.5], [null, 0], [undefined, 0],
    ["", 0], [" ", 0], ["abc", 0], [NaN, 0],
    [Infinity, Infinity], [-Infinity, -Infinity], [-0, 0],
  ])("rateNumber(%s) preserves %s", (input, expected) => {
    expect(rateNumber(input)).toBe(expected);
    expect(rateNumber(input)).toBe(expected);
  });

  test.each([
    ["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"],
    ['"', "&quot;"], ["'", "&#39;"],
    ['&<>"\'', "&amp;&lt;&gt;&quot;&#39;"],
    ["&amp;&lt;&quot;&#39;", "&amp;amp;&amp;lt;&amp;quot;&amp;#39;"],
    ["한글 AND", "한글 AND"], ["", ""], [null, ""], [undefined, ""],
    [123, "123"], [false, "false"], ["/`=", "/`="],
  ])("escapeHtml(%s) preserves %s", (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
    expect(escapeHtml(input)).toBe(expected);
  });

  test.each([
    ["won", won, "1,235원"], ["moneyAmount", moneyAmount, 1235],
    ["rateNumber", rateNumber, 1234.5], ["escapeHtml", escapeHtml, "&lt;AND&gt;"],
  ])("%s does not mutate a frozen coercible input", (_name, format, expected) => {
    const input = Object.freeze({
      amount: 1234.5,
      text: "<AND>",
      valueOf() { return this.amount; },
      toString() { return this.text; },
    });
    const before = Object.getOwnPropertyDescriptors(input);
    expect(format(input)).toBe(expected);
    expect(format(input)).toBe(expected);
    expect(Object.getOwnPropertyDescriptors(input)).toEqual(before);
  });

  test("imports and runs in a fresh Node process without browser globals", () => {
    const script = `
      import assert from "node:assert/strict";
      for (const name of ["window", "document", "localStorage", "sessionStorage"])
        assert.equal(typeof globalThis[name], "undefined", name);
      const { won, moneyAmount, rateNumber, escapeHtml } = await import(${JSON.stringify(utilityUrl.href)});
      assert.equal(won(1234), "1,234원");
      assert.equal(moneyAmount(-0.5), -0);
      assert.equal(rateNumber("0.3"), 0.3);
      assert.equal(escapeHtml("<AND>"), "&lt;AND&gt;");
      for (const name of ["window", "document", "localStorage", "sessionStorage"])
        assert.equal(typeof globalThis[name], "undefined", name);
      console.log("browser-global-free PASS");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8", timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe("browser-global-free PASS");
  });

  test("main imports all four canonical exports and utils has no external dependencies", () => {
    const mainUrl = new URL("../../../public/os-app/src/main.js", import.meta.url);
    const options = { ecmaVersion: "latest", sourceType: "module" };
    const main = parse(readFileSync(mainUrl, "utf8"), options);
    const utils = parse(readFileSync(utilityUrl, "utf8"), options);
    const utilityImport = main.body.find((node) => node.type === "ImportDeclaration" && node.source.value === "./utils.js");
    expect(utilityImport?.specifiers.map((node) => [node.imported.name, node.local.name]))
      .toEqual(names.map((name) => [name, name]));
    const declarations = (body) => body.flatMap((node) => {
      const declaration = node.type === "ExportNamedDeclaration" ? node.declaration : node;
      if (declaration?.type === "FunctionDeclaration") return [declaration.id.name];
      if (declaration?.type === "VariableDeclaration") return declaration.declarations.map((entry) => entry.id.name);
      return [];
    });
    expect(declarations(main.body).filter((name) => names.includes(name))).toEqual([]);
    expect(declarations(utils.body).filter((name) => names.includes(name)).sort()).toEqual([...names].sort());
    expect(utils.body.filter((node) => node.type === "ImportDeclaration")).toEqual([]);
  });
});
