import type { NumMaybeEmpty, DiscountType, Line } from "../types/types";

export const asNum = (v: NumMaybeEmpty | undefined) =>
  v === "" || v == null ? 0 : Number(v);
export const currency = (n: number) => n.toLocaleString("vi-VN");

export const lineTotal = (l: Line) => {
  const gross = asNum(l.quantity) * asNum(l.unitPrice);
  const disc =
    l.discountType === "PERCENT"
      ? Math.max(0, Math.min(100, asNum(l.discountValue))) * 0.01 * gross
      : asNum(l.discountValue);
  return Math.max(0, gross - disc);
};

export const applyGlobalDiscount = (
  subTotal: number,
  type: DiscountType,
  value: NumMaybeEmpty
) => {
  const gDisc =
    type === "PERCENT"
      ? Math.max(0, Math.min(100, asNum(value))) * 0.01 * subTotal
      : // for AMOUNT clamp between 0 and subTotal to avoid negative/over-discount
        Math.max(0, Math.min(subTotal, asNum(value)));

  return { gDisc, after: Math.max(0, subTotal - gDisc) };
};
