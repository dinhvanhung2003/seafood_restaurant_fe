"use client";
import { currency } from "@/utils/purchase";

export default function TotalsBar({ subTotal, grandTotal }: { subTotal: number; grandTotal: number }) {
  return (
    <div className="text-sm">
      <div>Tổng tiền hàng: <b>{currency(subTotal)}</b></div>
      <div>Cần trả NCC: <b>{currency(grandTotal)}</b></div>
    </div>
  );
}
