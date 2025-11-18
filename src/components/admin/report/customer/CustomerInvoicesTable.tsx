"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default function CustomerInvoicesTable({
  rows,
  meta,
}: {
  rows: any;
  meta?: { page?: number; limit?: number };
}) {
  const data: any[] = Array.isArray(rows)
    ? rows
    : Array.isArray(rows?.rows)
    ? rows.rows
    : Array.isArray(rows?.data)
    ? rows.data
    : [];
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-blue-50">
        <div className="font-semibold">Giao dịch theo hóa đơn</div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>#</TableHead>
              <TableHead>Mã HĐ</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Tiền hàng</TableHead>
              <TableHead className="text-right">Giảm HĐ</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r: any, idx: number) => (
              <TableRow
                key={
                  r.invoiceId ||
                  r.id ||
                  r.code ||
                  `${r.customerId || "row"}-${idx}`
                }
              >
                <TableCell className="text-xs text-muted-foreground">
                  {(meta?.page
                    ? (meta.page - 1) * (meta?.limit || data.length)
                    : 0) +
                    idx +
                    1}
                </TableCell>
                <TableCell>{r.invoiceNumber || "-"}</TableCell>
                <TableCell>{r.customerName || "Khách lẻ"}</TableCell>
                <TableCell>
                  {r.occurredAt ? new Date(r.occurredAt).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.goodsAmount || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.invoiceDiscount || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {Number(r.netRevenue || 0).toLocaleString()}₫
                </TableCell>
              </TableRow>
            ))}
            {!data.length && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
