import { escapeHtml } from "./utils.js";

export function projectDifferences(source, target) {
  const labels = { project_name: "프로젝트명", client_name: "고객명", phone: "연락처", address: "현장 주소", area_pyeong: "평형" };
  return Object.entries(labels).filter(([key]) => String(source?.[key] ?? "") !== String(target?.[key] ?? ""))
    .map(([key, label]) => ({ label, source: String(source?.[key] ?? ""), target: String(target?.[key] ?? "") }));
}

export function foundationErrorMessage(error) {
  const message = /^[가-힣]/.test(error?.message || "") ? error.message : "요청을 처리하지 못했습니다. 입력을 유지했으니 다시 시도해 주세요.";
  if (error?.status === 401) return "로그인이 만료됐습니다. 다시 로그인한 뒤 진행해 주세요.";
  if (error?.status === 403) return "현재 프로젝트에 접근하거나 작업할 권한이 없습니다. 관리자·매니저에게 확인해 주세요.";
  if (error?.status === 423) return "현재 읽기 전용입니다. 생성·저장은 할 수 없습니다.";
  if (error?.status === 503) return "본견적 기능이 비활성화됐거나 서비스를 사용할 수 없습니다. 잠시 후 다시 확인해 주세요.";
  return message;
}

export function mountDetailedEstimateView({ document, getContext, request, loadMode = async () => ({ mode: "OFF" }) }) {
  const host = document.getElementById("appShell"), actions = document.querySelector(".preliminary-actions");
  if (!host || !actions) return null;
  const start = document.createElement("button");
  start.type = "button"; start.id = "startDetailedEstimateButton"; start.textContent = "본견적 작성 시작";
  start.hidden = true;
  actions.before(start);
  const dialog = document.createElement("dialog");
  dialog.id = "detailedEstimateDialog"; dialog.className = "detailed-workspace";
  dialog.setAttribute("aria-labelledby", "detailedWorkspaceTitle");
  host.append(dialog);
  let preview = null, selected = null, draft = null, sourceId = null, busy = false, dirty = false;
  let projects = [], customers = [], lastCommand = null;
  let mode = "OFF", modeRequest = 0, projectRequest = 0;
  const hasUnsavedChanges = () => dialog.open && dirty;
  const canClose = () => !hasUnsavedChanges() || confirm("저장하지 않은 본견적 변경사항을 닫을까요?");
  const discardChanges = () => { projectRequest++; dirty = false; };
  const refreshMode = async () => {
    const generation = ++modeRequest;
    let next = "OFF";
    try { const value = await loadMode(); if (["ON", "READ_ONLY"].includes(value?.mode)) next = value.mode; } catch { /* Fail closed without blocking legacy workflows. */ }
    if (generation !== modeRequest) return mode;
    if (next !== mode && dialog.open) { projectRequest++; dialog.close(); draft = null; dirty = false; }
    mode = next; start.hidden = mode === "OFF";
    start.textContent = mode === "READ_ONLY" ? "본견적 조회" : "본견적 작성 시작";
    return mode;
  };
  const esc = escapeHtml;
  const field = (id, label, value = "", type = "text") => `<label>${label}<input id="${id}" type="${type}" value="${esc(value ?? "")}" ${type === "number" ? 'min="0" max="100000" step="any"' : 'maxlength="500"'}></label>`;
  const status = (message, error = false) => {
    const n = dialog.querySelector("#detailedStatus");
    if (n) {
      n.textContent = message; n.setAttribute("role", error ? "alert" : "status");
      if (error) { n.focus(); n.scrollIntoView?.({ block: "nearest" }); }
    }
  };
  const run = async fn => {
    if (busy) return;
    busy = true;
    dialog.querySelectorAll("button").forEach(n => { n.disabled = true; });
    status("처리 중입니다. 잠시 기다려 주세요.");
    try { await fn(); } catch (error) {
      status(foundationErrorMessage(error), true);
      if (error.field) dialog.querySelector(`#${error.field}`)?.focus();
    }
    finally { busy = false; dialog.querySelectorAll("button").forEach(n => { n.disabled = false; }); }
  };
  const command = (path, method, body) => {
    if (mode !== "ON") throw new Error("프로젝트·본견적 기능은 현재 읽기 전용입니다.");
    const signature = JSON.stringify({ path, method, body });
    if (lastCommand?.signature !== signature) lastCommand = { signature, request_id: crypto.randomUUID() };
    return request(path, { method, body: JSON.stringify({ ...body, request_id: lastCommand.request_id }) });
  };
  const shell = title => {
    projectRequest++;
    dialog.innerHTML = `<header><h2 id="detailedWorkspaceTitle">${title}</h2><button type="button" data-detailed-close aria-label="닫기">닫기</button></header><p id="detailedStatus" role="status" tabindex="-1"></p><div id="detailedBody"></div>`;
  };
  const projectOptions = () => `<option value="">선택</option>${projects.map(p => `<option value="${esc(p.id)}">${esc(p.project_name)}${mode === "ON" && !p.managed ? " (도입 확인 필요)" : ""}</option>`).join("")}`;
  const load = async id => {
    draft = await request(`/detailed-estimates/${encodeURIComponent(id)}`);
    dirty = false; lastCommand = null;
    shell("본견적 준비 작성본");
    const c = draft.context;
    dialog.querySelector("#detailedBody").innerHTML = `
      <p class="detailed-state">준비 작성본 · 상세 품목 및 금액 미작성</p>
      <dl><div><dt>프로젝트</dt><dd>${esc(draft.project.project_name)}</dd></div><div><dt>저장 상태</dt><dd>저장됨</dd></div>
      <div><dt>참고 가견적</dt><dd>${esc(draft.reference.snapshot.header.project_name)}</dd></div>
      <div><dt>참고 당시 고객금액</dt><dd>${Number(draft.reference.snapshot.header.total_price || 0).toLocaleString("ko-KR")}원</dd></div></dl>
      <div class="detailed-fields">${field("detailedProjectName", "작성 현장명", c.project_name)}${field("detailedClientName", "고객명", c.client_name)}
      ${field("detailedPhone", "연락처", c.phone)}${field("detailedAddress", "현장 주소", c.address)}${field("detailedArea", "평형", c.area_pyeong, "number")}
      <label><input id="detailedCustomerUndecided" type="checkbox" ${c.customer_undecided ? "checked" : ""}> 고객 미정</label></div>
      <div class="detailed-actions">${mode === "ON" ? '<button type="button" id="saveDetailedDraftButton">작성본 저장</button>' : ""}<button type="button" id="reloadDetailedDraftButton">다시 불러오기</button><button type="button" id="loadDetailedEventsButton">작업 이력</button></div><div id="detailedEvents"></div>`;
    if (mode !== "ON") dialog.querySelectorAll("input").forEach(n => { n.disabled = true; });
    status(mode === "READ_ONLY" ? "읽기 전용으로 불러왔습니다." : "작성본을 불러왔습니다.");
  };
  const renderSelection = () => {
    selected = null;
    const body = dialog.querySelector("#detailedBody"), s = preview.snapshot.header, linked = Boolean(preview.connection);
    body.innerHTML = `<h3>저장 가견적 확인</h3><p>${esc(s.project_name)} · ${esc(s.client_name || "고객 미정")} · ${Number(s.total_price || 0).toLocaleString("ko-KR")}원</p>
      <ul>${preview.snapshot.customerQuote.groups.map(g => `<li>${esc(g.label)}: ${Number(g.total || 0).toLocaleString("ko-KR")}원</li>`).join("")}</ul>
      <p>${esc(preview.notice)}</p><label ${linked ? "hidden" : ""}>프로젝트 연결<select id="detailedProjectMode"><option value="new" ${linked ? "" : "selected"}>새 프로젝트 생성</option><option value="existing" ${linked ? "selected" : ""}>기존 프로젝트 선택</option></select></label>
      <div id="detailedExisting" ${linked ? "" : "hidden"}><label ${linked ? "hidden" : ""}>프로젝트<select id="detailedProjectSelect">${projectOptions()}</select></label><div id="detailedProjectReview"></div></div>
      <div id="detailedNew" ${linked ? "hidden" : ""} class="detailed-fields">${field("newDetailedProjectName", "프로젝트명", s.project_name)}${field("newDetailedAddress", "현장 주소", s.address)}${field("newDetailedArea", "평형", s.area_pyeong ?? "", "number")}
      <label>고객 연결<select id="detailedCustomerMode"><option value="undecided" ${s.client_name ? "" : "selected"}>고객 미정</option><option value="new" ${s.client_name ? "selected" : ""}>신규 고객 생성</option><option value="existing">기존 고객 선택</option></select></label>
      <div id="detailedNewCustomer" ${s.client_name ? "" : "hidden"}>${field("newDetailedClient", "고객명", s.client_name)}${field("newDetailedPhone", "연락처", s.phone)}</div>
      <label id="detailedExistingCustomer" hidden>기존 고객<select id="detailedCustomerSelect"><option value="">선택</option>${customers.map(c => `<option value="${esc(c.id)}">${esc(c.name || "이름 없음")} · ${esc(c.phone || "")}</option>`).join("")}</select></label></div>
      <div id="detailedTitleField">${field("newDetailedTitle", "본견적 제목", `${s.project_name} 본견적`)}</div><button type="button" id="createDetailedDraftButton">${linked ? "본견적 작성 시작" : "프로젝트 만들고 본견적 시작"}</button>`;
  };
  const currentProjectSelection = (generation, id) => generation === projectRequest
    && (preview?.connection?.project_id === id || dialog.querySelector("#detailedProjectSelect")?.value === id)
    && (mode === "READ_ONLY" || dialog.querySelector("#detailedProjectMode")?.value === "existing");
  const renderProjectReview = value => {
    const linked = preview?.connection?.project_id === value.project.id;
    const differences = projectDifferences(preview?.snapshot.header, value.project);
    const drafts = linked ? value.drafts.filter(d => preview.connection.draft_ids.includes(d.id)) : value.drafts;
    dialog.querySelector("#detailedProjectReview").innerHTML = `<p>${linked ? "연결된 프로젝트: " : ""}${esc(value.project.project_name)} · ${esc(value.project.address || "")}</p>${mode === "ON" ? `${linked ? "" : `<table><thead><tr><th>확인 항목</th><th>참고 가견적</th><th>선택 프로젝트</th></tr></thead><tbody>${differences.map(d => `<tr><th>${esc(d.label)}</th><td>${esc(d.source || "미정")}</td><td>${esc(d.target || "미정")}</td></tr>`).join("")}</tbody></table>`}
      ${value.project.managed ? (linked ? "" : '<label><input type="checkbox" id="detailedProjectConfirmed"> 선택 프로젝트와 정보 차이를 확인했습니다.</label>') : '<button type="button" id="adoptDetailedProjectButton">기존 프로젝트 도입</button>'}` : ""}
      ${drafts.length ? `<label>저장 작성본<select id="existingDetailedDraft">${drafts.map(d => `<option value="${esc(d.id)}">${esc(d.title)}</option>`).join("")}</select></label><button type="button" id="openDetailedDraftButton">${linked ? "이어서 작성" : "작성본 불러오기"}</button>${linked && mode === "ON" ? '<button type="button" id="newIndependentDetailedButton">새 본견적 작성</button>' : ""}` : ""}`;
    if (linked) {
      dialog.querySelector("#createDetailedDraftButton").hidden = drafts.length > 0;
      dialog.querySelector("#detailedTitleField").hidden = drafts.length > 0;
    }
  };
  const selectProject = async projectId => {
    const generation = ++projectRequest;
    selected = null;
    dialog.querySelector("#detailedProjectReview").textContent = "";
    if (!projectId) return;
    try {
      const value = await request(`/projects/${encodeURIComponent(projectId)}`);
      if (!currentProjectSelection(generation, projectId)) return;
      selected = value;
      const option = [...dialog.querySelector("#detailedProjectSelect").options].find(p => p.value === projectId);
      if (option) option.textContent = `${value.project.project_name}${mode === "ON" && !value.project.managed ? " (도입 확인 필요)" : ""}`;
      renderProjectReview(value); status("");
    } catch (error) { if (currentProjectSelection(generation, projectId)) {
      if (preview?.connection) { dialog.querySelector("#createDetailedDraftButton").hidden = true; dialog.querySelector("#detailedTitleField").hidden = true; }
      status(foundationErrorMessage(error), true);
    } }
  };
  const open = () => run(async () => {
    if (await refreshMode() === "OFF") return;
    const c = getContext();
    if (mode === "ON" && !c.estimateId) { alert("저장된 가견적을 불러온 뒤 시작해 주세요."); return; }
    sourceId = c.estimateId; draft = null; dirty = false; lastCommand = null;
    shell("가견적에서 본견적 작성 시작"); dialog.showModal();
    if (mode === "READ_ONLY") {
      preview = null; selected = null; projects = await request("/projects");
      shell("본견적 조회"); status("읽기 전용입니다. 생성·도입·저장은 할 수 없습니다.");
      dialog.querySelector("#detailedBody").innerHTML = `<label>프로젝트<select id="detailedProjectSelect">${projectOptions()}</select></label><div id="detailedProjectReview"></div>`;
      return;
    }
    preview = await request("/detailed-estimates/from-preliminary/preview", { method: "POST", body: JSON.stringify({ estimate_id: sourceId }) });
    projects = await request("/projects"); customers = await request("/projects/customers"); renderSelection(); status("");
    if (preview.connection) await selectProject(preview.connection.project_id);
  });
  start.addEventListener("click", open);
  dialog.addEventListener("change", event => {
    const id = event.target.id;
    if (id === "detailedProjectMode") {
      projectRequest++; selected = null;
      dialog.querySelector("#detailedExisting").hidden = event.target.value !== "existing";
      dialog.querySelector("#detailedNew").hidden = event.target.value !== "new";
      dialog.querySelector("#createDetailedDraftButton").textContent = event.target.value === "new" ? "프로젝트 만들고 본견적 시작" : "본견적 작성 시작";
    } else if (id === "detailedCustomerMode") {
      dialog.querySelector("#detailedNewCustomer").hidden = event.target.value !== "new";
      dialog.querySelector("#detailedExistingCustomer").hidden = event.target.value !== "existing";
    } else if (id === "detailedProjectSelect") void selectProject(event.target.value);
  });
  dialog.addEventListener("input", () => { if (draft) { dirty = true; status("저장하지 않은 변경사항이 있습니다."); } });
  dialog.addEventListener("cancel", event => { if (busy || !canClose()) event.preventDefault(); else discardChanges(); });
  dialog.addEventListener("click", event => {
    const id = event.target.closest("button")?.id;
    if (event.target.closest("[data-detailed-close]")) {
      if (!busy && canClose()) { discardChanges(); dialog.close(); }
      return;
    }
    if (!id) return;
    run(async () => {
      if (id === "newIndependentDetailedButton") {
        dialog.querySelector("#createDetailedDraftButton").hidden = false;
        dialog.querySelector("#detailedTitleField").hidden = false;
        status("같은 프로젝트에 별도의 본견적 준비 작성본을 만듭니다.");
      } else if (id === "createDetailedDraftButton") {
        const value = id => dialog.querySelector(`#${id}`).value;
        const required = (id, label, max = 500) => {
          const input = dialog.querySelector(`#${id}`);
          if (!input.value.trim() || input.value.length > max) throw Object.assign(new Error(!input.value.trim() ? `${label} 입력이 필요합니다.` : `${label}: ${max}자 이내로 입력해 주세요.`), { field: id });
          return input.value;
        };
        let selection;
        if (value("detailedProjectMode") === "existing") {
          if (!selected || !selected.project.managed) throw new Error("프로젝트를 선택하고 도입 상태를 확인해 주세요.");
          if (!preview.connection && !dialog.querySelector("#detailedProjectConfirmed")?.checked) throw new Error("선택 프로젝트와 정보 차이를 확인해 주세요.");
          selection = { mode: "existing", project_id: selected.project.id, confirmation: selected.confirmation, confirmed: true };
        } else {
          required("newDetailedProjectName", "프로젝트명", 200);
          selection = { mode: "new", project_name: value("newDetailedProjectName"), address: value("newDetailedAddress"), area_pyeong: value("newDetailedArea") === "" ? "" : Number(value("newDetailedArea")), customer_mode: value("detailedCustomerMode") };
          if (selection.area_pyeong !== "" && (!Number.isFinite(selection.area_pyeong) || selection.area_pyeong < 0 || selection.area_pyeong > 100000)) throw new Error("평형을 0 이상 100000 이하로 입력해 주세요.");
          if (selection.customer_mode === "existing") selection.customer_id = required("detailedCustomerSelect", "기존 고객");
          if (selection.customer_mode === "new") Object.assign(selection, { client_name: required("newDetailedClient", "고객명"), phone: value("newDetailedPhone") });
        }
        const created = await command("/detailed-estimates/from-preliminary", "POST", { estimate_id: sourceId, confirmation: preview.confirmation, title: required("newDetailedTitle", "본견적 제목", 200), selection });
        await load(created.id);
      } else if (id === "adoptDetailedProjectButton") {
        if (!selected || selected.project.managed || !confirm("기존 프로젝트의 공개 정보를 내부 직원 업무 목록에 도입할까요?")) return;
        const target = selected, generation = ++projectRequest, projectId = target.project.id;
        let accepted = false;
        try {
          await command(`/projects/${projectId}/adopt`, "POST", { confirmation: target.confirmation });
          accepted = true;
          if (!currentProjectSelection(generation, projectId)) return;
          selected = null; dialog.querySelector("#detailedProjectReview").textContent = "";
          const [list, value] = await Promise.all([request("/projects"), request(`/projects/${encodeURIComponent(projectId)}`)]);
          if (!currentProjectSelection(generation, projectId)) return;
          if (!value.project.managed || !list.some(p => p.id === projectId && p.managed)) throw new Error("도입 상태를 확인하지 못했습니다.");
          projects = list; selected = value;
          const select = dialog.querySelector("#detailedProjectSelect");
          select.innerHTML = projectOptions(); select.value = projectId;
          renderProjectReview(value); status("프로젝트 도입 상태를 확인했습니다.");
        } catch (error) {
          if (!currentProjectSelection(generation, projectId)) return;
          throw accepted ? new Error("도입 요청 후 목록을 확인하지 못했습니다. 프로젝트를 다시 선택해 확인해 주세요.") : error;
        }
      } else if (id === "openDetailedDraftButton") await load(dialog.querySelector("#existingDetailedDraft").value);
      else if (id === "reloadDetailedDraftButton") {
        if (!dirty || confirm("저장하지 않은 변경사항을 버리고 다시 불러올까요?")) await load(draft.id);
      } else if (id === "saveDetailedDraftButton") {
        const value = id => dialog.querySelector(`#${id}`).value;
        const saved = await command(`/detailed-estimates/${draft.id}/draft`, "PATCH", { expected_revision: draft.revision,
          context: { project_name: value("detailedProjectName"), client_name: value("detailedClientName"), phone: value("detailedPhone"), address: value("detailedAddress"),
            area_pyeong: value("detailedArea") === "" ? "" : Number(value("detailedArea")), customer_undecided: dialog.querySelector("#detailedCustomerUndecided").checked } });
        await load(saved.id); status("작성본을 저장했습니다.");
      } else if (id === "loadDetailedEventsButton") {
        const events = await request(`/detailed-estimates/${draft.id}/events`);
        const labels = { start: "작성 시작", save: "작성본 저장" };
        dialog.querySelector("#detailedEvents").textContent = events.map(e => `${labels[e.action] || "프로젝트 작업"} · 개정 ${e.result_revision ?? "-"} · ${new Date(e.created_at).toLocaleString("ko-KR")}`).join("\n");
      }
    });
  });
  const beforeUnload = event => { if (hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ""; } };
  document.defaultView?.addEventListener("beforeunload", beforeUnload);
  const authChanged = () => {
    if (host.classList.contains("app-locked")) {
      modeRequest++; projectRequest++; mode = "OFF"; start.hidden = true;
      if (dialog.open) dialog.close(); draft = null; dirty = false;
    } else void refreshMode();
  };
  const Observer = document.defaultView?.MutationObserver;
  const authObserver = Observer ? new Observer(authChanged) : null;
  authObserver?.observe(host, { attributes: true, attributeFilter: ["class"] });
  authChanged();
  return { open, refreshMode, destroy() { modeRequest++; projectRequest++; authObserver?.disconnect(); start.remove(); dialog.remove(); document.defaultView?.removeEventListener("beforeunload", beforeUnload); } };
}
