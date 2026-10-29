import { expect, test, vi } from "vitest";
import { foundationErrorMessage, mountDetailedEstimateView, projectDifferences } from "../../../public/os-app/src/detailed-estimate-view.js";
import { emptyEditor } from "../../../app/api/os/projects/_lib/editor-model.ts";

test("project differences retain zero, empty and distinct customer/site values", () => {
  expect(projectDifferences({ project_name: "A", client_name: "", area_pyeong: 0 }, { project_name: "B", client_name: "C", area_pyeong: 0 }))
    .toEqual([{ label: "프로젝트명", source: "A", target: "B" }, { label: "고객명", source: "", target: "C" }]);
});
test("mount adds no legacy inputs or writes, and an unsaved preliminary cannot start", async () => {
  document.body.innerHTML = '<main id="appShell"><section id="client"><div class="preliminary-actions"></div><input id="original" value="unchanged"></section></main>';
  const original = document.getElementById("original"), request = vi.fn(), alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  const view = mountDetailedEstimateView({ document, request, loadMode: async () => ({ mode: "ON" }), getContext: () => ({ estimateId: null }) });
  await view.open();
  expect(request).not.toHaveBeenCalled(); expect(alert).toHaveBeenCalled();
  expect(document.querySelectorAll("#client input")).toHaveLength(1); expect(original.value).toBe("unchanged");
  view.destroy(); alert.mockRestore();
});

test("saved-source preview never serializes unsaved DOM inputs or relies on canonical dirty state", async () => {
  document.body.innerHTML = '<main id="appShell"><section id="client"><div class="preliminary-actions"></div><input id="original" value="unsaved"></section></main>';
  const request = vi.fn(async path => path.endsWith("preview") ? { snapshot: { header: { project_name: "saved" }, customerQuote: { groups: [] } }, notice: "저장된 가견적만 참고합니다." } : []);
  const view = mountDetailedEstimateView({ document, request, loadMode: async () => ({ mode: "ON" }), getContext: () => ({ estimateId: "saved-id", dirty: true }) });
  document.getElementById("detailedEstimateDialog").showModal = vi.fn();
  await view.open();
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ estimate_id: "saved-id" });
  expect(request.mock.calls).toHaveLength(3);
  expect(document.getElementById("original").value).toBe("unsaved");
  expect(document.getElementById("detailedProjectMode")).not.toBeNull();
  view.destroy();
});

