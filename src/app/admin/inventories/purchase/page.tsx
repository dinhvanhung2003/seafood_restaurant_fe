// src/app/admin/inventories/purchase/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePRList } from "@/hooks/admin/usePurchase";
import { Button } from "@/components/ui/button";
import PurchaseReceiptDetailModal from "@/components/admin/inventories/purchase/modal/PurchaseReceiptDetailModal";
import {
  ReceiptStatus,
  ReceiptStatusColor,
  ReceiptStatusLabel,
} from "@/types/types";

export default function PurchaseListPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data } = usePRList({ page, limit });

  const currentPage = data?.page ?? page;
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  // Tạo dải số trang (tối đa 5 nút) quanh trang hiện tại
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    const start = Math.max(
      1,
      Math.min(currentPage - half, totalPages - maxButtons + 1)
    );
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xl font-semibold">Phiếu nhập hàng</div>
        <Link href="/admin/inventories/purchase/new">
          <Button>+ Nhập hàng</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Mã phiếu</th>
              <th className="px-3 py-2 text-left">Thời gian</th>
              <th className="px-3 py-2 text-left">Nhà cung cấp</th>
              <th className="px-3 py-2 text-right">Trạng thái</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.code}</td>
                <td className="px-3 py-2">{r.receiptDate}</td>
                <td className="px-3 py-2">{r.supplier?.name}</td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      ReceiptStatusColor[r.status as ReceiptStatus]
                    }`}
                  >
                    {ReceiptStatusLabel[r.status as ReceiptStatus] ??
                      "Không xác định"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      setSelectedId(r.id);
                      setOpen(true);
                    }}
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}

            {(!data || (data?.data ?? []).length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          Trước
        </Button>

        {/* Nút số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === currentPage ? "default" : "outline"}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <span className="ml-2 text-sm text-slate-600">
          Trang <b>{currentPage}</b>/<b>{totalPages}</b>
        </span>

        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          Sau
        </Button>
      </div>

      <PurchaseReceiptDetailModal
        open={open}
        onOpenChange={setOpen}
        id={selectedId}
      />
    </div>
  );
}
