"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function CustomerItemsFlatTable({ rows }: { rows: any[] }) {
  const data = Array.isArray(rows)
    ? rows
    : Array.isArray((rows as any)?.rows)
    ? (rows as any).rows
    : [];
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-blue-50">
        <div className="font-semibold">Món đã bán</div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>#</TableHead>
              <TableHead>Món</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">Tiền hàng</TableHead>
              <TableHead className="text-right">Giảm HĐ</TableHead>
              <TableHead className="text-right">Giảm nhóm</TableHead>
              <TableHead className="text-right">Giảm món</TableHead>
              <TableHead className="text-right">Phân bổ giảm</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r: any, idx: number) => (
              <TableRow key={r.itemCode || r.id || idx}>
                <TableCell className="text-xs text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell>{r.itemName || "-"}</TableCell>
                <TableCell>{r.categoryName || "-"}</TableCell>
                <TableCell className="text-right">
                  {Number(r.soldQty || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.goodsAmount || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.discountOrder || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.discountCategory || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right">
                  {Number(r.discountItem || 0).toLocaleString()}₫
                </TableCell>
                <TableCell className="text-right">
                  {Number(
                    r.allocatedDiscount || r.discount || 0
                  ).toLocaleString()}
                  ₫
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {Number(r.netRevenue || r.revenue || 0).toLocaleString()}₫
                </TableCell>
              </TableRow>
            ))}
            {!data.length && (
              <TableRow>
                <TableCell
                  colSpan={10}
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
