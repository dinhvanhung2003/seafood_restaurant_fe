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
import { CustomerModal } from "@/components/cashier/modals/CustomerModal";
import { GuestCountModal } from "@/components/cashier/modals/GuestCountModal";
import { useAttachCustomer, useCreateCustomerAndAttach, useCustomerSearch } from "@/hooks/cashier/useCustomers";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type OrderTabs = { activeId: string; orders: { id: string; label: string }[] };
type ShortCustomer = { id: string; name: string; phone?: string };

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
}: {
  orderId?: string;
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
  const [guestCount, setGuestCount] = useState(0);

  const [selectedCus, setSelectedCus] = useState<ShortCustomer | null>(null);
  const [q, setQ] = useState("");

  const { data: results = [] } = useCustomerSearch(q);
  const attachMu = useAttachCustomer(orderId);
  const createAndAttachMu = useCreateCustomerAndAttach(orderId);

  const handleSelectCustomer = (c: any) => {
    if (!orderId) return toast.error("Chưa có đơn để gắn khách.");
    attachMu.mutate(
      { customerId: c.id },
      {
        onSuccess: () => {
          setSelectedCus({ id: c.id, name: c.name, phone: c.phone });
          setQ("");
          toast.success("Đã gắn khách");
        },
        onError: (e: any) => toast.error(e?.message || "Gắn khách thất bại"),
      }
    );
  };

  const handleAttachWalkin = () => {
    if (!orderId) return toast.error("Chưa có đơn để gắn khách.");
    attachMu.mutate(
      { walkin: true },
      {
        onSuccess: () => {
          setSelectedCus({ id: "WALKIN", name: "Khách lẻ" });
          setQ("");
          toast.success("Đã gắn khách lẻ");
        },
        onError: (e: any) => toast.error(e?.message || "Gắn khách lẻ thất bại"),
      }
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B63E5]">
        
          {tableFloor ? `${tableName} / ${tableFloor}` : tableName}
        </div>

        {/* Search + chip */}
        <div className="relative ml-auto w-full max-w-sm">
          <Input
            placeholder="Tìm khách (tên/SĐT)"
            disabled={!orderId}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={selectedCus ? "text-transparent caret-transparent" : ""}
          />

          {selectedCus && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-3 right-9 flex items-center">
                <div className="flex items-center gap-2 max-w-full overflow-hidden">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-600">
                      <circle cx="12" cy="8" r="3" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </span>
                  <span className="truncate text-blue-600 font-medium">{selectedCus.name}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSelectedCus(null); setQ(""); }}
                className="absolute inset-y-0 right-2 my-auto grid h-7 w-7 place-items-center rounded-full hover:bg-slate-100"
                title="Bỏ chọn khách"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          {!selectedCus && q && results.length > 0 && (
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
              <div className="mt-1 flex items-center justify-between border-t pt-2">
                <Button size="sm" variant="outline" onClick={handleAttachWalkin}>
                  Khách lẻ
                </Button>
                <Button size="sm" onClick={() => setOpenCustomerModal(true)}>
                  Thêm mới
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCustomerModal(true)} disabled={!hasTable}>
            <Plus className="h-5 w-5" />
          </Button>
          <CustomerModal
            open={openCustomerModal}
            onClose={() => setOpenCustomerModal(false)}
            onSaved={(payload) => {
              if (!orderId) return toast.error("Chưa có đơn để gắn khách.");
              // dùng hook gộp: tạo + gắn
              createAndAttachMu.mutate(payload, {
                onSuccess: (res: any) => {
                  const c = res?.customer ?? res;
                  setSelectedCus({
                    id: c?.id,
                    name: c?.name || payload.name,
                    phone: c?.phone || payload.phone,
                  });
                  setQ("");
                  toast.success("Đã tạo & gắn khách");
                },
                onError: (e: any) => toast.error(e?.message || "Lỗi lưu khách"),
              });
            }}
          />
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
            className="h-12 rounded-xl border border-blue-500 bg-white text-blue-500 hover:bg-blue-50"
            onClick={onNotify}
            disabled={!hasTable || !canNotify}
          >
            <Bell className="mr-2 h-5 w-5" />
            Thông báo (F10)
          </Button>{" "}
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
      {/* BỎ CustomerModal lặp ở cuối */}
      <GuestCountModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={(count) => setGuestCount(count)}
      />
    </div>
  );
}
