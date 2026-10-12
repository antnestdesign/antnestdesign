export const identity = (value) => value;

export const won = (value) => `${Math.round(value).toLocaleString("ko-KR")}원`;
export const moneyAmount = (value) => Math.round(Number(value) || 0);

export function rateNumber(value) {
  return Number(value) || 0;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
