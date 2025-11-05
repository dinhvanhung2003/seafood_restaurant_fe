"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CashbookSummary } from "@/types/admin/cashbook";

const fmt = (v?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
    .format(v ?? 0);

export function CashbookSummaryBar({ summary, loading }: { summary?: CashbookSummary; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const net = (summary?.totalReceipt ?? 0) - (summary?.totalPayment ?? 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Số dư đầu kỳ</div>
          <div className="text-lg font-semibold">{fmt(summary?.openingBalance)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Tổng thu</div>
          <div className="text-lg font-semibold text-green-600">+ {fmt(summary?.totalReceipt)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Tổng chi</div>
          <div className="text-lg font-semibold text-red-600">- {fmt(summary?.totalPayment)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Số dư cuối kỳ</div>
            <Badge variant={net >= 0 ? "default" : "destructive"}>
              {net >= 0 ? "Dòng tiền +" : "Dòng tiền -"}
            </Badge>
          </div>
          <div className="text-lg font-semibold">{fmt(summary?.closingBalance)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
