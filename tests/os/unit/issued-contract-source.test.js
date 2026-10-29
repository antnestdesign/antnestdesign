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
import { buildContractDocuments } from "../../../app/api/os/contract-packages/_lib/contracts.ts";
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
