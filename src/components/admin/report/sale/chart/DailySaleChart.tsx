"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function DailySalesChart({ data }: { data: any[] }) {
  const chartData = data.flatMap((g) => g.items);
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toLocaleString() : v)} />
          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Doanh thu" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DailySalesChart;
