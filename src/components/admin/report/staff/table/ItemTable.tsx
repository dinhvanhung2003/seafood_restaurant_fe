'use client';

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ItemTable({ groups }: { groups: any[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!groups || groups.length === 0) {
    return <div className="text-center text-sm text-muted-foreground">Không có dữ liệu</div>;
  }

  const totalStaff = groups.length;
  const totalRevenue = groups.reduce((sum, g) => sum + (g.totals?.netRevenue || 0), 0);
  const totalQty = groups.reduce((sum, g) => sum + (g.totals?.soldQty || 0), 0);

  return (
    <Card className="overflow-hidden border border-border">
      {/* ---- Header tổng hợp ---- */}
      <div className="bg-blue-50 border-b border-border px-4 py-3">
        <div className="text-lg font-semibold">Người nhận đơn</div>
      </div>

      <div className="bg-amber-50 border-b border-border px-4 py-2 flex justify-between">
        <span className="font-medium">SL Người nhận đơn: {totalStaff}</span>
        <span className="font-medium text-primary">
          Tổng doanh thu: {totalRevenue.toLocaleString()}₫
        </span>
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
                  {Number(g.totals?.netRevenue || 0).toLocaleString()}₫
                </span>
              </div>
            </button>

            {/* ---- Chi tiết món hàng ---- */}
            {open === g.userId && (
              <div className="bg-muted/20 px-4 py-2 animate-fadeIn">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Tên món</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Tiền hàng</TableHead>
                      <TableHead className="text-right">Giảm giá</TableHead>
                      <TableHead className="text-right">Doanh thu ròng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.items.map((i: any) => (
                      <TableRow key={i.itemCode}>
                        <TableCell>{i.itemName}</TableCell>
                        <TableCell className="text-right">{i.soldQty}</TableCell>
                        <TableCell className="text-right">{Number(i.goodsAmount).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(i.discount).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {Number(i.netRevenue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ItemTable;
