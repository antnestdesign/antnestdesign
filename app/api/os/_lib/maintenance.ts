export type MaintenanceMode='OPEN'|'READ_ONLY'|'PAUSED'|'RECOVERY';
export class MaintenanceError extends Error {status=503;constructor(){super('시스템 점검 중입니다. 저장하지 말고 잠시 후 다시 확인해 주세요.');}}
export function maintenanceMode():MaintenanceMode {
 const value=process.env.AND_OS_MAINTENANCE_MODE;
 return !value||value==='OPEN'?'OPEN':['READ_ONLY','PAUSED','RECOVERY'].includes(value)?value as MaintenanceMode:'PAUSED';
}
export function maintenanceAllows(method:string,path:string,mode=maintenanceMode()){
 if(mode==='OPEN')return true;
 if(path==='/api/os/maintenance'&&method==='GET')return true;
 if(mode==='PAUSED')return false;
 if(['GET','HEAD','OPTIONS'].includes(method))return true;
 if(mode==='RECOVERY'&&((method==='POST'&&path==='/api/os/estimates')||(method==='PATCH'&&/^\/api\/os\/estimates\/[0-9a-f-]{36}$/.test(path))))return true;
 return method==='POST'&&['/api/os/estimates/calculate','/api/os/estimates/preview'].includes(path);
}
export function assertMaintenanceRequest(request:{method:string;url:string}){
 if(!maintenanceAllows(request.method.toUpperCase(),new URL(request.url).pathname))throw new MaintenanceError();
}
const readRpc=new Set(['get_preliminary_policy_state','and_os_estimate_can_edit','and_os_preliminary_project','and_os_preliminary_issues','and_os_preliminary_fingerprint']);
export function assertMaintenanceBackend(path:string,init?:RequestInit){
 const mode=maintenanceMode();if(mode==='OPEN')return;
 if(mode==='PAUSED')throw new MaintenanceError();
 const method=(init?.method||'GET').toUpperCase();if(['GET','HEAD'].includes(method)&&!path.startsWith('/rest/v1/rpc/'))return;
 const rpc=path.split('?')[0].replace('/rest/v1/rpc/','');
 if(path.startsWith('/rest/v1/rpc/')&&readRpc.has(rpc))return;
 const actions:Record<string,string[]>={and_os_5b_command:['projects','customers','project','preview','get','events'],and_os_5b_contract:['source','get'],and_os_5b_versions:['list','get'],and_os_5b_editor:['get']};
 if(actions[rpc]){let value;try{value=JSON.parse(String(init?.body));}catch{throw new MaintenanceError();}if(actions[rpc].includes(value.p_action))return;}
 if(mode==='RECOVERY'&&path==='/rest/v1/rpc/and_os_save_estimate'){
  let value;try{value=JSON.parse(String(init?.body));}catch{throw new MaintenanceError();}
  if(value.p_delete===false)return;
 }
 throw new MaintenanceError();
}
