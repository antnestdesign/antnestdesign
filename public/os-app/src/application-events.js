export function bindApplicationEvents({ document, window, elements: el, actions }) {
document.getElementById("loginForm")?.addEventListener("submit", actions.onLoginSubmit);

document.getElementById("logoutButton")?.addEventListener("click", actions.onLogoutClick);

el.projectSearch?.addEventListener("input", actions.onProjectSearchInput);

document.getElementById("loadProjectButton")?.addEventListener("click", actions.onLoadProjectClick);

document.getElementById("saveEstimateButton")?.addEventListener("click", actions.onSaveEstimateClick);

document.getElementById("saveAsNewEstimateButton")?.addEventListener("click", actions.onSaveAsNewEstimateClick);

document.addEventListener("click", actions.onDelegatedSaveClick);

document.addEventListener("input", actions.onContractOptionsInput);

document.addEventListener("change", actions.onContractOptionsChange);

document.addEventListener("click", actions.onContractActionClick);

window.addEventListener("beforeunload", actions.onBeforeUnload);

document.getElementById("printQuoteButton")?.addEventListener("click", actions.onPrintQuoteClick);

document.addEventListener("click", actions.onInternalPrintClick);

document.addEventListener("click", actions.onSystemActionClick);

document.addEventListener("click", actions.onCostCategoryClick);

document.addEventListener("click", actions.onUserActionClick);

document.addEventListener("click", actions.onReloadAuditClick);

document.addEventListener("click", actions.onCostItemSubmitClick);

document.addEventListener("submit", actions.onManagementSubmit);

document.addEventListener("input", actions.onCostSearchInput);

document.addEventListener("change", actions.onCostFilterChange);

document.addEventListener("click", actions.onSaveRateDbClick);

document.addEventListener("click", actions.onCompareCostSnapshotClick);

document.addEventListener("click", actions.onInternalEstimateToggle);

document.addEventListener("click", actions.onInternalTradeToggle);

document.addEventListener("click", actions.onSavedEstimateAction);

document.addEventListener("click", actions.onStaffQuoteAction);

for (const input of Object.values(el)) {
  if (!input) continue;
  if (["projectSearch", "projectSearchResults"].includes(input.id)) continue;
  if (input.id === "existingPipeCleaningEnabled") {
    input.addEventListener("change", actions.onPipeCleaningChanged);
    continue;
  }
  input.addEventListener("input", () => actions.onEstimateInput(input));
  input.addEventListener("change", () => actions.onEstimateInput(input));
}
}
