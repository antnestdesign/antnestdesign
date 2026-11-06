import { supabaseFetch } from '../server';
import { defaultPolicy, validatePolicy } from './preliminary-policy.js';

export async function publishedPreliminaryPolicy(defaultRates,masters) {
  const state=await supabaseFetch('/rest/v1/preliminary_policy_state?singleton=eq.true&select=current_version');
  const version=state?.[0]?.current_version;
  let config;
  if(version){const rows=await supabaseFetch(`/rest/v1/preliminary_policy_versions?version=eq.${Number(version)}&select=config`);config=rows[0]?.config;if(!config)throw Error('게시된 산정 기준을 확인할 수 없습니다.');}
  else config=defaultPolicy(defaultRates,masters);
  config=structuredClone(config);
  // Existing cost management remains authoritative for its own published master rows.
  for(const row of masters)if(Object.hasOwn(config.prices,row.item_code))config.prices[row.item_code]=Number(row.cost_price);
  return {version:version||0,engine:'preliminary-20261105',config:validatePolicy(config)};
}
