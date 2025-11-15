"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { currency } from "@/utils/money";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ItemTable({ groups }: { groups: any[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Không có dữ liệu
      </div>
    );
  }

  const totalStaff = groups.length;
  const totalRevenue = groups.reduce(
    (sum, g) => sum + (g.totals?.netRevenue || 0),
    0
  );
  const totalQty = groups.reduce((sum, g) => sum + (g.totals?.soldQty || 0), 0);

  return (
    <Card className="overflow-hidden border border-border">
      {/* ---- Header tổng hợp ---- */}
      <div className="bg-blue-50 border-b border-border px-4 py-3">
        <div className="text-lg font-semibold">Người nhận đơn</div>
      </div>

      <div className="bg-amber-50 border-b border-border px-4 py-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        <div className="font-medium">SL Người nhận đơn: {totalStaff}</div>
        <div className="font-medium">Tổng SL: {totalQty}</div>
        <div className="font-semibold text-primary md:text-right">
          Tổng doanh thu: {currency(totalRevenue)}
        </div>
      </div>

      {/* ---- Danh sách nhân viên ---- */}
      <div className="divide-y">
        {groups.map((g) => (
          <div key={g.userId} className="bg-white">
            <button
              onClick={() => setOpen(open === g.userId ? null : g.userId)}
              className="flex w-full justify-between items-center px-4 py-2 hover:bg-muted/40 transition"
            >
              <div className="flex items-center space-x-2 text-primary font-medium">
                {open === g.userId ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>{g.fullName}</span>
              </div>
              <div className="text-right space-x-6 text-sm">
                <span>{g.totals?.soldQty || 0}</span>
                <span className="font-semibold text-primary">
                  {currency(Number(g.totals?.netRevenue || 0))}
                </span>
              </div>
            </button>

            {/* ---- Chi tiết món hàng ---- */}
            {open === g.userId && (
              <div className="bg-muted/20 px-4 py-2 animate-fadeIn">
                <div className="max-h-80 overflow-auto rounded border">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="bg-muted/40 sticky top-0">
                        <TableHead>Tên món</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">Tiền hàng</TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          Giảm giá
                        </TableHead>
                        <TableHead className="text-right">
                          Doanh thu ròng
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.items.map((i: any, idx: number) => (
                        <TableRow
                          key={i.itemCode}
                          className={idx % 2 ? "bg-slate-50" : undefined}
                        >
                          <TableCell>{i.itemName}</TableCell>
                          <TableCell className="text-right">
                            {i.soldQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {currency(Number(i.goodsAmount))}
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            {currency(Number(i.discount))}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {currency(Number(i.netRevenue))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell>Tổng</TableCell>
                        <TableCell className="text-right">
                          {g.totals?.soldQty || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(Number(g.totals?.goodsAmount || 0))}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {currency(Number(g.totals?.discount || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(Number(g.totals?.netRevenue || 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ItemTable;
