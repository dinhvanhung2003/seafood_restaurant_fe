// src/components/cashier/notify/NotifyHistoryDrawer.tsx
"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { HistoryItem } from "@/hooks/cashier/useKitchenHistory";

export function NotifyHistoryDrawer({
  open, onOpenChange, data,
}: { open: boolean; onOpenChange: (v:boolean)=>void; data: HistoryItem[] }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="text-lg">LỊCH SỬ BÁO BẾP</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {data.map(b => (
            <div key={b.id} className="rounded-lg border">
              <div className="px-4 py-3">
                <div className="text-xs text-slate-500">
                  {format(new Date(b.createdAt), "dd/MM/yyyy HH:mm",
                // { locale: undefined }
                )}
                </div>
                <div className="font-medium mt-0.5">{b.staff} thông báo bếp</div>
              </div>
              <div className="border-t px-4 py-2 space-y-1">
                {b.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-700">+ {it.qty} {it.name}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 flex items-center justify-end text-slate-500">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
          {!data.length && <div className="text-sm text-slate-500 px-4">Chưa có lịch sử.</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
