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
    purchaseQty: number;
    goodsAmount: number;
    headerDiscount: number;
    netGoods: number;
    returnQty: number;
    refundAmount: number;
    netAmount: number;
    itemCount: number;
    // Optional fields when coming from purchase mode merge
    returnAmount?: number; // alias for refund in purchase mode
    netAfterReturn?: number; // alias for netAmount in purchase mode
    invoiceDiscount?: number; // purchase mode receipts
    totalAmount?: number; // purchase mode total voucher amount
  };
  items: any[];
}

export default function ItemsTable({
  groups = [],
  header = {} as any,
}: {
  groups: Group[];
  header?: any;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"all" | "purchase" | "return">(
    "all"
  );

  const current = useMemo(
    () => groups.find((g) => g.supplierId === openId),
    [groups, openId]
  );
  const totals = useMemo(() => {
    if (!current) return null;
    const sum = (current.items ?? []).reduce(
      (acc: any, r: any) => {
        acc.purchaseQty += Number(r.purchaseQty || 0);
        acc.goodsAmount += Number(r.goodsAmount || 0);
        acc.headerDiscount += Number(r.headerDiscount || 0);
        acc.netGoods += Number(r.netGoods || 0);
        acc.returnQty += Number(r.returnQty || 0);
        acc.refundAmount += Number(r.refundAmount || 0);
        acc.netAmount += Number(r.netAmount || 0);
        acc.itemCount += 1;
        return acc;
      },
      {
        purchaseQty: 0,
        goodsAmount: 0,
        headerDiscount: 0,
        netGoods: 0,
        returnQty: 0,
        refundAmount: 0,
        netAmount: 0,
        itemCount: 0,
      }
    );
    return { ...sum, ...(current.totals || {}) };
  }, [current]);

  return (
    <Card className="p-4 space-y-4">
      {/* KPI header separated into Purchase / Return / Net subsections */}
      <div className="bg-slate-50 border rounded-md p-3 flex flex-col gap-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div>
            <div className="text-[11px] uppercase text-slate-500">Số NCC</div>
            <div className="text-lg font-semibold">
              {header.supplierCount ?? groups.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">
              SL mặt hàng
            </div>
            <div className="text-lg font-semibold">{header.itemCount ?? 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">SL mua</div>
            <div className="text-lg font-semibold">
              {header.purchaseQty ?? 0}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">
              Tiền hàng
            </div>
            <div className="text-lg font-semibold">
              {currency(Number(header.goodsAmount || 0))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">
              Giảm đầu phiếu
            </div>
            <div className="text-lg font-semibold text-rose-600">
              {currency(Number(header.headerDiscount || 0))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">Sau giảm</div>
            <div className="text-lg font-semibold">
              {currency(Number(header.netGoods || 0))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t">
          <div>
            <div className="text-[11px] uppercase text-slate-500">SL trả</div>
            <div className="text-lg font-semibold">{header.returnQty ?? 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">
              Hoàn tiền
            </div>
            <div className="text-lg font-semibold text-rose-600">
              {currency(
                Number(header.refundAmount || header.returnAmount || 0)
              )}
            </div>
          </div>
          <div className="col-span-2 lg:col-span-4 flex flex-col justify-center">
            <div className="text-[11px] uppercase text-slate-500">
              Ròng (sau trả)
            </div>
            <div className="text-xl font-semibold text-emerald-600">
              {currency(
                Number(
                  (header.netAmount ?? header.netAfterReturn) ||
                    Number(header.netGoods || 0) -
                      Number(header.refundAmount || header.returnAmount || 0)
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.supplierId} className="border rounded-md bg-white">
            <div className="flex w-full justify-between items-center px-4 py-2 text-sm font-medium">
              <div
                className="text-primary truncate max-w-[280px]"
                title={g.supplierName}
              >
                {g.supplierName}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] md:text-xs items-center">
                <span className="font-semibold text-slate-700">
                  {g.totals.purchaseQty} SL mua
                </span>
                <span>{currency(g.totals.goodsAmount)}</span>
                <span className="text-rose-600">
                  {currency(g.totals.headerDiscount)}
                </span>
                <span>{currency(g.totals.netGoods)}</span>
                <span>{g.totals.returnQty} SL trả</span>
                <span className="text-rose-600">
                  {currency(g.totals.refundAmount ?? g.totals.returnAmount)}
                </span>
                <span className="font-semibold text-emerald-600">
                  {currency(g.totals.netAmount ?? g.totals.netAfterReturn)}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-slate-50 text-xs"
                  onClick={() => setOpenId(g.supplierId)}
                >
                  <Eye className="h-4 w-4" />
                  <span>Chi tiết</span>
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
              Chi tiết mặt hàng - {current?.supplierName}
            </DialogTitle>
          </DialogHeader>
          {current && totals && (
            <div className="px-6 pt-4 pb-3 flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    SL mặt hàng
                  </div>
                  <div className="font-semibold">{totals.itemCount}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    SL mua
                  </div>
                  <div className="font-semibold">{totals.purchaseQty}</div>
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
                    Giảm đầu phiếu
                  </div>
                  <div className="font-semibold text-rose-600">
                    {currency(totals.headerDiscount)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    Sau giảm
                  </div>
                  <div className="font-semibold">
                    {currency(totals.netGoods)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    SL trả
                  </div>
                  <div className="font-semibold">{totals.returnQty}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    Hoàn tiền
                  </div>
                  <div className="font-semibold text-rose-600">
                    {currency(totals.refundAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-500">
                    Ròng
                  </div>
                  <div className="font-semibold text-emerald-600">
                    {currency(totals.netAmount)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDetailTab("all")}
                  className={`px-3 py-1 rounded-md border text-xs ${
                    detailTab === "all"
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  Tổng hợp
                </button>
                <button
                  onClick={() => setDetailTab("purchase")}
                  className={`px-3 py-1 rounded-md border text-xs ${
                    detailTab === "purchase"
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  Nhập hàng
                </button>
                <button
                  onClick={() => setDetailTab("return")}
                  className={`px-3 py-1 rounded-md border text-xs ${
                    detailTab === "return"
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  Trả hàng
                </button>
              </div>
            </div>
          )}
          <div className="px-2 pb-4">
            <div className="max-h-[65vh] overflow-auto rounded-md border bg-white shadow-sm">
              {detailTab === "all" && (
                <Table className="min-w-[1200px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted sticky top-0 z-10">
                      <TableHead className="whitespace-nowrap">
                        Mặt hàng
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        SL mua
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Tiền hàng
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Giảm đầu phiếu
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Sau giảm
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        SL trả
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Hoàn tiền
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Ròng
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
                          {r.purchaseQty}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(r.goodsAmount)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(r.headerDiscount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(r.netGoods)}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.returnQty}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(r.refundAmount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {currency(r.netAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {current && totals && (
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell>Tổng</TableCell>
                        <TableCell className="text-right">
                          {totals.purchaseQty}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.goodsAmount)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(totals.headerDiscount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.netGoods)}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.returnQty}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(totals.refundAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.netAmount)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {detailTab === "purchase" && (
                <Table className="min-w-[900px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted sticky top-0 z-10">
                      <TableHead>Mặt hàng</TableHead>
                      <TableHead className="text-right">SL mua</TableHead>
                      <TableHead className="text-right">Tiền hàng</TableHead>
                      <TableHead className="text-right">
                        Giảm đầu phiếu
                      </TableHead>
                      <TableHead className="text-right">Sau giảm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current?.items
                      ?.filter(
                        (r: any) => r.goodsAmount > 0 || r.purchaseQty > 0
                      )
                      .map((r: any, idx: number) => (
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
                            {r.purchaseQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {currency(r.goodsAmount)}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            {currency(r.headerDiscount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {currency(r.netGoods)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {current && totals && (
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell>Tổng</TableCell>
                        <TableCell className="text-right">
                          {totals.purchaseQty}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.goodsAmount)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(totals.headerDiscount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.netGoods)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {detailTab === "return" && (
                <Table className="min-w-[700px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted sticky top-0 z-10">
                      <TableHead>Mặt hàng</TableHead>
                      <TableHead className="text-right">SL trả</TableHead>
                      <TableHead className="text-right">Hoàn tiền</TableHead>
                      <TableHead className="text-right">Ròng sau trả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current?.items
                      ?.filter(
                        (r: any) => r.refundAmount > 0 || r.returnQty > 0
                      )
                      .map((r: any, idx: number) => (
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
                            {r.returnQty}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            {currency(r.refundAmount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {currency(r.netAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {current && totals && (
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell>Tổng</TableCell>
                        <TableCell className="text-right">
                          {totals.returnQty}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {currency(totals.refundAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(totals.netAmount)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
