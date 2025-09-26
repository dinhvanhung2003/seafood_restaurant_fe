"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { RangeKey } from "./RangeSelect";

type KPI = { revenue: number; ordersDone: number; inService: number; customers: number };

export default function SalesKPI({ range }: { range: RangeKey }) {
  const [kpi, setKpi] = useState<KPI | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get("/report/dashboard/summary", { params: { range } })
      .then((r) => alive && setKpi(r.data))
      .catch(() => alive && setKpi(null));
    return () => {
      alive = false;
    };
  }, [range]);

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-md border p-3">
        <div className="text-slate-500 text-sm">Doanh thu</div>
        <div className="text-xl font-bold">{kpi ? kpi.revenue.toLocaleString() : "—"}</div>
      </div>
      <div className="rounded-md border p-3">
        <div className="text-slate-500 text-sm">Đơn đã xong</div>
        <div className="text-xl font-bold">{kpi ? kpi.ordersDone.toLocaleString() : "—"}</div>
      </div>
      <div className="rounded-md border p-3">
        <div className="text-slate-500 text-sm">Đang phục vụ</div>
        <div className="text-xl font-bold">{kpi ? kpi.inService.toLocaleString() : "—"}</div>
      </div>
    </div>
  );
}
