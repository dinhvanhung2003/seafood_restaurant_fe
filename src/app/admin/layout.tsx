// app/admin/AdminLayout.tsx  (SERVER COMPONENT)
import React from "react";
import { SidebarNav } from "./SidebarNav";
import { MobileTopBar } from "@/app/admin/MobileTopNav";
import  AdminChatWidget  from "@/components/admin/chat/AdminChatWidget";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
        <SidebarNav variant="desktop" />
      </aside>

      {/* Cột bên phải: topbar mobile + content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar chỉ hiện trên mobile */}
        <MobileTopBar />

        {/* Content scroll theo chiều dọc, không trượt navbar */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
            <AdminChatWidget />
        </main>
      </div>
    </div>
  );
}
