// app/admin/MobileTopBar.tsx  (CLIENT COMPONENT - lazy load)
"use client";
import * as React from "react";
import dynamic from "next/dynamic";

// Lazy-load drawer để không chặn lần tải đầu desktop
const Drawer = dynamic(() => import("./MobileDrawer").then(m => m.MobileDrawer), { ssr: false });

export function MobileTopBar() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-slate-900 text-slate-100 border-b border-slate-800 px-4 h-12">
      <button onClick={() => setOpen(true)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm active:scale-[.98]">
        Menu
      </button>
      <div className="font-semibold">Admin</div>
      {open && <Drawer onClose={() => setOpen(false)} />}
    </div>
  );
}
