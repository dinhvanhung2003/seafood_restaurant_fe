"use client";

import { useState } from "react";
import { RangeSelect, type RangeKey } from "@/components/admin/report/RangeSelect";
import SalesKPI from "@/components/admin/report/SalesKPI";
import SalesSeriesChart from "@/components/admin/report/SaleSeriesChart"; // 👈 sửa tên import
import TopItemsChart from "@/components/admin/report/TopItemsChart";

export default function SalesSection() {
  // 👉 tách 2 state range độc lập
  const [kpiRange, setKpiRange] = useState<RangeKey>("today");
  const [seriesRange, setSeriesRange] = useState<RangeKey>("today");
  const [tab, setTab] = useState<"day" | "hour" | "dow">("day");

  return (
    <div className="space-y-6">
      {/* KPI card */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">KẾT QUẢ BÁN HÀNG</div>
          <RangeSelect value={kpiRange} onChange={setKpiRange} />
        </div>
        <SalesKPI range={kpiRange} />
      </div>

      {/* Chart card */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">DOANH SỐ</div>
          <RangeSelect value={seriesRange} onChange={setSeriesRange} />
        </div>
        <SalesSeriesChart range={seriesRange} tab={tab} onTabChange={setTab} />
      </div>

      {/* Top 10 */}
      <TopItemsChart />
    </div>
  );
}