test.each([undefined, "OFF", "invalid"])("feature mode %s hides entry and never requests domain data", async mode => {
  document.body.innerHTML = '<main id="appShell"><div class="preliminary-actions"></div></main>';
  const request = vi.fn();
  const view = mountDetailedEstimateView({ document, request, loadMode: async () => ({ mode }), getContext: () => ({}) });
  await view.open();
  expect(document.getElementById("startDetailedEstimateButton").hidden).toBe(true); expect(request).not.toHaveBeenCalled();
  view.destroy();
});
test("READ_ONLY opens existing projects without a preliminary and exposes no creation controls", async () => {
  document.body.innerHTML = '<main id="appShell"><div class="preliminary-actions"></div></main>';
  const request = vi.fn(async () => []);
  const view = mountDetailedEstimateView({ document, request, loadMode: async () => ({ mode: "READ_ONLY" }), getContext: () => ({}) });
  document.getElementById("detailedEstimateDialog").showModal = vi.fn();
  await view.open();
  expect(document.getElementById("startDetailedEstimateButton").textContent).toBe("본견적 조회");
  expect(request.mock.calls.map(c => c[0])).toEqual(["/projects"]);
  expect(document.getElementById("createDetailedDraftButton")).toBeNull();
  expect(document.getElementById("newDetailedProjectName")).toBeNull();
  view.destroy();
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function selectionFixture(hooks = {}) {
  document.body.innerHTML = '<main id="appShell"><div class="preliminary-actions"></div><input id="original" value="saved-source"></main>';
  let managed = hooks.managed ?? false;
  const project = id => ({ id, project_name: id === "a" ? (managed ? "서버 확인 현장" : "기존 현장") : "다른 현장", managed: id === "a" && managed });
  const detail = id => ({ project: project(id), confirmation: `confirmed-${id}`, drafts: [{ id: "draft-a", title: "기존 작성본" }] });
  const saved = { id: "draft-a", project: { project_name: "저장 현장" }, revision: 2, context: { project_name: "저장 현장", client_name: "저장 고객", address: "저장 주소", area_pyeong: 0 }, reference: { snapshot: { header: { project_name: "원본 가견적", total_price: 3770000 } } } };
  const request = vi.fn(async (path, options) => {
    if (hooks.request) { const result = await hooks.request(path, options); if (result !== undefined) return result; }
    if (path.endsWith("/adopt")) { await hooks.adopt?.(); managed = true; return { project_id: "a" }; }
    if (path === "/projects") { await hooks.list?.(managed); return [project("a"), project("b")]; }
    if (path === "/projects/customers") return [];
    if (path.startsWith("/projects/")) return await hooks.detail?.(path.slice(10), managed, detail) ?? detail(path.slice(10));
    if (path.endsWith("preview")) return { snapshot: { header: { project_name: "원본 가견적", client_name: "합성 고객", phone: "000", address: "저장 주소", area_pyeong: 0, total_price: 3770000 }, customerQuote: { groups: [] } }, confirmation: "source-confirmed", connection: hooks.connection ?? null };
    if (path === "/detailed-estimates/draft-a" && !options) return structuredClone(saved);
    if (path === "/detailed-estimates/draft-a/editor" && !options) return { editor: emptyEditor(), revision: saved.revision };
    if (path === "/detailed-estimates/catalog" || path === "/detailed-estimates/catalog?view=standards") return [];
    if (path === "/detailed-estimates/draft-a/versions") return [];
    throw new Error(`Unexpected fixture request ${path}`);
  });
  const view = mountDetailedEstimateView({ document, request, loadMode: async () => ({ mode: "ON" }), getContext: () => ({ estimateId: "source-a" }) });
  const dialog = document.getElementById("detailedEstimateDialog");
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  await view.open();
  const select = id => {
    const mode = document.getElementById("detailedProjectMode"); mode.value = "existing";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
    const input = document.getElementById("detailedProjectSelect"); input.value = id;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const selectA = async () => { select("a"); await vi.waitFor(() => expect(document.getElementById("adoptDetailedProjectButton")).not.toBeNull()); };
  const adopt = () => { vi.mocked(confirm).mockReturnValue(true); document.getElementById("adoptDetailedProjectButton").click(); };
  return { view, dialog, request, select, selectA, adopt };
}

test("adoption refreshes server list and detail immediately without losing selection", async () => {
  const f = await selectionFixture();
  try {
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").textContent).toBe("프로젝트 도입 상태를 확인했습니다."));
    const select = document.getElementById("detailedProjectSelect");
    expect(select.value).toBe("a"); expect(select.selectedOptions[0].textContent).toBe("서버 확인 현장");
    expect(document.getElementById("detailedProjectConfirmed")).not.toBeNull();
    expect(document.getElementById("adoptDetailedProjectButton")).toBeNull();
    expect(f.request.mock.calls.filter(([p]) => p === "/projects")).toHaveLength(2);
    expect(document.getElementById("original").value).toBe("saved-source");
  } finally { f.view.destroy(); }
});

test("pending adoption cannot send a duplicate command", async () => {
  const pending = deferred(), f = await selectionFixture({ adopt: () => pending.promise });
  try {
    await f.selectA(); f.adopt();
    document.getElementById("adoptDetailedProjectButton").click();
    expect(f.request.mock.calls.filter(([p]) => p.endsWith("/adopt"))).toHaveLength(1);
    pending.resolve();
    await vi.waitFor(() => expect(document.getElementById("detailedProjectConfirmed")).not.toBeNull());
  } finally { f.view.destroy(); }
});

test("failed adoption never claims success or changes the managed label", async () => {
  const f = await selectionFixture({ adopt: () => { throw new Error("도입 권한이 없습니다."); } });
  try {
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").textContent).toBe("도입 권한이 없습니다."));
    expect(document.getElementById("detailedProjectSelect").selectedOptions[0].textContent).toContain("도입 확인 필요");
    expect(f.request.mock.calls.filter(([p]) => p === "/projects")).toHaveLength(1);
  } finally { f.view.destroy(); }
});

test("post-command refresh failure shows unverified state, not adoption success", async () => {
  const f = await selectionFixture({ list: managed => { if (managed) throw new Error("조회 실패"); } });
  try {
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").textContent).toContain("목록을 확인하지 못했습니다"));
    expect(document.getElementById("detailedProjectSelect").value).toBe("a");
    expect(document.getElementById("adoptDetailedProjectButton")).toBeNull();
    expect(document.getElementById("detailedProjectConfirmed")).toBeNull();
  } finally { f.view.destroy(); }
});

test("unconfirmed server detail never becomes optimistically managed", async () => {
  const f = await selectionFixture({ detail: (id, managed, detail) => ({ ...detail(id), project: { ...detail(id).project, managed: false } }) });
  try {
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").textContent).toContain("목록을 확인하지 못했습니다"));
    expect(document.getElementById("detailedProjectConfirmed")).toBeNull();
  } finally { f.view.destroy(); }
});

test("an older same-project response cannot restore the pre-adoption state", async () => {
  const old = deferred(); let first = true;
  const f = await selectionFixture({ detail: (id, managed, detail) => {
    if (id === "a" && first) { first = false; return old.promise; }
    return detail(id);
  } });
  try {
    f.select("a"); f.select("b");
    await vi.waitFor(() => expect(document.getElementById("detailedProjectReview").textContent).toContain("다른 현장"));
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(document.getElementById("detailedProjectConfirmed")).not.toBeNull());
    old.resolve({ project: { id: "a", project_name: "과거 현장", managed: false }, drafts: [], confirmation: "old" });
    await Promise.resolve(); await Promise.resolve();
    expect(document.getElementById("adoptDetailedProjectButton")).toBeNull();
    expect(document.getElementById("detailedProjectSelect").selectedOptions[0].textContent).toBe("서버 확인 현장");
  } finally { f.view.destroy(); }
});

test("late adoption refresh does not replace a newly selected project", async () => {
  const pending = deferred(), f = await selectionFixture({ list: managed => managed ? pending.promise : undefined });
  try {
    await f.selectA(); f.adopt();
    await vi.waitFor(() => expect(f.request.mock.calls.filter(([p]) => p === "/projects")).toHaveLength(2));
    f.select("b");
    await vi.waitFor(() => expect(document.getElementById("detailedProjectReview").textContent).toContain("다른 현장"));
    pending.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(document.getElementById("detailedProjectSelect").value).toBe("b");
    expect(document.getElementById("detailedProjectReview").textContent).not.toContain("서버 확인 현장");
  } finally { f.view.destroy(); }
});

test("closing a pending selection invalidates its response", async () => {
  const pending = deferred(), f = await selectionFixture({ detail: () => pending.promise });
  try {
    f.select("a"); document.querySelector("[data-detailed-close]").click();
    pending.resolve({ project: { id: "a", project_name: "늦은 응답", managed: false }, drafts: [] });
    await Promise.resolve(); await Promise.resolve();
    expect(f.dialog.open).toBe(false); expect(document.getElementById("detailedProjectReview").textContent).toBe("");
  } finally { f.view.destroy(); }
});

test("canceling an unsaved close preserves inputs, and discard/reopen never saves them", async () => {
  const f = await selectionFixture();
  try {
    await f.selectA(); document.getElementById("openDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedClientName")).not.toBeNull());
    const input = document.getElementById("detailedClientName"); input.value = "미저장 고객"; input.dispatchEvent(new Event("input", { bubbles: true }));
    vi.mocked(confirm).mockReturnValue(false); document.querySelector("[data-detailed-close]").click();
    expect(f.dialog.open).toBe(true); expect(input.value).toBe("미저장 고객");
    vi.mocked(confirm).mockReturnValue(true); document.querySelector("[data-detailed-close]").click();
    expect(f.dialog.open).toBe(false);
    await f.view.open(); await f.selectA(); document.getElementById("openDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedClientName")?.value).toBe("저장 고객"));
    expect(f.request.mock.calls.some(([,o]) => o?.method === "PATCH")).toBe(false);
  } finally { f.view.destroy(); }
});

