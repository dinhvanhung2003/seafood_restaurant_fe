"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderItemCard } from "./OrderItemCard";
import { User2, CircleDollarSign, Plus, X, Clock } from "lucide-react";
import { currency } from "@/utils/money";
import type { Table, Catalog } from "@/types/types";
import { GuestCountModal } from "@/components/cashier/modals/GuestCountModal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { UIOrderItem } from "@/lib/cashier/pos-helpers";
import AddCustomerModal from "@/components/admin/partner/customer/modal/AddCustomerModal";
import { useKitchenProgress } from "@/hooks/cashier/useKitchenProgress";
import { useKitchenHistory } from "@/hooks/cashier/useKitchenHistory";
import { NotifyHistoryDrawer } from "@/components/cashier/drawer/NotifyHistoryDrawer";
import MergeOrderModal from "@/components/cashier/modals/MergeOrderModal";
import SplitOrderModal from "@/components/cashier/modals/SplitOrderModal";
import { useCustomer } from "@/hooks/cashier/useCustomers";
import { KitchenVoidsMap } from "@/hooks/cashier/socket/useKitchenVoids";
import { useHotkeys } from "react-hotkeys-hook";

type OrderTabs = { activeId: string; orders: { id: string; label: string }[] };

// ====== INPUT: mỗi item là 1 dòng OrderItem thật từ BE ======
export type UIOrderItemInput = {
  rowId?: string; // orderItemId
  id: string; // menuItemId
  qty: number; // quantity của row này
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "SERVED"
    | "CANCELLED";
  batchId?: string | null; // null khi chưa gửi bếp
};

