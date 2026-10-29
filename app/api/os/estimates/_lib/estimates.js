import { ApiError, errorResponse, supabaseFetch } from "../../_lib/server";
import { customerQuoteProjection } from "../../../../../public/os-app/src/customer-quote.js";
import {
  COST_ITEM_DEFINITIONS, ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS,
  createEstimateCalculation,
} from "../../_lib/calculation/calculator/estimate-core.js";

const privateInputs = new Set(PRIVATE_ESTIMATE_INPUTS);
export const staffInputIds = Object.keys(ESTIMATE_INPUT_SCHEMA).filter((id) => !privateInputs.has(id));
const allowedInputs = new Set(staffInputIds);
const metadataInputs = new Set(["projectName", "clientName", "clientPhone", "estimateStatus", "projectSearch", "projectSearchResults"]);
const money = (value) => `${(Math.floor(value / 1000) * 1000).toLocaleString("ko-KR")}원`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const text = (value) => typeof value === "string" ? value : "";
const amount = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function estimateErrorResponse(error) {
  // PostgREST constraint errors can contain the rejected full internal row.
  if (error instanceof ApiError && (error.message.trim().startsWith("{") || error.message.length > 500)) {
    return errorResponse(new ApiError(error.status, "견적 요청을 처리하지 못했습니다."));
  }
  return errorResponse(error);
}

export function assertEstimateId(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new ApiError(400, "견적 ID가 올바르지 않습니다.");
  }
  return id;
}

function inputValue(id, value, strict = false) {
  const schema = ESTIMATE_INPUT_SCHEMA[id];
  if (schema.type === "checkbox") {
    if (strict && typeof value !== "boolean") throw new ApiError(400, "선택값은 true/false여야 합니다.");
    return value === true;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    if (strict) throw new ApiError(400, "견적 입력값이 올바르지 않습니다.");
    return schema.value;
  }
  const result = String(value);
  if (strict && result.length > 500) throw new ApiError(400, "견적 입력값이 너무 깁니다.");
  if (schema.choices && !schema.choices.includes(result)) {
    if (strict) throw new ApiError(400, "견적 선택값이 올바르지 않습니다.");
    return schema.value;
  }
  if (schema.type === "number" && result !== "") {
    const numeric = Number(result);
    if (!Number.isFinite(numeric) || numeric < (schema.min ?? 0) || numeric > (schema.max ?? 10000000)) {
      if (strict) throw new ApiError(400, "견적 수치가 허용 범위를 벗어났습니다.");
      return schema.value;
    }
  }
  return result;
}

function legacyInputs(raw = {}) {
  const inputs = { ...raw };
  if (inputs.wallpaperPublicMaterialGrade == null && inputs.wallpaperMaterialGrade != null) inputs.wallpaperPublicMaterialGrade = inputs.wallpaperMaterialGrade;
  if (inputs.wallpaperPublicWallLengthM == null && inputs.wallpaperWallLengthM != null) inputs.wallpaperPublicWallLengthM = inputs.wallpaperWallLengthM;
  if (inputs.wallpaperRoomMaterialGrade == null) inputs.wallpaperRoomMaterialGrade = "besti";
  if (inputs.existingPipeCleaningEnabled == null) inputs.existingPipeCleaningEnabled = false;
  if (inputs.bathroomPlumbingRelocationEnabled == null) {
    inputs.bathroomPlumbingRelocationEnabled = inputs.bathroomEnabled === true && inputs.sectionBathroomEnabled !== false && amount(inputs.bathroomUnits) > 0;
  }
  if (inputs.targetMargin != null && amount(inputs.targetMargin) > 0 && amount(inputs.targetMargin) <= 1) inputs.targetMargin = String(amount(inputs.targetMargin) * 100);
  return inputs;
}

export function safeInputs(raw = {}) {
  const inputs = legacyInputs(raw);
  return Object.fromEntries(staffInputIds.map((id) => [id,
    inputValue(id, Object.hasOwn(inputs, id) ? inputs[id] : ESTIMATE_INPUT_SCHEMA[id].value)]));
}

export function validateStaffBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)
    || Object.keys(body).some((key) => !["inputs", "address"].includes(key))
    || !body.inputs || typeof body.inputs !== "object" || Array.isArray(body.inputs)) {
    throw new ApiError(400, "견적 입력값만 전송해 주세요.");
  }
  if (JSON.stringify(body).length > 64000) throw new ApiError(413, "견적 요청이 너무 큽니다.");
  const inputs = {};
  for (const [id, value] of Object.entries(body.inputs)) {
    if (!allowedInputs.has(id)) throw new ApiError(400, "허용되지 않은 견적 필드입니다.");
    inputs[id] = inputValue(id, value, true);
  }
  if (body.address !== undefined && (typeof body.address !== "string" || body.address.length > 500)) throw new ApiError(400, "현장 주소가 올바르지 않습니다.");
  return { inputs, ...(body.address !== undefined ? { address: body.address } : {}) };
}

