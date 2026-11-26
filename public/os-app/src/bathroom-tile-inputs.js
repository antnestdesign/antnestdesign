export const BATHROOM_TILE_LIMIT = 80;
export const BATHROOM_TILE_WALL_LIMIT_MM = 1000000;
export const BATHROOM_TILE_PRODUCTS = Object.fromEntries(
  [["ara", "실속형"], ["ekr", "표준형"], ["lt", "고급형"]].flatMap(([brand, label]) =>
    ["1200", "600"].map(size => [`${brand}-${size}`, `${label} 600×${size}`])),
);
export const EMPTY_BATHROOM_TILE_ROOM = {
  wallLengthMm: 0, floorArea: 0, wallTile: "", floorTile: "", labor: true, jolly: false,
};

export function parseBathroomTileRooms(value, { preserveStoredUnits = false } = {}) {
  if (value === "") return null;
  const rooms = JSON.parse(value);
  if (!Array.isArray(rooms) || rooms.length > BATHROOM_TILE_LIMIT) throw new Error("욕실별 타일 입력을 확인해 주세요.");
  return rooms.map(room => {
    const legacy = room != null && Object.hasOwn(room, "wallLength");
    const wallKey = legacy ? "wallLength" : "wallLengthMm";
    const keys = Object.keys(EMPTY_BATHROOM_TILE_ROOM).map(key => key === "wallLengthMm" ? wallKey : key);
    if (!room || typeof room !== "object" || Array.isArray(room) || Object.keys(room).length !== keys.length ||
      keys.some(key => !Object.hasOwn(room, key))) throw new Error("욕실별 타일 입력을 확인해 주세요.");
    const wall = room[wallKey];
    const wallMm = legacy ? Math.round(wall * 1000) : wall;
    if (!Number.isFinite(wall) || wall < 0 || !Number.isInteger(wallMm) || wallMm > BATHROOM_TILE_WALL_LIMIT_MM ||
      (legacy && Number(wall.toFixed(3)) !== wall)) throw new Error("욕실 벽체 총길이를 mm 단위로 확인해 주세요.");
    const floor = room.floorArea;
    if (!Number.isFinite(floor) || floor < 0 || floor > 1000 || Number(floor.toFixed(3)) !== floor)
      throw new Error("욕실 바닥 면적은 0~1000㎡ 사이에서 소수 셋째 자리까지 입력해 주세요.");
    for (const key of ["wallTile", "floorTile"]) {
      if (room[key] !== "" && (typeof room[key] !== "string" || !Object.hasOwn(BATHROOM_TILE_PRODUCTS, room[key]))) throw new Error("욕실 타일 제품을 확인해 주세요.");
    }
    if (typeof room.labor !== "boolean" || typeof room.jolly !== "boolean") throw new Error("욕실 타일 시공 선택을 확인해 주세요.");
    // Legacy V2.1 snapshots used metres. Do not rewrite them just because they were read.
    const storedMetres = legacy && preserveStoredUnits;
    return {
      [storedMetres ? "wallLength" : "wallLengthMm"]: storedMetres ? wall : wallMm,
      floorArea: floor, wallTile: room.wallTile, floorTile: room.floorTile, labor: room.labor, jolly: room.jolly,
    };
  });
}
