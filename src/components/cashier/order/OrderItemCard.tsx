"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, CookingPot } from "lucide-react";
import { currency } from "@/utils/money";
import { ItemNoteModal } from "@/components/cashier/modals/ItemNoteModal";
import type { OrderItem, CatalogItem } from "@/types/types";

type Props = {
  index: number;
  item: CatalogItem;
  order: OrderItem;
  onChangeQty: (id: string, delta: number) => void;
  onUpdateNote?: (id: string, note: string) => void;
  cooked?: number; // READY + SERVED

  // thông tin bếp hủy
  voidQty?: number;
  voidReason?: string;
  onClearVoid?: () => void;
};

export function OrderItemCard({
  index,
  item,
  order,
  onChangeQty,
  onUpdateNote,
  cooked = 0,
  voidQty = 0,
  voidReason,
  onClearVoid,
}: Props) {
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // món đã bị bếp huỷ hết nhưng vẫn để lại dòng cho thu ngân
  const isFullyCancelled = order.qty === 0 && voidQty > 0;

  const displayPrice = (item as any).priceAfterDiscount ?? item.price;
  const originPrice = item.price ?? 0;
  const hasPromo = Number((item as any).discountAmount ?? 0) > 0;
  const lineTotal = displayPrice * order.qty;
  const promoBadge =
    (item as any).badge ??
    (hasPromo
      ? `-${Number((item as any).discountAmount ?? 0).toLocaleString()}đ`
      : null);

  return (
    <div
      className={
        (hasPromo ? "rounded-md bg-emerald-50/40 p-2 " : "") +
        (isFullyCancelled ? "opacity-70" : "")
      }
    >
      {/* 🔴 Phần đã bị bếp huỷ – gạch riêng số phần đã huỷ */}
      {voidQty > 0 && (
        <div className="mb-1 flex items-center justify-between rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
          <div className="flex flex-col">
            <span className="font-medium">
              <span className="line-through mr-1">
                {item.name} x{voidQty}
              </span>
              — Đã hủy từ bếp
            </span>
            {voidReason && (
              <span className="text-[11px] opacity-80">
                Lý do: {voidReason}
              </span>
            )}
          </div>

          {onClearVoid && (
            <button
              type="button"
              className="ml-2 rounded-full p-1 hover:bg-red-100"
              onClick={onClearVoid}
              title="Ẩn thông tin hủy món này"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Tên món – nếu huỷ hết thì gạch luôn tên; còn lại thì bình thường */}
      <div className="flex items-center justify-between font-semibold text-base">
        <div className="flex items-center gap-2">
          <span className={isFullyCancelled ? "line-through" : ""}>
            {index + 1}. {item.name}
          </span>

          {hasPromo && promoBadge && (
            <span className="inline-flex items-center ml-2 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-xs font-semibold">
              KM {promoBadge}
            </span>
          )}

          {cooked > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              title="Số phần đã nấu xong (READY + SERVED)"
            >
              <CookingPot className="h-3 w-3" />
              {cooked}
            </span>
          )}
        </div>
      </div>

      {/* Ghi chú & controls */}
      <div className="flex items-center justify-between mt-1">
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => setNoteModalOpen(true)}
        >
          {order.note?.length ? `📝 ${order.note}` : "Ghi chú/Món thêm"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-full overflow-hidden h-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChangeQty(order.id, -1)}
              disabled={order.qty <= 0} // không cho trừ dưới 0
            >
              <Minus className="w-4 h-4" />
            </Button>

            {/* 👉 đây là phần còn lại sau khi bếp huỷ: thu ngân vẫn thấy & vẫn gọi lại được */}
            <div className="w-8 text-center text-sm font-medium">
              {order.qty}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChangeQty(order.id, +1)} // gọi lại phần mới
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-right w-28 text-sm text-muted-foreground">
            {hasPromo ? (
              <div>
                <div className="text-xs text-slate-400 line-through">
                  {currency(originPrice)}
                </div>
                <div className="text-sm font-bold text-emerald-700">
                  {currency(displayPrice)}
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium">{currency(displayPrice)}</div>
            )}
          </div>

          <div className="text-right w-24 text-sm font-semibold">
            {currency(lineTotal)}
          </div>
        </div>
      </div>

      <ItemNoteModal
        open={noteModalOpen}
        itemName={item.name}
        defaultNote={order.note || ""}
        onClose={() => setNoteModalOpen(false)}
        onConfirm={(note) => {
          onUpdateNote?.(order.id, note);
          setNoteModalOpen(false);
        }}
      />
    </div>
  );
}
