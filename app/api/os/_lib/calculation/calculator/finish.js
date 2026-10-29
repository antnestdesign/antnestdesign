export function wallpaperMaterialDetail(state, rates) {
  return wallpaperMaterialDetails(state, rates)[0] || null;
}

function wallpaperGradeOption(grade, rates, prefix = "") {
  return {
    besti: { item: `${prefix}도배지(베스띠급)`, unitPrice: rates.wallpaperBesti },
    diamant: { item: `${prefix}도배지(디아망급)`, unitPrice: rates.wallpaperDiamant },
    fortis: { item: `${prefix}도배지(디아망 포티스급)`, unitPrice: rates.wallpaperFortis },
  }[grade] || { item: `${prefix}도배지(디아망급)`, unitPrice: rates.wallpaperDiamant };
}

function wallpaperMaterialArea(lengthMm, ceilingShareArea, rates) {
  const wallArea = (lengthMm * rates.ceilingHeightMm) / 1000000;
  return (wallArea + ceilingShareArea) * rates.wasteFactor;
}

function wallpaperMaterialRow({ label, grade, lengthMm, ceilingShareArea, rates }) {
  const requiredArea = wallpaperMaterialArea(lengthMm, ceilingShareArea, rates);
  const rolls = requiredArea > 0 ? Math.ceil(requiredArea / rates.wallpaperRollArea) : 0;
  const gradeInfo = wallpaperGradeOption(grade, rates, `${label} `);
  if (rolls <= 0) return null;
  return {
    group: "wallpaper",
    item: gradeInfo.item,
    input: `${requiredArea.toFixed(1)}㎡ / 벽 ${lengthMm.toLocaleString("ko-KR")}mm / 15% 로스 포함`,
    quantity: `${rolls}롤`,
    unitPrice: gradeInfo.unitPrice,
    cost: rolls * gradeInfo.unitPrice,
  };
}

export function wallpaperMaterialDetails(state, rates) {
  if (!state.wallpaperMaterialEnabled) return [];
  const ceilingArea = state.areaPyeong * rates.pyeongToSquareMeter;
  const publicLength = Number(state.wallpaperPublicWallLengthM) || Number(state.wallpaperWallLengthM) || 0;
  const roomLength = Number(state.wallpaperRoomWallLengthM) || 0;
  const totalLength = publicLength + roomLength;
  if (totalLength <= 0) return [];
  const publicCeilingArea = ceilingArea * (publicLength / totalLength);
  const roomCeilingArea = ceilingArea - publicCeilingArea;
  return [
    wallpaperMaterialRow({
      label: "공용부",
      grade: state.wallpaperPublicMaterialGrade || state.wallpaperMaterialGrade,
      lengthMm: publicLength,
      ceilingShareArea: publicCeilingArea,
      rates,
    }),
    wallpaperMaterialRow({
      label: "각방",
      grade: state.wallpaperRoomMaterialGrade || "besti",
      lengthMm: roomLength,
      ceilingShareArea: roomCeilingArea,
      rates,
    }),
  ].filter(Boolean);
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
