import { escapeHtml as esc, won } from "./utils.js";

export function createContractSourceView({ document, request, selected, openPackage, changed, canEdit, loadMode, loadPreliminary }) {
  let source = null, root = null, generation = 0, requestId = null, pending = false;
  const ensure = () => {
    const form = document.getElementById("contractOptionsForm");
    if (!form) return null;
    if (!root?.isConnected) { root = document.createElement("section"); root.className = "contract-panel"; root.id = "contractSourcePanel"; form.before(root); }
    return root;
  };
  const render = () => {
    if (!ensure()) return;
    const d = source?.document, summary = d?.editor?.summary;
    root.hidden = !source?.versions?.length;
    root.innerHTML = `<h3>기준 견적 선택</h3><label>계약 기준<select data-contract-source><option value="">원본 가견적</option>${(source?.versions || []).map(v => `<option value="${esc(v.id)}" data-head="${esc(v.head_id)}" ${v.id === d?.id ? "selected" : ""}>${esc(v.title)} · V${v.version} · ${won(v.total)}</option>`).join("")}</select></label>${d ? `
      <p>${esc(d.context.project_name)} · ${esc(d.quoteNumber)} V${d.version} · ${esc(new Date(d.issuedAt).toLocaleString("ko-KR"))}</p>
      <p>공급가액 ${won(summary.supply)} · 부가세 ${won(summary.vat)} · 공급대가 ${won(summary.total)}</p>
      <p>공사범위: ${esc(d.editor.items.filter(i => !i.excluded).map(i => i.name).join(" · "))}</p>
      ${d.version < source.latest_version ? '<p role="alert">과거 발행본입니다. 최신 버전이 아닌 이 견적으로 계약할지 확인해 주세요.</p><label><input type="checkbox" data-older-confirm>과거 발행본 선택 확인</label>' : ""}
      ${source.linked_package_id ? '<p>이미 연결된 계약이 있습니다.</p><button type="button" data-source-package>기존 계약 조회</button>' : `<label><input type="checkbox" data-independent>다른 원계약과 구분되는 독립 공사범위</label><label>공사범위 명칭<input data-scope-label maxlength="200" value="전체 공사"></label>
      ${[ ["windows", "창호"], ["hvac", "냉난방기"] ].map(([key,label]) => `<fieldset><legend>${label} 별도 견적</legend><label>포함 여부<select data-separate="${key}"><option value="undecided">미정</option><option value="excluded" ${d.editor.separateQuotes[key] === "excluded" ? "selected" : ""}>제외</option><option value="included">포함</option></select></label><div data-separate-detail="${key}" hidden><label>고정할 발행본<select data-separate-version="${key}"><option value="">선택</option>${source.versions.map(v => `<option value="${esc(v.id)}">${esc(v.title)} V${v.version} · ${won(v.total)}</option>`).join("")}</select></label><label><input type="checkbox" data-included-total="${key}">선택한 견적 공사금액에 이미 포함됨을 확인</label></div></fieldset>`).join("")}`}` : ""}`;
    root.querySelectorAll("input,select").forEach(n => { n.disabled = !canEdit(); });
    // Read-only managers retain source/version inspection, not contract editing rights.
    if (root.querySelector("[data-contract-source]")) root.querySelector("[data-contract-source]").disabled = false;
  };
  const choose = async (headId, versionId) => {
    const seq = ++generation;
    pending = true;
    try {
      const value = await request(`/detailed-estimates/${headId}/contracts?versionId=${encodeURIComponent(versionId)}`);
      if (seq !== generation) return;
      source = value; requestId = null; render(); selected(source); return source;
    } catch (error) { if (seq === generation) render(); throw error; }
    finally { if (seq === generation) pending = false; }
  };
  const click = event => { if (event.target.closest("[data-source-package]")) void openPackage(source.linked_package_id); };
  const change = event => {
    const target = event.target;
    if (target.matches("[data-contract-source]")) {
      if (!target.value) {
        const seq = ++generation, estimateId = source.estimate_id;
        pending = true;
        void loadPreliminary(estimateId).then(estimate => {
          if (seq !== generation) return;
          source = { ...source, document: null, linked_package_id: null }; requestId = null; render(); selected({ preliminary: estimate });
        }).catch(error => { if (seq === generation) { render(); changed(error.message); } })
          .finally(() => { if (seq === generation) pending = false; });
      }
      else void choose(target.selectedOptions[0].dataset.head, target.value).catch(error => changed(error.message));
    } else {
      if (target.dataset.separate) root.querySelector(`[data-separate-detail="${target.dataset.separate}"]`).hidden = target.value !== "included";
      changed();
    }
  };
  document.addEventListener("click", click); document.addEventListener("change", event => { if (root?.contains(event.target)) change(event); });
  return {
    get source() { return source?.document ? source : null; },
    get pending() { return pending; },
    async load(estimateId) {
      const seq = ++generation; pending = false; source = null; requestId = null; selected(null); render();
      try { if ((await loadMode()).mode === "OFF" || seq !== generation) return;
        const value = await request(`/projects/contract-sources?estimateId=${estimateId}`); if (seq !== generation) return;
        source = { ...value, document: null }; render();
      } catch (error) { if (seq === generation && ![403,503].includes(error.status)) changed(error.message); }
    },
    open: choose,
    reset() { generation++; pending = false; source = null; requestId = null; if (root) root.hidden = true; },
    payload() {
      const separate_quotes = {};
      for (const key of ["windows", "hvac"]) {
        const state = root.querySelector(`[data-separate="${key}"]`).value;
        if (state === "undecided") throw new Error("창호·냉난방기 포함/제외를 먼저 확정해 주세요.");
        separate_quotes[key] = state === "excluded" ? { state } : { state, version_id: root.querySelector(`[data-separate-version="${key}"]`).value,
          included_in_total: root.querySelector(`[data-included-total="${key}"]`).checked };
        if (state === "included" && (!separate_quotes[key].version_id || !separate_quotes[key].included_in_total)) throw new Error("포함할 별도 견적 발행본과 계약금액 포함 여부를 확인해 주세요.");
      }
      const independent = root.querySelector("[data-independent]").checked;
      return { version_id: source.document.id, request_id: requestId ||= crypto.randomUUID(),
        scope: { independent, label: root.querySelector("[data-scope-label]").value, confirmed: independent }, separate_quotes,
        older_version_confirmed: root.querySelector("[data-older-confirm]")?.checked || false };
    },
  };
}
