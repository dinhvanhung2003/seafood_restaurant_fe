"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  LabelList,
  CartesianGrid,
} from "recharts";
import { currency } from "@/utils/money";

type Staff = {
  userId: string;
  fullName: string;
  revenue: number; // gross
  netRevenue: number; // after returns
};

function toMillions(v: number) {
  if (!v) return "0";
  const m = Math.round(Number(v) / 1_000_000);
  return `${m} tr`;
}

function TooltipContent({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const net = payload.find((p: any) => p.dataKey === "netRevenue");
  const ret = payload.find((p: any) => p.dataKey === "returnAmount");
  const name = (net || ret)?.payload?.fullName;
  return (
    <div className="rounded border bg-white p-2 text-xs shadow-sm">
      <div className="font-medium mb-1">{name}</div>
      {net && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span>Doanh thu ròng:</span>
          <span className="font-semibold">
            {currency(Number(net.value || 0))}
          </span>
        </div>
      )}
      {ret && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Hoàn trả:</span>
          <span className="font-semibold">
            {currency(Number(ret.value || 0))}
          </span>
        </div>
      )}
    </div>
  );
}

export function RevenueChart({ data }: { data: Staff[] }) {
  // Chuẩn hóa + Top 10 theo netRevenue
  const top10 = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    arr.sort((a, b) => Number(b?.netRevenue || 0) - Number(a?.netRevenue || 0));
    return arr.slice(0, 10).map((r) => ({
      ...r,
      returnAmount: Math.max(
        0,
        Number(r.revenue || 0) - Number(r.netRevenue || 0)
      ),
    }));
  }, [data]);

  // Ticks nice theo bội 3 triệu dựa trên netRevenue (đúng với “đã trừ trả hàng”)
  const xTicks = useMemo(() => {
    const maxVal = top10.reduce(
      (m, r) => Math.max(m, Number(r?.netRevenue || 0)),
      0
    );
    const step = 3_000_000;
    const niceMax = Math.max(step, Math.ceil(maxVal / step) * step);
    const count = Math.round(niceMax / step);
    return Array.from({ length: count + 1 }, (_, i) => i * step);
  }, [top10]);

  return (
    <div className="rounded-lg border bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
      <div className="text-center text-sm text-slate-600 mb-2">
        Top 10 người bán nhiều nhất (theo <b>Doanh thu ròng</b>)
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top10}
            layout="vertical"
            margin={{ left: 16, right: 24, top: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              ticks={xTicks}
              domain={[0, xTicks[xTicks.length - 1] || 0]}
              tickFormatter={toMillions}
              tick={{ fontSize: 12, fill: "#475569" }}
            />
            <YAxis
              type="category"
              dataKey="fullName"
              width={180}
              tick={{ fontSize: 12, fill: "#334155" }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 12 }}
            />
            <RTooltip content={<TooltipContent />} />

            {/* Net (xanh) */}
            <Bar
              dataKey="netRevenue"
              name="Doanh thu ròng"
              fill="#2563eb"
              radius={[0, 6, 6, 0]}
            >
              <LabelList
                dataKey="netRevenue"
                position="right"
                formatter={(v: any) =>
                  typeof v === "number" ? toMillions(v) : v
                }
                style={{ fontSize: 12 }}
              />
            </Bar>

            {/* Return (đỏ) */}
            <Bar
              dataKey="returnAmount"
              name="Hoàn trả"
              fill="#ef4444"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;
