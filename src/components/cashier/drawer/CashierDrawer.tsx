// app/cashier/drawer/CashierDrawer.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,   // 👈 THÊM
} from "@/components/ui/sheet";
import { LogOut, Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ReturnInvoicePickerModal } from "@/components/cashier/returns/ReturnInvoicePickerModal";
import { ReturnDetailModal } from "@/components/cashier/returns/ReturnDetailModal";

export function CashierDrawer() {
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
        className="w-[320px] max-w-full p-0"
        aria-label="Menu thu ngân" // 👈 optional, thêm cho chắc
      >
        <div className="flex h-full flex-col">
          {/* Header tài khoản – dùng SheetHeader + SheetTitle để Radix khỏi cảnh báo */}
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
          <div className="flex-1 overflow-y-auto py-2">
            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                QL
              </span>
              <span>Quản lý</span>
            </button>

            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                NB
              </span>
              <span>Nhà bếp</span>
            </button>

            <button
              className="mt-2 ml-4 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              onClick={() => setReturnPickerOpen(true)}
            >
              Chọn hóa đơn trả hàng
            </button>
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

      {/* Modal chọn hóa đơn & chi tiết trả hàng (dialog khác, OK) */}
      <ReturnInvoicePickerModal
        open={returnPickerOpen}
        onClose={() => setReturnPickerOpen(false)}
        onSelect={(inv) => {
          // inv là ReturnableInvoice
          setSelectedInvoiceForReturn(inv.id);
          setReturnPickerOpen(false);   // đóng modal chọn
          setReturnDetailOpen(true);    // mở modal tạo phiếu
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
