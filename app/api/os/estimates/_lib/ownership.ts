import { ApiError, supabaseFetch, type UserContext } from '../../_lib/server';
import { projectStaffEstimate, staffInputIds } from './estimates';
import { customerQuoteProjection } from '../../../../../public/os-app/src/customer-quote.js';
import { publicItemState } from '../../estimate-items/_lib/model.js';

type Row = Record<string, unknown>;
type Actor = { id: string; role: string; name?: string; is_active: boolean; must_change_password: boolean };

export function protectEstimateProjectStatus(body:Row,existing?:Row) {
  const inputs=body.inputs;
  if(!inputs||typeof inputs!=='object'||Array.isArray(inputs))return body;
  const {estimateStatus,...rest}=inputs as Row;
  if(estimateStatus!==undefined&&estimateStatus!==(existing?.status||'견적'))throw new ApiError(403,'견적 저장으로 프로젝트 진행 상태를 변경할 수 없습니다.');
  return {...body,inputs:rest};
}
export function preserveEstimateProjectStatus(snapshot:Row,existing?:Row) {
  const status=existing?.status||'견적';
  snapshot.status=status;
  snapshot.inputs={...(snapshot.inputs as Row),estimateStatus:status};
  snapshot.customerQuote={...(snapshot.customerQuote as Row),status};
  return snapshot;
}

export async function estimateActor(context: UserContext): Promise<Actor> {
  const rows = await supabaseFetch<Actor[]>(`/rest/v1/profiles?id=eq.${context.authUser.id}&select=id,role,name,is_active,must_change_password`);
  const actor = rows[0];
  if (!actor || !['admin','manager','staff'].includes(actor.role) || actor.role !== context.profile.role
    || actor.is_active !== true || actor.must_change_password !== false) throw new ApiError(403,'견적 접근 권한이 없습니다.');
  return actor;
}

export function canEditEstimate(actor: Actor, row: Row, creator?: Actor) {
  if (actor.role === 'admin') return true;
  if (!row.creator_id || !creator || creator.role !== row.creator_role || !creator.is_active || creator.must_change_password) return false;
  return actor.id === row.creator_id && actor.role === row.creator_role || actor.role === 'manager' && row.creator_role === 'staff';
}

export async function estimateViews(rows: Row[], actor: Actor) {
  async function fetchGroups<T>(ids: unknown[], path: (ids: string) => string) {
    const unique=[...new Set(ids.filter(Boolean))], result:T[]=[];
    for(let start=0;start<unique.length;start+=50) {
      result.push(...await supabaseFetch<T[]>(path(unique.slice(start,start+50).join(','))));
    }
    return result;
  }
  const [creators,versions,associations]=await Promise.all([
    fetchGroups<Actor>(actor.role==='admin'?[]:rows.map(row=>row.creator_id),ids=>`/rest/v1/profiles?id=in.(${ids})&select=id,role,is_active,must_change_password`),
    fetchGroups<Row>(rows.map(row=>row.latest_confirmation_id),ids=>`/rest/v1/preliminary_estimate_versions?id=in.(${ids})&select=id,version_no,confirmed_at,confirmer_name,supply_amount`),
    fetchGroups<Row>(rows.filter(row=>!row.confirmation_project_id&&!row.project_id).map(row=>row.id),ids=>`/rest/v1/project_preliminary_estimates?estimate_id=in.(${ids})&select=estimate_id,project_id`),
  ]);
  const creatorById=new Map(creators.map(row=>[row.id,row]));
  const versionById=new Map(versions.map(row=>[row.id,row]));
  const projectByEstimate=new Map();
  for(const row of associations)if(!projectByEstimate.has(row.estimate_id))projectByEstimate.set(row.estimate_id,row.project_id);
  const editable=(row:Row)=>canEditEstimate(actor,row,creatorById.get(row.creator_id as string));
  return rows.map(row=>({ ...(actor.role === 'staff' ? projectStaffEstimate(row) : row),
    projectId:row.confirmation_project_id||row.project_id||projectByEstimate.get(row.id)||null,
    authorship: { creatorId:row.creator_id ?? null, creatorName:row.creator_name ?? '작성자 미확인',
      createdAt:row.creator_recorded_at ?? row.created_at, editorId:row.last_editor_id ?? null,
      editorName:row.last_editor_name ?? '수정자 미확인', editedAt:row.last_edited_at ?? null },
    revision:String(row.revision), canEdit:row.confirmation_state!=='confirmed'&&editable(row),
    canConfirm:row.confirmation_state!=='confirmed'&&actor.role!=='staff'&&editable(row),
    canCreateRevision:row.confirmation_state==='confirmed'&&actor.role!=='staff'&&editable(row),
    confirmation:{state:row.confirmation_state||'draft',draftVersion:row.draft_version||1,projectId:row.confirmation_project_id||row.project_id||null,
      latestId:row.latest_confirmation_id||null,latest:versionById.get(row.latest_confirmation_id)||null},
  }));
}

