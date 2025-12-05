"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogOut, Menu, User, History } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ReturnInvoicePickerModal } from "@/components/cashier/returns/ReturnInvoicePickerModal";
import { ReturnDetailModal } from "@/components/cashier/returns/ReturnDetailModal";
import { useKitchenVoids } from "@/hooks/cashier/socket/useVoidHistory";

type Props = {
  currentTableId?: string; // 👈 bàn đang chọn (có thể undefined)
};

export function CashierDrawer({ currentTableId }: Props) {
  const { data } = useSession();
  const phone =
    (data?.user as any)?.phone ||
    (data?.user as any)?.username ||
    (data?.user as any)?.email ||
    "Tài khoản";

  const [returnPickerOpen, setReturnPickerOpen] = useState(false);
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState<
    string | undefined
  >();
  const [returnDetailOpen, setReturnDetailOpen] = useState(false);

  // trạng thái mở/đóng khối “Lịch sử huỷ”
  const [voidOpen, setVoidOpen] = useState(false);

  // chỉ fetch khi đang mở + có bàn
  const { data: voidEvents, isLoading } = useKitchenVoids(
    voidOpen ? currentTableId : undefined
  );

  return (
    <Sheet>
      {/* Nút mở drawer */}
      <SheetTrigger asChild>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>

      {/* Drawer bên trái */}
      <SheetContent
        side="left"
        className="w-[340px] max-w-full p-0"
        aria-label="Menu thu ngân"
      >
        <div className="flex h-full flex-col">
          {/* Header tài khoản */}
          <SheetHeader className="border-b px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-sm font-semibold">
                  {phone}
                </SheetTitle>
                <span className="text-xs text-slate-500">Thu ngân</span>
              </div>
            </div>
          </SheetHeader>

          {/* Menu chức năng */}
          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            {/* Trả hàng */}
            <div className="px-4">
              <button
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => setReturnPickerOpen(true)}
              >
                Chọn hóa đơn trả hàng
              </button>
            </div>

            {/* Lịch sử huỷ bàn hiện tại */}
            <div className="border-t pt-3">
              <button
                className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setVoidOpen((v) => !v)}
                disabled={!currentTableId}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <History className="h-4 w-4" />
                </span>
                <span>
                  Lịch sử huỷ{" "}
                  {currentTableId ? "bàn hiện tại (hôm nay)" : "(chọn bàn trước)"}
                </span>
              </button>

              {voidOpen && (
                <div className="mt-1 max-h-[320px] overflow-y-auto px-4 pb-2 text-sm">
                  {!currentTableId && (
                    <div className="text-xs text-slate-500">
                      Vui lòng chọn một bàn trên màn hình chính.
                    </div>
                  )}

                  {currentTableId && isLoading && (
                    <div className="text-xs text-slate-500">
                      Đang tải lịch sử huỷ...
                    </div>
                  )}

                  {currentTableId &&
                    !isLoading &&
                    (!voidEvents || voidEvents.length === 0) && (
                      <div className="text-xs text-slate-500">
                        Hôm nay chưa có món nào bị huỷ tại bàn này.
                      </div>
                    )}

                  {currentTableId &&
                    !isLoading &&
                    voidEvents &&
                    voidEvents.length > 0 && (
                      <div className="space-y-2">
                        {voidEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-md border bg-white px-2 py-1.5 shadow-sm"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">
                                 {ev.itemName} x{ev.qty}
                              </span>
                              <span>
    {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }) : ''}
  </span>
                            </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
  {ev.source === "kitchen"
    ? "Bếp huỷ"
    : ev.source === "waiter"
    ? "Phục vụ huỷ"
    : "Thu ngân huỷ"}
  {ev.byName ? ` · ${ev.byName}` : ""}
</div>
{ev.reason && (
  <div className="mt-0.5 text-[11px] italic text-slate-500">
    Lý do: {ev.reason}
  </div>
)}


                            
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="border-t px-2 py-2">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </SheetContent>

      {/* Modal chọn hóa đơn & chi tiết trả hàng */}
      <ReturnInvoicePickerModal
        open={returnPickerOpen}
        onClose={() => setReturnPickerOpen(false)}
        onSelect={(inv) => {
          setSelectedInvoiceForReturn(inv.id);
          setReturnPickerOpen(false);
          setReturnDetailOpen(true);
        }}
      />

      <ReturnDetailModal
        invoiceId={selectedInvoiceForReturn}
        open={returnDetailOpen}
        onClose={() => setReturnDetailOpen(false)}
        onSuccess={() => {
          // TODO: nếu cần thì refetch dashboard, invoice list...
        }}
      />
    </Sheet>
  );
}
