// src/components/cashier/returns/ReturnInvoicePickerModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReturnInvoices, ReturnableInvoice } from "@/hooks/cashier/useReturnInvoices";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 10;

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (invoice: ReturnableInvoice) => void;
};

export function ReturnInvoicePickerModal({
  open,
  onClose,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useReturnInvoices({
    search: search.trim() || undefined,
    from: undefined,
    to: undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? page;
  const totalPages = Math.max(
    1,
    Math.ceil(total / (data?.limit ?? PAGE_LIMIT)),
  );

  const handlePick = (inv: ReturnableInvoice) => {
    onSelect(inv);
  };

  const handleReset = () => {
    setSearch("");
    setPage(1);
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
   <DialogContent
  className="
    w-[95vw]
    max-w-[1500px] sm:max-w-[1500px]
    max-h-[85vh]
    p-0
  "
>



        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            Chọn hóa đơn trả hàng
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[calc(85vh-64px)] flex-col gap-3 overflow-hidden p-6 text-sm">
          {/* Filter + actions */}
          <div className="mb-2 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tìm kiếm
              </label>
              <Input
                placeholder="Mã hóa đơn / tên KH / tên bàn..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Xóa lọc
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <ChevronRight
                  className={cn("h-4 w-4 rotate-90", isFetching && "animate-spin")}
                />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-lg border">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Mã hóa đơn</th>
                  <th className="px-3 py-2 text-left">Phòng/bàn</th>
                  <th className="px-3 py-2 text-left">Ngày tạo</th>
                  <th className="px-3 py-2 text-left">Khách hàng</th>
                  <th className="px-3 py-2 text-right">Tổng cộng</th>
                  <th className="px-3 py-2 w-[90px]" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-slate-500"
                    >
                      Đang tải danh sách hóa đơn…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-slate-500"
                    >
                      Không tìm thấy hóa đơn phù hợp.
                    </td>
                  </tr>
                ) : (
                  rows.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t hover:bg-slate-50 cursor-pointer"
                      onDoubleClick={() => handlePick(inv)}
                    >
                      <td className="px-3 py-2 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-3 py-2">
                        {inv.tableName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {new Date(inv.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2">
                        {inv.customerName ?? "Khách lẻ"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {inv.finalAmount.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePick(inv);
                          }}
                        >
                          Chọn
                        </Button>
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
              <span className="font-semibold">
                {total}
              </span>{" "}
              hóa đơn
            </div>
            <div className="flex items-center gap-2">
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  setPage((p) =>
                    p < totalPages ? p + 1 : p,
                  )
                }
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
