"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

export function DailySalesTable({ groups }: { groups: any[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!groups || groups.length === 0)
    return <div className="text-center text-sm text-muted-foreground">Không có dữ liệu</div>;

  return (
    <Card className="overflow-hidden border">
      {groups.map((g) => (
        <div key={g.label} className="border-b last:border-0">
          <button
            onClick={() => setOpen(open === g.label ? null : g.label)}
            className="w-full flex justify-between items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 transition"
          >
            <div className="flex items-center space-x-2 font-semibold text-primary">
              {open === g.label ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span>{g.label}</span>
            </div>
            <span className="text-sm font-semibold text-primary">
              {g.items?.reduce((sum: number, i: any) => sum + Number(i.revenue || 0), 0).toLocaleString()}₫
            </span>
          </button>

          {open === g.label && (
            <div className="bg-white px-4 py-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Giờ</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead className="text-right">Số món</TableHead>
                    <TableHead className="text-right">Tiền hàng</TableHead>
                    <TableHead className="text-right">Giảm giá</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Thu khác</TableHead>
                    <TableHead className="text-right">Đã thanh toán</TableHead>
                    <TableHead className="text-right">Còn nợ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.items.map((i: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{i.time}</TableCell>
                      <TableCell>{i.receiverName}</TableCell>
                      <TableCell>{i.place}</TableCell>
                      <TableCell className="text-right">{i.itemsCount}</TableCell>
                      <TableCell className="text-right">{Number(i.goodsAmount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(i.invoiceDiscount).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {Number(i.revenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{Number(i.otherIncome).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(i.paid).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(i.debt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

export default DailySalesTable;
