import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { calculateEditor, emptyEditor } from "../../../app/api/os/projects/_lib/editor-model.ts";
import { ISSUE_COMPANY } from "../../../app/api/os/projects/_lib/versions.ts";
const state = vi.hoisted(() => ({ role: "admin", db: vi.fn() }));
vi.mock("../../../app/api/os/_lib/server", () => ({
  ApiError: class extends Error { constructor(status, message) { super(message); this.status = status; } },
  getUserContext: async () => ({ authUser: { id: "90000000-0000-4000-8000-000000000001" }, profile: { role: state.role } }),
  supabaseFetch: (...args) => state.db(...args), json: (data, init) => Response.json(data, init),
  requireServiceRoleKey: () => "synthetic-only-key",
}));
import { issuedContractEstimate, buildIssuedContract, contractSourceRoute } from "../../../app/api/os/projects/_lib/contract-source.ts";
import { buildContractDocuments,buildContractPackageSnapshot,buildSpecSnapshot } from "../../../app/api/os/contract-packages/_lib/contracts.ts";
import { createContractPrint, CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { JSDOM } from "jsdom";
const head = "90000000-0000-4000-8000-000000000010", version = "90000000-0000-4000-8000-000000000011";
function fixture() {
  const e = emptyEditor();e.items = [{id:"line1",trade:"furniture",spaceId:e.spaces[0].id,name:"합성 가구",spec:"규격",unit:"식",quantity:2.5,saleUnitPrice:100001,memo:"공개 사양",kind:"quantity",basis:"manual",masterCode:"",parentId:"",excluded:false}];
  e.addition=500;e.discount=200;
  return {id:version,quoteNumber:"AND-Q-2026-001",version:1,issuedAt:"2026-10-22T00:00:00Z",company:ISSUE_COMPANY,
    context:{project_name:"합성 현장",client_name:"합성 고객",address:"합성 주소",area_pyeong:32,phone:""},
    editor:calculateEditor(e,undefined,[],"admin").publicEditor, internal:{cost:12345},costSnapshot:{secret:"private"}};
}
beforeEach(()=>{vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE","ON");state.role="admin";state.db.mockReset().mockImplementation(async path=>path.includes("rpc/")?{estimate_id:head,document:fixture(),versions:[]}:[]);});
afterEach(()=>vi.unstubAllEnvs());
test("specification follows each frozen quote line across trades without catalog guesses",()=>{
 const quoted=[
  ["철거","방문 및 문틀 철거","demolition","방문 및 문틀 철거","2조",""],
  ["전기/조명","콘센트(수기 지정 제품)","electrical","콘센트(수기 지정 제품)","3개","수기 지정 제품"],
  ["욕실","도기 기본세트(AND 실속)","bathroom","도기 기본세트(AND 실속)","1세트","AND 실속"],
  ["도배","공용부 벽지(디아망급)","wallpaper","공용부 도배지(디아망급)","10롤","디아망급"],
  ["필름","필름(AND표준 우드)","film","필름 자재(우드 무늬)","2롤","AND표준 우드"],
  ["바닥","장판(2.2T)","flooring","바닥 시공(장판 2.2T)","12.7평","2.2T"],
  ["목공","간접조명(T3)","carpentry","간접조명(T3)","2m","T3"],
  ["가구","홈바장 상판(인조대리석, 12T)","homebar","홈바장 상판(인조대리석, 12T)","1장 환산","인조대리석, 12T"],
  ["가구","아일랜드 상판(세라믹)","island","아일랜드 상판(세라믹)","2장","세라믹"],
  ["가구","붙박이장 자체공장 맞춤 제작","builtIn","붙박이장 자체공장 맞춤 제작","5자","맞춤제작"],
  ["도어/창호","일반도어(아무스급)","door","일반도어(아무스급)","2EA","도무스급"],
  ["마감","현장 지정 실리콘","silicone","현장 지정 실리콘","1식",""],
 ];
 const items=quoted.map(([work_category,item_name])=>({work_category,item_name,sales_amount:1000,sales_amount_text:"1,000원"}));
 const details=quoted.map(([, ,group,item,quantity])=>({group,item,quantity,revenue:1300,customerRevenue:1000,input:"PRIVATE COST 500"}));
 details[7].input="1,000mm × 700mm";
 const specs=buildSpecSnapshot(items,details);
 expect(specs.map(s=>s.work_category)).toEqual(items.map(s=>s.work_category));
 expect(specs.map(s=>s.selected_grade)).toEqual(quoted.map(row=>row[5]));
 expect(specs[7]).toMatchObject({item_name:items[7].item_name,quantity:"1",unit:"장 환산",specification:"1,000mm × 700mm"});
 expect(specs[10]).toMatchObject({item_name:"일반도어(도무스급)",quantity:"2",unit:"EA"});
 expect(specs[9].item_name).toBe("붙박이장 맞춤제작");
 expect(JSON.stringify(specs)).not.toMatch(/칸스톤|아무스|자체공장|PRIVATE COST|1300/);
 expect(items[10].item_name).toBe("일반도어(아무스급)");
 expect(buildSpecSnapshot([items[7]],[details[7],details[7]])[0].quantity).toBe("");
});
test("new contract snapshots use the registered contractor and a single customer/site address",async()=>{
 const snapshot=await buildContractPackageSnapshot(head,{
  contract_no:null,contract_info:{},customer_info:{customer_address:"Synthetic customer address"},contractor_info:{company_name:"stale"},site_manager:{},admin_tasks:{},protection_options:{},item_options:{},notes:null,
 },null,{id:head,address:"Old site address",estimate_data:{},total_price:78570000});
 expect(snapshot.parties.contractor).toMatchObject({business_no:"149-85-03105",phone:"032-321-6722"});
 expect(snapshot.parties.contractor.company_name).not.toBe("stale");
 expect(snapshot.parties.customer.address).toBe("Synthetic customer address");
 expect(snapshot.contract_info.site_address).toBe(snapshot.parties.customer.address);
 expect(snapshot.contract_info.total_amount).toBe(78570000);
});
test("adapter uses only issued amounts and preserves adjustments without recalculation",()=>{
 const d=fixture(), before=JSON.stringify(d),e=issuedContractEstimate(d,head),q=e.estimate_data.customerQuote;
 expect(q.groups.reduce((n,g)=>n+g.total,0)).toBe(275000);expect(e.total_price).toBe(275000);
 expect(q.groups.at(-1).items.map(i=>i.amount)).toEqual([500,-200,-303,25000]);expect(JSON.stringify(d)).toBe(before);
 expect(JSON.stringify(e)).not.toMatch(/internal|cost|profit|margin|private/);
});
test("reuses 48 clauses and payment schedule with exact supply VAT and gross",async()=>{
 const source={estimate_id:head,document:fixture(),versions:[]},s=await buildIssuedContract(source,{},"AND-2026-10-001");
 expect(s.contract_info).toMatchObject({supply_amount:250000,vat_amount:25000,total_amount:275000,issued_version_id:version});
 expect(s.payment_schedule.reduce((n,p)=>n+p.amount,0)).toBe(275000);
 const docs=buildContractDocuments(s);expect(docs).toHaveLength(3);
 expect(docs[0].content_json.generated_sections.fixed_term_lines).toEqual(CONTRACT_FIXED_TERM_LINES);
 expect(CONTRACT_FIXED_TERM_LINES.filter(l=>/^제\d+조\(/.test(l))).toHaveLength(48);
 expect(JSON.stringify(docs)).not.toMatch(/internal|costSnapshot|profit|margin|private/);
 const dom=new JSDOM('<div id="printContractSheet"></div>');const print=createContractPrint({document:dom.window.document,formatDateTime:v=>v});
 const html=print.renderContractPrintDocument(s,docs);expect(html).toContain("275,000원");expect(html).toContain("250,000원");expect(html).toContain("25,000원");expect(html).toContain("VAT 포함");
});
test.each([undefined,"BAD","OFF","READ_ONLY"])("%s blocks new writes before DB",async mode=>{
 vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE",mode);const r=await contractSourceRoute(new Request("http://localhost/api/os/test",{method:"POST",body:JSON.stringify({})}),head);
 expect(r.status).toBe(mode==="READ_ONLY"?423:503);expect(state.db).not.toHaveBeenCalled();
});
test.each(["manager","staff"])("%s cannot create originals",async role=>{
 state.role=role;const r=await contractSourceRoute(new Request("http://localhost/api/os/test",{method:"POST",body:JSON.stringify({version_id:version,action:"create"})}),head);
 expect(r.status).toBe(403);expect(state.db.mock.calls).toHaveLength(1);
});
