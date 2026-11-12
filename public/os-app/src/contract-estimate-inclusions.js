export function estimateContractInclusions(inputs, fallback = {}) {
  const included = (key, section, otherwise) => typeof inputs?.[key] === "boolean"
    ? inputs[key] && inputs[section] !== false
    : otherwise === true;
  const consent = included("demolitionConsentEnabled", "sectionDemolitionEnabled", fallback.consentIncluded);
  return {
    adminOfficeIncluded: typeof inputs?.demolitionConsentEnabled === "boolean" ? consent : fallback.adminOfficeIncluded === true,
    consentIncluded: consent,
    permitIncluded: included("demolitionPermitEnabled", "sectionDemolitionEnabled", fallback.permitIncluded),
    protectionIncluded: included("interiorProtectionEnabled", "sectionFinishEnabled", fallback.protectionIncluded),
  };
}
