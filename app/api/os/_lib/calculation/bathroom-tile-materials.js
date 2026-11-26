export const BATHROOM_TILE_MATERIAL_PRICES = [
  ['BATH_TILE_CERAFIX', '욕실·타일', '세라픽스', '개', 17000, ''],
  ['BATH_TILE_DRYFIX', '욕실·타일', '드라이픽스', '포', 5500, ''],
  ['BATH_TILE_GROUT_MATERIAL', '욕실·타일', '줄눈재', '포', 5500, ''],
];

export const BATHROOM_TILE_COVERAGES = [
  ['bathTileCerafixCoverage', '욕실·타일', '세라픽스 1개당 시공면적', '평', 1.5, ''],
  ['bathTileDryfixCoverage', '욕실·타일', '드라이픽스 1포당 시공면적', '평', 1, ''],
];

const defaults = entries => Object.fromEntries(entries.map(([key, , , , value]) => [key, value]));
const materialDefaults = defaults(BATHROOM_TILE_MATERIAL_PRICES);
const coverageDefaults = defaults(BATHROOM_TILE_COVERAGES);

export function bathroomTileMaterialPolicy(config) {
  const resolve = (values, baseline) => Object.fromEntries(
    Object.entries(baseline).map(([key, value]) => [key, values && Object.hasOwn(values, key) ? values[key] : value]),
  );
  return {
    prices: resolve(config?.prices, materialDefaults),
    parameters: resolve(config?.parameters, coverageDefaults),
  };
}

export function withBathroomTileMaterialPolicy(config, source = config) {
  const material = bathroomTileMaterialPolicy(source);
  return {
    ...config,
    prices: { ...config.prices, ...material.prices },
    parameters: { ...config.parameters, ...material.parameters },
  };
}
