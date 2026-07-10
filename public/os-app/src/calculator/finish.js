export function wallpaperMaterialDetail(state, rates) {
  if (!state.wallpaperMaterialEnabled) return null;
  const wallArea = (state.wallpaperWallLengthM * rates.ceilingHeightMm) / 1000000;
  const ceilingArea = state.areaPyeong * rates.pyeongToSquareMeter;
  const requiredArea = (wallArea + ceilingArea) * rates.wasteFactor;
  const rolls = requiredArea > 0 ? Math.ceil(requiredArea / rates.wallpaperRollArea) : 0;
  const unitPrice = state.wallpaperMaterialGrade === "fortis" ? rates.wallpaperFortis : rates.wallpaperDiamant;
  return {
    group: "wallpaper",
    item: state.wallpaperMaterialGrade === "fortis" ? "도배 자재(디아망 포티스급)" : "도배 자재(디아망급)",
    input: `${requiredArea.toFixed(1)}㎡ / 15% 로스 포함`,
    quantity: `${rolls}롤`,
    unitPrice,
    cost: rolls * unitPrice,
  };
}

export function filmMaterialDetail(state, rates) {
  if (!state.filmMaterialEnabled) return null;
  const area = ((state.filmMaterialLengthM * rates.ceilingHeightMm) / 1000000) * rates.wasteFactor;
  const rolls = area > 0 ? Math.ceil(area / rates.filmRollArea) : 0;
  return {
    group: "film",
    item: "필름 자재(영림 나무무늬)",
    input: `${area.toFixed(1)}㎡ / 15% 로스 포함`,
    quantity: `${rolls}롤`,
    unitPrice: rates.filmWood,
    cost: rolls * rates.filmWood,
  };
}
