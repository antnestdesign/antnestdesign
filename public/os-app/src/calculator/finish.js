export function wallpaperMaterialDetail(state, rates) {
  if (!state.wallpaperMaterialEnabled) return null;
  const wallArea = (state.wallpaperWallLengthM * rates.ceilingHeightMm) / 1000000;
  const ceilingArea = state.areaPyeong * rates.pyeongToSquareMeter;
  const requiredArea = (wallArea + ceilingArea) * rates.wasteFactor;
  const rolls = requiredArea > 0 ? Math.ceil(requiredArea / rates.wallpaperRollArea) : 0;
  const grade = {
    besti: { item: "도배지(베스띠급)", unitPrice: rates.wallpaperBesti },
    diamant: { item: "도배지(디아망급)", unitPrice: rates.wallpaperDiamant },
    fortis: { item: "도배지(디아망 포티스급)", unitPrice: rates.wallpaperFortis },
  }[state.wallpaperMaterialGrade] || { item: "도배지(디아망급)", unitPrice: rates.wallpaperDiamant };
  return {
    group: "wallpaper",
    item: grade.item,
    input: `${requiredArea.toFixed(1)}㎡ / 15% 로스 포함`,
    quantity: `${rolls}롤`,
    unitPrice: grade.unitPrice,
    cost: rolls * grade.unitPrice,
  };
}

export function wallpaperSupplyDetail(state, rates) {
  if (!state.wallpaperMaterialEnabled) return null;
  const areaPyeong = Number(state.areaPyeong) || 0;
  const unitPrice = Number(rates.wallpaperMaterialPerPyeong) || 0;
  return {
    group: "wallpaper",
    item: "도배 잡자재",
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
