"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Table,
  CreditCard,
  Users,
  UserCircle,
  ShoppingCart,
  Wallet,
  BarChart3,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const NAV = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Hàng hóa", href: "/admin/hang-hoa", icon: Package },
  { label: "Phòng/Bàn", href: "/admin/table", icon: Table },
  { label: "Giao dịch", href: "/admin/giao-dich", icon: CreditCard },
  { label: "Đối tác", href: "/admin/doi-tac", icon: Users },
  { label: "Nhân viên", href: "/admin/nhan-vien", icon: UserCircle },
  { label: "Bán Online", href: "/admin/ban-online", icon: ShoppingCart },
  { label: "Sổ quỹ", href: "/admin/so-quy", icon: Wallet },
  { label: "Báo cáo", href: "/admin/bao-cao", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-white">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 px-5 h-14 border-b">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white font-bold">A</div>
          <div className="font-bold text-lg tracking-tight">Admin</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          <ul className="px-2 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-base md:text-lg font-medium transition",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {/* Thanh active bên trái */}
                    <span
                      className={cx(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r",
                        active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300"
                      )}
                    />
                    <Icon className="h-5 w-5 text-blue-600" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Top bar on mobile */}
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-white border-b px-4 h-12">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border px-3 py-1.5 text-sm bg-white active:scale-[.98]"
        >
          Menu
        </button>
        <div className="font-semibold">Admin</div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r bg-white shadow-md">
            <div className="flex items-center gap-2 px-5 h-14 border-b">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white font-bold">A</div>
              <div className="font-bold text-lg tracking-tight">Admin</div>
              <button className="ml-auto text-sm underline" onClick={() => setOpen(false)}>
                Đóng
              </button>
            </div>
            <nav className="py-4">
              <ul className="px-2 space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cx(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-base md:text-lg font-medium transition",
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span
                          className={cx(
                            "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r",
                            active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300"
                          )}
                        />
                        <Icon className="h-5 w-5 text-blue-600" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
