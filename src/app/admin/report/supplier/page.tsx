"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SupplierFilter from "@/components/admin/report/supplier/SupplierFilter";
import TopChart from "@/components/admin/report/supplier/TopChart";
import ReceiptsTable from "@/components/admin/report/supplier/ReceiptsTable";
import ReturnsTable from "@/components/admin/report/supplier/ReturnsTable";
import { useSupplierReport } from "@/hooks/admin/useSupplierReport";
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

export default function SupplierReportPage() {
  const r = useSupplierReport();

  return (
    <div className="p-6 space-y-6 mx-auto max-w-screen-2xl">
      <Card className="border-muted-foreground/10">
        <CardHeader>
          <CardTitle>Báo cáo nhập – trả hàng theo nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierFilter
            date={r.date}
            setDate={r.setDate}
            mode={r.mode}
            setMode={(m) => {
              r.setMode(m);
              r.fetchReport();
            }}
            supplierQ={r.supplierQ}
            setSupplierQ={r.setSupplierQ}
            loading={r.loading}
            onFetch={r.fetchReport}
          />
          {r.error && (
            <div className="mt-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">
              {r.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI strip (mode specific) */}
      {r.mode === "purchase" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Số NCC
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {r.header?.supplierCount ?? r.groups?.length ?? 0}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              SL phiếu
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {Number((r.header as any)?.receiptCount || 0)}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              SL trả
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {Number((r.header as any)?.returnQty || 0)}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Giá trị nhập thuần
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-600">
              {currency(
                Number(
                  (r.header as any)?.netAfterReturn ||
                    (r.header as any)?.totalAmount ||
                    0
                )
              )}
            </div>
          </UICard>
        </div>
      )}

      {r.mode === "return" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Số NCC
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {r.header?.supplierCount ?? 0}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              SL phiếu trả
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {Number((r.header as any)?.returnCount || 0)}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Tiền hoàn
            </div>
            <div className="mt-1 text-2xl font-semibold text-rose-600">
              {currency(
                Number(
                  (r.header as any)?.returnAmount ||
                    (r.header as any)?.refundAmount ||
                    0
                )
              )}
            </div>
          </UICard>
        </div>
      )}

      {r.mode === "net" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Số NCC
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {r.header?.supplierCount ?? r.topRows?.length ?? 0}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Tiền hàng
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {currency(Number((r.header as any)?.purchaseAmount || 0))}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Trả hàng
            </div>
            <div className="mt-1 text-2xl font-semibold text-rose-600">
              {currency(Number((r.header as any)?.returnAmount || 0))}
            </div>
          </UICard>
          <UICard className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Ròng
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-600">
              {currency(Number((r.header as any)?.netAmount || 0))}
            </div>
          </UICard>
        </div>
      )}

      {r.mode === "purchase" && (
        <TopChart rows={r.topRows} dataKey="purchaseAmount" />
      )}
      {r.mode === "purchase" && (
        <ReceiptsTable
          groups={r.groups}
          header={r.header}
          topRows={r.topRows}
          showSummary={false}
        />
      )}

      {r.mode === "return" && (
        <TopChart rows={r.topRows} dataKey="returnAmount" />
      )}
      {r.mode === "return" && (
        <>
          <ReturnsTable groups={r.groups} header={r.header} />
        </>
      )}

      {r.mode === "net" && <TopChart rows={r.topRows} dataKey="netAmount" />}

      {/* Pagination for paged modes */}
      {r.meta && (r.mode === "purchase" || r.mode === "return") && (
        <Pagination className="py-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!r.meta) return;
                  const prev = Math.max(1, r.meta.page - 1);
                  if (prev !== r.meta.page) r.goPage(prev);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {r.meta.page} / {r.meta.pages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!r.meta) return;
                  const next = Math.min(r.meta.pages, r.meta.page + 1);
                  if (next !== r.meta.page) r.goPage(next);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
