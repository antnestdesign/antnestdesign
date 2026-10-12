const string = (value) => typeof value === "string" ? value : "";
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

// Legacy customer quotes may contain nested private fields. Construct a whitelist.
export function customerQuoteProjection(quote = {}) {
  return {
    projectName: string(quote.projectName), clientName: string(quote.clientName), phone: string(quote.phone),
    areaPyeong: number(quote.areaPyeong), savedAt: string(quote.savedAt), status: string(quote.status),
    total: number(quote.total), totalText: string(quote.totalText),
    groups: (Array.isArray(quote.groups) ? quote.groups : []).map((group) => ({
      label: string(group.label), total: number(group.total), totalText: string(group.totalText),
      items: (Array.isArray(group.items) ? group.items : []).map((item) => ({
        name: string(item.name), amount: number(item.amount), amountText: string(item.amountText),
      })),
    })),
  };
}
