export function wallpaperMaterialDetail(state, rates) {
  if (!state.wallpaperMaterialEnabled) return null;
  const areaPyeong = Number(state.areaPyeong) || 0;
  const unitPrice = Number(rates.wallpaperMaterialPerPyeong) || 0;
  return {
    group: "wallpaper",
    item: state.wallpaperMaterialGrade === "fortis" ? "도배 자재(디아망 포티스급)" : "도배 자재(디아망급)",
    input: `${areaPyeong.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}평`,
    quantity: `${areaPyeong.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}평`,
    unitPrice,
    cost: areaPyeong * unitPrice,
  };
}

export function filmMaterialDetail(state, rates) {
  if (!state.filmMaterialEnabled) return null;
  const area = ((state.filmMaterialLengthM * rates.ceilingHeightMm) / 1000000) * rates.wasteFactor;
  const rolls = area > 0 ? Math.ceil(area / rates.filmRollArea) : 0;
  return {
    group: "film",
    item: "필름 자재(AND 표준 우드)",
    input: `${area.toFixed(1)}㎡ / 15% 로스 포함`,
    quantity: `${rolls}롤`,
    unitPrice: rates.filmWood,
    cost: rolls * rates.filmWood,
  };
}
