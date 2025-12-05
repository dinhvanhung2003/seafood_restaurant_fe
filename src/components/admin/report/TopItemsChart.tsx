"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import axios from "@/lib/axios";
import { RangeKey, RangeSelect } from "./RangeSelect";

type Row = { name: string; value: number };

export default function TopItemsChart() {
  const [range, setRange] = useState<RangeKey>("last7");
  const [rows, setRows] = useState<Row[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // xác định mobile / desktop để chỉnh width của YAxis
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    axios
      .get("/report/dashboard/top-items", {
        params: { range, by: "qty", limit: 10 },
      })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [range]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="font-semibold text-sm sm:text-base">
          TOP 10 HÀNG HÓA BÁN CHẠY
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      {/* Chart part */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
  data={rows}
  layout="vertical"
  margin={{ left: isMobile ? 40 : 80, right: 16, top: 8, bottom: 8 }}
>
  <XAxis type="number" tick={{ fontSize: 10 }} />
  <YAxis
    type="category"
    dataKey="name"
    width={isMobile ? 120 : 200}
    tickLine={false}
    tick={{ fontSize: 10 }}
  />
  <Tooltip formatter={(v: number) => v.toLocaleString()} />

  <Bar dataKey="value" fill="#284369ff" radius={[0, 4, 4, 0]}>
  <LabelList
    dataKey="value"
    position="right"
    fill="#0A2B61"
    formatter={(label: any) => {
      const n = Number(label);
      return Number.isFinite(n) ? n.toLocaleString() : label ?? "";
    }}
  />
</Bar>

</BarChart>

        </ResponsiveContainer>
      </div>
    </div>
  );
}
