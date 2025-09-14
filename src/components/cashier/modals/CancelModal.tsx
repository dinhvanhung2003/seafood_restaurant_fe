// src/components/cashier/modals/CancelItemsModal.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type CancelTarget = { orderItemId: string; name: string; qty: number };

export default function CancelItemsModal({
  open, onClose, items, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  items: CancelTarget[]; // các item sẽ huỷ nguyên dòng
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/40">
      <div className="w-[520px] rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-2 text-base font-semibold">Huỷ món đã báo bếp</div>
        <div className="mb-3 text-sm text-slate-600">Những món dưới sẽ được huỷ (chỉ áp dụng khi chưa bắt đầu nấu):</div>

        <ScrollArea className="mb-3 max-h-40 rounded-md border p-2">
          <ul className="space-y-1 text-sm">
            {items.map((it) => (
              <li key={it.orderItemId} className="flex items-center justify-between">
                <div className="truncate">{it.name}</div>
                <div className="ml-2 font-medium">x{it.qty}</div>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do huỷ (bắt buộc)"
          className="mb-3 h-24 w-full resize-none rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button
            className="bg-red-600 hover:bg-red-600/90"
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
          >
            Xác nhận huỷ
          </Button>
        </div>
      </div>
    </div>
  );
}
