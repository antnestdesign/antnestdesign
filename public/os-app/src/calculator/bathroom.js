export function bathroomDetails(state, rates) {
  const units = state.bathroomUnits;
  if (!state.bathroomEnabled || units <= 0) return [];
  const fanUnit = state.bathroomFanType === "hugent"
    ? rates.hugentMachine + rates.hugentInstallExtra
    : rates.fanNormal;

  return [
    ["욕실 포세린 타일 자재+잡자재", rates.porcelainTileMaterial, units, `${units}칸`],
    ["욕실 설비 위치조정", rates.plumbingRelocation, units, `${units}칸`],
    ["도기·수전·장식장·악세사리 기본세트", rates.fixtureSet, units, `${units}칸`],
    ["도기·수전·장식장·악세사리 설치비", rates.fixtureInstall, units, `${units}칸`],
    ["SMC 천장돔 설치비", rates.smcCeiling, units, `${units}칸`],
    [state.bathroomFanType === "hugent" ? "휴젠트 옵션" : "일반 환풍기", fanUnit, units, `${units}칸`],
    ["욕조", rates.bathtub, state.bathroomBathtubUnits, `${state.bathroomBathtubUnits}개`],
    ["유리부스", rates.glassBooth, state.bathroomGlassBoothUnits, `${state.bathroomGlassBoothUnits}개`],
    ["유리파티션", rates.glassPartition, state.bathroomGlassPartitionUnits, `${state.bathroomGlassPartitionUnits}개`],
  ].filter((item) => item[2] > 0).map(([item, unitPrice, units, quantity]) => ({
    group: "bathroom",
    item,
    input: quantity,
    quantity,
    unitPrice,
    cost: unitPrice * units,
  }));
}
