// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { beforeEach, expect, test } from "vitest";
import { ROOT } from "../runtime.mjs";
import { confirm, contractLib, createApiPackage, executeSql, readPackage, resetIntegrity } from "./helpers.mjs";

beforeEach(resetIntegrity);

async function renderer() {
  sessionStorage.clear();
  document.open();
  document.write(readFileSync(resolve(ROOT,"public/os-app/index.html"),"utf8"));
  document.close();
  return import("../../../../public/os-app/src/main.js");
}

test("PRINT-01 saved confirmed basic data and amounts survive ordinary re-render", async () => {
  const pkg = await confirm(await createApiPackage());
  const main = await renderer();
  const loaded = await readPackage(pkg.id);
  const html = main.renderContractPrintDocument(loaded);
  expect(html).toContain(pkg.contract_no);
  expect(html).toContain("3,770,000");
  expect(loaded.contract_info).toEqual(pkg.contract_info);
  expect(loaded.clause_snapshot).toEqual(pkg.clause_snapshot);
  expect(loaded.payment_schedule).toEqual(pkg.payment_schedule);
});

test("FIXED KF-010 confirmed contractor information must be printed", async () => {
  const pkg = await confirm(await createApiPackage());
  expect(pkg.parties_info.contractor.company_name).toBe("SYNTHETIC CONTRACTOR");
  const main = await renderer();
  const html = main.renderContractPrintDocument(await readPackage(pkg.id));
  expect(html).toContain(pkg.parties_info.contractor.company_name);
  const loaded = await readPackage(pkg.id);
  const savedContractor = loaded.contract_document_versions.find((doc) => doc.document_type === "CONTRACT").content_json.generated_sections.parties.contractor;
  expect(savedContractor).toEqual(pkg.parties_info.contractor);
  loaded.parties_info.contractor.company_name = "CURRENT_COMPANY_MUST_NOT_REPLACE_SNAPSHOT";
  expect(main.renderContractPrintDocument(loaded)).not.toContain("CURRENT_COMPANY_MUST_NOT_REPLACE_SNAPSHOT");
});

test("FIXED KF-008A confirmed fixed clauses ignore current frontend template", async () => {
  const pkg = await confirm(await createApiPackage());
  const main = await renderer();
  const loaded = await readPackage(pkg.id);
  const before = main.renderContractPrintDocument(loaded);
  const contractDoc = loaded.contract_document_versions.find((doc) => doc.document_type === "CONTRACT");
  expect(contractDoc.content_json.generated_sections.fixed_term_lines).toEqual(main.CONTRACT_FIXED_TERM_LINES);
  expect(contractDoc.content_json.generated_sections.fixed_term_lines.filter((line) => /^제\d+조/.test(line))).toHaveLength(48);
  expect(contractDoc.content_hash).toBe(contractLib.hashJson(contractDoc.content_json));
  const altered = structuredClone(contractDoc.content_json);
  altered.generated_sections.fixed_term_lines[1] = "NEW_SERVER_TEMPLATE";
  expect(contractLib.hashJson(altered)).not.toBe(contractDoc.content_hash);
  const original = main.CONTRACT_FIXED_TERM_LINES[1];
  let after;
  try {
    main.CONTRACT_FIXED_TERM_LINES[1] = "SYNTHETIC_NEXT_TEMPLATE_CLAUSE";
    after = main.renderContractPrintDocument(loaded);
  } finally { main.CONTRACT_FIXED_TERM_LINES[1] = original; }
  expect(loaded.contract_document_versions).toEqual(pkg.contract_document_versions);
  const text = (html) => {
    const node = document.createElement("div"); node.innerHTML=html;
    return node.querySelector(".contract-fixed-terms").textContent;
  };
  expect(text(after)).toBe(text(before));
});

test("FIXED KF-008B confirmed saved payment label/ratio/amount/due basis are honored", async () => {
  const pkg = await createApiPackage();
  const schedule = structuredClone(pkg.payment_schedule);
  schedule[1].due_basis = "SYNTHETIC_CONFIRMED_PAYMENT_WORDING";
  schedule[1].label = "SYNTHETIC_CONFIRMED_LABEL";
  schedule[1].ratio = 35;
  const snapshot = await contractLib.buildContractPackageSnapshot(pkg.estimate_id, undefined, pkg.contract_no);
  delete snapshot.source_hash;
  snapshot.payment_schedule = schedule;
  const sourceHash = contractLib.hashJson(snapshot);
  const docs = contractLib.buildContractDocuments(snapshot);
  const manifest = createHash("sha256").update(docs.slice().sort((a,b)=>a.document_type.localeCompare(b.document_type))
    .map((doc)=>`${doc.document_type}:${doc.content_hash}`).join("|")).digest("hex");
  const json = (value) => `'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
  executeSql(`update public.contract_package_snapshots set payment_schedule=${json(schedule)},source_hash='${sourceHash}',package_manifest_hash='${manifest}' where id='${pkg.id}';
    ${docs.map((doc)=>`update public.contract_document_versions set content_json=${json(doc.content_json)},content_hash='${doc.content_hash}'
      where package_id='${pkg.id}' and document_type='${doc.document_type}';`).join("\n")}`);
  const locked = await confirm(await readPackage(pkg.id));
  const main = await renderer();
  const savedSchedule = locked.contract_document_versions.find((doc) => doc.document_type === "CONTRACT").content_json.generated_sections.payment_schedule;
  expect(savedSchedule).toEqual(schedule);
  locked.payment_schedule[1].due_basis = "CURRENT_PACKAGE_MUST_NOT_REPLACE_DOCUMENT";
  const html = main.renderContractPrintDocument(locked);
  expect(html).toContain(schedule[1].due_basis);
  expect(html).toContain(schedule[1].label);
  expect(html).toContain("35%");
  expect(html).toContain(Number(schedule[1].amount).toLocaleString("ko-KR"));
  expect(html).not.toContain("CURRENT_PACKAGE_MUST_NOT_REPLACE_DOCUMENT");
});

test("PRINT-LEGACY packages without stored fixed clauses use read-only fallback", async () => {
  const pkg = await confirm(await createApiPackage());
  const main = await renderer();
  const legacy = structuredClone(pkg);
  legacy.contract_document_versions = [];
  const before = JSON.stringify(legacy);
  const html = main.renderContractPrintDocument(legacy);
  expect(html).toContain("제48조");
  expect(html).toContain(pkg.parties_info.contractor.company_name);
  expect(JSON.stringify(legacy)).toBe(before);
});

// Nothing changes the actual HTML/template files; mutations above are test-local.
