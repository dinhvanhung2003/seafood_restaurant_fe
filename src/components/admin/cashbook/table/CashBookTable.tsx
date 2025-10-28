"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import type { CashbookItem } from "@/types/admin/cashbook";
import { format } from "date-fns";


export type CashbookTableProps = {
  rows: CashbookItem[];
  onOpenDetail?: (id: string) => void;
};
export const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(typeof v === "string" ? parseFloat(v) : v);

export const fmtDateTime = (iso?: string) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "-";
export function CashbookTable({ rows, onOpenDetail }: CashbookTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Ngày</TableHead>
          <TableHead className="w-[120px]">Mã phiếu</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Đối tượng</TableHead>
          <TableHead>Nội dung</TableHead>
          <TableHead className="text-right">Số tiền</TableHead>
          <TableHead className="w-[120px]">Hạch toán</TableHead>
          <TableHead className="w-[90px]"></TableHead>{/* Actions */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const partyName =
            r.counterpartyGroup === "CUSTOMER"
              ? r.customer?.name
              : r.counterpartyGroup === "SUPPLIER"
              ? r.supplier?.name
              : r.cashOtherParty?.name;
          const content =
            r.invoice?.invoiceNumber || r.purchaseReceipt?.code || r.sourceCode || "-";

          return (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{fmtDateTime(r.date)}</TableCell>
              <TableCell className="font-medium">{r.code}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={r.type === "RECEIPT" ? "default" : "secondary"}>
                    {r.type === "RECEIPT" ? "Thu" : "Chi"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{r.cashType?.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium leading-5">{partyName || "-"}</span>
                  <span className="text-xs text-muted-foreground">{r.counterpartyGroup}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">{content}</TableCell>
              <TableCell className="text-right font-semibold">
                {r.type === "RECEIPT" ? (
                  <span className="text-green-600">+ {fmtCurrency(r.amount)}</span>
                ) : (
                  <span className="text-red-600">- {fmtCurrency(r.amount)}</span>
                )}
              </TableCell>
              <TableCell>
                {r.isPostedToBusinessResult ? (
                  <Badge variant="outline">Đã HT</Badge>
                ) : (
                  <Badge variant="destructive">Chưa HT</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDetail?.(r.id)} // ✅ gọi prop nếu có
                >
                  Xem
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
