'use client';

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReport } from "@/hooks/admin/useReport";
import { ReportFilter } from "@/components/admin/report/staff/filter/ReportFilter";
import RevenueChart from "@/components/admin/report/staff/chart/RevenueChart";
import RevenueTable from "@/components/admin/report/staff/chart/RevenueTable";
import ItemTable from "@/components/admin/report/staff/table/ItemTable";

export default function StaffReportPage() {
  const report = useReport();

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo bán hàng theo nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilter
            date={report.date}
            setDate={report.setDate}
            channel={report.channel}
            setChannel={report.setChannel}
            mode={report.mode}
            setMode={report.setMode}
            onFetch={report.fetchReport}   // ✅ Đúng prop name
            loading={report.loading}
          />
        </CardContent>
      </Card>

      {report.mode === "revenue" ? (
        <>
          <RevenueChart data={report.rows} />
          {/* <RevenueTable rows={report.rows} summary={report.summary?.revenue} /> */}
        </>
      ) : (
        <ItemTable groups={report.groups} />
      )}
    </div>
  );
}
