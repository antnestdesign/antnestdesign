import {beforeEach,expect,test,vi} from 'vitest';
const state=vi.hoisted(()=>({db:vi.fn(),pdf:vi.fn(),denied:false}));
vi.mock('../../../app/api/os/_lib/server',()=>({
 ApiError:class extends Error{constructor(status,message){super(message);this.status=status;}},
 getUserContext:async()=>({}),supabaseFetch:(...args)=>state.db(...args),json:(data,init)=>Response.json(data,init),
 errorResponse:error=>Response.json({error:error.message},{status:error.status||500}),
}));
vi.mock('../../../app/api/os/contract-packages/_lib/confirmed-source',async load=>{
 const actual=await load();const {ApiError}=await import('../../../app/api/os/_lib/server');
 return {...actual,confirmedContractAccess:async()=>{if(state.denied)throw new ApiError(403,'Forbidden');return {actor:{id:'90000000-0000-4000-8000-000000000001'},project:{flow_revision:7},version:{id:'90000000-0000-4000-8000-000000000002',snapshot_hash:'frozen',snapshot:{estimate_data:{inputs:{}}}}};},
 buildConfirmedContract:async()=>({snapshot:{contract_info:{total_amount:110},document_options_snapshot:{}},documents:[{document_type:'CONTRACT'},{document_type:'QUOTE'},{document_type:'SPEC'}],notices:[]})};
});
vi.mock('../../../app/api/os/contract-packages/_lib/contract-pdf',()=>({contractHtml:()=>'<p>Existing template</p>',contractPdfs:(...args)=>state.pdf(...args)}));
import {POST} from '../../../app/api/os/projects/[id]/contracts/route.ts';
const id='90000000-0000-4000-8000-000000000003';
const form={customerName:'Synthetic',customerPhone:'000',customerAddress:'Address',contractDate:'2026-11-18',startDate:'2026-11-19',completionDate:'2026-11-20',constructionType:'Interior',companyName:'Company',businessNo:'000',representative:'Representative',companyAddress:'Office',companyPhone:'000',amount:110,amountBasis:'vat_included',notes:'Last input'};
const body=()=>({action:'issue',versionId:'90000000-0000-4000-8000-000000000002',expectedRevision:'7',requestId:'90000000-0000-4000-8000-000000000004',form:{...form}});
const post=data=>POST(new Request('http://localhost',{method:'POST',body:JSON.stringify(data)}),{params:Promise.resolve({id})});
beforeEach(()=>{state.denied=false;state.db.mockReset().mockImplementation(async path=>path.includes('/rpc/')?{id:'issued'}:path.includes('select=contract_no')?[{contract_no:'SYNTHETIC',package_version:1}]:[]);state.pdf.mockReset().mockResolvedValue(['CONTRACT','QUOTE','SPEC'].map(document_type=>({document_type,pdf_bytes:'synthetic',pdf_sha256:'synthetic'})));});
test('direct issue validates final values and atomically sends all three PDFs without a preview token',async()=>{
 const response=await post(body());expect(response.status).toBe(201);expect(state.pdf).toHaveBeenCalledTimes(1);
 const rpc=state.db.mock.calls.find(([path])=>path.includes('/rpc/and_os_issue_confirmed_contract'));
 const saved=JSON.parse(rpc[1].body);expect(saved.p_snapshot.document_options_snapshot.confirmed_form.notes).toBe('Last input');expect(saved.p_documents).toHaveLength(3);expect(saved.p_revision).toBe(7);
});
test.each(['missing','stale','preview-changed','forbidden'])('%s cannot issue through the direct path',async kind=>{
 const data=body();if(kind==='missing')data.form.customerName='';if(kind==='stale')data.expectedRevision='6';if(kind==='preview-changed')data.previewHash='wrong';if(kind==='forbidden')state.denied=true;
 const response=await post(data);expect(response.status).toBe(kind==='missing'?400:kind==='forbidden'?403:409);expect(state.pdf).not.toHaveBeenCalled();expect(state.db.mock.calls.some(([path])=>path.includes('/rpc/'))).toBe(false);
});
test('PDF generation failure never calls the issuing transaction',async()=>{
 state.pdf.mockRejectedValue(new Error('Synthetic PDF failure'));expect((await post(body())).status).toBe(500);expect(state.db.mock.calls.some(([path])=>path.includes('/rpc/'))).toBe(false);
});
