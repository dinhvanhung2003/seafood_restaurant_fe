// app/admin/MobileDrawer.tsx (CLIENT)
"use client";
import * as React from "react";
import { SidebarNav } from "./SidebarNav";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl flex flex-col">
        <div className="flex items-center gap-2 h-14 px-5 border-b border-slate-800">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-white font-bold">A</div>
          <div className="font-bold text-lg tracking-tight text-slate-100">Admin</div>
          <button className="ml-auto text-sm underline" onClick={onClose}>Đóng</button>
        </div>
        <nav className="py-3 overflow-y-auto flex-1">
          <SidebarNav variant="mobile" />
        </nav>
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => { onClose(); signOut({ callbackUrl: "/auth/login" }); }}
            className="w-full group relative flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium text-slate-300 hover:text-red-100 hover:bg-red-900/30 transition-colors"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-transparent group-hover:bg-red-600" />
            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-300" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
