const on = v => v === true || v === "true";
export function requiredWorkScopes(definition, reference) {
  const i = reference?.inputs || {}, scopes = [];
  const add = (id, label, codes) => scopes.push({ id, label, standardIds: codes.map(c => `std-${c}`) });
  const tile = () => { add("tile-worker", "욕실 타일 기공", ["TILE_LABOR_WORKER"]); add("tile-helper", "욕실 타일 조공", ["TILE_LABOR_HELPER"]); };
  if (definition.trade === "demolition" && definition.inputs.includes("demolitionBathroomUnits") && on(i.demolitionBathroomEnabled) && Number(i.demolitionBathroomUnits) > 0) add("bath-demolition", "욕실 철거·방수 묶음", ["DEMO_BATHROOM_WATERPROOF"]);
  if (definition.trade === "bathroom" && definition.inputs.includes("bathroomUnits") && Number(i.bathroomUnits) > 0) {
    add("bath-material", "욕실 타일 자재·잡자재", ["BATH_PORCELAIN_TILE_MATERIAL"]);
    add("bath-fixtures", "욕실 도기·수전", ["BATH_FIXTURE_SET"]);
    add("bath-install", "욕실 도기·수전 설치", ["BATH_FIXTURE_INSTALL"]);
    add("bath-ceiling", "욕실 천장돔", ["BATH_SMC_CEILING"]);
    if (on(i.tileEnabled)) tile();
  }
  if (definition.trade === "bathroom" && definition.inputs.includes("bathroomMasonryWallUnits")) {
    if (on(i.tileEnabled)) { tile(); add("bath-material", "욕실 타일 자재·잡자재", ["BATH_PORCELAIN_TILE_MATERIAL"]); }
    if (on(i.tileEnabled) && on(i.tileGroutEnabled)) add("tile-grout", "줄눈·메지", ["TILE_GROUT"]);
    if (Number(i.bathroomMasonryWallUnits) > 0) add("masonry", "조적벽 추가 작업", ["TILE_LABOR_WORKER"]);
    if (reference?.customerQuote?.groups?.some(g => g.items?.some(r => /^비욕실 타일/.test(r.name) && Number(r.amount) > 0))) add("non-bath-tile", "비욕실 타일 자재·노무", ["TILE_AREA"]);
  }
  return scopes;
}
export function scopeCompatible(scope, item) {
  return scope.standardIds.includes(item.standardId) || (!item.standardId && !item.masterCode && Boolean(item.workScope?.trim()) && Boolean(item.spec?.trim()));
}
export function coverageStamp(rows) {
  return JSON.stringify([...rows].sort((a,b)=>a.id.localeCompare(b.id)).map(i=>[i.id,i.standardId||"",i.name,i.spec,i.unit,i.excluded,i.workScope||"",i.spaceIds||(i.spaceId?[i.spaceId]:[])]));
}
export function coverageProblem(scope, record, task, editor) {
  if (!record || !["included", "excluded"].includes(record.decision) || !record.reason.trim()) return "반영 또는 제외와 근거를 확인해 주세요.";
  if (record.decision === "excluded") return task.itemIds.some(id=>editor.items.some(i=>i.id===id&&!i.excluded&&scopeCompatible(scope,i))) ? "선택 품목에 같은 범위가 포함되어 있습니다. 적용 범위를 확인해 주세요." : "";
  const rows=record.itemIds.map(id=>editor.items.find(i=>i.id===id));
  if (!rows.length || rows.some(i=>!i || i.excluded || !task.itemIds.includes(i.id) || !scopeCompatible(scope,i) || !(i.quantity>0 && i.saleUnitPrice>0))) return "이 공사 범위를 충족하는 실제 품목을 연결해 주세요.";
  if (record.stamp !== coverageStamp(rows)) return "연결 품목이 변경되어 공사 범위를 다시 확인해야 합니다.";
  return "";
}
export function taskCoverage(definition, task, editor, reference) {
  return requiredWorkScopes(definition, reference).map(scope=>{
    const record=task?.coverage?.find(r=>r.id===scope.id);
    return {...scope,record,problem:task?.status==="excluded"&&task.reason.trim()?"":coverageProblem(scope,record,task||{itemIds:[]},editor)};
  });
}
