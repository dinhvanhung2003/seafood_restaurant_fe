// app/cashier/_components/CashierDrawer.tsx
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function CashierDrawer() {
  const { data } = useSession();
  const phone =
    (data?.user as any)?.phone ||
    (data?.user as any)?.username ||
    (data?.user as any)?.email ||
    "Tài khoản";

  return (
    <Sheet>
      {/* Nút mở drawer (icon 3 gạch trên header thu ngân) */}
      <SheetTrigger asChild>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>

      {/* Drawer bên trái giống hình anh gửi */}
      <SheetContent side="left" className="p-0 w-[320px] max-w-full">
        <div className="flex flex-col h-full">
          {/* Header tài khoản */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{phone}</span>
              <span className="text-xs text-slate-500">Thu ngân</span>
            </div>
          </div>

          {/* Các menu (tạm để vài cái, anh muốn thì thêm link sau) */}
          <div className="flex-1 overflow-y-auto py-2">
            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                QL
              </span>
              <span>Quản lý</span>
            </button>

            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                NB
              </span>
              <span>Nhà bếp</span>
            </button>

            {/* ... các item khác nếu cần ... */}
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
    </Sheet>
  );
}
