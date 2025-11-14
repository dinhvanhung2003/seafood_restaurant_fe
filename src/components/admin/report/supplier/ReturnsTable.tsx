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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReturnItem {
  itemId?: string;
  itemName?: string;
  qty?: number;
  baseQty?: number;
  uomName?: string;
  uomCode?: string;
  baseUomName?: string;
}

interface ReturnVoucher {
  returnId: string;
  returnCode: string;
  time: string;
  refundAmount: number;
  items: ReturnItem[];
  returnQtyBase?: number;
}

interface GroupTotals {
  returnQtyBase: number;
  returnAmount: number;
  returnCount: number;
}

interface Group {
  supplierId: string;
  supplierName: string;
  totals: GroupTotals;
  returns: ReturnVoucher[];
}

export default function ReturnsTable({
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
    const sum = (current.returns ?? []).reduce(
      (acc, r) => {
        acc.returnQtyBase += Number(r.returnQtyBase || 0);
        acc.returnAmount += Number(r.refundAmount || 0);
        acc.returnCount += 1;
        return acc;
      },
      { returnQtyBase: 0, returnAmount: 0, returnCount: 0 }
    );
    return { ...sum, ...(current.totals || {}) };
  }, [current]);

  return (
    <Card className="p-4 space-y-4">
      {/* Supplier list overview */}
      <div className="overflow-auto border rounded-md bg-white">
        <Table className="min-w-[800px] text-sm">
          <TableHeader>
            <TableRow className="bg-muted/40 sticky top-0">
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-right">Tiền hoàn</TableHead>
              <TableHead className="text-right">SL phiếu trả</TableHead>
              <TableHead className="text-right">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g, idx) => (
              <TableRow
                key={g.supplierId}
                className={idx % 2 ? "bg-slate-50" : undefined}
              >
                <TableCell className="font-medium text-primary">
                  {g.supplierName}
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  {currency(Number(g.totals?.returnAmount || 0))}
                </TableCell>
                <TableCell className="text-right">
                  {Number(g.totals?.returnCount || 0)}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-slate-50"
                    onClick={() => setOpenId(g.supplierId)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Xem chi tiết</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-medium">
              <TableCell>Tổng</TableCell>
              <TableCell className="text-right text-rose-600">
                {currency(Number(header.returnAmount || 0))}
              </TableCell>
              <TableCell className="text-right">
                {Number(header.returnCount || 0)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="w-[96vw] sm:max-w-[92vw] md:max-w-[1000px] lg:max-w-[1200px] xl:max-w-[1400px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-base md:text-lg">
              Chi tiết trả hàng - {current?.supplierName}
            </DialogTitle>
            {current && totals && (
              <div className="mt-2 text-xs text-slate-600">
                <span>Số phiếu trả: </span>
                <span className="font-medium">
                  {Number(totals.returnCount || 0)}
                </span>
                <span className="mx-2">•</span>
                <span>Tiền hoàn: </span>
                <span className="font-medium text-rose-600">
                  {currency(Number(totals.returnAmount || 0))}
                </span>
              </div>
            )}
          </DialogHeader>
          <div className="px-2 pb-4">
            <div className="max-h-[65vh] overflow-auto rounded-md border bg-white shadow-sm">
              <Table className="min-w-[980px] text-sm">
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0 z-10">
                    <TableHead>Mã phiếu trả</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Tiền hoàn</TableHead>
                    <TableHead className="text-right">SL mặt hàng</TableHead>
                    <TableHead>Chi tiết mặt hàng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current?.returns?.map((r, idx) => (
                    <TableRow
                      key={r.returnId}
                      className={
                        (idx % 2 ? "bg-slate-50" : "") +
                        " hover:bg-muted/20 transition-colors"
                      }
                    >
                      <TableCell className="font-medium">
                        {r.returnCode}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500">{r.time}</div>
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {currency(Number(r.refundAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {(r.items || []).length}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 max-w-[700px]">
                          {(r.items || []).map((it, i) => {
                            const qty = it.qty ?? it.baseQty ?? 0;
                            const uom =
                              it.uomName ?? it.uomCode ?? it.baseUomName ?? "";
                            return (
                              <Badge
                                key={it.itemId || i}
                                className="whitespace-nowrap font-normal bg-slate-100 text-slate-700 hover:bg-slate-200"
                              >
                                <span className="truncate max-w-[160px] inline-block align-middle">
                                  {it.itemName}
                                </span>
                                <span className="ml-1 text-slate-500">
                                  • {Number(qty).toLocaleString()} {uom}
                                </span>
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {current && totals && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>Tổng</TableCell>
                      <TableCell />
                      <TableCell className="text-right text-rose-600">
                        {currency(Number(totals.returnAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(totals.returnCount || 0)}
                      </TableCell>
                      <TableCell />
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
