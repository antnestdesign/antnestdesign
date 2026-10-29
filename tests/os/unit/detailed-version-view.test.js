import { expect, test, vi } from "vitest";
import { mountDetailedVersions } from "../../../public/os-app/src/detailed-version-view.js";
import { calculateEditor, emptyEditor } from "../../../app/api/os/projects/_lib/editor-model.ts";
import { renderDetailedVersion } from "../../../public/os-app/src/detailed-version-print.js";
import { readFileSync } from "node:fs";
const documentFixture = () => ({ company: { brand: "AND", name: "합성 회사" }, context: { project_name: "현장", client_name: "고객", address: "주소" }, editor: calculateEditor(emptyEditor(), undefined, [], "admin").publicEditor });

test("print closing keeps totals, separate scopes and complete company identity together without mutating snapshot", () => {
  const doc=documentFixture(),before=structuredClone(doc);
  doc.company={...doc.company,representative:"합성 대표",businessNumber:"SYNTHETIC-REG",address:"합성 회사 주소",phone:"SYNTHETIC-PHONE",email:"synthetic@example.invalid"};
  const expected=structuredClone(doc);document.body.innerHTML=renderDetailedVersion(doc);
  const closing=document.querySelector('.detailed-issued-closing');
  expect(closing.querySelector('.detailed-issued-summary')).not.toBeNull();
  expect(closing.querySelectorAll('.contract-print-section')).toHaveLength(2);
  for(const value of Object.values(doc.company))expect(document.body.textContent).toContain(value);
  expect(closing.querySelector('footer').textContent).toContain('SYNTHETIC-REG');
  expect(doc).toEqual(expected);expect(before.editor).toEqual(doc.editor);
  expect(readFileSync('public/os-app/styles.css','utf8')).toMatch(/\.detailed-issued-closing\s*\{[^}]*break-inside:\s*avoid;[^}]*page-break-inside:\s*avoid;/);
});
function setup({ dirty = false, canIssue = true, readOnly = false } = {}) {
  document.body.innerHTML = '<div id="versions"></div>';
  const host = document.getElementById("versions"), message = vi.fn(); let count = 0;
  const request = vi.fn(async (path, options) => path.endsWith("preview") ? { document: documentFixture(), confirmation: "sealed" }
    : options?.method === "POST" ? { ...documentFixture(), id: "version-a", version: ++count, issuedAt: "2026-10-21T00:00:00Z", issuedBy: "합성 발행자", quoteNumber: "AND-Q-2026-000001" }
    : count ? [{ id: "version-a", version: count, issuedAt: "2026-10-21T00:00:00Z", issuedBy: "합성 발행자", total: 0 }] : []);
  const run = async fn => { try { await fn(); } catch (e) { message(e.message, true); } };
  const view = mountDetailedVersions({ host, draftId: "head-a", revision: 2, canIssue, readOnly, isDirty: () => dirty, request, run, message });
  return { view, host, request, message, setDirty: value => { dirty = value; } };
}
test("unsaved edits cannot preview or issue any saved version", async () => {
  const f = setup({ dirty: true });
  f.host.querySelector("[data-issue-preview]").click(); await Promise.resolve();
  f.host.querySelector("[data-issue-confirm]").click(); await Promise.resolve();
  expect(f.request).not.toHaveBeenCalled(); expect(f.message).toHaveBeenCalledWith(expect.stringContaining("먼저 저장"), true);
  f.view.destroy();
});
test("explicit preview, confirmation and issue are separate and never record delivery", async () => {
  const f = setup(); await f.view.refresh();
  f.host.querySelector("[data-issue-confirm]").click(); await Promise.resolve();
  expect(f.request.mock.calls.filter(([,o]) => o?.method === "POST")).toHaveLength(0);
  f.host.querySelector("[data-issue-preview]").click(); await vi.waitFor(() => expect(f.host.querySelector("[data-version-preview]").hidden).toBe(false));
  vi.mocked(confirm).mockReturnValue(false); f.host.querySelector("[data-issue-confirm]").click(); await Promise.resolve();
  expect(f.message).toHaveBeenCalledWith("공식 발행을 취소했습니다.");
  expect(f.request.mock.calls.filter(([p,o]) => !p.endsWith("preview") && o?.method === "POST")).toHaveLength(0);
  vi.mocked(confirm).mockReturnValue(true); f.host.querySelector("[data-issue-confirm]").click();
  await vi.waitFor(() => expect(f.host.querySelector("[data-version-title]").textContent).toContain("V1"));
  expect(f.message).toHaveBeenCalledWith(expect.stringContaining("자동 발송하지 않았습니다."));
  const issue = f.request.mock.calls.find(([p,o]) => !p.endsWith("preview") && o?.method === "POST");
  expect(JSON.parse(issue[1].body)).toMatchObject({ expected_revision: 2, confirmation: "sealed", confirmed: true });
  f.view.destroy();
});
test("editing after preview still blocks publication", async () => {
  const f = setup(); f.host.querySelector("[data-issue-preview]").click();
  await vi.waitFor(() => expect(f.host.querySelector("[data-version-preview]").hidden).toBe(false));
  f.setDirty(true); f.host.querySelector("[data-issue-confirm]").click(); await Promise.resolve();
  expect(f.request.mock.calls.filter(([p,o]) => !p.endsWith("preview") && o?.method === "POST")).toHaveLength(0); f.view.destroy();
});
test.each([{ canIssue: false }, { readOnly: true }])("staff/READ_ONLY do not expose publication control %j", options => {
  const f = setup(options); expect(f.host.querySelector("[data-issue-confirm]")).toBeNull(); f.view.destroy();
});
