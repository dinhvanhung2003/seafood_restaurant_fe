'use client';

import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export function RevenueTable({ rows, summary }: { rows: any[]; summary?: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead className="text-right">Doanh thu</TableHead>
            <TableHead className="text-right">Hoàn trả</TableHead>
            <TableHead className="text-right">Doanh thu ròng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.userId}>
              <TableCell>{r.fullName}</TableCell>
              <TableCell className="text-right">{r.revenue.toLocaleString()}</TableCell>
              <TableCell className="text-right">{r.returnValue.toLocaleString()}</TableCell>
              <TableCell className="text-right font-semibold">{r.netRevenue.toLocaleString()}</TableCell>
            </TableRow>
          ))}

          {summary && (
            <TableRow className="font-semibold bg-muted/40">
              <TableCell>Tổng cộng</TableCell>
              <TableCell className="text-right">{Number(summary?.revenue || 0).toLocaleString()}</TableCell>
              <TableCell className="text-right">{Number(summary?.returnValue || 0).toLocaleString()}</TableCell>
              <TableCell className="text-right">{Number(summary?.netRevenue || 0).toLocaleString()}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default RevenueTable;
