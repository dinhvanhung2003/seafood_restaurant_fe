"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

interface Props {
  rows: any[];
  mode: "invoices" | "items";
}

export default function CustomerItemsChart({ rows, mode }: Props) {
  // Build chart data depending on mode
  const data = (rows || [])
    .slice(0, 10)
    .map((r) => ({
      name:
        mode === "items"
          ? r.itemName || r.itemCode || "Món"
          : r.customerName || "Khách lẻ",
      value: Number(
        mode === "items"
          ? r.netRevenue || r.revenue || 0
          : r.revenue || r.netRevenue || 0
      ),
    }))
    .filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <div className="rounded-md border bg-white p-4">
      <div className="font-semibold mb-2">
        Top 10{" "}
        {mode === "items" ? "món theo doanh thu" : "khách hàng theo doanh thu"}
      </div>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 120, right: 16, top: 8, bottom: 8 }}
          >
            <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tickLine={false}
            />
            <Tooltip formatter={(v: number) => v.toLocaleString() + " ₫"} />
            <Bar dataKey="value" fill="#0ea5e9">
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: any) => {
                  const n = Number(v);
                  return Number.isFinite(n) ? n.toLocaleString() + " ₫" : "";
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
