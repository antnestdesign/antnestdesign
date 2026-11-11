// Keep stored/API units stable; only explicitly marked controls accept millimetres.
export function storedEstimateInputValue(input) {
  const value = input?.value;
  if (input?.dataset?.lengthUnit !== "mm" || value === "") return value;
  const metres = Number(value) / 1000;
  return Number.isFinite(metres) ? String(metres) : value;
}

export function displayEstimateInputValue(input, value) {
  if (input?.dataset?.lengthUnit !== "mm" || value === "") return value;
  const millimetres = Number(value) * 1000;
  return Number.isFinite(millimetres) ? String(millimetres) : value;
}