test("Escape cancel retains dirty draft input without a write", async () => {
  const f = await selectionFixture();
  try {
    await f.selectA(); document.getElementById("openDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedAddress")).not.toBeNull());
    const input = document.getElementById("detailedAddress"); input.value = "미저장 주소"; input.dispatchEvent(new Event("input", { bubbles: true }));
    vi.mocked(confirm).mockReturnValue(false);
    const event = new Event("cancel", { cancelable: true }); f.dialog.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(input.value).toBe("미저장 주소");
    expect(f.request.mock.calls.some(([,o]) => o?.method === "PATCH")).toBe(false);
  } finally { f.view.destroy(); }
});

async function openDirtyDraft(f) {
  await f.selectA(); document.getElementById("openDetailedDraftButton").click();
  await vi.waitFor(() => expect(document.getElementById("detailedClientName")).not.toBeNull());
  const input = document.getElementById("detailedClientName");
  input.value = "이탈 전 미저장 고객"; input.dispatchEvent(new Event("input", { bubbles: true }));
  return input;
}
function unloadAttempt() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

test("dirty browser departure is prevented without saving or discarding inputs", async () => {
  const f = await selectionFixture();
  try {
    expect(unloadAttempt().defaultPrevented).toBe(false);
    const input = await openDirtyDraft(f);
    expect(unloadAttempt().defaultPrevented).toBe(true);
    expect(f.dialog.open).toBe(true); expect(input.value).toBe("이탈 전 미저장 고객");
    expect(f.request.mock.calls.some(([, o]) => o?.method === "PATCH")).toBe(false);
  } finally { f.view.destroy(); }
});

