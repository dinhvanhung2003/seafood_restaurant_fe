"use client";

import React from "react";
import { Card } from "@/components/ui/card";

interface Summary {
  totalInvoices?: number;
  totalCustomers?: number;
  totalItems?: number;
  goodsAmount?: number;
  discountOrder?: number;
  revenue?: number;
}

export default function CustomerKPIs({
  summary,
  mode,
}: {
  summary?: Summary;
  mode: string;
}) {
  // Guard against undefined summary (initial render before data loaded)
  const s = summary || {};
  const items: {
    label: string;
    value: number | undefined;
    isMoney?: boolean;
  }[] = [
    { label: "Số khách", value: s.totalCustomers },
    {
      label: mode === "invoices" ? "Số HĐ" : "Số món",
      value: mode === "invoices" ? s.totalInvoices : s.totalItems,
    },
    { label: "Tiền hàng", value: s.goodsAmount, isMoney: true },
    { label: "Giảm HĐ", value: s.discountOrder, isMoney: true },
    { label: "Doanh thu", value: s.revenue, isMoney: true },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {items.map((i, idx) => (
        <Card
          key={i.label}
          className="px-4 py-3 animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          <div className="text-sm text-muted-foreground">{i.label}</div>
          <div className="text-lg font-semibold mt-1">
            {(i.value || 0).toLocaleString()} {i.isMoney ? "₫" : ""}
          </div>
        </Card>
      ))}
    </div>
  );
}