export function projectStaffEstimate(row) {
  const data = row.estimate_data || {};
  const quote = customerQuoteProjection(data.customerQuote || {});
  const total = amount(row.total_price ?? data.total ?? quote.total);
  const projectName = text(row.project_name || data.projectName);
  const clientName = text(row.client_name || data.clientName);
  const phone = text(row.phone || data.phone);
  const savedAt = text(row.created_at || data.savedAt);
  const inputs = safeInputs({ ...(data.inputs || {}), projectName, clientName, clientPhone: phone,
    areaPyeong: String(row.area_pyeong ?? data.areaPyeong ?? 0), estimateStatus: row.status || data.status || "견적" });
  return {
    id: text(row.id), projectName, clientName, phone, clientPhone: phone,
    address: text(row.address || data.address), areaPyeong: amount(row.area_pyeong ?? data.areaPyeong),
    total, totalText: money(total), status: text(row.status || data.status), savedAt,
    updatedAt: text(row.updated_at), inputs,
    customerQuote: {
      projectName, clientName, phone, areaPyeong: amount(row.area_pyeong ?? data.areaPyeong),
      savedAt, total, totalText: money(total), status: text(row.status || data.status),
      groups: quote.groups,
    },
  };
}

export async function readEstimate(id) {
  const rows = await supabaseFetch(`/rest/v1/estimates?id=eq.${assertEstimateId(id)}&select=*&limit=1`);
  if (!rows[0]) throw new ApiError(404, "견적을 찾을 수 없습니다.");
  return rows[0];
}

function normalizedInputs(raw) {
  const values = legacyInputs(raw);
  return Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id, schema]) => [id,
    Object.hasOwn(values, id) ? inputValue(id, values[id]) : schema.value]));
}

async function trustedCostContext(existing) {
  const rows = await supabaseFetch("/rest/v1/cost_items?select=item_code,category,item_name,unit,cost_price,default_margin_rate,updated_at&order=sort_order.asc");
  if (!rows.length) throw new ApiError(409, "운영 원가를 불러올 수 없어 견적을 계산하지 않았습니다.");
  const published = new Map(rows.map((row) => [row.item_code, row]));
  const oldSnapshot = existing?.estimate_data?.costSnapshot;
  const saved = new Map((oldSnapshot?.items || []).map((item) => [item.itemCode, item]));
  const rateValues = {};
  for (const definition of COST_ITEM_DEFINITIONS) {
    const old = saved.get(definition.itemCode);
    const current = published.get(definition.itemCode);
    if (old || current) rateValues[definition.inputId] = amount(old ? old.costPrice : current.cost_price);
  }
  const items = COST_ITEM_DEFINITIONS.filter((definition) => published.has(definition.itemCode)).map((definition) => {
    const row = published.get(definition.itemCode);
    return { itemCode: definition.itemCode, category: row.category, itemName: row.item_name, unit: row.unit,
      costPrice: amount(row.cost_price), defaultMarginRate: amount(row.default_margin_rate), updatedAt: row.updated_at };
  });
  return { rateValues, snapshot: oldSnapshot?.items?.length ? clone(oldSnapshot) : {
    capturedAt: new Date().toISOString(), source: "supabase_cost_items", items,
    costDbUpdatedAt: items.map((item) => item.updatedAt).filter(Boolean).sort().at(-1) || null,
  } };
}

export function privateEstimateDefaults() {
  return Object.fromEntries(PRIVATE_ESTIMATE_INPUTS.map(id=>[id,ESTIMATE_INPUT_SCHEMA[id].value]));
}

