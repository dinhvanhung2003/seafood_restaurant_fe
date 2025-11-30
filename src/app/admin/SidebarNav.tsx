// app/admin/SidebarNav.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Table as TableIcon,
  CreditCard,
  Users,
  UserCircle,
  Wallet,
  BarChart3,
  Boxes,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

type NavChild = { label: string; href: string };
type NavItem = {
  label: string;
  href: string;
  icon: any;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Hàng hóa",
    href: "/admin/hang-hoa",
    icon: Package,
    children: [
      { label: "Thực đơn", href: "/admin/product/menu" },
      { label: "Danh mục", href: "/admin/product/category" },
      { label: "Combo", href: "/admin/product/combo" },
      { label: "Đơn vị tính", href: "/admin/product/uom" },
      { label: "Khuyến mãi", href: "/admin/product/promotion" },
    ],
  },
  { label: "Phòng/Bàn", href: "/admin/table", icon: TableIcon },
  {
    label: "Giao dịch",
    href: "/admin/giao-dich",
    icon: CreditCard,
    children: [
      { label: "Hóa đơn", href: "/admin/transaction/invoice" },
      { label: "Phiếu trả hàng nhập", href: "/admin/purchasereturn" },
    ],
  },
  {
    label: "Đối tác",
    href: "/admin/doi-tac",
    icon: Users,
    children: [
      { label: "Khách hàng", href: "/admin/customer" },
      { label: "Nhà Cung Cấp", href: "/admin/supplier" },
    ],
  },
  {
    label: "Nhân viên",
    href: "/admin/employee",
    icon: UserCircle,
    children: [
      { label: "Danh sách nhân viên", href: "/admin/employee/list" },
      { label: "Lịch làm việc", href: "/admin/employee/shift" },
      { label: "Bảng chấm công", href: "/admin/employee/attendance" },
      { label: "Bảng lương", href: "/admin/employee/payroll" },
      {
        label: "Thiết lập chấm công",
        href: "/admin/employee/attendance-setting",
      },
    ],
  },
  {
    label: "Kho hàng",
    href: "/admin/kho-hang",
    icon: Boxes,
    children: [
      { label: "Hàng Hóa", href: "/admin/inventories/ingredients" },
      { label: "Nhập kho", href: "/admin/inventories/purchase" },
    ],
  },
  { label: "Sổ quỹ", href: "/admin/cashbook", icon: Wallet },
  {
    label: "Báo cáo",
    href: "/admin/report",
    icon: BarChart3,
    children: [
      // { label: "Bán hàng", href: "/admin/report/sale" },
      { label: "Bán Hàng", href: "/admin/report/closing" },
      { label: "Nhân viên", href: "/admin/report/staff" },
      { label: "Nhà cung cấp", href: "/admin/report/supplier" },
      { label: "Khách hàng", href: "/admin/report/customer" },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SidebarNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const init: Record<string, boolean> = {};
    NAV.forEach((item) => {
      if (item.children?.length) {
        const activeChild = item.children.some((c) =>
          pathname?.startsWith(c.href)
        );
        if (activeChild || pathname?.startsWith(item.href)) {
          init[item.href] = true;
        }
      }
    });
    setExpanded((prev) => ({ ...prev, ...init }));
  }, [pathname]);

  const isActive = (href: string) =>
    pathname ? pathname.startsWith(href) : false;

  const PrefetchLink = (p: React.ComponentProps<typeof Link>) => (
    <Link prefetch {...p} />
  );

  const renderNav = () => (
    <ul className="px-2 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const hasChildren = !!item.children?.length;
        const activeParent =
          isActive(item.href) ||
          (hasChildren && item.children!.some((c) => isActive(c.href)));

        const isExpanded = expanded[item.href];

        return (
          <li key={item.href}>
            <div
              className={cx(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium cursor-pointer transition-colors relative",
                activeParent
                  ? "bg-sky-700/25 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              onClick={() => {
                if (hasChildren) {
                  setExpanded((s) => ({ ...s, [item.href]: !s[item.href] }));
                }
              }}
            >
              <Icon className="h-5 w-5 text-slate-400 group-hover:text-white" />

              {hasChildren ? (
                <span className="truncate">{item.label}</span>
              ) : (
                <PrefetchLink href={item.href} className="truncate">
                  {item.label}
                </PrefetchLink>
              )}

              {hasChildren && (
                <ChevronDown
                  className={cx(
                    "ml-auto h-4 w-4 text-slate-400 transition-transform",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              )}
            </div>

            {hasChildren && isExpanded && (
              <ul className="mt-1 space-y-1 pl-8">
                {item.children!.map((c) => {
                  const active = isActive(c.href);
                  return (
                    <li key={c.href}>
                      <PrefetchLink
                        href={c.href}
                        className={cx(
                          "flex items-center rounded-md px-3 py-2 text-[15px] transition-colors relative",
                          active
                            ? "text-white bg-sky-700/20"
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        {c.label}
                      </PrefetchLink>
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

  // 👉 DESKTOP
  if (variant === "desktop") {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 h-14 px-5 border-b border-slate-800">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-white font-bold">
            A
          </div>
          <div className="font-bold text-lg text-white">Admin</div>
        </div>

        {/* NAV có scroll riêng */}
        <nav className="flex-1 overflow-y-auto py-3">{renderNav()}</nav>

        {/* Logout */}
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="group flex items-center gap-3 w-full px-3 py-2 rounded-md text-slate-300 hover:text-red-200 hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    );
  }

  // 👉 MOBILE: chỉ cần list menu, header + logout đã có ở MobileDrawer
  if (variant === "mobile") {
    return (
      <nav className="py-2 overflow-y-auto flex-1 min-h-0">{renderNav()}</nav>
    );
  }

  return null;
}
