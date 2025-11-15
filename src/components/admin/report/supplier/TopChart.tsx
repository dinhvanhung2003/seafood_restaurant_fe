"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import { currency } from "@/utils/money";

function formatName(name: string) {
  if (!name) return "";
  return name.length > 24 ? name.slice(0, 22) + "…" : name;
}

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="rounded border bg-white p-2 text-xs shadow">
      <div className="font-medium mb-1">{d.name}</div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded bg-sky-500" /> Tiền hàng:{" "}
        <b>{currency(Number(d.purchaseAmount || 0))}</b>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded bg-rose-500" /> Trả hàng:{" "}
        <b>{currency(Number(d.returnAmount || 0))}</b>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded bg-emerald-600" /> Ròng:{" "}
        <b>{currency(Number(d.netAmount || 0))}</b>
      </div>
    </div>
  );
};

export default function TopChart({
  rows = [] as any[],
  dataKey = "netAmount" as "purchaseAmount" | "returnAmount" | "netAmount",
}: {
  rows: any[];
  dataKey?: "purchaseAmount" | "returnAmount" | "netAmount";
}) {
  // Làm sạch dữ liệu: chỉ giữ NCC có ít nhất một giá trị khác 0
  const cleaned = [...rows]
    .filter((r) =>
      [r?.purchaseAmount, r?.returnAmount, r?.netAmount].some(
        (v) => Number(v || 0) !== 0
      )
    )
    .sort((a, b) => Number(b.netAmount || 0) - Number(a.netAmount || 0));

  // Giới hạn tối đa hiển thị (tránh quá dài gây khó đọc) – vẫn có thể tăng nếu cần
  const MAX_ROWS = 30;
  const shown = cleaned.slice(0, MAX_ROWS);
  const hiddenCount = cleaned.length - shown.length;

  // Chiều cao động theo số dòng để chữ không chồng lên nhau khi ít dòng, co giãn khi nhiều
  const rowHeight = 40; // px mỗi NCC
  const baseExtra = 80; // margin + trục
  const dynamicHeight = Math.min(
    680,
    Math.max(280, shown.length * rowHeight + baseExtra)
  );

  // Font chữ trục Y thu nhỏ khi quá nhiều dòng
  const yTickFontSize = shown.length > 18 ? (shown.length > 25 ? 10 : 11) : 12;

  const data = shown.map((r) => ({ ...r, shortName: formatName(r.name) }));

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-slate-500">
          {cleaned.length === 0 && <span>Không có dữ liệu để hiển thị.</span>}
          {cleaned.length > 0 && hiddenCount > 0 && (
            <span>
              Hiển thị top {shown.length}/{cleaned.length} nhà cung cấp (ẩn{" "}
              {hiddenCount}).
            </span>
          )}
        </div>
      </div>
      <div style={{ height: dynamicHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id="netG" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tickFormatter={(v) => currency(Number(v)).replace(" ₫", "")}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fill: "#475569", fontSize: yTickFontSize }}
              width={180}
            />
            <Tooltip content={<TooltipContent />} />
            {/* Show selected metric as primary bar */}
            <Bar dataKey={dataKey} fill="url(#netG)" radius={4}>
              <LabelList
                dataKey={dataKey}
                position="right"
                formatter={(label: any) =>
                  currency(Number(label || 0)).replace(" ₫", "")
                }
                style={{ fill: "#475569", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
