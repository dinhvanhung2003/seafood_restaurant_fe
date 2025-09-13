"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { currency } from "@/utils/money";
import { ItemNoteModal } from "@/components/cashier/modals/ItemNoteModal";
import type { OrderItem, CatalogItem } from "@/types/types";

type Props = {
  index: number;
  item: CatalogItem;
  order: OrderItem;
  onChangeQty: (id: string, delta: number) => void;
  onUpdateNote?: (id: string, note: string) => void;
};

export function OrderItemCard({
  index,
  item,
  order,
  onChangeQty,
  onUpdateNote,
}: Props) {
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const lineTotal = item.price * order.qty;

  return (
    <div>
      {/* Tên món */}
      <div className="flex justify-between items-center font-semibold text-base">
        <span>{index + 1}. {item.name}</span>
      </div>

      {/* Ghi chú & controls */}
      <div className="flex items-center justify-between mt-1">
        {/* Ghi chú / mở modal */}
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => setNoteModalOpen(true)}
        >
          {order.note?.length ? `📝 ${order.note}` : "Ghi chú/Món thêm"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-full overflow-hidden h-10">
            <Button variant="ghost" size="icon" onClick={() => onChangeQty(order.id, -1)}>
              <Minus className="w-4 h-4" />
            </Button>
            <div className="w-8 text-center text-sm font-medium">{order.qty}</div>
            <Button variant="ghost" size="icon" onClick={() => onChangeQty(order.id, +1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-right w-20 text-sm text-muted-foreground">
            {currency(item.price)}
          </div>
          <div className="text-right w-24 text-sm font-semibold">
            {currency(lineTotal)}
          </div>
        </div>
      </div>

      {/* Modal ghi chú */}
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
