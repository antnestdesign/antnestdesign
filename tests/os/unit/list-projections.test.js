import { expect, test, vi } from "vitest";
import { supabaseFetch } from "../../../app/api/os/_lib/server";
import { estimateViews } from "../../../app/api/os/estimates/_lib/ownership";
import { publicProjectWorkflows } from "../../../app/api/os/projects/_lib/project-workflow";

vi.mock("../../../app/api/os/_lib/server", async importOriginal => ({
  ...await importOriginal(),
  supabaseFetch: vi.fn(),
}));

test("estimate list preserves project precedence, locked versions and staff projection", async () => {
  const staff={id:"staff-1",role:"staff",is_active:true,must_change_password:false};
  const version={id:"version-1",version_no:1};
  const requested=[];
  supabaseFetch.mockImplementation(async url=>{
    requested.push(url);
    if(url.includes("/profiles?"))return [staff];
    if(url.includes("/preliminary_estimate_versions?"))return [version];
    return [{estimate_id:"draft",project_id:"fallback"}];
  });
  const base={creator_id:staff.id,creator_role:"staff",estimate_data:{costTotal:42}};
  const [draft,confirmed]=await estimateViews([
    {...base,id:"draft"},
    {...base,id:"locked",project_id:"old",confirmation_project_id:"confirmed",confirmation_state:"confirmed",latest_confirmation_id:version.id},
  ],staff);
  expect(draft).toMatchObject({projectId:"fallback",canEdit:true,canConfirm:false});
  expect(draft).not.toHaveProperty("costTotal");
  expect(confirmed).toMatchObject({projectId:"confirmed",canEdit:false,canCreateRevision:false,confirmation:{latest:version}});
  expect(requested.find(url=>url.includes("/project_preliminary_estimates?"))).toContain("in.(draft)");
});

test("contract projects retain author, dates and locked basis alongside legacy rows", async () => {
  supabaseFetch.mockImplementation(async url=>url.includes("/preliminary_estimate_versions?")
    ? [{id:"v1",estimate_id:"e1",version_no:1,supply_amount:100,vat_amount:10,total_amount:110}]
    : [{id:"e1",creator_name:"Synthetic author"}]);
  const [managed,legacy]=await publicProjectWorkflows([
    {id:"p1",flow_estimate_id:"e1",flow_version_id:"v1",flow_revision:4,flow_contract_date:"2026-11-01"},
    {id:"p2",status:"계약"},
  ]);
  expect(managed.workflow).toMatchObject({creatorName:"Synthetic author",revision:"4",contractDate:"2026-11-01",basis:{id:"v1",total:110}});
  expect(legacy).toMatchObject({id:"p2",status:"계약",workflow:null});
});