// Same engine and rounding as the former browser runtime; only its execution location changes.
export async function calculatePrivilegedEstimate(body, context) {
  if(!['admin','manager'].includes(context.profile.role))throw new ApiError(403,'내부 견적 계산 권한이 없습니다.');
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['inputs','estimateId','rateValues','address'].includes(k))||!body.inputs||typeof body.inputs!=='object'||Array.isArray(body.inputs))throw new ApiError(400,'견적 입력값을 확인해 주세요.');
  if(JSON.stringify(body).length>100000)throw new ApiError(413,'견적 입력값이 너무 큽니다.');
  const incoming={};
  for(const [id,value] of Object.entries(body.inputs)){
    if(['projectSearch','projectSearchResults'].includes(id)){if(typeof value!=='string'||value.length>500)throw new ApiError(400,'견적 입력값을 확인해 주세요.');incoming[id]=value;continue;}
    if(!ESTIMATE_INPUT_SCHEMA[id])throw new ApiError(400,'허용되지 않은 견적 필드입니다.');
    incoming[id]=inputValue(id,value,true);
  }
  const existing=body.estimateId?await readEstimate(body.estimateId):null;
  const old=existing?.estimate_data,baseline=normalizedInputs(old?.inputs||{}),inputs={...baseline,...incoming};
  const compare=createEstimateCalculation(),effective=compare.effectiveEstimateInputOverrides(compare.readState(baseline));
  delete effective.existingPipeCleaningEnabled;Object.assign(baseline,effective);
  const changed=Object.keys(ESTIMATE_INPUT_SCHEMA).filter(id=>!metadataInputs.has(id)&&inputValue(id,inputs[id])!==inputValue(id,baseline[id]));
  const costs=await trustedCostContext(existing);
  const rateValues={...costs.rateValues};
  if(body.rateValues!==undefined){
    if(!body.rateValues||typeof body.rateValues!=='object'||Array.isArray(body.rateValues))throw new ApiError(400,'적용 원가를 확인해 주세요.');
    for(const [id,value] of Object.entries(body.rateValues)){
      if(!COST_ITEM_DEFINITIONS.some(d=>d.inputId===id)||typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9)throw new ApiError(400,'적용 원가를 확인해 주세요.');
      if(!old?.costSnapshot?.items?.length||!changed.length)rateValues[id]=value;
    }
  }
  const core=createEstimateCalculation({rateValues}),state=core.readState(inputs),result=core.calculate(state);
  if(old?.costSnapshot?.items?.length&&changed.length&&state.wallpaperMaterialEnabled&&!old.costSnapshot.items.some(i=>i.itemCode==='WALLPAPER_MATERIAL_PER_PYEONG'))throw new ApiError(409,'저장 당시 원가 스냅샷에 도배 자재비가 없어 현재 원가와 섞어 계산하지 않았습니다.');
  const groups=core.groupedCustomerItems(result.details,result.quoteLines),total=groups.reduce((n,g)=>n+amount(g.total),0),savedAt=new Date().toISOString();
  let snapshot=core.applyExistingPipeCleaningAdjustment({
    projectName:state.projectName,clientName:state.clientName,phone:state.clientPhone,areaPyeong:state.areaPyeong,status:state.status,
    address:body.address??existing?.address??old?.address??'',savedAt,total,totalText:money(total),costTotal:result.directCost,
    marginRate:Number((result.actualMargin*100).toFixed(2)),costSnapshot:costs.snapshot,
    inputs:{...(old?.inputs||{}),...inputs,...core.effectiveEstimateInputOverrides(state)},
    author:old?.author||{user_id:context.authUser.id,user_email:context.profile.email,role:context.profile.role},
    internalDetails:result.details,internalSummary:{directCost:result.directCost,customerRevenue:result.customerRevenue,profit:result.profit,marginRate:Number((result.actualMargin*100).toFixed(2)),discountRoom:result.discountRoom},
    customerQuote:{projectName:state.projectName,clientName:state.clientName,phone:state.clientPhone,areaPyeong:state.areaPyeong,status:state.status,savedAt,total,totalText:money(total),groups},
  },state.existingPipeCleaningEnabled);
  if(Array.isArray(old?.customerQuote?.groups)&&changed.length===0)snapshot=clone(old);
  else if(Array.isArray(old?.customerQuote?.groups)&&changed.length===1&&changed[0]==='existingPipeCleaningEnabled')snapshot=core.applyExistingPipeCleaningAdjustment(old,inputs.existingPipeCleaningEnabled === true);
  Object.assign(snapshot,{projectName:state.projectName,clientName:state.clientName,phone:state.clientPhone,areaPyeong:state.areaPyeong,status:state.status,savedAt,inputs:{...snapshot.inputs,...incoming}});
  Object.assign(snapshot.customerQuote,{projectName:snapshot.projectName,clientName:snapshot.clientName,phone:snapshot.phone,areaPyeong:snapshot.areaPyeong,status:snapshot.status,savedAt});
  return {snapshot,result};
}

