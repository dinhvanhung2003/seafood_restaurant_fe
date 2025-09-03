"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock4, CheckCircle2, ChefHat, Truck } from "lucide-react";
import type { Ticket } from "./page";

type Props = {
  t: Ticket;
  variant: "waiting" | "done";
  onStart?: () => void;
  onComplete?: () => void;
  onServe?: () => void;
};

export default function TicketCard({ t, variant, onStart, onComplete, onServe }: Props) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-800">{t.table}</div>
        <div className="flex items-center gap-2">
          {t.priority === "high" && <Badge className="bg-red-600">Ưu tiên</Badge>}
          <div className="flex items-center text-xs text-slate-500">
            <Clock4 className="mr-1 h-4 w-4" />
            {t.createdAt}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {t.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="truncate">{i + 1}. {it.name}</div>
            <div className="font-semibold">x{it.qty}</div>
          </div>
        ))}
      </div>

      {t.note && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
          📝 {t.note}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {variant === "waiting" ? (
          <>
            <Button size="sm" className="h-8" onClick={onStart}>
              <ChefHat className="mr-2 h-4 w-4" />
              Bắt đầu
            </Button>
            <Button size="sm" variant="secondary" className="h-8" onClick={onComplete}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Hoàn tất
            </Button>
          </>
        ) : (
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-600/90" onClick={onServe}>
            <Truck className="mr-2 h-4 w-4" />
            Cung ứng
          </Button>
        )}
      </div>
    </div>
  );
}
