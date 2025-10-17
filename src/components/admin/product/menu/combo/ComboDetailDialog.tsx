"use client";
import { isUUID } from "@/lib/uuid";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useComboDetailQuery } from "@/hooks/admin/useCombo";

function formatVND(x: string | number) {
  const n = typeof x === "string" ? Number(x) : x;
  return Number.isNaN(n) ? String(x) : n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

export default function ComboDetailDialog({
  id, open, onOpenChange,
}: { id?: string; open: boolean; onOpenChange: (v: boolean) => void; }) {
    const enabled = open && isUUID(id);
  const q = useComboDetailQuery(enabled ? id : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Chi tiết combo</DialogTitle></DialogHeader>
        {q.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : q.error ? (
          <div className="py-6 text-center text-red-500">{q.error.message}</div>
        ) : q.data ? (
          <div className="space-y-3">
            <div className="text-lg font-semibold">{q.data.name}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-medium">Giá:</span> {formatVND(q.data.price)}</div>
              <div><span className="font-medium">Trạng thái:</span> {q.data.isAvailable ? "Sẵn sàng" : "Tạm ẩn"}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Thành phần ({q.data.components?.length ?? 0})</div>
              {(q.data.components?.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">—</div>
              ) : (
                <ul className="list-disc pl-6 text-sm">
                  {q.data.components!.map((c:any) => (
                    <li key={c.id}>{c.item?.name ?? c.id} — SL: {c.quantity}</li>
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
