// src/app/admin/inventories/purchase/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePRList } from "@/hooks/admin/usePurchase";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import PurchaseReceiptDetailModal from "@/components/admin/inventories/purchase/modal/PurchaseReceiptDetailModal";
import {
  ReceiptStatus,
  ReceiptStatusColor,
  ReceiptStatusLabel,
} from "@/types/types";

export default function PurchaseListPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  // Lấy dữ liệu + trạng thái tải
  const { data, isFetching } = usePRList({ page, limit });

  // Chuẩn hoá dữ liệu trả về
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  // Dải số trang có dấu "..."
  const pages = useMemo(() => {
    const last = totalPages;
    const current = page;
    const siblings = 1; // số nút sát hai bên trang hiện tại

    if (last <= 5) {
      return Array.from({ length: last }, (_, i) => i + 1) as (number | "...")[];
    }

    const arr: (number | "...")[] = [1];
    const start = Math.max(2, current - siblings);
    const end = Math.min(last - 1, current + siblings);

    if (start > 2) arr.push("...");
    for (let p = start; p <= end; p++) arr.push(p);
    if (end < last - 1) arr.push("...");
    arr.push(last);

    return arr;
  }, [page, totalPages]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-4 space-y-3">
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
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
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
                    {ReceiptStatusLabel[r.status as ReceiptStatus] ?? "Không xác định"}
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

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  {isFetching ? "Đang tải..." : "Không có dữ liệu"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination shadcn/ui + thông tin tổng */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Trang {page}/{totalPages} • Tổng {total}
          {isFetching && <span className="ml-2 italic text-slate-400">Đang tải…</span>}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (canPrev) setPage((p) => p - 1);
                }}
                className={!canPrev ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {pages.map((p, i) =>
              p === "..." ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p as number);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (canNext) setPage((p) => p + 1);
                }}
                className={!canNext ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <PurchaseReceiptDetailModal open={open} onOpenChange={setOpen} id={selectedId} />
    </div>
  );
}
