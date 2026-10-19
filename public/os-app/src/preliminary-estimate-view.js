const TRADES = [
  ["Demolition", "철거·인허가", ["철거"], ["demolitionSummary"]],
  ["Electrical", "전기·조명", ["전기/조명"], ["electricalSummary"]],
  ["Bathroom", "욕실·타일", ["욕실", "타일"], []],
  ["Wallpaper", "도배", ["도배"], []],
  ["Film", "필름", ["필름"], []],
  ["Flooring", "바닥", ["바닥"], []],
  ["Carpentry", "목공", ["목공", "도어/창호"], []],
  ["Furniture", "가구", ["가구"], ["cabinetSummary", "islandSummary", "homebarSummary", "shoeSummary", "fridgeLaundrySummary", "pantrySummary", "builtInSummary", "hangerSummary"]],
  ["Finish", "마감·기타", ["마감", "기타"], []],
].map(([key, label, groups, summaries]) => ({
  id: `section${key}Enabled`, label, groups, summaries,
}));

export const PRELIMINARY_TRADES = TRADES;

function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function selectedSummary(panel) {
  const checks = [];
  const choices = [];
  for (const input of panel.querySelectorAll("input, select")) {
    if (input.disabled) continue;
    const label = input.closest("label");
    if (input.type === "checkbox" && input.checked) {
      const text = label?.querySelector("span")?.textContent.trim();
      if (text) checks.push(input.id === "demolitionFurnitureEnabled" ? "가구 철거" : text);
    } else if (input.tagName === "SELECT" && input.value) {
      const unitToggle = input.closest(".demo-unit")?.querySelector("input[type='checkbox']");
      if (unitToggle && !unitToggle.checked) continue;
      if (["none", "0"].includes(input.value)) continue;
      const material = panel.querySelector("#flooringMaterialType")?.value;
      if (input.id === "flooringSheetGrade" && material !== "sheet") continue;
      if (input.id === "flooringWoodGrade" && material !== "wood") continue;
      const text = input.selectedOptions[0]?.textContent.trim();
      if (text) choices.push(text);
    }
  }
  return [...checks, ...choices].slice(0, 4).join(" · ") || "선택 항목 없음";
}

