export function isEstimateInputExcluded(id, excludedInputById) {
  return Boolean(excludedInputById[id]);
}

export function canonicalInputValues(inputs = {}, excludedInputById) {
  return JSON.stringify(Object.keys(inputs)
    .sort()
    .reduce((acc, key) => {
      if (!isEstimateInputExcluded(key, excludedInputById)) acc[key] = inputs[key];
      return acc;
    }, {}));
}
