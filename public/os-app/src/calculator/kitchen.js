export function kitchenDetails(state, rates) {
  if (!state.kitchenEnabled) return [];
  return [
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
}