export async function requireEstimateEdit(actor: Actor, row: Row) {
  const result = await supabaseFetch<boolean>('/rest/v1/rpc/and_os_estimate_can_edit', {method:'POST',body:JSON.stringify({p_actor:actor.id,p_estimate:row.id})});
  if (!result) throw new ApiError(403,'이 견적은 수정 권한이 없습니다.');
  if(row.confirmation_state==='confirmed')throw new ApiError(423,'확정된 견적은 직접 수정할 수 없습니다. 수정본을 만들어 주세요.');
}

export function saveBody(raw: unknown, update: boolean) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ApiError(400,'견적 입력값을 확인해 주세요.');
  const { expectedRevision, ...body } = raw as Row;
  if (update && (typeof expectedRevision !== 'string' || !/^\d+$/.test(expectedRevision) || !Number.isSafeInteger(Number(expectedRevision))))
    throw new ApiError(409,'저장 버전을 확인할 수 없습니다. 견적을 다시 불러와 주세요.');
  if (!update && expectedRevision !== undefined) throw new ApiError(400,'새 견적에는 수정 버전을 지정할 수 없습니다.');
  return {body, revision:update ? Number(expectedRevision) : null};
}

export async function saveEstimateCommand(actor: Actor, id: string | null, revision: number | null, row: Row | null, remove = false) {
  if(!remove && (typeof row?.project_name !== 'string' || !row.project_name.trim())) throw new ApiError(400,'프로젝트명을 입력해 주세요.');
  try {
    return await supabaseFetch<Row>('/rest/v1/rpc/and_os_save_estimate', {method:'POST',body:JSON.stringify({p_actor:actor.id,p_id:id,p_expected_revision:revision,p_row:row,p_delete:remove})});
  } catch(error) {
    const message = error instanceof Error ? error.message : '';
    if(message.includes('estimate_locked'))throw new ApiError(423,'확정된 견적은 직접 수정할 수 없습니다. 수정본을 만들어 주세요.');
    if (message.includes('estimate_revision_conflict')) throw new ApiError(409,'다른 사용자가 견적을 수정했습니다. 다시 불러온 후 저장해 주세요.');
    if (message.includes('estimate_access_denied')) throw new ApiError(403,'이 견적은 수정 권한이 없습니다.');
    if (message.includes('23503')) throw new ApiError(409,'프로젝트·본견적·계약에서 참조 중인 견적은 삭제할 수 없습니다.');
    throw new ApiError(500,'견적과 변경 이력을 저장하지 못했습니다. 다시 불러와 확인해 주세요.');
  }
}

const publicHistory = new Set(['workflow_state','version_no','project_name','client_name','phone','address','area_pyeong','status','total_price','customer_items','additional_items',
  ...staffInputIds.filter((id:string)=>!['clientPhone','clientName','projectName'].includes(id)).map((id:string)=>`input:${id}`)]);
