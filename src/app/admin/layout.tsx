"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Table as TableIcon, CreditCard, Users, UserCircle,
  ShoppingCart, Wallet, BarChart3, Boxes, ChevronDown, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; icon: any; children?: NavChild[] };

const NAV: NavItem[] = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Hàng hóa", href: "/admin/hang-hoa", icon: Package,

 children: [
     
      { label: "Thực đơn", href: "/admin/product/menu" },
      { label: "Danh mục", href: "/admin/product/category" },
      { label: "Combo", href: "/admin/kho-hang/kiem-ke" },
    ],
  

   },
  { label: "Phòng/Bàn", href: "/admin/table", icon: TableIcon },
  { label: "Giao dịch", href: "/admin/giao-dich", icon: CreditCard,

 children: [
      { label: "Hóa đơn", href: "/admin/transaction/invoice" },
      { label: "Nhập kho", href: "/admin/inventories/purchase" },
      
    ],

   },
  { label: "Đối tác", href: "/admin/doi-tac", icon: Users,
children: [
      { label: "Khách hàng", href: "/admin/customer" },
      { label: "Nhà Cung Cấp", href: "/admin/supplier" },
     
    ],


   },
  { label: "Nhân viên", href: "/admin/employee", icon: UserCircle },
  { label: "Bán Online", href: "/admin/ban-online", icon: ShoppingCart },
  {
    label: "Kho hàng",
    href: "/admin/kho-hang",
    icon: Boxes,
    children: [
      { label: "Danh sách tồn kho", href: "/admin/inventories/list" },
      { label: "Nhập kho", href: "/admin/inventories/purchase" },
      { label: "Xuất kho", href: "/admin/kho-hang/xuat-kho" },
      { label: "Kiểm kê kho", href: "/admin/kho-hang/kiem-ke" },
      { label: "Lịch sử kho", href: "/admin/kho-hang/lich-su" },
    ],
  },
  { label: "Sổ quỹ", href: "/admin/so-quy", icon: Wallet },
  { label: "Báo cáo", href: "/admin/bao-cao", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const init: Record<string, boolean> = {};
    NAV.forEach((item) => {
      if (item.children?.length) {
        const childActive = item.children.some((c) => pathname?.startsWith(c.href));
        if (childActive || pathname?.startsWith(item.href)) init[item.href] = true;
      }
    });
    setExpanded((prev) => ({ ...prev, ...init }));
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  const renderNav = (onItemClick?: () => void) => (
    <ul className="px-2 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const activeParent =
          isActive(item.href) ||
          (item.children?.length ? item.children.some((c) => isActive(c.href)) : false);
        const hasChildren = !!item.children?.length;
        const isExpanded = expanded[item.href];

        return (
          <li key={item.href}>
            <div
              className={cx(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium transition-colors cursor-pointer",
                activeParent
                  ? "bg-sky-700/25 text-slate-50"
                  : "text-slate-300 hover:text-slate-50 hover:bg-slate-800"
              )}
              onClick={() => {
                if (hasChildren) {
                  setExpanded((s) => ({ ...s, [item.href]: !s[item.href] }));
                } else {
                  onItemClick?.();
                }
              }}
            >
              <span
                className={cx(
                  "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r transition-colors",
                  activeParent ? "bg-sky-500" : "bg-transparent group-hover:bg-slate-600"
                )}
              />
              <Icon
                className={cx(
                  "h-5 w-5 flex-none transition-colors",
                  activeParent ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {hasChildren ? (
                <span className="truncate">{item.label}</span>
              ) : (
                <Link href={item.href} className="truncate" onClick={onItemClick}>
                  {item.label}
                </Link>
              )}
              {hasChildren && (
                <ChevronDown
                  className={cx(
                    "ml-auto h-4 w-4 transition-transform text-slate-400",
                    isExpanded ? "rotate-180" : "rotate-0"
                  )}
                />
              )}
            </div>

            {hasChildren && isExpanded && (
              <ul className="mt-1 space-y-1 pl-9">
                {item.children!.map((c) => {
                  const active = isActive(c.href);
                  return (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={onItemClick}
                        className={cx(
                          "group relative flex items-center rounded-md px-3 py-2 text-[15px] transition-colors",
                          active
                            ? "text-slate-50 bg-sky-700/20"
                            : "text-slate-300 hover:text-slate-50 hover:bg-slate-800"
                        )}
                      >
                        <span
                          className={cx(
                            "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r",
                            active ? "bg-sky-500" : "bg-transparent group-hover:bg-slate-600"
                          )}
                        />
                        {c.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
        <div className="flex items-center gap-2 h-14 px-5 border-b border-slate-800">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-white font-bold">A</div>
          <div className="font-bold text-lg tracking-tight text-slate-100">Admin</div>
        </div>
        <nav className="flex-1 py-3">{renderNav()}</nav>

        {/* Logout (desktop) */}
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full group relative flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium text-slate-300 hover:text-red-100 hover:bg-red-900/30 transition-colors"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-transparent group-hover:bg-red-600" />
            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-300" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-slate-900 text-slate-100 border-b border-slate-800 px-4 h-12">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm active:scale-[.98]"
        >
          Menu
        </button>
        <div className="font-semibold">Admin</div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl flex flex-col">
            <div className="flex items-center gap-2 h-14 px-5 border-b border-slate-800">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-white font-bold">A</div>
              <div className="font-bold text-lg tracking-tight text-slate-100">Admin</div>
              <button className="ml-auto text-sm underline" onClick={() => setOpen(false)}>
                Đóng
              </button>
            </div>
            <nav className="py-3 overflow-y-auto flex-1">
              {renderNav(() => setOpen(false))}
            </nav>

            <div className="p-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/auth/login" });
                }}
                className="w-full group relative flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium text-slate-300 hover:text-red-100 hover:bg-red-900/30 transition-colors"
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-transparent group-hover:bg-red-600" />
                <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-300" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
