"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useClosingReport } from "@/hooks/admin/useClosingReport";
import { ClosingFilter } from "@/components/admin/report/closing/ClosingFilter";
import ClosingTable from "@/components/admin/report/closing/ClosingTable";
import type { PaymentMethod as FilterPaymentMethod } from "@/components/admin/report/closing/ClosingFilter";

export default function ClosingReportPage() {
  const r = useClosingReport();
  React.useEffect(() => {
    r.fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    r.mode,
    r.dateFrom,
    r.dateTo,
    r.paymentMethod,
    r.areaId,
    r.tableId,
    r.page,
    r.limit,
  ]);
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo cuối ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ClosingFilter
            dateFrom={r.dateFrom}
            setDateFrom={r.setDateFrom}
            dateTo={r.dateTo}
            setDateTo={r.setDateTo}
            mode={r.mode}
            setMode={r.setMode}
            paymentMethod={r.paymentMethod as FilterPaymentMethod}
            setPaymentMethod={(v) => r.setPaymentMethod(v as any)}
            areaId={r.areaId}
            setAreaId={r.setAreaId}
            tableId={r.tableId}
            setTableId={r.setTableId}
            fetchReport={r.fetchReport}
            loading={r.loading}
          />
        </CardContent>
      </Card>

      <ClosingTable
        mode={r.mode}
        rows={r.rows as any}
        salesSummary={r.salesSummary as any}
        cancelSummary={r.cancelSummary as any}
        cashbookSummary={r.cashbookSummary as any}
        meta={r.meta as any}
        page={r.page}
        setPage={r.setPage}
        limit={r.limit}
        setLimit={r.setLimit}
      />
    </div>
  );
}
