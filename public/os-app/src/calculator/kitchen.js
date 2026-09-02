export function kitchenDetails(state, rates) {
  if (!state.kitchenEnabled) return [];
  const standardItems = [
    ["싱크볼(깜포르떼960 기준)", rates.sinkBowl, state.kitchenSinkBowlUnits],
    ["싱크수전(라우체급 기준)", rates.faucet, state.kitchenFaucetUnits],
    ["후드(하츠 아일랜드 후드 기준)", rates.hood, state.kitchenHoodUnits],
    ["AND 표준설비 설치비", rates.standardInstall, state.kitchenStandardInstallEnabled ? 1 : 0],
  ].filter((item) => item[2] > 0).map(([item, unitPrice, units]) => ({
    group: "kitchen",
    item,
    input: `${units}EA`,
    quantity: `${units}EA`,
    unitPrice,
    cost: unitPrice * units,
  }));
  const customPrice = Number(state.kitchenCustomAppliancePrice) || 0;
  if (customPrice <= 0) return standardItems;
  return standardItems.concat({
    group: "kitchen",
    item: "싱크볼·싱크수전·후드 직접입력",
    input: "소비자가 직접입력",
    quantity: "1식",
    unitPrice: customPrice,
    cost: 0,
    customerRevenue: customPrice,
  });
}
