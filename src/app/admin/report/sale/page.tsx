"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDailySales } from "@/hooks/admin/useDailySale";
import { ReportFilter } from "@/components/admin/report/sale/filter/ReportFilter";

import DailySalesChart from "@/components/admin/report/sale/chart/DailySaleChart";
import DailySalesTable from "@/components/admin/report/sale/table/DailySaleTable";

export default function DailySalesPage() {
  const report = useDailySales();

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo bán hàng hằng ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilter
            date={report.date}
            setDate={report.setDate}
            channel={report.channel}
            setChannel={report.setChannel}
            paymentMethod={report.paymentMethod}
            setPaymentMethod={report.setPaymentMethod}
            fetchReport={report.fetchReport}
            loading={report.loading}
          />
        </CardContent>
      </Card>

      <DailySalesChart data={report.data} />
      <DailySalesTable groups={report.data} />
    </div>
  );
}