test.each(["close", "escape"])("accepted %s discards only local dirty state and releases departure guard", async method => {
  const f = await selectionFixture();
  try {
    await openDirtyDraft(f); vi.mocked(confirm).mockReturnValue(true);
    if (method === "close") document.querySelector("[data-detailed-close]").click();
    else {
      const event = new Event("cancel", { cancelable: true }); f.dialog.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      f.dialog.close();
    }
    expect(f.dialog.open).toBe(false); expect(unloadAttempt().defaultPrevented).toBe(false);
    expect(f.request.mock.calls.some(([, o]) => o?.method === "PATCH")).toBe(false);
  } finally { f.view.destroy(); }
});

test("canceling close retains departure protection, and destroy removes its listener", async () => {
  const f = await selectionFixture();
  try {
    const input = await openDirtyDraft(f); vi.mocked(confirm).mockReturnValue(false);
    document.querySelector("[data-detailed-close]").click();
    expect(input.value).toBe("이탈 전 미저장 고객"); expect(unloadAttempt().defaultPrevented).toBe(true);
  } finally { f.view.destroy(); }
  expect(unloadAttempt().defaultPrevented).toBe(false);
});

test("unlinked source defaults to prefilled new project/customer without recalculating or creating", async () => {
  const f = await selectionFixture();
  try {
    expect(document.getElementById("detailedProjectMode").value).toBe("new");
    expect(document.getElementById("detailedExisting").hidden).toBe(true);
    expect(document.getElementById("newDetailedProjectName").value).toBe("원본 가견적");
    expect(document.getElementById("newDetailedClient").value).toBe("합성 고객");
    expect(document.getElementById("newDetailedPhone").value).toBe("000");
    expect(document.getElementById("newDetailedArea").value).toBe("0");
    expect(document.getElementById("createDetailedDraftButton").textContent).toBe("프로젝트 만들고 본견적 시작");
    expect(f.request.mock.calls.some(([,o]) => o?.method && !o.body.includes('"estimate_id":"source-a"'))).toBe(false);
  } finally { f.view.destroy(); }
});

test("linked source selects only its established project and offers its own saved draft first", async () => {
  const f = await selectionFixture({ managed: true, connection: { project_id: "a", draft_ids: ["draft-a"] } });
  try {
    expect(f.request.mock.calls.some(([p]) => p === "/projects/a")).toBe(true);
    expect(document.getElementById("detailedProjectMode").parentElement.hidden).toBe(true);
    expect(document.getElementById("detailedNew").hidden).toBe(true);
    expect(document.getElementById("openDetailedDraftButton").textContent).toBe("이어서 작성");
    expect(document.getElementById("createDetailedDraftButton").hidden).toBe(true);
    document.getElementById("openDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedClientName")?.value).toBe("저장 고객"));
    expect(f.request.mock.calls.some(([,o]) => o?.method === "PATCH")).toBe(false);
  } finally { f.view.destroy(); }
});

test("independent creation is explicit and reuses exact linked project without a difference checkbox", async () => {
  const f = await selectionFixture({ managed: true, connection: { project_id: "a", draft_ids: ["draft-a"] }, request: path => path === "/detailed-estimates/from-preliminary" ? { id: "draft-a" } : undefined });
  try {
    document.getElementById("newIndependentDetailedButton").click();
    await vi.waitFor(() => expect(document.getElementById("createDetailedDraftButton").disabled).toBe(false));
    expect(document.getElementById("createDetailedDraftButton").hidden).toBe(false);
    document.getElementById("createDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedClientName")).not.toBeNull());
    const body = JSON.parse(f.request.mock.calls.find(([p]) => p === "/detailed-estimates/from-preliminary")[1].body);
    expect(body.estimate_id).toBe("source-a"); expect(body.selection).toMatchObject({ mode: "existing", project_id: "a", confirmed: true });
    expect(body).not.toHaveProperty("total");
  } finally { f.view.destroy(); }
});

