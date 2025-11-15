"use client";

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

export default function TopTable({
  rows = [],
  header = {} as any,
}: {
  rows: any[];
  header?: any;
}) {
  return (
    <Card className="p-4">
      <div className="bg-slate-50 border rounded-md p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div>
          <div className="text-[11px] uppercase text-slate-500">Số NCC</div>
          <div className="text-lg font-semibold">
            {header.supplierCount ?? rows.length}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">Tiền hàng</div>
          <div className="text-lg font-semibold text-slate-700">
            {currency(Number(header.purchaseAmount || 0))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">Trả hàng</div>
          <div className="text-lg font-semibold text-rose-600">
            {currency(Number(header.returnAmount || 0))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">Ròng</div>
          <div className="text-lg font-semibold text-emerald-600">
            {currency(Number(header.netAmount || 0))}
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded border">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-right">Tiền hàng</TableHead>
              <TableHead className="text-right">Trả hàng</TableHead>
              <TableHead className="text-right">Ròng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any, idx: number) => (
              <TableRow
                key={r.supplierId}
                className={idx % 2 ? "bg-slate-50" : undefined}
              >
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.code}</div>
                </TableCell>
                <TableCell className="text-right">
                  {currency(Number(r.purchaseAmount || 0))}
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  {currency(Number(r.returnAmount || 0))}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">
                  {currency(Number(r.netAmount || 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
