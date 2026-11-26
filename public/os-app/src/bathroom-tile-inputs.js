export const BATHROOM_TILE_LIMIT = 80;
export const BATHROOM_TILE_PRODUCTS = Object.fromEntries(
  [["ara", "실속형"], ["ekr", "표준형"], ["lt", "고급형"]].flatMap(([brand, label]) =>
    ["1200", "600"].map(size => [`${brand}-${size}`, `${label} 600×${size}`])),
);
export const EMPTY_BATHROOM_TILE_ROOM = {
  wallLength: 0, floorArea: 0, wallTile: "", floorTile: "", labor: true, jolly: false,
};

export function parseBathroomTileRooms(value) {
  if (value === "") return null;
  const rooms = JSON.parse(value);
  if (!Array.isArray(rooms) || rooms.length > BATHROOM_TILE_LIMIT) throw new Error("욕실별 타일 입력을 확인해 주세요.");
  return rooms.map(room => {
    if (!room || Object.keys(room).length !== Object.keys(EMPTY_BATHROOM_TILE_ROOM).length ||
      Object.keys(EMPTY_BATHROOM_TILE_ROOM).some(key => !Object.hasOwn(room, key))) throw new Error("욕실별 타일 입력을 확인해 주세요.");
    for (const key of ["wallLength", "floorArea"]) {
      const n = room[key];
      if (!Number.isFinite(n) || n < 0 || n > 1000 || Number(n.toFixed(3)) !== n) throw new Error("욕실 치수는 0~1000 사이에서 소수 셋째 자리까지 입력해 주세요.");
    }
    for (const key of ["wallTile", "floorTile"]) {
      if (room[key] !== "" && (typeof room[key] !== "string" || !Object.hasOwn(BATHROOM_TILE_PRODUCTS, room[key]))) throw new Error("욕실 타일 제품을 확인해 주세요.");
    }
    if (typeof room.labor !== "boolean" || typeof room.jolly !== "boolean") throw new Error("욕실 타일 시공 선택을 확인해 주세요.");
    return Object.fromEntries(Object.keys(EMPTY_BATHROOM_TILE_ROOM).map(key => [key, room[key]]));
  });
}
