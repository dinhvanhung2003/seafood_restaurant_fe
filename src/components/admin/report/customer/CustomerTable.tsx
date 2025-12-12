"use client";
import React from "react";
import CustomerKPIs from "./CustomerKPIs";
import CustomerInvoicesTable from "./CustomerInvoicesTable";
import CustomerItemsChart from "./CustomerItemsChart";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function CustomerTable({
  rows,
  summary,
  top10Customers,
  meta,
  page,
  setPage,
  loading,
  limit,
}: {
  rows: any[];
  summary?: any;
  top10Customers?: any[];
  meta?: Meta;
  page: number;
  setPage: (p: number) => void;
  loading?: boolean;
  limit?: number;
}) {
  const totalPages = meta?.pages || 1;
  const goPrev = () => setPage(Math.max(1, page - 1));
  const goNext = () => setPage(Math.min(totalPages, page + 1));
  const showPagination =
    (meta?.pages || 0) > 1 ||
    (Array.isArray(rows) && limit ? rows.length >= limit : false);

  return (
    <div className="relative rounded-xl border p-4 space-y-4">
      {/* KPIs */}
      <CustomerKPIs summary={summary} mode="invoices" />

      {/* Table */}
      <CustomerInvoicesTable rows={rows} meta={meta} />

      {/* Pagination directly under table */}
      {showPagination && (
        <div className="flex justify-end">
          <Pagination className="px-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1 && !loading) goPrev();
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {meta?.pages ? `${page} / ${totalPages}` : `Trang ${page}`}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!loading && (meta?.pages ? page < totalPages : true)) {
                      goNext();
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Chart */}
      <CustomerItemsChart
        rows={
          Array.isArray(top10Customers)
            ? top10Customers
            : Array.isArray(rows)
            ? rows
            : []
        }
        mode="invoices"
      />

      {loading && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-4 py-2 rounded-md bg-white shadow-sm border text-sm font-medium text-slate-700 animate-pulse">
            Đang tải…
          </div>
        </div>
      )}
    </div>
  );
}
