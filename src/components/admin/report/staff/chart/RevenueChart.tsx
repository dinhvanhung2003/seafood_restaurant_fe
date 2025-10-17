'use client';

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function RevenueChart({ data }: { data: any[] }) {
  // data expected: [{ fullName, netRevenue, revenue, ... }, ...]
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="fullName" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toLocaleString() : v)} />
          <Bar dataKey="netRevenue" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Doanh thu ròng" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
