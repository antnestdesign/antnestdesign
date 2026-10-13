import { escapeHtml } from "./utils.js";

// Customer-only fields: never pass an internal detail row to this renderer.
export function renderCustomerQuoteRows(groups, money, groupLabel = label => label || "-") {
  if (!groups.length) return '<tbody><tr><td colspan="3">표시할 견적 항목이 없습니다.</td></tr></tbody>';
  return groups.map(group => {
    const label = groupLabel(group.label);
    const items = Array.isArray(group.items) ? group.items : [];
    return `<tbody class="document-trade">
      <tr class="contract-subtotal-row"><td>${escapeHtml(label)}</td><td>소계</td><td class="document-number">${escapeHtml(group.totalText || money(group.total))}</td></tr>
      ${items.map(item => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(item.name || "-")}</td><td class="document-number">${escapeHtml(item.amountText || money(item.amount))}</td></tr>`).join("")}
    </tbody>`;
  }).join("");
}