// Move the original nodes: input identity, listeners and section-lock boundaries remain intact.
export function mountPreliminaryEstimateView({ document, getContext, onPrint }) {
  const root = document.getElementById("client");
  const form = root?.querySelector(".option-panel");
  const overview = root?.querySelector(".live-summary");
  if (!form || !overview || root.classList.contains("preliminary-workspace")) return null;
  root.classList.add("preliminary-workspace");
  root.closest(".workspace")?.classList.add("preliminary-shell");
  for (const label of document.querySelectorAll(".top-search-strip > label")) {
    const text = [...label.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
    if (!text) continue;
    const caption = document.createElement("span");
    caption.className = "project-field-label";
    caption.textContent = text.textContent.trim();
    text.replaceWith(caption);
  }
  form.querySelector("h2").textContent = "가견적";
  form.querySelector(":scope > .section-heading > p")?.remove();

  const list = document.createElement("div");
  list.className = "preliminary-trades";
  list.setAttribute("aria-label", "공정 목록");
  const entries = TRADES.map((trade) => {
    const toggle = document.getElementById(trade.id);
    const heading = toggle.closest(".section-heading");
    const content = [];
    let node = heading.nextElementSibling;
    while (node && !node.classList.contains("section-heading")) {
      content.push(node);
      node = node.nextElementSibling;
    }
    const section = document.createElement("section");
    section.className = "preliminary-trade";
    section.dataset.trade = trade.id;
    const panel = document.createElement("div");
    panel.id = `preliminary-${trade.id}`;
    panel.className = "preliminary-trade-detail";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    const button = document.createElement("button");
    button.type = "button";
    button.id = `${panel.id}-button`;
    button.className = "preliminary-detail-button";
    button.textContent = "상세 입력";
    button.setAttribute("aria-label", `${trade.label} 상세 입력`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-labelledby", button.id);
    const summary = document.createElement("p");
    summary.className = "preliminary-trade-summary";
    const amount = document.createElement("strong");
    amount.className = "preliminary-trade-amount";
    amount.setAttribute("aria-label", `${trade.label} 고객금액`);
    const price = document.createElement("div");
    price.className = "preliminary-trade-price";
    const amountSource = document.createElement("small");
    amountSource.className = "preliminary-amount-source";
    price.append(amount, amountSource);
    heading.querySelector(".section-toggle span").textContent = trade.label;
    heading.querySelector("p")?.remove();
    heading.append(summary, price, button);
    panel.append(...content);
    section.append(heading, panel);
    list.append(section);
    button.addEventListener("click", () => {
      const open = panel.hidden;
      for (const entry of entries) {
        entry.panel.hidden = entry.panel !== panel || !open;
        entry.button.setAttribute("aria-expanded", String(!entry.panel.hidden));
        entry.button.textContent = entry.panel.hidden ? "상세 입력" : "접기";
      }
    });
    return { ...trade, toggle, panel, button, summary, amount, amountSource };
  });

  for (const entry of entries) {
    const summary = document.createElement("dl");
    summary.className = "summary-list preliminary-detail-summary";
    for (const id of entry.summaries) {
      const node = document.getElementById(id)?.closest(".summary-list > div");
      if (node) summary.append(node);
    }
    if (summary.childElementCount) entry.panel.append(summary);
  }
  overview.classList.replace("live-summary", "preliminary-overview");
  const context = document.createElement("p");
  context.className = "preliminary-context";
  const identity = document.createElement("p");
  identity.className = "preliminary-identity";
  const identityRepeat = document.createElement("span");
  identityRepeat.className = "preliminary-identity-repeat";
  const address = document.createElement("span");
  address.className = "preliminary-site-address";
  identity.append(identityRepeat, address);
  overview.prepend(context, identity);
  const sourceNotice = document.createElement("p");
  sourceNotice.className = "preliminary-source-notice";
  sourceNotice.hidden = true;
  overview.append(sourceNotice);
  const actions = document.createElement("div");
  actions.className = "preliminary-actions";
  for (const id of ["saveEstimateButton", "saveAsNewEstimateButton"]) {
    const button = document.getElementById(id);
    if (button) actions.append(button);
  }
  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.className = "secondary-action";
  printButton.textContent = "견적서 출력";
  printButton.addEventListener("click", onPrint);
  actions.append(printButton);
  overview.insertBefore(actions, document.getElementById("saveStatus"));
  const excluded = overview.querySelector(".excluded-work");
  form.append(overview, list);
  if (excluded) form.append(excluded);

  function update() {
    const { estimate, editingId, storedSnapshot = false } = getContext();
    const groups = estimate?.customerQuote?.groups || [];
    setText(context, editingId ? "저장 견적 수정 중" : "신규 견적 작성 중");
    const project = document.getElementById("projectName").value.trim() || "새 프로젝트";
    const client = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    setText(identityRepeat, [project, client, phone].filter(Boolean).join(" · "));
    setText(address, estimate?.address || "");
    identity.dataset.hasAddress = String(Boolean(estimate?.address));
    const totalLabel = document.getElementById("clientTotal")?.previousElementSibling;
    if (totalLabel) setText(totalLabel, storedSnapshot ? "저장 견적 총액" : "현재 견적 총액");
    let unselectedWithAmount = false;
    for (const entry of entries) {
      const amount = groups.filter((group) => entry.groups.includes(group.label))
        .reduce((sum, group) => sum + (Number(group.total) || 0), 0);
      const mismatch = !entry.toggle.checked && amount !== 0;
      unselectedWithAmount ||= mismatch;
      setText(entry.summary, entry.toggle.checked ? selectedSummary(entry.panel) : mismatch ? "입력 미선택" : "미선택");
      setText(entry.amount, `${amount.toLocaleString("ko-KR")}원`);
      entry.amountSource.hidden = !mismatch;
      setText(entry.amountSource, storedSnapshot ? "저장 금액 포함" : "표시 견적에 포함");
      entry.panel.closest(".preliminary-trade").classList.toggle("is-selected", entry.toggle.checked);
    }
    sourceNotice.hidden = !unselectedWithAmount;
    setText(sourceNotice, storedSnapshot
      ? "입력에서 미선택인 공정의 금액이 저장 견적에 포함되어 있습니다. 총액과 고객 출력은 저장 견적 기준입니다."
      : "입력에서 미선택인 공정의 금액이 현재 표시 견적에 포함되어 있습니다.");
    if (excluded) excluded.hidden = ![...excluded.children].some(node => node.tagName !== "STRONG" && node.textContent.trim());
  }
  const Observer = document.defaultView.MutationObserver;
  const observer = new Observer(() => {
    if (!root.isConnected) { observer.disconnect(); return; }
    update();
  });
  for (const id of ["clientTotal", "saveStatus", "quoteRows"]) {
    const target = document.getElementById(id);
    if (target) observer.observe(target, { childList: true, characterData: true, subtree: true });
  }
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  update();
  return { update, destroy() {
    observer.disconnect();
    root.removeEventListener("input", update);
    root.removeEventListener("change", update);
  } };
}
