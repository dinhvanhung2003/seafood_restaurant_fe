// app/admin/AdminLayout.tsx  (SERVER COMPONENT - KHÔNG "use client")
import React from "react";
import { SidebarNav } from "./SidebarNav";
import { MobileTopBar } from "@/app/admin/MobileTopNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
        <SidebarNav variant="desktop" />
      </aside>

      {/* Top bar mobile */}
      <MobileTopBar />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
