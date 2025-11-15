"use client";

import React, { useMemo, useState } from "react";
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
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Group {
  supplierId: string;
  supplierName: string;
  totals: {
    returnQty?: number;
    returnBaseQty?: number;
    refundAmount: number;
    itemCount: number;
  };
  items: any[];
}

export default function ReturnsItemsTable({
  groups = [],
  header = {} as any,
}: {
  groups: Group[];
  header?: any;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const current = useMemo(
    () => groups.find((g) => g.supplierId === openId),
    [groups, openId]
  );
  const totals = useMemo(() => {
    if (!current) return null;
    const sum = (current.items ?? []).reduce(
      (acc: any, r: any) => {
        acc.returnQty += Number(r.returnQty || 0);
        acc.returnBaseQty += Number(r.returnBaseQty || 0);
        acc.refundAmount += Number(r.refundAmount || 0);
        acc.itemCount += 1;
        return acc;
      },
      { returnQty: 0, returnBaseQty: 0, refundAmount: 0, itemCount: 0 }
    );
    return { ...sum, ...(current.totals || {}) };
  }, [current]);

  return (
    <Card className="p-4 space-y-4">
      <div className="bg-slate-50 border rounded-md p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase text-slate-500">Số NCC</div>
          <div className="text-lg font-semibold">
            {header.supplierCount ?? groups.length}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">SL trả</div>
          <div className="text-lg font-semibold">
            {header.returnQty ?? header.returnBaseQty ?? 0}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">Tiền hoàn</div>
          <div className="text-lg font-semibold text-rose-600">
            {currency(Number(header.refundAmount || 0))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500">
            SL mặt hàng
          </div>
          <div className="text-lg font-semibold">{header.itemCount ?? 0}</div>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.supplierId} className="border rounded-md bg-white">
            <div className="flex w-full justify-between items-center px-4 py-2 text-sm font-medium">
              <div className="text-primary">{g.supplierName}</div>
              <div className="flex gap-6 text-xs md:text-sm items-center">
                <span>{g.totals.itemCount} mặt hàng</span>
                <span>{g.totals.returnQty ?? g.totals.returnBaseQty} SL</span>
                <span className="font-semibold text-rose-600">
                  {currency(g.totals.refundAmount)}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-slate-50"
                  onClick={() => setOpenId(g.supplierId)}
                >
                  <Eye className="h-4 w-4" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="w-[96vw] sm:max-w-[92vw] md:max-w-[1000px] lg:max-w-[1200px] xl:max-w-[1400px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-base md:text-lg">
              Chi tiết mặt hàng trả - {current?.supplierName}
            </DialogTitle>
          </DialogHeader>
          <div className="px-2 pb-4">
            <div className="max-h-[65vh] overflow-auto rounded-md border bg-white shadow-sm">
              <Table className="min-w-[900px] text-sm">
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0 z-10">
                    <TableHead className="whitespace-nowrap">
                      Mặt hàng
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      SL trả
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Hoàn tiền
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current?.items?.map((r: any, idx: number) => (
                    <TableRow
                      key={r.itemId}
                      className={
                        (idx % 2 ? "bg-slate-50" : "") +
                        " hover:bg-muted/20 transition-colors"
                      }
                    >
                      <TableCell className="font-medium">
                        {r.itemName}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.returnQty ?? r.returnBaseQty}
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {currency(r.refundAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {current && totals && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>Tổng</TableCell>
                      <TableCell className="text-right">
                        {totals.returnQty ?? totals.returnBaseQty}
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {currency(totals.refundAmount)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
