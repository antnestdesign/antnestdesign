import { BATHROOM_TILE_LIMIT, BATHROOM_TILE_PRODUCTS, EMPTY_BATHROOM_TILE_ROOM } from "../../../../../../public/os-app/src/bathroom-tile-inputs.js";
import { bathroomTileMaterialPolicy } from "../bathroom-tile-materials.js";

const listBoxCosts = {
  "ara-1200": 36000, "ara-600": 21600,
  "ekr-1200": 50400, "ekr-600": 36000,
  "lt-1200": 89280, "lt-600": 72000,
};
const boxCosts = Object.fromEntries(Object.entries(listBoxCosts).map(([code, price]) => [code, price * 85 / 100]));
const BOX_AREA = 1440000;
const PYEONG_AREA = 3305785;
const supplyCount = (area, coverage) => Math.ceil(area * 1000 / (PYEONG_AREA * Math.round(coverage * 1000)));

export function bathroomTileAmounts(room, laborEnabled, material = bathroomTileMaterialPolicy()) {
  // Use integer millionths of a square metre so exact box boundaries do not round up twice.
  const wallArea = room.wallLengthMm * 2400;
  const floorArea = Math.round(room.floorArea * 1000) * 1000;
  const wallBuy = Math.ceil(wallArea * 115 / (BOX_AREA * 100));
  const floorBuy = Math.ceil(floorArea * 115 / (BOX_AREA * 100));
  const wallLay = Math.ceil(wallArea / BOX_AREA);
  const floorLay = Math.ceil(floorArea / BOX_AREA);
  const cerafix = supplyCount(wallArea, material.parameters.bathTileCerafixCoverage);
  const dryfix = supplyCount(floorArea, material.parameters.bathTileDryfixCoverage);
  const grout = 2;
  return {
    wallBuy, floorBuy, wallLay, floorLay, cerafix, dryfix, grout,
    tile: wallBuy * (boxCosts[room.wallTile] || 0) + floorBuy * (boxCosts[room.floorTile] || 0),
    supplies: cerafix * material.prices.BATH_TILE_CERAFIX + dryfix * material.prices.BATH_TILE_DRYFIX + grout * material.prices.BATH_TILE_GROUT_MATERIAL,
    labor: laborEnabled && room.labor && wallLay + floorLay > 0 ? Math.max((wallLay + floorLay) * 38000, 700000) : 0,
    jolly: room.jolly ? 400000 : 0,
  };
}

export function bathroomTileDetails(state, policy) {
  if (!state.bathroomEnabled || state.bathroomTileRooms == null) return [];
  const material = bathroomTileMaterialPolicy(policy);
  return Array.from({ length: Math.min(state.bathroomUnits, BATHROOM_TILE_LIMIT) }, (_, i) => i).flatMap(i => {
    const room = state.bathroomTileRooms[i] || EMPTY_BATHROOM_TILE_ROOM;
    const a = bathroomTileAmounts(room, state.tileEnabled, material);
    const prefix = `욕실 ${i + 1}`;
    const products = [
      a.wallBuy && room.wallTile && `벽체 ${BATHROOM_TILE_PRODUCTS[room.wallTile]}`,
      a.floorBuy && room.floorTile && `바닥 ${BATHROOM_TILE_PRODUCTS[room.floorTile]}`,
    ].filter(Boolean).join(" / ");
    return [
      [`타일 자재 (${products})`, a.tile, `벽체 ${a.wallBuy}박스 / 바닥 ${a.floorBuy}박스`],
      ["타일 부자재", a.supplies, `세라픽스 ${a.cerafix}개 / 드라이픽스 ${a.dryfix}포 / 줄눈재 ${a.grout}포`],
      ["타일 시공 인건비", a.labor, `벽체 ${a.wallLay}박스 / 바닥 ${a.floorLay}박스`],
      ["졸리컷", a.jolly, "1개소"],
    ].filter(([, cost]) => cost > 0).map(([item, cost, input]) => ({
      group: "tile", item: `${prefix} ${item}`, cost, input, quantity: "1식", unitPrice: cost, fixedMarkup: 0.30,
    }));
  });
}
