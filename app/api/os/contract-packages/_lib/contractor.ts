export const contractCompany = {
  company_name: "주식회사 앤트네스트디자인",
  business_no: "149-85-03105",
  representative: "이민영",
  address: "인천광역시 서구 중봉대로612번길 10-20, 506호(청라동, 청라프라자)",
  phone: "032-321-6722",
} as const;

export function contractAddress(customerAddress: unknown, siteAddress: unknown) {
  return [customerAddress, siteAddress].find(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  )?.trim() ?? "";
}
