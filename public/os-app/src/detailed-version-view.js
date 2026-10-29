import { escapeHtml as esc } from "./utils.js";
import { renderDetailedVersion, printDetailedVersion } from "./detailed-version-print.js";
import { itemReviewText } from "./detailed-item-review.js";
const money = v => `${Number(v).toLocaleString("ko-KR")}원`;
export function mountDetailedVersions({ host, draftId, revision, canIssue, readOnly, isDirty, request, run, message, onContract, actionsHost }) {
  let prepared = null, selected = null, lastRequest = null, generation = 0;
  const path = `/detailed-estimates/${draftId}/versions`;
  host.innerHTML = `<h3>공식 발행본</h3><div class="detailed-actions">${canIssue ? '<button type="button" data-issue-preview>발행 전 미리보기</button>' : ""}${canIssue && !readOnly ? '<button type="button" data-issue-confirm>공식 발행</button>' : ""}<button type="button" data-version-reload>버전 목록 갱신</button></div><div data-version-list></div><section data-version-preview hidden><div class="detailed-actions"><h3 data-version-title></h3><button type="button" data-version-print>PDF 저장·인쇄</button><button type="button" data-version-close>작성본으로 돌아가기</button></div><div class="detailed-version-preview-body"></div></section>`;
  if (actionsHost) host.querySelectorAll("[data-issue-preview], [data-issue-confirm]").forEach(button => actionsHost.append(button));
  const show = doc => {
    selected = doc;
    host.querySelector("[data-version-title]").textContent = doc.version ? `${doc.quoteNumber} · V${doc.version}` : "발행 전 검토 · 미발행";
    host.querySelector(".detailed-version-preview-body").innerHTML = renderDetailedVersion(doc);
    host.querySelector("[data-version-contract]")?.remove();
    if (doc.version && onContract) {
      const button = host.ownerDocument.createElement("button"); button.type = "button"; button.dataset.versionContract = "";
      button.textContent = "이 견적으로 계약 작성"; host.querySelector("[data-version-title]").after(button);
    }
    host.querySelector("[data-version-preview]").hidden = false;
    host.querySelector("[data-version-preview]").scrollIntoView?.({ block: "start" });
  };
  const refresh = async () => {
    const current = ++generation, versions = await request(path);
    if (current !== generation || !host.isConnected) return;
    host.querySelector("[data-version-list]").innerHTML = versions.length ? `<ul class="detailed-version-list">${versions.map(v => `<li><span><strong>V${v.version}</strong> · ${esc(new Date(v.issuedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }))} · ${esc(v.issuedBy)}</span><strong>${money(v.total)}</strong><button type="button" data-view-version="${esc(v.id)}">조회·출력</button></li>`).join("")}</ul>` : "<p>발행된 버전 없음</p>";
  };
  const checkSaved = () => { if (isDirty()) throw new Error("저장하지 않은 변경사항이 있습니다. 작성본을 먼저 저장해 주세요."); };
  const handle = event => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.hasAttribute("data-version-contract")) { void run(() => onContract(draftId, selected.id)); return; }
    if (button.hasAttribute("data-version-print")) {
      try { if (!selected.version) checkSaved(); printDetailedVersion(selected, host.ownerDocument.defaultView); } catch (error) { message(error.message, true); } return;
    }
    if (button.hasAttribute("data-version-close")) { host.querySelector("[data-version-preview]").hidden = true; host.ownerDocument.getElementById("detailedEditorHost")?.scrollIntoView?.({ block: "start" }); return; }
    void run(async () => {
      if (button.hasAttribute("data-version-reload")) { await refresh(); message("발행 버전 목록을 불러왔습니다."); }
      else if (button.dataset.viewVersion) {
        const doc = await request(`${path}/${button.dataset.viewVersion}`); show(doc); message(`V${doc.version} 발행본을 불러왔습니다.`);
      }
      else if (button.hasAttribute("data-issue-preview")) {
        checkSaved(); prepared = await request(`${path}/preview`, { method: "POST", body: JSON.stringify({ expected_revision: revision }) });
        lastRequest = null; show(prepared.document); message(prepared.notices?.length ? itemReviewText(prepared.notices) : "저장된 견적을 확인했습니다. 공식 발행 시 최종 금액을 다시 확인합니다.");
      } else if (button.hasAttribute("data-issue-confirm")) {
        checkSaved();
        if (!prepared) throw new Error("발행 전 미리보기를 먼저 확인해 주세요.");
        const review = prepared.notices?.length ? `${itemReviewText(prepared.notices)}\n시공 범위를 확인한 후 진행해 주세요.\n` : "";
        if (!host.ownerDocument.defaultView.confirm(`${review}최종 공급대가 ${money(prepared.document.editor.summary.total)}으로 공식 발행할까요? 발행 후 이 버전은 수정·삭제할 수 없습니다.`)) { message("공식 발행을 취소했습니다."); return; }
        lastRequest ||= crypto.randomUUID();
        const issued = await request(path, { method: "POST", body: JSON.stringify({ expected_revision: revision, confirmation: prepared.confirmation, confirmed: true, request_id: lastRequest }) });
        prepared = null; lastRequest = null; show(issued); await refresh(); message(`V${issued.version} 공식 발행 완료. 고객에게 자동 발송하지 않았습니다.`);
      }
    });
  };
  host.addEventListener("click", handle);
  actionsHost?.addEventListener("click", handle);
  return { refresh, destroy() { generation++; host.removeEventListener("click", handle); actionsHost?.removeEventListener("click", handle); if (actionsHost) actionsHost.replaceChildren(); } };
}
