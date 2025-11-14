// app/admin/SidebarNav.tsx  (CLIENT COMPONENT)
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
  ShoppingCart,
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
      // { label: "Nhập kho", href: "/admin/inventories/purchase" },
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
      {
        label: "Thiết lập chấm công",
        href: "/admin/employee/attendance-setting",
      },
    ],
  },
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
  { label: "Sổ quỹ", href: "/admin/cashbook", icon: Wallet },
  {
    label: "Báo cáo",
    href: "/admin/report",
    icon: BarChart3,
    children: [
      { label: "Bán hàng", href: "/admin/report/sale" },
      { label: "Cuối ngày", href: "/admin/report/closing" },
      { label: "Nhân viên", href: "/admin/report/staff" },
      { label: "Nhà cung cấp", href: "/admin/report/supplier" },
      { label: "Khách hàng", href: "/admin/report/customer" },
      { label: "Xuất kho", href: "/admin/kho-hang/xuat-kho" },
      { label: "Kiểm kê kho", href: "/admin/kho-hang/kiem-ke" },
      { label: "Lịch sử kho", href: "/admin/kho-hang/lich-su" },
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
        const childActive = item.children.some((c) =>
          pathname?.startsWith(c.href)
        );
        if (childActive || pathname?.startsWith(item.href))
          init[item.href] = true;
      }
    });
    setExpanded((prev) => ({ ...prev, ...init }));
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin")
      return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  // prefetch mạnh tay hơn: hover để prefetch sớm
  const PrefetchLink = (props: React.ComponentProps<typeof Link>) => (
    <Link prefetch {...props} onMouseEnter={props.onMouseEnter ?? (() => {})} />
  );

  const renderNav = (onItemClick?: () => void) => (
    <ul className="px-2 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const activeParent =
          isActive(item.href) ||
          (item.children?.length
            ? item.children.some((c) => isActive(c.href))
            : false);
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
                  activeParent
                    ? "bg-sky-500"
                    : "bg-transparent group-hover:bg-slate-600"
                )}
              />
              <Icon
                className={cx(
                  "h-5 w-5 flex-none transition-colors",
                  activeParent
                    ? "text-sky-400"
                    : "text-slate-400 group-hover:text-slate-2 00"
                )}
              />
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
                      <PrefetchLink
                        href={c.href}
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
                            active
                              ? "bg-sky-500"
                              : "bg-transparent group-hover:bg-slate-600"
                          )}
                        />
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

  return (
    <>
      {variant === "desktop" && (
        <>
          <div className="flex items-center gap-2 h-14 px-5 border-b border-slate-800">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-600 text-white font-bold">
              A
            </div>
            <div className="font-bold text-lg tracking-tight text-slate-100">
              Admin
            </div>
          </div>
          <nav className="flex-1 py-3">{renderNav()}</nav>
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
        </>
      )}
    </>
  );
}
