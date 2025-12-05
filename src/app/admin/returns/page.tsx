// app/admin/returns/page.tsx
"use client";

import { useState } from "react";
import { useSalesReturns } from "@/hooks/admin/useSalesReturns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SalesReturnDetailModal } from "@/components/cashier/returns/SalesReturnDetailModal";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import type { ReturnableInvoice } from "@/hooks/cashier/useReturnInvoices";
// 🔁 Tái dùng luôn 2 modal của màn thu ngân
import { ReturnInvoicePickerModal } from "@/components/cashier/returns/ReturnInvoicePickerModal";
import { ReturnDetailModal } from "@/components/cashier/returns/ReturnDetailModal";

const PAGE_LIMIT = 20;

const formatCurrency = (v: number | null | undefined) =>
  (Number(v || 0)).toLocaleString("vi-VN");

const formatDateTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminSalesReturnsPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);

  // modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>();

  const queryParams = {
    search: search.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: PAGE_LIMIT,
  };
const [viewId, setViewId] = useState<string | undefined>();
const [viewOpen, setViewOpen] = useState(false);
  const { data, isLoading, refetch, isFetching } = useSalesReturns(queryParams);

  const meta = data?.meta ?? {
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  };

  const rows = data?.data ?? [];

  const handleResetFilter = () => {
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
    refetch();
  };

  const handleOpenCreate = () => {
    setSelectedInvoiceId(undefined);
    setPickerOpen(true);
  };

  const handleInvoicePicked = (invoice: { id: string }) => {
    setSelectedInvoiceId(invoice.id);
    setPickerOpen(false);
    setDetailOpen(true);
  };

  const handleReturnCreated = () => {
    setDetailOpen(false);
    refetch();
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Phiếu trả hàng bán</h1>
          <p className="text-xs text-slate-500">
            Quản lý các phiếu trả hàng và tiền hoàn lại cho khách.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                isFetching && "animate-spin"
              )}
            />
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm phiếu trả hàng
          </Button>
        </div>
      </header>

      {/* Filters + Table */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="mx-auto flex h-full max-w-6xl flex-col rounded-xl bg-white p-4 shadow-sm">
          {/* Filters */}
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tìm kiếm
              </label>
              <Input
                placeholder="Mã phiếu / mã hóa đơn / khách hàng / thu ngân..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-slate-600">
                Từ ngày
              </label>
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-medium text-slate-600">
                Đến ngày
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
              >
                Xóa lọc
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Mã phiếu</th>
                  <th className="px-3 py-2 text-left">Hóa đơn</th>
                  <th className="px-3 py-2 text-left">Khách hàng</th>
                  <th className="px-3 py-2 text-left">Thu ngân</th>
                  <th className="px-3 py-2 text-right">Tiền hàng</th>
                  <th className="px-3 py-2 text-right">Giảm</th>
                  <th className="px-3 py-2 text-right">Hoàn lại</th>
                  <th className="px-3 py-2 text-center">PT hoàn tiền</th>
                  <th className="px-3 py-2 text-left">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-6 text-center text-slate-500"
                    >
                      Đang tải danh sách phiếu trả hàng…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-6 text-center text-slate-500"
                    >
                      Chưa có phiếu trả hàng nào.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                   <tr
      key={r.id}
      className="cursor-pointer border-t text-xs hover:bg-slate-50/70"
      onClick={() => {
        setViewId(r.id);
        setViewOpen(true);
      }}
    >
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {r.returnNumber}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {r.invoiceNumber ?? "—"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ID: {r.invoiceId ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {r.customerName ?? "Khách lẻ"}
                      </td>
                      <td className="px-3 py-2">
                        {r.cashierName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(r.goodsAmount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(r.discountAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                        {formatCurrency(r.refundAmount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {r.refundMethod === "CASH"
                            ? "Tiền mặt"
                            : r.refundMethod === "BANK_TRANSFER"
                            ? "Chuyển khoản"
                            : r.refundMethod === "CARD"
                            ? "Thẻ"
                            : r.refundMethod}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatDateTime(r.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <div>
              Tổng:{" "}
              <span className="font-semibold">{meta.total}</span> phiếu
            </div>
            <div className="flex items-center gap-2">
              <span>
                Trang {meta.page} / {meta.totalPages || 1}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                disabled={meta.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  setPage((p) =>
                    meta.totalPages && p < meta.totalPages
                      ? p + 1
                      : p,
                  )
                }
                disabled={
                  !meta.totalPages || meta.page >= meta.totalPages
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ====== MODALS DÙNG LẠI CỦA THU NGÂN ====== */}

      {/* 1. Modal chọn hóa đơn để tạo phiếu trả */}
    <ReturnInvoicePickerModal
  open={pickerOpen}
  onClose={() => setPickerOpen(false)}
  onSelect={handleInvoicePicked}
/>

      {/* 2. Modal chi tiết phiếu trả (tạo phiếu) */}
      {selectedInvoiceId && (
        <ReturnDetailModal
          invoiceId={selectedInvoiceId}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onSuccess={handleReturnCreated}
        />
      )}
      {viewId && (
  <SalesReturnDetailModal
    id={viewId}
    open={viewOpen}
    onClose={() => setViewOpen(false)}
  />
)}

    </div>
  );
}
