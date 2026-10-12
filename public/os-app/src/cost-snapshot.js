export function costSnapshotMap(snapshot) {
  return new Map((snapshot?.items || []).map((item) => [item.itemCode, item]));
}
