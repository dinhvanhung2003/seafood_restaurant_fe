"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
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
      <div className="mb-2 flex gap-2">
        {[
          { k: "day", label: "Theo ngày" },
          { k: "hour", label: "Theo giờ" },
          { k: "dow", label: "Theo thứ" },
        ].map((t) => (
          <button
            key={t.k}
            className={`px-3 py-1.5 rounded-md border text-sm ${tab === (t.k as Granularity) ? "bg-slate-900 text-white" : "bg-white"}`}
            onClick={() => onTabChange(t.k as Granularity)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "day" ? (
            <LineChart data={points} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Line type="monotone" dataKey="value" dot />
            </LineChart>
          ) : (
            <BarChart data={points} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}
