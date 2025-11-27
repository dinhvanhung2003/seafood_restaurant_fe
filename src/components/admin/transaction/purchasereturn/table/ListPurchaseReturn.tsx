// src/components/admin/transaction/purchasereturn/PurchaseReturnTable.tsx
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  usePurchaseReturns,
  PurchaseReturnStatus,
} from "@/hooks/admin/usePurchaseReturns";
import PurchaseReturnDetailModal from "@/components/admin/transaction/purchasereturn/modal/PurchaseReturnDetailModal";
import CreatePurchaseReturnModal from "@/components/admin/transaction/purchasereturn/modal/CreatePurchaseReturnModal";

function currency(n: number) {
  return (n ?? 0).toLocaleString("vi-VN");
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

export default function PurchaseReturnTable({
  page,
  limit,
  onPageChange,
  supplierId,
  status,
}: {
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  supplierId?: string;
  status?: PurchaseReturnStatus | "";
}) {
  const { data, isFetching, isError, error, refetch } = usePurchaseReturns({
    page,
    limit,
    supplierId,
    status,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);

  const rows = data?.data ?? [];
  const meta = data?.meta ?? { page, limit, pages: 1, total: 0 };

  const handleEditDraft = (id: string) => {
    setDetailOpen(false);
    setEditId(id);
    setEditOpen(true);
  };

  const handleSuccess = () => {
    setEditOpen(false);
    setEditId(undefined);
    refetch();
  };

  const statusBadge = useMemo(
    () => (s: PurchaseReturnStatus) => {
      switch (s) {
        case "POSTED":
          return (
            <Badge className="bg-blue-600 hover:bg-blue-600">Đã ghi nhận</Badge>
          );
        case "REFUNDED":
          return (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              Đã hoàn tiền
            </Badge>
          );
        case "CANCELLED":
          return (
            <Badge className="bg-rose-600 hover:bg-rose-600">Đã hủy</Badge>
          );
        case "DRAFT":
        default:
          return <Badge variant="secondary">Nháp</Badge>;
      }
    },
    []
  );

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-base font-semibold">Danh sách phiếu trả hàng</div>
        <Button
          size="icon"
          variant="outline"
          className="ml-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Mã phiếu</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-right w-[120px]">Tổng hàng</TableHead>
              {/* Bỏ cột Giảm nếu không gian hẹp, hoặc giữ nếu cần */}
              {/* <TableHead className="text-right w-[100px]">Giảm</TableHead> */}
              <TableHead className="text-right w-[140px]">
                Hoàn/Ghi có
              </TableHead>
              <TableHead className="text-right w-[120px]">Đã trả</TableHead>
              {/* CỘT MỚI: CÒN NỢ */}
              <TableHead className="text-right w-[120px] font-bold text-red-600">
                Còn nợ
              </TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="w-[150px]">Tạo lúc</TableHead>
              <TableHead className="w-[80px] text-right">Xem</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={9} className="text-red-600">
                  {(error as any)?.message ?? "Không tải được dữ liệu."}
                </TableCell>
              </TableRow>
            )}

            {isFetching && rows.length === 0
              ? Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((r) => {
                  // Tính nợ
                  const debt = Math.max(0, r.refundAmount - r.paidAmount);
                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50">
                      <TableCell className="font-semibold">{r.code}</TableCell>
                      <TableCell
                        title={r.supplier?.name}
                        className="max-w-[200px] truncate"
                      >
                        {r.supplier?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(r.totalGoods)}
                      </TableCell>
                      {/* <TableCell className="text-right">{currency(r.discount)}</TableCell> */}
                      <TableCell className="text-right font-medium">
                        {currency(r.refundAmount)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {currency(r.paidAmount)}
                      </TableCell>

                      {/* HIỂN THỊ NỢ */}
                      <TableCell className="text-right font-bold text-red-600">
                        {debt > 0 ? currency(debt) : "-"}
                      </TableCell>

                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {shortDate(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailOpen(true);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

            {rows.length === 0 && !isFetching && !isError && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-slate-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableCaption className="pt-4">
            {/* Pagination Controls ... (Giữ nguyên) */}
            <div className="flex items-center justify-between">
              <div>
                Trang <b>{meta.page}</b> / <b>{meta.pages}</b> — Tổng{" "}
                <b>{meta.total}</b> phiếu
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onPageChange(Math.max(1, meta.page - 1))}
                  disabled={meta.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    onPageChange(Math.min(meta.pages || 1, meta.page + 1))
                  }
                  disabled={meta.page >= (meta.pages || 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TableCaption>
        </Table>
      </div>

      <PurchaseReturnDetailModal
        id={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditDraft}
      />

      <CreatePurchaseReturnModal
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditId(undefined);
        }}
        editId={editId}
        onCreated={handleSuccess}
      />
    </div>
  );
}