export async function calculateStaffEstimate(validated, context, existing = null) {
  const oldData = existing?.estimate_data;
  const baseline = normalizedInputs({ ...(oldData?.inputs || {}), ...(existing ? {
    projectName: existing.project_name, clientName: existing.client_name || "", clientPhone: existing.phone || "",
    areaPyeong: String(existing.area_pyeong ?? 0), estimateStatus: existing.status || "견적",
  } : {}) });
  // Match the existing UI's section gating without repricing a loaded snapshot.
  const comparisonCore = createEstimateCalculation();
  const effectiveBaseline = comparisonCore.effectiveEstimateInputOverrides(comparisonCore.readState(baseline));
  delete effectiveBaseline.existingPipeCleaningEnabled;
  Object.assign(baseline, effectiveBaseline);
  const inputs = { ...baseline, ...validated.inputs };
  const changed = staffInputIds.filter((id) => inputValue(id, inputs[id]) !== inputValue(id, baseline[id]));
  const calculating = changed.filter((id) => !metadataInputs.has(id));
  const hasStoredQuote = Array.isArray(oldData?.customerQuote?.groups);
  let snapshot;
  let recalculated = false;
  if (hasStoredQuote && calculating.length === 0) snapshot = clone(oldData);
  else if (hasStoredQuote && calculating.length === 1 && calculating[0] === "existingPipeCleaningEnabled") {
    snapshot = createEstimateCalculation().applyExistingPipeCleaningAdjustment(oldData, inputs.existingPipeCleaningEnabled);
  } else {
    recalculated = true;
    const costs = await trustedCostContext(existing);
    const core = createEstimateCalculation({ rateValues: costs.rateValues });
    const state = core.readState(inputs);
    if (oldData?.costSnapshot?.items?.length && state.wallpaperMaterialEnabled
      && !oldData.costSnapshot.items.some((item) => item.itemCode === "WALLPAPER_MATERIAL_PER_PYEONG")) {
      throw new ApiError(409, "저장 당시 원가 스냅샷에 도배 자재비가 없어 현재 원가와 섞어 저장하지 않았습니다.");
    }
    const result = core.calculate(state);
    const groups = core.groupedCustomerItems(result.details, result.quoteLines);
    const total = groups.reduce((sum, group) => sum + amount(group.total), 0);
    snapshot = core.applyExistingPipeCleaningAdjustment({
      ...(oldData || {}), inputs: { ...(oldData?.inputs || {}), ...inputs, ...core.effectiveEstimateInputOverrides(state) },
      projectName: state.projectName, clientName: state.clientName, phone: state.clientPhone,
      areaPyeong: state.areaPyeong, status: state.status, total, totalText: money(total),
      costTotal: result.directCost, marginRate: Number((result.actualMargin * 100).toFixed(2)),
      costSnapshot: costs.snapshot, internalDetails: result.details,
      internalSummary: { directCost: result.directCost, customerRevenue: result.customerRevenue,
        profit: result.profit, marginRate: Number((result.actualMargin * 100).toFixed(2)), discountRoom: result.discountRoom },
      customerQuote: { projectName: state.projectName, clientName: state.clientName, phone: state.clientPhone,
        areaPyeong: state.areaPyeong, status: state.status, total, totalText: money(total), groups },
    }, state.existingPipeCleaningEnabled);
  }
  const projectName = text(inputs.projectName).trim();
  if (!projectName) throw new ApiError(400, "프로젝트명을 입력해 주세요.");
  Object.assign(snapshot, { projectName, clientName: text(inputs.clientName), phone: text(inputs.clientPhone),
    areaPyeong: amount(inputs.areaPyeong), status: text(inputs.estimateStatus) || "견적",
    address: validated.address ?? existing?.address ?? oldData?.address ?? "",
    inputs: recalculated ? snapshot.inputs : { ...(snapshot.inputs || {}), ...validated.inputs }, savedAt: new Date().toISOString(),
  });
  if (!existing) snapshot.author = { user_id: context.authUser.id, user_email: context.profile.email, role: context.profile.role };
  Object.assign(snapshot.customerQuote, { projectName: snapshot.projectName, clientName: snapshot.clientName,
    phone: snapshot.phone, areaPyeong: snapshot.areaPyeong, status: snapshot.status, savedAt: snapshot.savedAt });
  return snapshot;
}

export function estimateRowPayload(snapshot) {
  return { project_name: snapshot.projectName, client_name: snapshot.clientName, phone: snapshot.phone,
    address: snapshot.address, area_pyeong: snapshot.areaPyeong, status: snapshot.status,
    total_price: snapshot.total, cost_total: snapshot.costTotal, margin_rate: snapshot.marginRate,
    estimate_data: snapshot };
}
