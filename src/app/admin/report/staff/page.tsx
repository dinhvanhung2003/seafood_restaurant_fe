"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReport } from "@/hooks/admin/useReport";
import { ReportFilter } from "@/components/admin/report/staff/filter/ReportFilter";
import RevenueChart from "@/components/admin/report/staff/chart/RevenueChart";
import RevenueTable from "@/components/admin/report/staff/chart/RevenueTable";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import { Card as UICard } from "@/components/ui/card";
import { currency } from "@/utils/money";
import ItemTable from "@/components/admin/report/staff/table/ItemTable";
import { differenceInCalendarDays } from "date-fns";

export default function StaffReportPage() {
  const report = useReport();

  return (
    <div className="p-6 space-y-6 mx-auto max-w-screen-2xl">
      <Card className="border-muted-foreground/10">
        <CardHeader>
          <CardTitle>Báo cáo bán hàng theo nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilter
            date={report.date}
            setDate={report.setDate}
            mode={report.mode}
            setMode={report.setMode}
            onFetch={report.fetchReport} // lọc: auto reset về trang 1
            loading={report.loading}
          />
        </CardContent>
      </Card>

      {report.mode === "revenue" ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Số nhân viên
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {report.summary?.staffCount ?? report.rows?.length ?? 0}
              </div>
            </UICard>
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Doanh thu
              </div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">
                {currency(Number(report.summary?.revenue || 0))}
              </div>
            </UICard>
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Hoàn trả
              </div>
              <div className="mt-1 text-2xl font-semibold text-rose-600">
                {currency(Number(report.summary?.returnValue || 0))}
              </div>
            </UICard>
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Doanh thu ròng
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {currency(Number(report.summary?.netRevenue || 0))}
              </div>
            </UICard>
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Tỷ lệ hoàn trả
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {(() => {
                  const rev = Number(report.summary?.revenue || 0);
                  const ret = Number(report.summary?.returnValue || 0);
                  return rev ? `${((ret / rev) * 100).toFixed(1)}%` : "0%";
                })()}
              </div>
            </UICard>
            <UICard className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                DT/ngày TB
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {(() => {
                  const from = report.date?.from;
                  const to = report.date?.to;
                  const days =
                    from && to
                      ? Math.max(1, differenceInCalendarDays(to, from) + 1)
                      : 1;
                  const net = Number(report.summary?.netRevenue || 0);
                  return currency(net / days);
                })()}
              </div>
            </UICard>
            <UICard className="p-4 md:col-span-3 bg-gradient-to-b from-indigo-50 to-white">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Top nhân viên
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {(() => {
                  const top = [...(report.rows || [])].sort(
                    (a, b) =>
                      Number(b?.netRevenue || 0) - Number(a?.netRevenue || 0)
                  )[0];
                  return top
                    ? `${top.fullName} • ${currency(
                        Number(top.netRevenue || 0)
                      )}`
                    : "-";
                })()}
              </div>
            </UICard>
          </div>

          <RevenueChart data={report.rows} />
          <RevenueTable rows={report.rows} summary={report.summary} />

          {/* Pagination */}
          {report.meta && (
            <Pagination className="py-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!report.meta) return;
                      const prev = Math.max(1, report.meta.page - 1);
                      if (prev !== report.meta.page) report.goPage(prev);
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {report.meta.page} / {report.meta.pages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!report.meta) return;
                      const next = Math.min(
                        report.meta.pages,
                        report.meta.page + 1
                      );
                      if (next !== report.meta.page) report.goPage(next);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <>
          <ItemTable groups={report.groups} />
          {report.meta && (
            <Pagination className="py-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!report.meta) return;
                      const prev = Math.max(1, report.meta.page - 1);
                      if (prev !== report.meta.page) report.goPage(prev);
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {report.meta.page} / {report.meta.pages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!report.meta) return;
                      const next = Math.min(
                        report.meta.pages,
                        report.meta.page + 1
                      );
                      if (next !== report.meta.page) report.goPage(next);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
