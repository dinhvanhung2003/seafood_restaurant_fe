"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

import { useCashbookDetail } from "@/hooks/admin/useCashBook";

export const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(typeof v === "string" ? parseFloat(v) : v);

export const fmtDateTime = (iso?: string) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "-";
export function CashbookDetailModal({
  id,
  open,
  onOpenChange,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading, isError } = useCashbookDetail(id);
  const item = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Chi tiết sổ quỹ</DialogTitle>
          <DialogDescription>Thông tin chứng từ và đối tượng liên quan.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Đang tải chi tiết…
          </div>
        ) : isError || !item ? (
          <div className="py-10 text-center text-sm text-red-600">
            Không tải được dữ liệu.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Mã phiếu</div>
              <div className="font-semibold">{item.code}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Ngày</div>
              <div className="font-medium">{fmtDateTime(item.date)}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Loại</div>
              <div className="flex items-center gap-2">
                <Badge variant={item.type === "RECEIPT" ? "default" : "secondary"}>
                  {item.type === "RECEIPT" ? "Thu" : "Chi"}
                </Badge>
                <span className="text-sm text-muted-foreground">{item.cashType?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Số tiền</div>
              <div
                className={`font-semibold ${
                  item.type === "RECEIPT" ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.type === "RECEIPT" ? "+ " : "- "}
                {fmtCurrency(item.amount)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Hạch toán KQKD</div>
              <div>
                {item.isPostedToBusinessResult ? (
                  <Badge variant="outline">Đã HT</Badge>
                ) : (
                  <Badge variant="destructive">Chưa HT</Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Nhóm đối tác</div>
                <div className="font-medium">{item.counterpartyGroup}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Đối tượng</div>
                <div className="font-medium">
                  {item.customer?.name ||
                    item.supplier?.name ||
                    item.cashOtherParty?.name ||
                    "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Nguồn/Chứng từ</div>
                <div className="font-medium">{item.sourceCode || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tạo lúc</div>
                <div className="font-medium">{fmtDateTime(item.createdAt)}</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
