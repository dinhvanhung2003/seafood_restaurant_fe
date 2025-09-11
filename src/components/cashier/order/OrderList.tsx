"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderItemCard } from "./OrderItemCard";
import { User2, CircleDollarSign, Bell, Plus, Trash2 } from "lucide-react";
import { currency } from "@/utils/money";
import type { Table, OrderItem, Catalog } from "@/types/types";
import { CustomerModal } from "@/components/cashier/modals/CustomerModal";
import { GuestCountModal } from "@/components/cashier/modals/GuestCountModal";

type OrderTabs = { activeId: string; orders: { id: string; label: string }[] };

export function OrderList({
  table,
  items,
  catalog,
  total,
  onChangeQty,
  onCheckout,
  onNotify,
  onClear,
  orderTabs,
  onAddOrder,
  onSwitchOrder,
  onCloseOrder,
   canCancel, 
  onCancelOrder,
   canNotify,
}: {
  table: Table | null;
  items: OrderItem[];
  catalog: Catalog;
  total: number;
  onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  onNotify: () => void;
onCancelOrder?: () => void; 
canCancel?: boolean;
 canNotify?: boolean;
  // các prop thêm (để khớp POSPage) — đều là tùy chọn
  onClear?: () => void;
  orderTabs?: OrderTabs;
  onAddOrder?: () => void;
  onSwitchOrder?: (id: string) => void;
  onCloseOrder?: (id: string) => void;
}) {
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  // guard cho table có thể null
  const tableName = table?.name ?? "Chưa chọn bàn";
  const tableFloor = table?.floor ?? "";
  const hasTable = !!table;

  // modal states
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B63E5]">
          <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" aria-hidden>
            <path d="M4 3v7a2 2 0 0 0 2 2h1V3M11 3v9M18 3l-3 6h6l-3 6" />
          </svg>
          {tableFloor ? `${tableName} / ${tableFloor}` : tableName}
        </div>

        <input
          placeholder="Tìm khách hàng (F4)"
          className="ml-auto w-full max-w-sm rounded-full bg-slate-100 px-3 py-1.5 text-sm outline-none ring-0"
          disabled={!hasTable}
        />

        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCustomerModal(true)} disabled={!hasTable}>
            <Plus className="h-5 w-5" />
          </Button>
          <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} />
        </div>
      </div>

      {/* Danh sách món */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4 pt-0">
          {items.map((order, idx) => {
            const item = catalog.items.find((m) => m.id === order.id);
            if (!item) return null;
            return (
              <OrderItemCard
                key={order.id}
                index={idx}
                item={item}
                order={order}
                onChangeQty={onChangeQty}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator className="my-2" />

      <div className="space-y-2 p-3">
        <div className="rounded-md bg-yellow-50 p-2 text-center text-sm text-muted-foreground">
          Bạn vừa cập nhật đơn hàng. Click{" "}
         <Button
  className="h-12 flex-1 rounded-xl border border-blue-500 bg-white text-blue-500 hover:bg-blue-50"
  onClick={onNotify}
  disabled={!hasTable || !canNotify}   // <- chỉ bấm được khi còn PENDING
>
  <Bell className="mr-2 h-5 w-5" />
  Thông báo (F10)
</Button>
{}
          để gửi thông tin chế biến đến bar bếp.
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-sm" disabled={!hasTable}>
              <option>Nguyễn...</option>
            </select>

            <Button
              onClick={() => setGuestModalOpen(true)}
              variant="outline"
              className="h-8 gap-1 px-2 text-sm"
              disabled={!hasTable}
            >
              <User2 className="h-4 w-4" />
              {guestCount}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tổng tiền</span>
            <Badge className="rounded-full bg-slate-800 text-white">{itemCount}</Badge>
            <span className="text-lg font-bold">{currency(total)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {/* Nếu có truyền onClear thì hiện nút Xoá đơn */}
           {/* Xoá sạch món trong đơn (giữ order) */}
          {onClear && (
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={onClear}
              disabled={!hasTable}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Xoá món
            </Button>
          )}

          {/* Huỷ đơn (đổi status=CANCELLED, hoàn kho, huỷ invoice chưa trả) */}
     <Button
  variant="outline"
  className="h-12 flex-1 rounded-xl text-black border-2"
  onClick={onCancelOrder ?? (() => {})}     // nếu chưa truyền hàm thì no-op
  disabled={!hasTable || !canCancel || !onCancelOrder}  // mờ khi chưa có order/hàm
>
  Huỷ đơn
</Button>


          <Button
            className="h-12 flex-1 rounded-xl border border-blue-500 bg-white text-blue-500 hover:bg-blue-50"
            onClick={onNotify}
            disabled={!hasTable}
          >
            <Bell className="mr-2 h-5 w-5" />
            Thông báo (F10)
          </Button>

          <Button
            className="h-12 flex-1 rounded-xl bg-[#0B63E5] text-base text-white hover:bg-[#0959cb]"
            onClick={onCheckout}
            disabled={!hasTable}
          >
            <CircleDollarSign className="mr-2 h-5 w-5" />
            Thanh toán (F9)
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} />
      <GuestCountModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={(count) => setGuestCount(count)}
      />
    </div>
  );
}
