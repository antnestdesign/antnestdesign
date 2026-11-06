import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createEstimateCalculation} from '../../../app/api/os/_lib/calculation/calculator/estimate-core.js';
import {defaultPolicy,validatePolicy,evaluateExpression,policyCatalog} from '../../../app/api/os/_lib/calculation/preliminary-policy.js';
import {PRELIMINARY_POLICY_EXAMPLES} from '../../../app/api/os/_lib/calculation/preliminary-policy-examples.js';
const base=()=>defaultPolicy(createEstimateCalculation().policyDefaults());
const run=(inputs,policy)=>{const c=createEstimateCalculation({preliminaryPolicy:policy});const r=c.calculate(c.readState(inputs));return {r,groups:c.groupedCustomerItems(r.details,r.quoteLines)};};
test('all 91 master bindings plus missing prices and rule entries have concrete baseline values',()=>{
 const p=base();expect(()=>validatePolicy(p)).not.toThrow();expect(Object.values(p.prices).every(v=>Number.isFinite(v))).toBe(true);expect(policyCatalog().prices).toHaveLength(109);
});
test.each([
 {sectionDemolitionEnabled:true,demolitionBasicEnabled:true,demolitionBasicArea:'34',demolitionFloorEnabled:true,areaPyeong:'34'},
 {sectionWallpaperEnabled:true,wallpaperPreset:'p20',wallpaperBaseCoatEnabled:true,wallpaperPublicWallLengthM:'30000',wallpaperRoomWallLengthM:'20000',areaPyeong:'32'},
 {sectionFilmEnabled:true,filmPreset:'p30',filmMaterialLengthM:'30000'},
 {sectionBathroomEnabled:true,bathroomUnits:'2',tileEnabled:true,bathroomMasonryWallUnits:'1',bathroomFixtureGrade:'premium'},
 {sectionFurnitureEnabled:true,baseEnabled:true,lowerCabinetM:'4500',baseT3Units:'2',islandEnabled:true,islandM:'3100',islandDepthMm:'900'},
 {sectionCarpentryEnabled:true,carpentryCostMode:'assembly-v1',carpentryCofferType:'new',carpentryCofferUnits:'2',carpentryArtwallM:'3000',carpentryTvUnits:'1'},
 {sectionFinishEnabled:true,generalWasteEnabled:true,interiorProtectionEnabled:true,moveInCleaningEnabled:true,existingPipeCleaningEnabled:true},
])('baseline policy keeps the original money and customer output: %j',inputs=>{
 const a=run(inputs),b=run(inputs,base());expect(b.r.directCost).toBe(a.r.directCost);expect(b.r.customerRevenue).toBe(a.r.customerRevenue);expect(b.groups).toEqual(a.groups);
});
test('wallpaper labor, demolition and film material are actual engine settings',()=>{
 const p=base();p.rules['wallpaper.p20.basic']={value:8};p.prices.BASIC_DEMOLITION_NORMAL=90000;p.prices.FILM_WOOD=320000;
 expect(run({sectionWallpaperEnabled:true,wallpaperPreset:'p20'},p).r.details.find(d=>d.item==='도배 인건비').cost).toBe(8*p.prices.WALLPAPER_LABOR);
 expect(run({sectionDemolitionEnabled:true,demolitionBasicEnabled:true,demolitionBasicArea:'2'},p).r.directCost).toBe(180000);
 expect(run({sectionFilmEnabled:true,filmMaterialLengthM:'1000'},p).r.details.find(d=>d.item.startsWith('필름 자재')).unitPrice).toBe(320000);
});
test('the formula evaluator has no arbitrary code, unknown inputs or zero division',()=>{
 for(const node of[{operator:'eval',args:[]},{variable:'constructor'},{operator:'divide',args:[{value:1},{value:0}]}]){const p=base();p.rules['wallpaper.p20.basic']=node;expect(()=>validatePolicy(p)).toThrow();}
 expect(()=>evaluateExpression({operator:'divide',args:[{value:1},{value:0}]},{})).toThrow();
 const p=base();p.rules['bom.coffer.WOOD_LABOR_WORKER']={value:9};expect(()=>validatePolicy(p)).toThrow(/동일한 품수/);
});
test('zero price is an explicit value under the new policy, not a request for the old fallback',()=>{
 const p=base(),inputs={sectionWallpaperEnabled:true};const old=run(inputs,p);p.prices.WALLPAPER_LABOR=0;const next=run(inputs,p);expect(next.r.directCost).toBe(old.r.directCost-5*base().prices.WALLPAPER_LABOR);expect(next.r.details.some(d=>d.item==='도배 인건비')).toBe(false);
});
test.each(PRELIMINARY_POLICY_EXAMPLES)('standard comparison preserves original amounts: $label',sample=>{
 const old=run(sample.inputs),next=run(sample.inputs,base());expect(next.r.directCost).toBe(old.r.directCost);expect(next.groups).toEqual(old.groups);
});
test('an unregistered price cannot silently become zero or the old default',()=>{const p=base();p.prices.FILM_WOOD=null;expect(()=>validatePolicy(p)).toThrow(/미등록/);});
test('large but finite formula output cannot create an unsafe currency amount',()=>{const p=base();p.rules['wallpaper.p20.basic']={value:1000000000};expect(()=>run({sectionWallpaperEnabled:true},p)).toThrow(/허용 범위/);});
test('the database validation manifest matches the server catalog exactly',()=>{const sql=readFileSync('supabase/migrations/20261105000000_preliminary_policy.sql','utf8'),manifest=JSON.parse(sql.match(/SELECT '([^']+)'::jsonb \$manifest\$/)[1]),catalog=policyCatalog();expect(manifest).toEqual({prices:catalog.prices.map(f=>f.key).sort(),parameters:catalog.parameters.map(f=>f.key).sort(),rules:Object.fromEntries(catalog.rules.map(r=>[r.key,Object.keys(r.variables)]))});});
