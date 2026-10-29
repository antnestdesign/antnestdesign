export function miscDetails(state, rates) {
  return [
    ["일반 폐기물", rates.generalWaste, state.generalWasteEnabled],
    ["세대 내 보양비", rates.interiorProtection, state.interiorProtectionEnabled],
    ["입주청소", rates.moveInCleaning, state.moveInCleaningEnabled],
  ].filter((item) => item[2]).map(([item, unitPrice]) => ({
    group: "misc",
    item,
    input: "1식",
    quantity: "1식",
    unitPrice,
    cost: unitPrice,
  }));
}
