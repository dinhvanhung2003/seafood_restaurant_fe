// src/components/cashier/modals/SplitOrderModal.tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

import { useSplitOrderMutate } from "@/hooks/cashier/useSplitOrder";
import {
  useOpenOrdersInTable,
  type TargetOrderSummary,
} from "@/hooks/cashier/useOpenOrders";
import { useTablesWithOpenOrders, useTablesWithoutOpenOrders } from "@/hooks/cashier/useTableForSplit";

type OrderItemVM = { id: string; name: string; quantity: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromOrderId: string;
  fromTableId?: string;
  fromTableName?: string;
  items: OrderItemVM[];
};

export default function SplitOrderModal({
  open,
  onOpenChange,
  fromOrderId,
  fromTableId,
  fromTableName,
  items,
}: Props) {
  const [mode, setMode] = React.useState<"create-new" | "to-existing">("create-new");
  const [targetTableId, setTargetTableId] = React.useState<string | undefined>(undefined);
  const [targetOrderId, setTargetOrderId] = React.useState<string | undefined>(undefined);

  // { orderItemId: splitQty }
  const [split, setSplit] = React.useState<Record<string, number>>({});

  // map số lượng gốc theo item id
  const originalQty = React.useMemo(
    () => Object.fromEntries(items.map((it) => [it.id, it.quantity])),
    [items]
  );

  // tổng còn lại trên đơn gốc (phải >= 1)
  const totalRemain = React.useMemo(
    () => items.reduce((s, it) => s + (it.quantity - (split[it.id] ?? 0)), 0),
    [items, split]
  );

  // set SL tách cho 1 dòng, chỉ khống chế theo tổng còn lại
  const setSplitQty = (itemId: string, nextRaw: number) => {
    const orig = originalQty[itemId] ?? 0;
    const curr = split[itemId] ?? 0;

    // Sau thay đổi: newRemain = totalRemain + (curr - next)
    // Ràng buộc: newRemain >= 1  => next <= curr + (totalRemain - 1)
    const maxByGlobal = curr + (totalRemain - 1);
    const capped = Math.max(0, Math.min(nextRaw, Math.min(orig, maxByGlobal)));

    setSplit((s) => ({ ...s, [itemId]: capped }));
  };

  // danh sách bàn theo mode
  const { data: tablesForCreate = [], isLoading: loadingCreate } =
    useTablesWithoutOpenOrders(fromTableId);
  const { data: tablesForExisting = [], isLoading: loadingExisting } =
    useTablesWithOpenOrders();

  const tableOptions =
    mode === "create-new"
      ? tablesForCreate.map((t) => ({ value: t.id, label: t.name }))
      : tablesForExisting.map((t) => ({ value: t.tableId, label: t.tableName }));

  // đơn mở của bàn đích (khi tách vào đơn có sẵn)
  const { data: targetOrders = [], isLoading: loadingOrders } = useOpenOrdersInTable(
    mode === "to-existing" ? targetTableId : undefined,
    { excludeOrderId: fromOrderId }
  );

  // đổi mode -> reset chọn
  React.useEffect(() => {
    setTargetTableId(undefined);
    setTargetOrderId(undefined);
  }, [mode]);

  // đổi bàn -> reset đơn
  React.useEffect(() => {
    setTargetOrderId(undefined);
  }, [targetTableId]);

  const splitMut = useSplitOrderMutate(fromOrderId);

  const chosenAnything = Object.values(split).some((q) => (q ?? 0) > 0);
  const canSubmit =
    chosenAnything &&
    totalRemain >= 1 &&
    ((mode === "create-new" && !!targetTableId) ||
      (mode === "to-existing" && !!targetOrderId));

  const onSubmit = async () => {
    if (!canSubmit) return;
    const itemsToMove = Object.entries(split)
      .filter(([, q]) => (q ?? 0) > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    try {
      if (mode === "create-new") {
        await splitMut.mutateAsync({ mode, tableId: targetTableId!, items: itemsToMove });
      } else {
        await splitMut.mutateAsync({ mode, toOrderId: targetOrderId!, items: itemsToMove });
      }
      toast.success("Đã tách đơn thành công");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Tách đơn thất bại", { description: e?.response?.data?.message || e.message });
    }
  };

  const loadingTables = mode === "create-new" ? loadingCreate : loadingExisting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{fromTableName ? `${fromTableName} – ` : ""}Tách đơn</DialogTitle>
        </DialogHeader>

        {/* Mode */}
        <div className="flex gap-6 mb-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "create-new"}
              onChange={() => setMode("create-new")}
            />
            Tạo đơn mới
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "to-existing"}
              onChange={() => setMode("to-existing")}
            />
            Tách vào đơn có sẵn
          </label>
        </div>

        {/* Chọn bàn/đơn đích */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Select value={targetTableId} onValueChange={setTargetTableId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingTables
                      ? "Đang tải..."
                      : mode === "create-new"
                      ? "Chọn bàn TRỐNG"
                      : "Chọn bàn có ĐƠN"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "to-existing" && (
            <div className="w-64">
              <Select
                value={targetOrderId}
                onValueChange={setTargetOrderId}
                disabled={!targetTableId || loadingOrders}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !targetTableId
                        ? "Chọn bàn trước"
                        : loadingOrders
                        ? "Đang tải..."
                        : targetOrders.length
                        ? "Chọn đơn đích"
                        : "Bàn chưa có đơn khác"
                    }
                  />
                </SelectTrigger>
              <SelectContent>
  {targetOrders.map((o: TargetOrderSummary) => (
    <SelectItem key={o.orderId} value={o.orderId}>
      {o.orderCode} — {Number(o.totalAmount ?? 0).toLocaleString("vi-VN")}đ
    </SelectItem>
  ))}
</SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Bảng items */}
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="grid grid-cols-6 bg-slate-100 px-3 py-2 text-sm font-semibold">
            <div className="col-span-3">Món</div>
            <div className="text-center">SL trên đơn gốc</div>
            <div className="col-span-2 text-right pr-2">SL tách</div>
          </div>

          <div className="max-h-72 overflow-auto">
            {items.map((it) => {
              const curr = split[it.id] ?? 0;
              // tối đa cho phép theo ràng buộc tổng
              const allowedMax = Math.min(it.quantity, curr + (totalRemain - 1));
              const disableMinus = curr <= 0;
              const disablePlus = curr >= allowedMax;

              return (
                <div key={it.id} className="grid grid-cols-6 items-center px-3 py-2 border-t">
                  <div className="col-span-3">{it.name}</div>
                  <div className="text-center">{it.quantity}</div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSplitQty(it.id, curr - 1)}
                        disabled={disableMinus}
                      >
                        −
                      </Button>
                      <input
                        className="w-12 text-center border rounded"
                        value={curr}
                        onChange={(e) => setSplitQty(it.id, Number(e.target.value || 0))}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSplitQty(it.id, curr + 1)}
                        disabled={disablePlus}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bỏ qua
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit || splitMut.isPending}>
            {splitMut.isPending ? "Đang xử lý..." : "Thực hiện"}
          </Button>
        </div>

        {/* Nhắc nhở tổng còn lại */}
        {chosenAnything && totalRemain < 1 && (
          <div className="mt-2 text-right text-xs text-red-600">
            Đơn gốc phải còn lại ít nhất 1 số lượng.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
