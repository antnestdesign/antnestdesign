import { CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { contractFixture } from "../fixtures/contract-cost-view-cases.js";

export const documentCases = [
  { name: "quote-small", type: "QUOTE", count: 3 },
  { name: "quote-normal", type: "QUOTE", count: 55 },
  { name: "quote-large", type: "QUOTE", count: 200, long: true },
  { name: "contract-full", type: "CONTRACT", count: 3 },
  { name: "contract-long", type: "CONTRACT", count: 3, long: true },
  { name: "spec-small", type: "SPEC", count: 3 },
  { name: "spec-large", type: "SPEC", count: 120, long: true },
  { name: "all-normal", type: "ALL", count: 55 },
  { name: "estimate-small", type: "ESTIMATE", count: 3 },
];

export function documentFixture(entry) {
  const fixture = contractFixture({ generated: true }, CONTRACT_FIXED_TERM_LINES);
  const snapshot = fixture.preview.snapshot;
  const project = entry.long ? "합성 프로젝트 - 긴 공사명 ".repeat(12) : "합성 프로젝트 / 문서 출력 검증";
  const groups = [];
  for (let index = 0; index < entry.count; index++) {
    const groupIndex = Math.floor(index / 20);
    groups[groupIndex] ||= { label: `합성 공정 ${groupIndex + 1}`, items: [], total: 0 };
    const amount = 100000 + index * 1000;
    groups[groupIndex].items.push({ name: `Q${String(index).padStart(4, "0")} ${entry.long ? "긴 품목명 및 규격 설명 ".repeat(10) : "합성 품목 1식"} QE${String(index).padStart(4, "0")}`, amount, amountText: `${amount.toLocaleString("ko-KR")}원` });
    groups[groupIndex].total += amount;
    groups[groupIndex].totalText = `${groups[groupIndex].total.toLocaleString("ko-KR")}원`;
  }
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const quote = { projectName: project, areaPyeong: 33, savedAt: "2026-01-01T00:00:00Z", groups, total, totalText: `${total.toLocaleString("ko-KR")}원` };
  Object.assign(snapshot.contract_info, { project_name: project, total_amount: total, site_address: entry.long ? "합성 지역 합성 현장 주소 ".repeat(15) : "합성 지역 합성 현장 101호" });
  Object.assign(snapshot.estimate_snapshot, { project_name: project, total_price: total, customer_quote: quote });
  snapshot.parties_info.customer.name = entry.long ? "합성 고객명 ".repeat(12) : "합성 고객";
  snapshot.spec_snapshot = Array.from({ length: entry.count }, (_, index) => ({ work_category: `합성 공정 ${Math.floor(index / 20) + 1}`, item_name: `S${String(index).padStart(4, "0")} ${entry.long ? "합성 품목명 ".repeat(4) : "합성 품목"}`, quantity: 1.5, unit: "식", selected_grade: "합성 표준", specification: entry.long ? "긴 표준사양 및 시공방법 설명 ".repeat(8) : "합성 표준사양", changed_specification: `${entry.long ? "긴 변경사양 및 현장 비고 ".repeat(8) : "변경 없음"} SE${String(index).padStart(4, "0")}` }));
  const generated = fixture.preview.documents[0].content_json.generated_sections;
  Object.assign(generated.contract_info, snapshot.contract_info);
  generated.parties.customer.name = snapshot.parties_info.customer.name;
  generated.parties.customer.address = entry.long ? "합성 고객 주소 ".repeat(15) : "합성 고객 주소";
  generated.payment_schedule = [
    { label: "계약금", ratio: 10, amount: total * .1, due_basis: "계약 체결 시" },
    { label: "1차 중도금", ratio: 40, amount: total * .4, due_basis: entry.long ? "착공일 3일 전까지 / 합성 긴 지급조건 ".repeat(16) : "착공일 3일 전까지" },
    { label: "2차 중도금", ratio: 40, amount: total * .4, due_basis: "목공공사 착수일까지" },
    { label: "잔금", ratio: 10, amount: total * .1, due_basis: "준공확인 후 목적물 인도 전" },
  ];
  if (entry.name === "contract-long") generated.fixed_term_lines[5] += " 합성 긴 조항 본문입니다.".repeat(150);
  // Sentinel values must never leak from snapshots into customer documents.
  Object.assign(snapshot, { costTotal: 987654321, internalSummary: { secret: "PRIVATE_MARGIN_SENTINEL" }, source_hash: "PRIVATE_HASH_SENTINEL", created_by: "PRIVATE_ACTOR_SENTINEL" });
  return { snapshot, documents: fixture.preview.documents, quote };
}