test("same project name never chooses or merges an unlinked project", async () => {
  const f = await selectionFixture({ managed: true });
  try { expect(document.getElementById("detailedProjectSelect").value).toBe(""); expect(document.getElementById("detailedProjectMode").value).toBe("new"); }
  finally { f.view.destroy(); }
});

test("linked inaccessible project fails closed without new-project fallback", async () => {
  const f = await selectionFixture({ connection: { project_id: "a", draft_ids: [] }, detail: () => { throw Object.assign(new Error("접근 권한이 없습니다."), { status: 403 }); } });
  try {
    expect(document.getElementById("createDetailedDraftButton").hidden).toBe(true);
    expect(document.getElementById("detailedNew").hidden).toBe(true);
    expect(document.getElementById("detailedStatus").textContent).toContain("관리자·매니저");
    expect(document.getElementById("detailedStatus").getAttribute("role")).toBe("alert");
  } finally { f.view.destroy(); }
});

test("required input failure is visible, focuses missing input and never sends start", async () => {
  const f = await selectionFixture();
  try {
    document.getElementById("newDetailedProjectName").value = "";
    document.getElementById("createDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").textContent).toContain("프로젝트명"));
    expect(document.activeElement.id).toBe("newDetailedProjectName");
    expect(document.getElementById("newDetailedClient").value).toBe("합성 고객");
    expect(f.request.mock.calls.some(([p]) => p === "/detailed-estimates/from-preliminary")).toBe(false);
  } finally { f.view.destroy(); }
});

test.each([401,403,409,423,503,500])("start HTTP %s failure preserves inputs and announces an actionable error", async status => {
  const f = await selectionFixture({ request: path => { if (path === "/detailed-estimates/from-preliminary") throw Object.assign(new Error("기존 프로젝트 연결과 충돌합니다."), { status }); } });
  try {
    document.getElementById("createDetailedDraftButton").click();
    await vi.waitFor(() => expect(document.getElementById("detailedStatus").getAttribute("role")).toBe("alert"));
    expect(document.getElementById("newDetailedProjectName").value).toBe("원본 가견적");
    expect(document.activeElement.id).toBe("detailedStatus");
    expect(document.getElementById("createDetailedDraftButton").disabled).toBe(false);
    if (status === 409) expect(document.getElementById("detailedStatus").textContent).toContain("프로젝트 연결");
  } finally { f.view.destroy(); }
});

test("delayed double click sends one command; retry after response loss reuses request id", async () => {
  const pending = deferred(); let attempt = 0;
  const f = await selectionFixture({ request: path => {
    if (path === "/detailed-estimates/from-preliminary") return ++attempt === 1 ? pending.promise : { id: "draft-a" };
  } });
  try {
    const button = document.getElementById("createDetailedDraftButton"); button.click(); button.click();
    expect(f.request.mock.calls.filter(([p]) => p === "/detailed-estimates/from-preliminary")).toHaveLength(1);
    expect(document.getElementById("detailedStatus").textContent).toContain("처리 중");
    pending.reject(new Error("응답을 받지 못했습니다."));
    await vi.waitFor(() => expect(button.disabled).toBe(false)); button.click();
    await vi.waitFor(() => expect(document.getElementById("detailedClientName")).not.toBeNull());
    const commands = f.request.mock.calls.filter(([p]) => p === "/detailed-estimates/from-preliminary").map(([,o]) => JSON.parse(o.body));
    expect(commands[0].request_id).toBe(commands[1].request_id);
  } finally { f.view.destroy(); }
});

test("unrecognized errors never show raw private response text", () => {
  expect(foundationErrorMessage(new Error('SYNTHETIC_PRIVATE_ROW'))).not.toContain('PRIVATE');
});

test("failed save keeps draft input dirty and preserves browser departure protection", async () => {
  const f = await selectionFixture({ request: (path, options) => { if (options?.method === 'PATCH') throw Object.assign(new Error('다른 사용자가 수정했습니다. 다시 불러와 주세요.'), { status: 409 }); } });
  try {
    const input = await openDirtyDraft(f);
    document.getElementById('saveDetailedDraftButton').click();
    await vi.waitFor(() => expect(document.getElementById('detailedStatus').getAttribute('role')).toBe('alert'));
    expect(input.value).toBe('이탈 전 미저장 고객'); expect(unloadAttempt().defaultPrevented).toBe(true);
    expect(document.getElementById('detailedStatus').textContent).toContain('다른 사용자가 수정');
  } finally { f.view.destroy(); }
});
