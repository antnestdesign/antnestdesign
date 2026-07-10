export function doorDetails(state, rates) {
  if (!state.doorWindowEnabled) return [];
  return [
    ["중문", rates.middleDoor, state.middleDoorUnits, "SET"],
    ["일반도어", rates.standardDoor, state.standardDoorUnits, "EA"],
    ["슬라이딩도어", rates.slidingDoor, state.slidingDoorUnits, "EA"],
  ].filter((item) => item[2] > 0).map(([item, unitPrice, units, unit]) => ({
    group: "door",
    item,
    input: `${units}${unit}`,
    quantity: `${units}${unit}`,
    unitPrice,
    cost: unitPrice * units,
  }));
}
