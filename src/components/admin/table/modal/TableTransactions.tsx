// components/table/TableTransactions.tsx
"use client";

import { useMemo, useState } from "react";
import { useTableTransactions } from "@/hooks/admin/useTable";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

function fmtMoney(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  return n.toLocaleString("vi-VN");
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN");
}

export default function TableTransactions({ tableId }: { tableId: string }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isFetching, error } = useTableTransactions(tableId, { page, limit, status });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { total: 0, page, limit, pages: 1 };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select value={status ?? "ALL"} onValueChange={(v) => { setPage(1); setStatus(v === "ALL" ? undefined : v); }}>
            <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="VOID">Huỷ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-32">
          <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(Number(v)); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}/trang</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[18%]">Mã hóa đơn</TableHead>
              <TableHead className="w-[18%]">Thời gian</TableHead>
              <TableHead className="w-[26%]">Người tạo</TableHead>
              <TableHead className="w-[26%]">Người nhận đơn</TableHead>
              <TableHead className="w-[12%]" align="right">Tổng cộng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-red-600">
                  {(error as any)?.message ?? "Có lỗi xảy ra"}
                </TableCell>
              </TableRow>
            ) : isFetching && !data ? (
              // skeleton đơn giản
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="animate-pulse h-6 bg-slate-100" />
                    <TableCell className="animate-pulse h-6 bg-slate-100" />
                    <TableCell className="animate-pulse h-6 bg-slate-100" />
                    <TableCell className="animate-pulse h-6 bg-slate-100" />
                    <TableCell className="animate-pulse h-6 bg-slate-100" />
                  </TableRow>
                ))}
              </>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.invoiceId}>
                  <TableCell>
                    <a href={`/invoices/${r.invoiceId}`} className="text-blue-600 hover:underline">
                      {r.invoiceNumber}
                    </a>
                    <div className="mt-1">
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{fmtDate(r.createdAt)}</TableCell>
                  <TableCell>{r.cashier?.name ?? r.cashier?.id ?? "—"}</TableCell>
                  <TableCell>{r.orderedBy?.name ?? r.orderedBy?.id ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmtMoney(r.totalAmount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Tổng {meta.total} hóa đơn · Trang {meta.page}/{meta.pages || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Trước
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(meta.pages || 1, p + 1))}
            disabled={page >= (meta.pages || 1) || isFetching}
          >
            Sau <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
