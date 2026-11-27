import { FLOORING_DEFAULT_PLAN, FLOORING_MAX_ROOMS, flooringProductLabel, parseFlooringPlan } from "./flooring-inputs.js";
import { escapeHtml as esc } from "./utils.js";

const unitName = { BOX: "박스", "2BOX": "2박스 묶음", PYEONG: "평당" };
const won = value => `${Number(value).toLocaleString("ko-KR")}원`;
const packText = row => {
  const unit = row.billing_unit ?? row.unit;
  const basis = row.supplier_pyeong_m2 ?? row.supplierBasis;
  return unit === "PYEONG" ? `${unitName[unit]} (${basis}㎡/평)`
    : `포장 ${row.pack_m2 ?? row.packM2}㎡/박스 · ${unitName[unit]}`;
};
const option = (value, label, current) => `<option value="${esc(value)}"${value === current ? " selected" : ""}>${esc(label)}</option>`;
const empty = () => ({ sku: "", loss: null, area: 0 });

export function mountFlooringView({ document, request, canEditEstimate, canEditCatalog }) {
  const host = document.getElementById("flooringProductControls");
  const field = document.getElementById("flooringPlan");
  const total = document.getElementById("flooringArea");
  const material = document.getElementById("flooringMaterialType");
  const enabled = document.getElementById("sectionFlooringEnabled");
  const goods = new Map();
  let loaded = false, pending = null, failure = "", generation = 0, rendered = "";
  let saved = [], brandsByZone = [], lastTotals = null, lastPlan = field.value;
  const visible = () => Boolean(field.value && material.value === "wood");
  const editable = () => enabled.checked && canEditEstimate();
  const plan = () => parseFlooringPlan(field.value === "invalid" ? lastPlan || FLOORING_DEFAULT_PLAN : field.value);
  const rows = value => [value.common, ...value.rooms];
  const areaSum = value => value.rooms.reduce((sum, row) => sum + Math.round(Number(row.area) * 1000), 0);
  const brands = () => [...new Set([...goods.values()].map(row => row.brand))].sort((a,b) => a.localeCompare(b,"ko"));
  const selected = sku => saved.find(row => row.sku === sku) || goods.get(sku);

  async function load() {
    if (pending || loaded) return;
    const token = generation;
    failure = "";
    pending = request().then(products => {
      if (generation !== token) return;
      goods.clear();
      products.forEach(product => goods.set(product.sku, product));
      loaded = true;
    }).catch(error => { if (generation === token) failure = error.message; })
      .finally(() => {
        if (generation === token) {
          pending = null;
          if (field.value !== "invalid") render();
        }
      });
    render();
  }

  function render() {
    host.hidden = !visible();
    if (!visible()) return;
    const value = plan();
    rendered = field.value;
    host.innerHTML = `
      <div class="flooring-plan-heading"><strong>구역별 마루</strong>
        <button type="button" data-floor-add${value.rooms.length >= FLOORING_MAX_ROOMS ? " hidden" : ""}>마루 추가</button></div>
      ${rows(value).map((entry, index) => {
        const product = selected(entry.sku);
        const brand = brandsByZone[index] || product?.brand || "";
        const label = index ? `별도 방 ${index}` : "공용부";
        const brandOptions = [...new Set([...brands(), ...(brand ? [brand] : [])])];
        const items = [...goods.values()].filter(row => row.brand === brand);
        if (product && !items.some(row => row.sku === entry.sku)) items.unshift(product);
        return `<fieldset class="flooring-zone" data-floor-zone="${index}">
          <legend>${label}</legend>
          <div class="flooring-product-grid">
            <label>업체<select data-floor-field="brand">${option("", "업체 선택", brand)}${brandOptions.map(name => option(name, name, brand)).join("")}</select></label>
            <label>마루 제품<select data-floor-field="sku">${option("", "제품 선택", entry.sku)}${items.map(row => option(row.sku, row.label || flooringProductLabel(row), entry.sku)).join("")}</select></label>
          </div>
          <div class="flooring-product-grid">
            ${index ? `<label>시공평수 (평)<input data-floor-field="area" type="number" min="0" max="2000" step="0.001" value="${entry.area || ""}"></label>`
              : '<label>공용부 시공평수 (평)<output data-floor-common></output></label>'}
            <label>로스율 (%)<input data-floor-field="loss" type="number" min="0" max="100" step="0.01" value="${entry.loss ?? ""}"
              placeholder="${product?.loss_percent ?? product?.defaultLoss ?? 15}"></label>
          </div>
          <p data-floor-meta>${product ? esc(`${product.label || flooringProductLabel(product)} · ${packText(product)}`) : ""}</p>
          ${index ? '<button type="button" data-floor-remove>이 구역 삭제</button>' : ""}
        </fieldset>`;
      }).join("")}
      ${value.rooms.length ? '<p data-floor-room-total></p>' : ""}
      ${failure ? `<p role="status">${esc(failure)} <button type="button" data-floor-retry>다시 불러오기</button></p>` : ""}
      <div data-floor-calculated aria-live="polite"></div>`;
    sync();
  }

  function sync() {
    host.hidden = !visible();
    if (!visible()) return;
    if (rendered !== field.value) {
      if (field.value !== "invalid") lastPlan = field.value;
      brandsByZone = [];
      lastTotals = null;
      saved = [];
      render();
      return;
    }
    const value = plan();
    const roomTotal = host.querySelector("[data-floor-room-total]");
    if (roomTotal) roomTotal.textContent = `별도 방 시공평수 합계: ${areaSum(value) / 1000}평`;
    const common = host.querySelector("[data-floor-common]");
    if (common) {
      const remaining = Math.round(Number(total.value || 0) * 1000) - areaSum(value);
      common.textContent = remaining < 0 ? "별도 방 면적 초과" : String(remaining / 1000);
    }
    for (const node of host.querySelectorAll("fieldset,button")) node.disabled = !editable();
    const result = host.querySelector("[data-floor-calculated]");
    if (result) {
      const visibleTotals = lastTotals?.key === calcKey() ? lastTotals.rows : [];
      const markup = visibleTotals.map(row => `<p><strong>${esc(row.zones.join("·"))}</strong> · ${esc(row.label)} ·
        ${esc(row.quantity)} · 로스 ${row.loss}% · ${won(row.customerRevenue)}</p>`).join("");
      if (result.innerHTML !== markup) result.innerHTML = markup;
    }
    if (editable() && !loaded && !failure && !pending) void load();
  }

  function calcKey() { return JSON.stringify([field.value, total.value, material.value, enabled.checked]); }
  function result(estimate) {
    const next = estimate?.flooringSummary || [];
    const changed = JSON.stringify(next) !== JSON.stringify(saved);
    saved = next;
    lastTotals = { key: calcKey(), rows: next };
    if (changed && visible() && field.value !== "invalid" && !host.contains(document.activeElement)) render();
    else sync();
  }
  function save(value, rebuild = false) {
    lastPlan = JSON.stringify(value);
    field.value = lastPlan;
    rendered = field.value;
    if (rebuild) render();
    else sync();
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }

  host.addEventListener("input", event => {
    const input = event.target;
    const key = input.dataset.floorField;
    if (!editable() || key !== "area" && key !== "loss") return;
    const value = plan();
    if (input.validity.valid) {
      rows(value)[Number(input.closest("[data-floor-zone]").dataset.floorZone)][key] =
        key === "loss" && input.value === "" ? null : Number(input.value);
    }
    if (host.querySelector("input[data-floor-field]:invalid")) {
      // Keep the edited form visible without sending a previously valid amount.
      lastPlan = JSON.stringify(value);
      field.value = "invalid";
      rendered = field.value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    save(value);
  });
  host.addEventListener("change", event => {
    const key = event.target.dataset.floorField;
    if (!editable() || field.value === "invalid" || key !== "brand" && key !== "sku") return;
    const index = Number(event.target.closest("[data-floor-zone]").dataset.floorZone);
    const value = plan();
    const zone = rows(value)[index];
    if (key === "brand") brandsByZone[index] = event.target.value;
    zone.sku = key === "sku" ? event.target.value : "";
    zone.loss = null;
    save(value, true);
    host.querySelector(`[data-floor-zone="${index}"] [data-floor-field="${key}"]`)?.focus();
  });
  host.addEventListener("click", event => {
    if (!editable() || field.value === "invalid") return;
    const button = event.target.closest("button");
    if (!button) return;
    const value = plan();
    if (Object.hasOwn(button.dataset, "floorRetry")) void load();
    if (Object.hasOwn(button.dataset, "floorAdd") && value.rooms.length < FLOORING_MAX_ROOMS) {
      value.rooms.push(empty());
      save(value, true);
      host.querySelector(`[data-floor-zone="${value.rooms.length}"] [data-floor-field="brand"]`)?.focus();
    }
    if (Object.hasOwn(button.dataset, "floorRemove")) {
      const index = Number(button.closest("[data-floor-zone]").dataset.floorZone);
      value.rooms.splice(index - 1, 1);
      brandsByZone.splice(index, 1);
      save(value, true);
      host.querySelector("[data-floor-add]")?.focus();
    }
  });

  let manager = null;
  function mountCatalogManager() {
    if (!canEditCatalog()) return;
    const shell = document.querySelector(".system-cost-card");
    if (!shell || manager?.isConnected) return;
    manager = document.createElement("details");
    manager.className = "flooring-catalog-manager";
    manager.innerHTML = '<summary>마루 제품 원가</summary><div data-floor-admin></div>';
    shell.append(manager);
    const content = manager.querySelector("[data-floor-admin]");
    let catalog = [];
    let chosenBrand = "", chosenSku = "", message = "";
    function renderAdmin() {
      const product = catalog.find(row => row.sku === chosenSku);
      const adminBrands = [...new Set(catalog.map(row => row.brand))];
      content.innerHTML = `
        <div class="flooring-product-grid">
          <label>업체<select data-admin-brand>${option("", "업체 선택", chosenBrand)}${adminBrands.map(brand => option(brand,brand,chosenBrand)).join("")}</select></label>
          <label>마루 제품<select data-admin-sku>${option("", "제품 선택", chosenSku)}${catalog.filter(row => row.brand === chosenBrand).map(row => option(row.sku, flooringProductLabel(row), chosenSku)).join("")}</select></label>
        </div>
        ${product ? `<form data-floor-editor>
          <p>${esc(product.official_name)} · ${esc(product.source_version)} · 원가 버전 ${product.revision}</p>
          <p>${esc(product.source_notes)}</p>
          <div class="flooring-product-grid">
            <label>공급 원가 (원, VAT 별도)<input name="supply_cost" type="number" min="1" max="10000000" required value="${product.supply_cost}"></label>
            <label>기본 로스율 (%)<input name="loss_percent" type="number" min="0" max="100" step="0.01" required value="${product.loss_percent}"></label>
            <label>포장 면적 (㎡/박스)<input name="pack_m2" type="number" min="0.01" max="100" step="0.0001"
              value="${product.pack_m2 ?? ""}" ${product.billing_unit === "PYEONG" ? "" : "required"}></label>
            <label>과금 단위<select name="billing_unit">${Object.entries(unitName).map(([key,name]) => option(key,name,product.billing_unit)).join("")}</select></label>
            <label data-admin-basis ${product.billing_unit === "PYEONG" ? "" : "hidden"}>과금 기준 1평 (㎡)<input name="supplier_pyeong_m2" type="number" min="0.01" max="100" step="0.0001"
              value="${product.supplier_pyeong_m2 ?? ""}" ${product.billing_unit === "PYEONG" ? "required" : "disabled"}></label>
            <label class="flooring-active"><input name="active" type="checkbox" ${product.active ? "checked" : ""}> 제품 활성</label>
          </div><button type="submit">마루 원가 저장</button>
        </form>` : ""}
        <p data-admin-message role="status">${esc(message)}</p>`;
    }
    async function reloadAdmin() {
      message = "마루 제품을 불러오는 중입니다.";
      renderAdmin();
      try { catalog = await request(true); message = ""; }
      catch (error) { message = error.message; }
      renderAdmin();
    }
    manager.addEventListener("toggle", () => { if (manager?.open && !catalog.length) void reloadAdmin(); });
    content.addEventListener("change", event => {
      if (event.target.matches("[data-admin-brand]")) {
        chosenBrand = event.target.value;
        chosenSku = "";
        renderAdmin();
        content.querySelector("[data-admin-brand]")?.focus();
      } else if (event.target.matches("[data-admin-sku]")) {
        chosenSku = event.target.value;
        renderAdmin();
        content.querySelector("[data-admin-sku]")?.focus();
      } else if (event.target.name === "billing_unit") {
        const basis = content.querySelector("[data-admin-basis]");
        const input = basis.querySelector("input");
        basis.hidden = event.target.value !== "PYEONG";
        input.required = !(input.disabled = basis.hidden);
        event.target.form.elements.pack_m2.required = basis.hidden;
      }
    });
    content.addEventListener("submit", async event => {
      if (!event.target.matches("[data-floor-editor]")) return;
      event.preventDefault();
      const product = catalog.find(row => row.sku === chosenSku);
      if (!product || !canEditCatalog()) return;
      const controls = event.target.elements;
      const button = event.target.querySelector("button");
      button.disabled = true;
      try {
        const billing_unit = controls.billing_unit.value;
        const updated = await request(true, {
          sku: chosenSku, revision: product.revision, supply_cost: Number(controls.supply_cost.value),
          loss_percent: Number(controls.loss_percent.value),
          pack_m2: controls.pack_m2.value === "" ? null : Number(controls.pack_m2.value), billing_unit,
          supplier_pyeong_m2: billing_unit === "PYEONG" ? Number(controls.supplier_pyeong_m2.value) : null, active: controls.active.checked,
        });
        catalog = catalog.map(row => row.sku === updated.sku ? updated : row);
        loaded = false;
        failure = "";
        message = "저장했습니다.";
        renderAdmin();
      } catch (error) {
        content.querySelector("[data-admin-message]").textContent = error.message;
      } finally { button.disabled = false; }
    });
  }

  function clear() {
    generation++;
    loaded = false;
    pending = null;
    failure = "";
    rendered = "";
    saved = [];
    brandsByZone = [];
    lastTotals = null;
    goods.clear();
    manager?.remove();
    manager = null;
  }
  return { sync, result, mountCatalogManager, clear };
}
