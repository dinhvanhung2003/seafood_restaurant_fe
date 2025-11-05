"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderItemCard } from "./OrderItemCard";
import { User2, CircleDollarSign, Bell, Plus, Trash2, X } from "lucide-react";
import { currency } from "@/utils/money";
import type { Table, OrderItem, Catalog } from "@/types/types";
import { GuestCountModal } from "@/components/cashier/modals/GuestCountModal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { UIOrderItem } from "@/lib/cashier/pos-helpers";
import { useMemo } from "react";
import { useCashierStore } from '@/store/cashier'; 
import AddCustomerModal from "@/components/admin/partner/customer/modal/AddCustomerModal";
import { useKitchenProgress } from "@/hooks/cashier/useKitchenProgress";
type OrderTabs = { activeId: string; orders: { id: string; label: string }[] };
import { Clock } from "lucide-react";
import { useKitchenHistory} from "@/hooks/cashier/useKitchenHistory";
import { NotifyHistoryDrawer } from "@/components/cashier/drawer/NotifyHistoryDrawer";
import MergeOrderModal from "@/components/cashier/modals/MergeOrderModal";
import SplitOrderModal from "@/components/cashier/modals/SplitOrderModal";
import { useCustomer } from "@/hooks/cashier/useCustomers";




// ====== INPUT: mỗi item là 1 dòng OrderItem thật từ BE ======
export type UIOrderItemInput = {
  rowId?: string;           // orderItemId
  id: string;               // menuItemId
  qty: number;              // quantity của row này
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  batchId?: string | null;  // null khi chưa gửi bếp
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
  onClear,
  orderTabs,
  onAddOrder,
  onSwitchOrder,
  onCloseOrder,
  canCancel,
  onCancelOrder,
  canNotify,
  justChanged,
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
}) {
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const tableName = table?.name ?? "Chưa chọn bàn";
  const tableFloor = table?.floor ?? "";
  const hasTable = !!table;

  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  

  const guestCount = useCashierStore((s) => s.guestCount);
  const setGuestCount = useCashierStore((s) => s.setGuestCount);

  const [mergeOpen, setMergeOpen] = useState(false);


   const selectedCus = useCashierStore(s => s.selectedCustomer);
  const setSelectedCus = useCashierStore(s => s.setSelectedCustomer);
  const [q, setQ] = useState("");

  const { data: results = [] } = useCustomer(q);
   const handleSelectCustomer = (c: any) => {
    if (!orderId) return toast.error("Chưa có đơn để chọn khách.");
    setSelectedCus({ id: c.id, name: c.name, phone: c.phone });
    setQ("");
    toast.success("Đã chọn khách");
  };


const [splitOpen, setSplitOpen] = useState(false);
const splitItems = useMemo(
  () =>
    items.map((it) => ({
      id: it.rowId ?? it.id, // ưu tiên orderItemId; fallback (không khuyến nghị) là menuItemId
      name: catalog.items.find((m) => m.id === it.id)?.name ?? "Món",
      quantity: it.qty,
    })),
  [items, catalog]
);
const { cookedMap } = useKitchenProgress(orderId);
const [historyOpen, setHistoryOpen] = useState(false);
const { data: history = [], prepend } = useKitchenHistory(orderId);
// Gộp các dòng cùng menuItemId để hiển thị một dòng duy nhất
const mergedItems = useMemo(() => {
  const seen = new Map<string, UIOrderItem>();
  const merged: UIOrderItem[] = [];

  for (const it of items) {
    const mid = it.id;                 // menuItemId
    if (!seen.has(mid)) {
      const clone = { ...it };         // giữ row đại diện đầu tiên
      seen.set(mid, clone);
      merged.push(clone);              // PUSH theo thứ tự gặp -> KHÔNG sort
    } else {
      seen.get(mid)!.qty += it.qty;    // cộng dồn số lượng
    }
  }
  return merged;                       // thứ tự = thứ tự gặp lần đầu
}, [items]);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B63E5]">
        
          {tableFloor ? `${tableName} / ${tableFloor}` : tableName}
        </div>

        {/* Search + chip */}
          {/* Khối tìm kiếm/ chọn khách */}
        <div className="relative ml-auto w-full max-w-sm">
          {/* ẨN input nếu đã chọn khách */}
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
                      <span className="text-sm text-slate-500">{c.phone || c.code}</span>
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
              <span className="truncate text-blue-600 font-medium">{selectedCus.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCus(null);
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
          <Button onClick={() => setOpenCustomerModal(true)} disabled={!hasTable}>
            <Plus className="h-5 w-5" />
          </Button>
          
        </div>
      </div>

      {/* Danh sách món */}
  <ScrollArea className="min-h-0 flex-1">
  <div className="space-y-4 p-4 pt-0">
    {mergedItems.map((oi, idx) => {
      // Lấy meta từ catalog (nếu có)
      const meta = catalog.items.find((m) => m.id === oi.id);

      // ✅ Ưu tiên field từ item trả về từ BE (đã map ở useOrders)
      const name  = (oi as any).name  ?? meta?.name  ?? "Món";
      const image = (oi as any).image ?? meta?.image;
      const price = (oi as any).price ?? meta?.price ?? 0;

      // Tạo object “menuItemLike” đủ tối thiểu cho OrderItemCard
      const itemLike = { id: oi.id, name, price, image };

      // cooked vẫn lấy như cũ
      const cooked = cookedMap.get(oi.id) ?? 0;

      return (
        <OrderItemCard
          key={`${orderId ?? "no-order"}-${oi.id}`}
          index={idx}
          item={itemLike as any}   // nếu type chặt, sửa type của OrderItemCard cho rộng hơn
          order={oi}
          onChangeQty={onChangeQty}
          cooked={cooked}
        />
      );
    })}
  </div>
</ScrollArea>




      {/* Footer */}
      <Separator className="my-2" />

      <div className="space-y-2 p-3">
      {justChanged && canNotify && (  // <-- thêm canNotify
    <div className="rounded-md bg-yellow-50 p-2 text-center text-sm text-muted-foreground">
      🔔 Bạn vừa cập nhật đơn hàng. Click <strong>Thông báo</strong> để gửi thông tin chế biến đến bar bếp.
    </div>
  )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
 <Button variant="outline" onClick={() => setSplitOpen(true)} disabled={!orderId}>
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
            <Badge className="rounded-full bg-slate-800 text-white">{itemCount}</Badge>
            <span className="text-lg font-bold">{currency(total)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {/* {onClear && (
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={onClear}
              disabled={!hasTable}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Xoá món
            </Button>
          )} */}
      <Button
  className="h-12 rounded-xl border"
  onClick={onNotify}
  disabled={!hasTable || !canNotify}
>
  {canNotify ? "Thông báo" : "Thông báo"}
</Button>
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-xl text-black border-2"
            onClick={onCancelOrder ?? (() => {})}
            disabled={!hasTable || !canCancel || !onCancelOrder}
          >
            Huỷ đơn
          </Button>

          {/* BỎ nút Thông báo ở footer để tránh trùng */}
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
        onCreated={(c) => {
          // c là object khách từ BE (do mutateAsync trả về)
          if (c?.id) {
            setSelectedCus({ id: c.id, name: c.name, phone: c.phone });
            toast.success("Đã tạo & chọn khách");
          }
        }}
      />

      <GuestCountModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={(count) => setGuestCount(count)}
      />
      <NotifyHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} data={history}/>
     {orderId && (
  <MergeOrderModal
    open={mergeOpen}
    onOpenChange={setMergeOpen}
    fromOrderId={orderId}             // giờ chắc chắn là string
    currentTableId={table?.id}        // có thể undefined -> để prop optional
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
    items={splitItems} // <-- dùng mảng đã map ở bước 3
  />
)}
    </div>
    
  );
}