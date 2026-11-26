import { BATHROOM_TILE_LIMIT, BATHROOM_TILE_WALL_LIMIT_MM, BATHROOM_TILE_PRODUCTS, EMPTY_BATHROOM_TILE_ROOM, parseBathroomTileRooms } from "./bathroom-tile-inputs.js";

export function mountBathroomTileInputs(document) {
  const count = document.getElementById("bathroomUnits");
  const toggle = document.getElementById("tileEnabled");
  const section = document.getElementById("sectionBathroomEnabled");
  const caption = toggle.parentElement.querySelector("span");
  const legacyCaption = caption.textContent;
  const host = document.createElement("div");
  host.className = "furniture-block bathroom-tile-rooms";
  host.hidden = true;
  const value = document.createElement("input");
  value.type = "hidden";
  value.id = "bathroomTileRooms";
  value.value = "[]";
  const rows = document.createElement("div");
  host.append(value, rows);
  count.closest(".furniture-block").after(host);
  let renderedValue, renderedCount, rooms = [];

  const fields = [
    ["wallLengthMm", "벽체 총길이 (mm)", "number"], ["wallTile", "벽체 타일", "select"],
    ["floorArea", "바닥 면적 (㎡)", "number"], ["floorTile", "바닥 타일", "select"],
    ["labor", "타일 시공 인건비", "checkbox"], ["jolly", "졸리컷", "checkbox"],
  ];

  function roomFields(index) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "control-grid compact-row-grid";
    const legend = document.createElement("legend");
    legend.textContent = `욕실 ${index + 1} 타일`;
    fieldset.append(legend);
    const room = rooms[index] || EMPTY_BATHROOM_TILE_ROOM;
    for (const [key, title, type] of fields) {
      const label = document.createElement("label");
      const field = document.createElement(type === "select" ? "select" : "input");
      field.dataset.tileField = key;
      field.dataset.tileRoom = String(index);
      field.disabled = !section.checked;
      if (type === "select") {
        for (const [id, name] of [["", "제품 선택"], ...Object.entries(BATHROOM_TILE_PRODUCTS)]) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = name;
          field.append(option);
        }
      } else {
        field.type = type;
        if (type === "number") {
          const wall = key === "wallLengthMm";
          field.min = "0";
          field.max = wall ? String(BATHROOM_TILE_WALL_LIMIT_MM) : "1000";
          field.step = wall ? "1" : "0.001";
          field.inputMode = wall ? "numeric" : "decimal";
        }
      }
      if (type === "checkbox") {
        label.className = "inline-check";
        field.checked = room[key];
        const text = document.createElement("span");
        text.textContent = title;
        label.append(field, text);
      } else {
        field.value = room[key];
        label.append(title, field);
      }
      fieldset.append(label);
    }
    return fieldset;
  }

  rows.addEventListener("input", event => {
    const field = event.target;
    const key = field.dataset.tileField;
    if (!key || field.disabled) return;
    const index = Number(field.dataset.tileRoom);
    while (rooms.length <= index) rooms.push({ ...EMPTY_BATHROOM_TILE_ROOM });
    rooms[index][key] = field.type === "checkbox" ? field.checked :
      field.type === "number" ? Number(field.value || 0) : field.value;
    renderedValue = value.value = JSON.stringify(rooms);
    value.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  });

  return () => {
    const legacy = value.value === "";
    host.hidden = legacy;
    count.max = legacy ? "" : String(BATHROOM_TILE_LIMIT);
    const title = legacy ? legacyCaption : "타일 시공 인건비 적용";
    if (caption.textContent !== title) caption.textContent = title;
    const activeCount = legacy ? 0 : Math.min(BATHROOM_TILE_LIMIT, Math.max(0, Math.trunc(Number(count.value) || 0)));
    if (renderedCount === activeCount && renderedValue === value.value) return;
    if (renderedValue !== value.value) {
      rooms = parseBathroomTileRooms(value.value) || [];
      renderedValue = value.value;
    }
    renderedCount = activeCount;
    rows.replaceChildren(...Array.from({ length: activeCount }, (_, index) => roomFields(index)));
  };
}