export function OrderList({
  orderId,
  table,
  items,
  catalog,
  total,
  onChangeQty,
  onCheckout,
  onNotify,
  canCancel,
  onCancelOrder,
  canNotify,
  justChanged,
  kitchenVoids,
  onClearKitchenVoid,
   createdByName,
  // thêm các props 
   guestCount,
  customer,
  onChangeGuestCount,
  onChangeCustomer,
  onUpdateNote: onUpdateNoteProp,
    // thêm props mới
  hasUnsentItems,
  priorityNext,
  onChangePriorityNext,
}: {
  orderId?: string;
  table: Table | null;
  items: UIOrderItem[];
  catalog: Catalog;
  total: number;
  justChanged: boolean;
  onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  onNotify: () => void;
  onCancelOrder?: () => void;
  canCancel?: boolean;
  canNotify?: boolean;
  onClear?: () => void;
  orderTabs?: OrderTabs;
  onAddOrder?: () => void;
  onSwitchOrder?: (id: string) => void;
  onCloseOrder?: (id: string) => void;
  kitchenVoids?: KitchenVoidsMap;
  onClearKitchenVoid?: (menuItemId: string) => void;
  // them các hàm 
   guestCount: number;
  customer: { id: string; name: string; phone?: string | null } | null;
  onChangeGuestCount: (value: number) => void | Promise<void>;
  onChangeCustomer: (
    c: { id: string; name: string; phone?: string | null } | null
  ) => void | Promise<void>;
 onUpdateNote?: (id: string, note: string) => void;
 hasUnsentItems: boolean;
  priorityNext: boolean;
  onChangePriorityNext: (val: boolean) => void;
     createdByName?: string;

}) {
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const tableName = table?.name ?? "Chưa chọn bàn";
  const tableFloor = table?.floor ?? "";
  const hasTable = !!table;

  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  //  useHotkeys(
  //   "f10",
  //   (e) => {
  //     e.preventDefault();
  //     if (!hasTable || !canNotify) return;
  //     onNotify();
  //   },
  //   [hasTable, canNotify, onNotify]
  // );

  useHotkeys(
    "f9",
    (e) => {
      e.preventDefault();
      if (!hasTable) return;
      onCheckout();
    },
    [hasTable, onCheckout]
  );
const selectedCus = customer;
  const [q, setQ] = useState("");
  const { data: results = [] } = useCustomer(q);

 const handleSelectCustomer = async (c: any) => {
    if (!orderId) return toast.error("Chưa có đơn để chọn khách.");
    await onChangeCustomer?.({ id: c.id, name: c.name, phone: c.phone });
    setQ("");
    toast.success("Đã chọn khách");
  };

  const splitItems = useMemo(
    () =>
      items.map((it) => ({
        id: it.rowId ?? it.id,
        name:
          catalog.items.find((m) => m.id === it.id)?.name ??
          (it as any).name ??
          "Món",
        quantity: it.qty,
      })),
    [items, catalog]
  );

  const { cookedMap } = useKitchenProgress(orderId);
  const { data: history = [] } = useKitchenHistory(orderId);

  // Gộp theo menuItemId để hiển thị 1 dòng duy nhất, giữ thứ tự lần đầu gặp
  const mergedItems = useMemo(() => {
    const seen = new Map<string, UIOrderItem>();
    const merged: UIOrderItem[] = [];

    for (const it of items) {
      const mid = it.id;
      if (!seen.has(mid)) {
        const clone = { ...it };
        seen.set(mid, clone);
        merged.push(clone);
      } else {
        seen.get(mid)!.qty += it.qty;
      }
    }
    return merged;
  }, [items]);
// sau mergedItems
const mergedWithPhantom = useMemo(() => {
  const base = [...mergedItems];

  if (!kitchenVoids) return base;

  const existingMenuIds = new Set(base.map((i) => i.id));

  for (const [menuItemId, info] of Object.entries(kitchenVoids)) {
    if (existingMenuIds.has(menuItemId)) continue; // đã có dòng thật rồi

    const meta = catalog.items.find((m) => m.id === menuItemId);

    // ✅ tạo UIOrderItem ảo
    base.push({
      id: menuItemId,
      rowId: `void-${menuItemId}`,      // id ảo, không trùng orderItemId
      qty: 0,                           // đã bị huỷ hết
      status: "CANCELLED",
      batchId: null,
      // đính thêm cho tiện hiển thị (cast any khi dùng)
      ...(meta
        ? { name: meta.name, price: meta.price, image: meta.image }
        : {}),
    } as any); // cast tạm cho hợp kiểu
  }

  return base;
}, [mergedItems, kitchenVoids, catalog.items]);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B63E5]">
          {tableFloor ? `${tableName} / ${tableFloor}` : tableName}
        </div>

        {/* Khối tìm kiếm/ chọn khách */}
        <div className="relative ml-auto w-full max-w-sm">
          {!selectedCus ? (
            <>
              <Input
                placeholder="Tìm khách (tên/SĐT)"
                disabled={!orderId}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white p-2 shadow">
                  {results.map((c: any) => (
                    <button
                      key={c.id}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-sm text-slate-500">
                        {c.phone || c.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-600">
                  <circle cx="12" cy="8" r="3" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </span>
              <span className="truncate text-blue-600 font-medium">
                {selectedCus.name}
              </span>
              <button
                type="button"
                onClick={async () => {
                  // clear customer: truyền id rỗng, BE sẽ map thành null
                   await onChangeCustomer?.(null);
                  setQ("");
                }}
                className="ml-auto grid h-7 w-7 place-items-center rounded-full hover:bg-slate-100"
                title="Bỏ chọn khách"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOpenCustomerModal(true)}
            disabled={!hasTable}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Danh sách món */}
   <ScrollArea className="min-h-0 flex-1">
  <div className="space-y-4 p-4 pt-0">
    {mergedWithPhantom.map((oi, idx) => {
      const meta = catalog.items.find((m) => m.id === oi.id);
      const name  = (oi as any).name  ?? meta?.name  ?? "Món";
      const image = (oi as any).image ?? meta?.image;
      const price = (oi as any).price ?? meta?.price ?? 0;

      const itemLike = { id: oi.id, name, price, image };
      const cooked = cookedMap.get(oi.id) ?? 0;

      const voidInfo = kitchenVoids?.[oi.id];   // key = menuItemId
      const voidQty  = voidInfo?.qty ?? 0;
      const reason   = voidInfo?.last?.reason;

      return (
       <OrderItemCard
  key={`${orderId ?? "no-order"}-${oi.rowId ?? oi.id}`}
  index={idx}
  item={itemLike as any}
  order={oi}
  onChangeQty={onChangeQty}
  onUpdateNote={(id, note) => {
    console.log("OrderList onUpdateNote handler", { id, note });
     onUpdateNoteProp?.(id, note);  
  }}
  cooked={cooked}
  voidQty={voidQty}
  voidReason={reason}
  onClearVoid={
    onClearKitchenVoid ? () => onClearKitchenVoid(oi.id) : undefined
  }
/>

      );
    })}
  </div>
</ScrollArea>



      {/* Footer */}
      <Separator className="my-2" />

      <div className="space-y-2 p-3">
      {canNotify && (hasUnsentItems || justChanged) && (
          <div className="rounded-md bg-yellow-50 p-2 text-center text-sm text-muted-foreground">
            🔔 Bạn vừa cập nhật đơn hàng. Click{" "}
            <strong>Thông báo</strong> để gửi thông tin chế biến đến bar bếp.
          </div>
        )}
 {hasUnsentItems && (
          <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
            <label
              htmlFor="priorityNext"
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                id="priorityNext"
                type="checkbox"
                checked={priorityNext}
                onChange={(e) => onChangePriorityNext(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Gửi ưu tiên cho lần này
            </label>
            {priorityNext && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 font-semibold">
                Ưu tiên
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
         {/*  Hiển thị tên người order */}
             {createdByName && (
              <span className="text-xs text-slate-600 italic mr-2 max-w-[120px] truncate">
                {createdByName}
              </span>
            )}
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <Clock className="w-4 h-4 mr-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setMergeOpen(true)}
              disabled={!orderId}
            >
              Ghép đơn
            </Button>
            <Button
              variant="outline"
              onClick={() => setSplitOpen(true)}
              disabled={!orderId}
            >
              Tách đơn
            </Button>
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
            <Badge className="rounded-full bg-slate-800 text-white">
              {itemCount}
            </Badge>
            <span className="text-lg font-bold">{currency(total)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button
            className="h-12 w-60 rounded-xl border"
            onClick={onNotify}
            disabled={!hasTable || !canNotify}
          >
            Thông báo (F10)
          </Button>

          {/* <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl text-black border-2"
            onClick={onCancelOrder ?? (() => {})}
            disabled={!hasTable || !canCancel || !onCancelOrder}
          >
            Huỷ đơn
          </Button> */}

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
      <AddCustomerModal
        open={openCustomerModal}
        onOpenChange={setOpenCustomerModal}
        onCreated={async (c) => {
          if (c?.id) {
            await onChangeCustomer?.({
              id: c.id,
              name: c.name,
              phone: c.phone,
            });
            toast.success("Đã tạo & chọn khách");
          }
        }}
      />

      <GuestCountModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={async (count) => {
          await onChangeGuestCount(count);
        }}
      />

      <NotifyHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        data={history}
      />

      {orderId && (
        <MergeOrderModal
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          fromOrderId={orderId}
          currentTableId={table?.id}
          onMerged={() => {
            // activeOrdersQuery.refetch?.();
          }}
        />
      )}

      {orderId && (
        <SplitOrderModal
          open={splitOpen}
          onOpenChange={setSplitOpen}
          fromOrderId={orderId}
          fromTableId={table?.id}
          fromTableName={table?.name}
          items={splitItems}
        />
      )}
    </div>
  );
}
