"use client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMenuItemDetailQuery } from "@/hooks/admin/useMenu";

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;
  if (Number.isNaN(num)) return String(x);
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

type Props = {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function MenuItemDetailDialog({ id, open, onOpenChange }: Props) {
  const detailQuery = useMenuItemDetailQuery(id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết món</DialogTitle>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detailQuery.error ? (
          <div className="py-6 text-center text-red-500">{detailQuery.error.message}</div>
        ) : detailQuery.data ? (
          <div className="space-y-3">
            <div>
              <div className="text-lg font-semibold">{detailQuery.data.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-medium">Danh mục:</span> {detailQuery.data.category?.name ?? "—"}</div>
              <div><span className="font-medium">Giá:</span> {formatVND(detailQuery.data.price)}</div>
              <div className="col-span-2">
                <span className="font-medium">Mô tả:</span> {detailQuery.data.description ?? "—"}
              </div>
              <div>
                <span className="font-medium">Trạng thái:</span> {detailQuery.data.isAvailable ? "Sẵn sàng" : "Tạm ẩn"}
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Nguyên liệu ({detailQuery.data.ingredients.length})</div>
              {detailQuery.data.ingredients.length === 0 ? (
                <div className="text-sm text-muted-foreground">Không có nguyên liệu</div>
              ) : (
                <ul className="list-disc pl-6 text-sm">
                  {detailQuery.data.ingredients.map((ing) => (
                    <li key={ing.id}>SL: {ing.quantity}{ing.note ? ` — ${ing.note}` : ""}</li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
