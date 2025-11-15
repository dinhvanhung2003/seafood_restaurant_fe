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
    goodsAmount: number;
    invoiceDiscount: number;
    netGoods: number;
    shippingFee: number;
    totalAmount: number;
    receiptCount: number;
  };
  rows: any[];
}

export default function ReceiptsTable({
  groups = [],
  header = {} as any,
  topRows = [] as any[],
  showSummary = true,
}: {
  groups: Group[];
  header?: any;
  topRows?: any[];
  showSummary?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const current = useMemo(
    () => groups.find((g) => g.supplierId === openId),
    [groups, openId]
  );
  const totals = useMemo(() => {
    if (!current) return null;

    // Cộng từ rows làm fallback
    const fromRows = (current.rows ?? []).reduce(
      (acc: any, r: any) => {
        acc.goodsAmount += Number(r.goodsAmount || 0);
        acc.invoiceDiscount += Number(r.invoiceDiscount || 0);
        acc.netGoods += Number(r.netGoods || 0);
        acc.shippingFee += Number(r.shippingFee || 0);
        acc.totalAmount += Number(r.totalAmount || 0);
        acc.receiptCount += 1;
        return acc;
      },
      {
        goodsAmount: 0,
        invoiceDiscount: 0,
        netGoods: 0,
        shippingFee: 0,
        totalAmount: 0,
        receiptCount: 0,
        returnQty: 0,
        returnAmount: 0,
        netAfterReturn: 0,
      }
    );
    const merged = { ...fromRows, ...(current.totals || {}) };
    if (!merged.netAfterReturn) {
      merged.netAfterReturn =
        Number(merged.totalAmount || 0) - Number(merged.returnAmount || 0);
    }
    return merged;
  }, [current]);

  const hasReceipts = groups && groups.length > 0;

  return (
    <Card className="p-4 space-y-4">
      {/* Optional summary strip (hidden in purchase mode to avoid duplication) */}
      {showSummary && (
        <div className="bg-slate-50 border rounded-md p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Số NCC
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {header.supplierCount ?? (hasReceipts ? groups.length : 0)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              SL phiếu
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {header.receiptCount ?? 0}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Giá trị nhập
            </div>
            <div className="text-xl font-semibold">
              {currency(Number(header.goodsAmount || 0))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Giảm đầu phiếu
            </div>
            <div className="text-xl font-semibold text-rose-600">
              {currency(Number(header.invoiceDiscount || 0))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Tiền hàng sau giảm
            </div>
            <div className="text-xl font-semibold">
              {currency(Number(header.netGoods || 0))}
            </div>
          </div>
          <div>
            <div className="text-xl font-semibold">
              {Number(header.returnQty || 0)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Tiền hoàn
            </div>
            <div className="text-xl font-semibold text-rose-600">
              {currency(Number(header.returnAmount || 0))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Giá trị nhập thuần
            </div>
            <div className="text-xl font-semibold text-emerald-600">
              {currency(
                Number(header.netAfterReturn || header.totalAmount || 0)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supplier table with dialog trigger (style gần giống ảnh tham khảo) */}
      <div className="space-y-2">
        {hasReceipts ? (
          <div className="overflow-auto border rounded-md bg-white">
            <Table className="min-w-[1400px] text-sm table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/40 sticky top-0">
                  <TableHead className="w-[240px]">Nhà cung cấp</TableHead>
                  <TableHead className="w-[90px] text-right">
                    SL phiếu
                  </TableHead>
                  <TableHead className="w-[140px] text-right">
                    Giá trị nhập
                  </TableHead>
                  <TableHead className="w-[140px] text-right">
                    Giảm đầu phiếu
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    Tiền hàng sau giảm
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Phí ship
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    Giá trị nhập thuần
                  </TableHead>
                  <TableHead className="w-[140px] text-right">&nbsp;</TableHead>
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
                    <TableCell className="text-right">
                      {g.totals.receiptCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {currency(g.totals.goodsAmount)}
                    </TableCell>
                    <TableCell className="text-right text-rose-600">
                      {currency(g.totals.invoiceDiscount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currency(g.totals.netGoods)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currency(g.totals.shippingFee)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {currency(
                        (g as any).totals?.netAfterReturn ??
                          g.totals.totalAmount -
                            Number((g as any).totals?.returnAmount || 0)
                      )}
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
                {/* Totals row */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell>Tổng</TableCell>
                  <TableCell className="text-right">
                    {header.receiptCount ??
                      groups.reduce(
                        (s, g: any) => s + (g.totals?.receiptCount || 0),
                        0
                      )}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency(Number(header.goodsAmount || 0))}
                  </TableCell>
                  <TableCell className="text-right text-rose-600">
                    {currency(Number(header.invoiceDiscount || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency(Number(header.netGoods || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency(Number(header.shippingFee || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(header.returnQty || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency(
                      Number(header.netAfterReturn || header.totalAmount || 0)
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md bg-white">
            <div className="px-4 py-3 text-sm text-slate-600">
              Hôm nay không có phiếu nhập. Dưới đây là số ròng (đã trừ trả hàng)
              theo nhà cung cấp.
            </div>
            <div className="px-2 pb-3">
              <div className="overflow-auto border rounded-md">
                <Table className="min-w-[520px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/40 sticky top-0">
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead className="text-right">Ròng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRows
                      ?.filter((r: any) => Number(r.netAmount || 0) !== 0)
                      .map((r: any, idx: number) => (
                        <TableRow
                          key={r.id || r.supplierId || r.name + idx}
                          className={idx % 2 ? "bg-slate-50" : undefined}
                        >
                          <TableCell className="font-medium">
                            {r.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {currency(Number(r.netAmount || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        {/* Override shadcn's default max-w with responsive breakpoints for a much wider dialog */}
        <DialogContent className="w-[96vw] sm:max-w-[92vw] md:max-w-[1000px] lg:max-w-[1200px] xl:max-w-[1400px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="text-base md:text-lg">
              Chi tiết phiếu - {current?.supplierName}
            </DialogTitle>
          </DialogHeader>

          {/* Small summary bar inside dialog for quick glance */}
          {current && totals && (
            <div className="px-6 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-sm">
              <div>
                <div className="text-[11px] uppercase text-slate-500">
                  SL phiếu
                </div>
                <div className="font-semibold">{totals.receiptCount}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">
                  Tiền hàng
                </div>
                <div className="font-semibold">
                  {currency(totals.goodsAmount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">
                  Giảm giá
                </div>
                <div className="font-semibold text-rose-600">
                  {currency(totals.invoiceDiscount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Ship</div>
                <div className="font-semibold">
                  {currency(totals.shippingFee)}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase text-slate-500">
                  Giá trị nhập thuần
                </div>
                <div className="font-semibold text-emerald-600">
                  {currency(totals.netAfterReturn)}
                </div>
              </div>
            </div>
          )}

          <div className="px-2 pb-4">
            <div className="max-h-[65vh] overflow-auto rounded-md border bg-white shadow-sm">
              <Table className="min-w-[1200px] text-sm">
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0 z-10">
                    <TableHead className="whitespace-nowrap">
                      Mã phiếu
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Ngày</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Tiền hàng
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Giảm giá
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Tiền hàng sau giảm
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Phí ship
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Tổng
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Người tạo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current?.rows?.map((r: any, idx: number) => (
                    <TableRow
                      key={r.receiptId}
                      className={
                        (idx % 2 ? "bg-slate-50" : "") +
                        " hover:bg-muted/20 transition-colors"
                      }
                    >
                      <TableCell className="font-medium">
                        {r.receiptCode}
                      </TableCell>
                      <TableCell>
                        <div>{r.receiptDate?.substring(0, 10)}</div>
                        <div className="text-xs text-slate-500">{r.time}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(r.goodsAmount)}
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {currency(r.invoiceDiscount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(r.netGoods)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(r.shippingFee)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {currency(r.totalAmount)}
                      </TableCell>
                      <TableCell>{r.creatorName}</TableCell>
                    </TableRow>
                  ))}
                  {current && totals && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell colSpan={2}>Tổng</TableCell>
                      <TableCell className="text-right">
                        {currency(totals.goodsAmount)}
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {currency(totals.invoiceDiscount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(totals.netGoods)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(totals.shippingFee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(totals.totalAmount)}
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