const labels: Record<string,string> = {workflow_state:'견적 작성 상태',version_no:'견적 버전',project_name:'현장명',client_name:'고객명',phone:'연락처',address:'현장 주소',area_pyeong:'평형',status:'견적 상태',
  'input:managementCost':'관리비용','input:managementDiscount':'할인금액',total_price:'견적금액',cost_total:'직접원가',margin_rate:'원가 가산율',customer_items:'공사 항목·판매금액',additional_items:'추가 공사 항목'};
export function projectEstimateHistory(row: Row, staff: boolean) {
  const before = row.before_data as {revision:unknown;changes:Row};
  const after = row.after_data as {revision:unknown;changes:Row};
  const safeValue = (key:string, value:unknown) => {
    if(!staff || value == null) return value ?? null;
    if(key==='customer_items')return customerQuoteProjection({groups:Array.isArray(value)?value:[]}).groups;
    if(key==='additional_items')return publicItemState({publicRows:Array.isArray(value)?value:[]}).itemRows;
    return ['string','number','boolean'].includes(typeof value) ? value : null;
  };
  const changes = Object.keys({...before?.changes,...after?.changes}).filter(key=>(!staff || publicHistory.has(key))&&JSON.stringify(before?.changes?.[key])!==JSON.stringify(after?.changes?.[key])).map(key=>({
    key, label:labels[key] ?? (key.startsWith('input:') ? '견적 입력' : '견적 기준'),
    before:safeValue(key,before?.changes?.[key]), after:safeValue(key,after?.changes?.[key]),
  }));
  const readable = changes.flatMap(change=>{
    if(!['customer_items','additional_items'].includes(change.key))return [change];
    if(change.key==='additional_items') {
      const rows=(v:unknown)=>publicItemState({publicRows:Array.isArray(v)?v:[]}).itemRows as Row[];
      const a=new Map(rows(change.before).map(r=>[r.id,r])),b=new Map(rows(change.after).map(r=>[r.id,r]));
      const fields:Record<string,string>={name:'품목명',spec:'규격',unit:'단위',quantity:'수량',saleUnitPrice:'판매단가',amount:'판매금액'};
      return [...new Set([...a.keys(),...b.keys()])].flatMap(id=>{
        const old=a.get(id),next=b.get(id),name=String(next?.name||old?.name||'추가 공사');
        if(!old||!next)return [{key:change.key,label:`${name} ${!old?'항목 추가':'항목 삭제'}`,before:old?.amount??null,after:next?.amount??null}];
        return Object.keys(fields).filter(field=>old[field]!==next[field]).map(field=>({key:change.key,label:`${name} ${fields[field]}`,before:old[field]??null,after:next[field]??null}));
      });
    }
    const items = (value:unknown) => {
      const groups = change.key==='customer_items' ? customerQuoteProjection({groups:Array.isArray(value)?value:[]}).groups : [{label:'추가 공사',items:publicItemState({publicRows:Array.isArray(value)?value:[]}).itemRows}];
      const counts=new Map<string,number>(),result=new Map<string,{name:string;amount:unknown}>();
      for(const group of groups)for(const item of group.items||[]){
        const name=`${group.label} · ${item.name}`,index=counts.get(name)||0;counts.set(name,index+1);
        result.set(`${name}:${index}`,{name,amount:item.amount});
      }
      return result;
    };
    const a=items(change.before),b=items(change.after);
    return [...new Set([...a.keys(),...b.keys()])].filter(k=>a.get(k)?.amount!==b.get(k)?.amount).map(k=>({
      key:change.key,label:`${b.get(k)?.name||a.get(k)?.name} ${!a.has(k)?'항목 추가':!b.has(k)?'항목 삭제':'판매금액 변경'}`,
      before:a.get(k)?.amount??null,after:b.get(k)?.amount??null,
    }));
  });
  return {id:row.id,at:row.created_at,actor:row.actor_name,action:row.action,revision:String(after?.revision ?? ''),versionNo:after?.changes?.version_no,changes:readable};
}
