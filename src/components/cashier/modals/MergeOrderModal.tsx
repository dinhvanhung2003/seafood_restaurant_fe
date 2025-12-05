// src/components/cashier/modals/MergeOrderModal.tsx
"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import {
  useOpenOrderTables,
  useOpenOrdersInTable,
 
} from "@/hooks/cashier/useOpenOrders"; // ⬅️ đổi import cho đúng tên hook
import { useMergeOrderMutate } from "@/hooks/cashier/useMergeOrder";
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromOrderId: string;          // đơn nguồn (bắt buộc truyền đúng string)
  fromTableName?: string;
  currentTableId?: string;       // bàn hiện tại (để ẩn khỏi dropdown)
  onMerged?: () => void;
};

export default function MergeOrderModal({
  open,
  onOpenChange,
  fromOrderId,
  fromTableName,
  currentTableId,
  onMerged,
}: Props) {
  // chỉ làm "Ghép đơn"
  const [targetTableId, setTargetTableId] = React.useState<string | undefined>();
  const [selectedTargetOrder, setSelectedTargetOrder] = React.useState<string | undefined>();

  // 1) Bàn có đơn mở – loại trừ bàn hiện tại & đơn hiện tại
 const { data: tables = [], isLoading: loadingTables } = useOpenOrderTables();
const visibleTables = React.useMemo(
  () => tables.filter(t => t.tableId !== currentTableId),
  [tables, currentTableId]
);
  // 2) Các đơn mở của bàn đích – loại trừ đơn hiện tại
  const { data: targetOrders = [], isLoading: loadingOrders } = useOpenOrdersInTable(
    targetTableId,
    { excludeOrderId: fromOrderId },
  );

  // đổi bàn thì reset đơn được chọn
  React.useEffect(() => {
    setSelectedTargetOrder(undefined);
  }, [targetTableId]);

  const mergeMut = useMergeOrderMutate();

  const onSubmit = async () => {
    if (!targetTableId || !selectedTargetOrder) {
      return toast.error("Hãy chọn bàn và chọn 1 hoá đơn để ghép vào.");
    }
    if (selectedTargetOrder === fromOrderId) {
      return toast.error("Không thể ghép vào chính hoá đơn hiện tại.");
    }
    try {
      await mergeMut.mutateAsync({ fromId: fromOrderId, toId: selectedTargetOrder });
      toast.success("Đã ghép đơn thành công.");
      onOpenChange(false);
      onMerged?.();
    } catch (e: any) {
      toast.error("Ghép đơn thất bại", {
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{fromTableName ? `${fromTableName} – ` : ""}Ghép đơn</DialogTitle>
        </DialogHeader>

        {/* Mode (chỉ ghép) */}
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2">
            <input type="radio" checked readOnly /> Ghép đơn
          </label>
          {/* <label className="flex items-center gap-2 opacity-50">
            <input type="radio" disabled /> Tách đơn (sắp có)
          </label> */}
        </div>

        {/* Select bàn đích */}
        <div className="mt-3">
          <div className="text-sm mb-1">Ghép đến</div>
        <Select value={targetTableId} onValueChange={setTargetTableId}>
  <SelectTrigger>
    <SelectValue placeholder={loadingTables ? "Đang tải..." : (tables.length ? "Chọn phòng/bàn" : "Không có bàn khả dụng")} />
  </SelectTrigger>
  <SelectContent>
  
     {visibleTables.map((t) => (
  <SelectItem key={t.tableId} value={t.tableId}>
    {t.tableName}
    {typeof t.orderCount === "number" && t.orderCount > 1 ? ` (${t.orderCount} đơn)` : ""}
  </SelectItem>


    ))}
  </SelectContent>
</Select>


        </div>

        {/* Danh sách đơn của bàn đích */}
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-100 px-3 py-2 text-sm font-semibold">
            <div>Khách hàng</div>
            <div>Mã đơn</div>
            <div>Số lượng hàng</div>
            <div className="text-right pr-2">Tổng tiền</div>
          </div>
          <div className="max-h-64 overflow-auto">
            {(!targetTableId || loadingOrders) && (
              <div className="p-4 text-sm text-slate-500">
                {targetTableId ? "Đang tải..." : "Chưa chọn bàn"}
              </div>
            )}

            {targetTableId && !loadingOrders && targetOrders.length === 0 && (
              <div className="p-4 text-sm text-slate-500">Bàn chưa có hoá đơn nào</div>
            )}

            {targetOrders.map((o) => (
              <label
                key={o.orderId}
                className="grid grid-cols-4 items-center px-3 py-2 border-t cursor-pointer hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTargetOrder === o.orderId}
                    onCheckedChange={(checked) =>
                      setSelectedTargetOrder(checked ? o.orderId : undefined)
                    }
                  />
                  <span>{o.customerName ?? "Khách lẻ"}</span>
                </div>

                {/* Ví dụ mã hiển thị: Bàn 10 -> 10-AB12 */}
                <div>
                  {o.code ??
                    (o.orderId ? `${(o.tableName ?? "").split(" ").pop()}-${o.orderId.slice(0, 4)}` : "")}
                </div>

                <div>{o.itemsCount ?? 0}</div>
                <div className="text-right pr-2">
                  {(o.total ?? 0).toLocaleString()}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bỏ qua
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!targetTableId || !selectedTargetOrder || mergeMut.isPending}
          >
            {mergeMut.isPending ? "Đang xử lý..." : "Thực hiện"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
