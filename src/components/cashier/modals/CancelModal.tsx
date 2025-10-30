// src/components/cashier/modals/CancelOneItemModal.tsx
"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type CancelTarget = { orderItemId: string; name: string; qty: number };

const REASONS = ["Khách đổi món", "Đặt nhầm", "Hết hàng", "In lộn phiếu", "Khác"] as const;
type ReasonKey = (typeof REASONS)[number];

export default function CancelOneItemModal({
  open,
  onClose,
  item,                         // ⬅️ 1 dòng món
  onConfirm,                    // ⬅️ trả { qty, reason }
}: {
  open: boolean;
  onClose: () => void;
  item: CancelTarget | null;
  onConfirm: (p: { qty: number; reason: string }) => Promise<void> | void;
}) {
  const max = useMemo(() => item?.qty ?? 0, [item]);
  const [qty, setQty] = useState(1);
  const [reasonKey, setReasonKey] = useState<ReasonKey>("Khác");
  const [reasonOther, setReasonOther] = useState("");

  if (!open || !item) return null;

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(max, q + 1));
  const reason = reasonKey === "Khác" ? reasonOther.trim() : reasonKey;
  const canSubmit = qty >= 1 && qty <= max && reason.length > 0;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/40">
      <div className="w-[540px] rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-2 text-base font-semibold">Xác nhận giảm / Huỷ món</div>
        <p className="mb-4 text-sm text-slate-600">
          Bạn có chắc chắn muốn huỷ món <b>{item.name}</b> không?
        </p>

        {/* Qty stepper */}
        <div className="mb-4">
          <div className="mb-1 text-sm font-medium text-slate-700">Số lượng huỷ</div>
          <div className="flex items-center gap-3">
            <button
              className="h-8 w-8 rounded-full border text-lg leading-none"
              onClick={dec}
              disabled={qty <= 1}
              aria-label="Giảm"
            >
              –
            </button>
            <div className="min-w-[40px] text-center text-base font-semibold">{qty}</div>
            <span className="text-slate-500">/ {max}</span>
            <button
              className="h-8 w-8 rounded-full border text-lg leading-none"
              onClick={inc}
              disabled={qty >= max}
              aria-label="Tăng"
            >
              +
            </button>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <div className="mb-1 text-sm font-medium text-slate-700">Lý do huỷ</div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 w-48 rounded-md border px-2 text-sm"
              value={reasonKey}
              onChange={(e) => setReasonKey(e.target.value as ReasonKey)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {reasonKey === "Khác" && (
              <input
                className="h-9 flex-1 rounded-md border px-2 text-sm"
                placeholder="Nhập lý do khác…"
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Bỏ qua</Button>
          <Button
            className="bg-red-600 hover:bg-red-600/90"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              await onConfirm({ qty, reason });
            }}
          >
            🗑️ Chắc chắn
          </Button>
        </div>
      </div>
    </div>
  );
}
