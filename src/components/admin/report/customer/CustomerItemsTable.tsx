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

interface ItemRow {
  customerName?: string;
  customerPhone?: string;
  itemName?: string;
  quantity?: number;
  goodsAmount?: number;
  discount?: number;
  revenue?: number;
}

export default function CustomerItemsTable({ groups }: { groups: any }) {
  const data: any[] = Array.isArray(groups)
    ? groups
    : Array.isArray(groups?.groups)
    ? groups.groups
    : Array.isArray(groups?.data)
    ? groups.data
    : [];
  return (
    <div className="space-y-4">
      {data.map((g: any, idx: number) => {
        const rowsRaw: any = g.rows || [];
        const rows: ItemRow[] = Array.isArray(rowsRaw) ? rowsRaw : [];
        const totalGoods = rows.reduce(
          (s, r) => s + Number(r.goodsAmount || 0),
          0
        );
        const totalDiscount = rows.reduce(
          (s, r) => s + Number(r.discount || 0),
          0
        );
        const totalRevenue = rows.reduce(
          (s, r) => s + Number(r.revenue || 0),
          0
        );
        return (
          <Card key={idx} className="overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-blue-50">
              <div className="font-semibold">
                {g.customerName || "Khách lẻ"}{" "}
                {g.customerPhone ? `(${g.customerPhone})` : ""}
              </div>
              <div className="text-sm">
                Doanh thu:{" "}
                <span className="font-semibold text-primary">
                  {totalRevenue.toLocaleString()}₫
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Món</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Tiền hàng</TableHead>
                    <TableHead className="text-right">Giảm</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{r.itemName || "-"}</TableCell>
                      <TableCell className="text-right">
                        {r.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(r.goodsAmount || 0).toLocaleString()}₫
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(r.discount || 0).toLocaleString()}₫
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {Number(r.revenue || 0).toLocaleString()}₫
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-6"
                      >
                        Không có món
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-2 border-t text-xs flex gap-6">
              <div>
                Tiền hàng:{" "}
                <span className="font-medium">
                  {totalGoods.toLocaleString()}₫
                </span>
              </div>
              <div>
                Giảm giá:{" "}
                <span className="font-medium">
                  {totalDiscount.toLocaleString()}₫
                </span>
              </div>
              <div>
                Doanh thu:{" "}
                <span className="font-semibold text-primary">
                  {totalRevenue.toLocaleString()}₫
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
