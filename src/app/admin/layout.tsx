"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Tổng quan", href: "/admin" },
    { label: "Hàng hóa", href: "/admin/hang-hoa" },
    { label: "Phòng/Bàn", href: "/admin/table" },
    { label: "Giao dịch", href: "/admin/giao-dich" },
    { label: "Đối tác", href: "/admin/doi-tac" },
    { label: "Nhân viên", href: "/admin/nhan-vien" },
    { label: "Bán Online", href: "/admin/ban-online" },
    { label: "Sổ quỹ", href: "/admin/so-quy" },
    { label: "Báo cáo", href: "/admin/bao-cao" },
  ];

  const isActive = (href: string) => {
  if (!pathname) return false; 
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname.startsWith(href);
};


  return (
    <div className="min-h-screen bg-muted/10 ">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 shadow-sm flex justify-center">
        <div className="w-full bg-blue-600">
          <div className="mx-auto max-w-screen-2xl px-3">
           <nav className="flex justify-center items-center gap-1 py-2 overflow-x-auto no-scrollbar">

              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cx(
                    "rounded-2xl px-4 py-2 font-medium text-white/95 hover:text-white",
                    "data-[state=open]:bg-blue-700",
                    isActive(item.href)
                      ? "bg-blue-700 shadow-inner hover:bg-blue-700"
                      : "hover:bg-blue-500/40"
                  )}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</main>
    </div>
  );
}

/** Optional: hide scrollbar for the nav when it overflows */
// Add this to your globals.css if you like the clean look:
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
