"use client";

import { useState } from "react";
import { RangeSelect, type RangeKey } from "@/components/admin/report/RangeSelect";
import SalesKPI from "@/components/admin/report/SalesKPI";
import SalesSeriesChart from "@/components/admin/report/SaleSeriesChart"; 
import TopItemsChart from "@/components/admin/report/TopItemsChart";

export default function SalesSection() {
  const [seriesRange, setSeriesRange] = useState<RangeKey>("today");
  const [tab, setTab] = useState<"day" | "hour" | "dow">("day");

  return (
    <div className="space-y-6 w-full overflow-hidden">
      
      {/* KPI card */}
      <div className="rounded-lg border bg-white p-4">
        <SalesKPI />
      </div>

      {/* Chart card */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="font-semibold">DOANH SỐ</div>
          <RangeSelect value={seriesRange} onChange={setSeriesRange} />
        </div>

        <div className="w-full">
          <SalesSeriesChart range={seriesRange} tab={tab} onTabChange={setTab} />
        </div>
      </div>

      {/* Top Items */}
      <TopItemsChart />
    </div>
  );
}
