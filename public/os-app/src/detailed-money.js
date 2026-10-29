// Decimal quantity (up to six places), integer won; round once at the line boundary.
export function detailedLineAmount(quantity, unitPrice) {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  const scaled = BigInt(Math.round(quantity * 1000000));
  return Number((scaled * BigInt(Math.round(unitPrice)) + 500000n) / 1000000n);
}
