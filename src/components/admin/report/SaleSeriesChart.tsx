"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import api from "@/lib/axios";
import type { RangeKey } from "./RangeSelect";

type Point = { label: string; value: number };
type Granularity = "day" | "hour" | "dow";

export default function SalesSeriesChart({
  range,
  tab,
  onTabChange,
}: {
  range: RangeKey;
  tab: Granularity;
  onTabChange: (t: Granularity) => void;
}) {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .get("/report/dashboard/sales", { params: { range, granularity: tab } })
      .then((r) => alive && setPoints(r.data || []))
      .catch(() => alive && setPoints([]));
    return () => {
      alive = false;
    };
  }, [range, tab]);

  return (
    <>
      {/* tab button: cho wrap, không bị tràn ngang */}
      <div className="mb-2 flex flex-wrap gap-2">
        {[
          { k: "day", label: "Theo ngày" },
          { k: "hour", label: "Theo giờ" },
          { k: "dow", label: "Theo thứ" },
        ].map((t) => (
          <button
            key={t.k}
            className={`px-3 py-1.5 rounded-md border text-xs sm:text-sm ${
              tab === (t.k as Granularity)
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700"
            }`}
            onClick={() => onTabChange(t.k as Granularity)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart wrapper */}
      <div className="h-[260px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "day" ? (
            <LineChart
              data={points}
              margin={{ left: 4, right: 4, top: 8, bottom: 8 }}
            >
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0A2B61"        // xanh đậm vừa
                dot={{ r: 3, stroke: "#0A2B61", fill: "#0A2B61" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
       <BarChart
  data={points}
  margin={{ left: 4, right: 4, top: 8, bottom: 8 }}
>
  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
  <YAxis tick={{ fontSize: 10 }} />
  <Tooltip formatter={(v: number) => v.toLocaleString()} />

  {/* MÀU CỘT MỚI */}
  <Bar dataKey="value" fill="#0A2B61" />
</BarChart>

          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}
