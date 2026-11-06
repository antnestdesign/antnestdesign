import {afterEach,expect,it,vi} from 'vitest';
import {assertBuilderActor,builderMode,requireBuilder} from '../../../app/api/os/estimate-items/_lib/service';
import * as server from '../../../app/api/os/_lib/server';
const original=process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE;
afterEach(()=>{vi.restoreAllMocks();if(original===undefined)delete process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE;else process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE=original;});
it('fails closed when no configuration is present',()=>{delete process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE;expect(builderMode()).toBe('OFF');expect(()=>requireBuilder()).toThrow();});
it.each(['on',' ON ','true','INVALID',''])('fails closed for invalid configuration %s',value=>{process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE=value;expect(builderMode()).toBe('OFF');expect(()=>requireBuilder(true)).toThrow();});
it('separates read-only from ON',()=>{process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE='READ_ONLY';expect(requireBuilder()).toBe('READ_ONLY');try{requireBuilder(true);expect.unreachable();}catch(error){expect(error.status).toBe(423);}process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE='ON';expect(requireBuilder(true)).toBe('ON');});
it.each([null,'','unknown','admin'])('requires an explicit current role, not a fallback staff role: %s',role=>{vi.spyOn(server,'supabaseFetch').mockResolvedValue([{role,is_active:true,must_change_password:false}]);return expect(assertBuilderActor({authUser:{id:'33333333-3333-4333-8333-333333333333'},profile:{role:'staff'}})).rejects.toMatchObject({status:403});});
