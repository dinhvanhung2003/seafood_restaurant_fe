"use client";

import { useEffect, useState } from "react";
import { currency } from "@/utils/money";
import type { Table } from "@/types/types";
import { UtensilsCrossed } from "lucide-react";

type Props = {
  table: Table;
  selected?: boolean;
  onSelect: () => void;
  amount?: number;
  count?: number;
};

/** Parse LOCAL (bỏ offset/Z) */
function minsSinceLocal(iso?: string) {
  if (!iso) return 0;
  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!m) return 0;
  const [, y, mo, d, h, mi, s] = m;
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    s ? Number(s) : 0
  ); // local time
  return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 60000));
}

/** Parse chuẩn có offset (UTC-based) */
function minsSinceStd(iso?: string) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

/** Lấy phút “an toàn” để tránh lệch 7 giờ giữa hai cách parse */
function safeMinsSince(iso?: string) {
  const a = minsSinceLocal(iso);
  const b = minsSinceStd(iso);
  // nếu chênh quá lớn (thường ~420 phút = 7 giờ), lấy giá trị nhỏ hơn
  return Math.min(a, b);
}

function formatDuration(startedAt?: string) {
  const m = safeMinsSince(startedAt);
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  return `${h}g${mm}p`;
}

export function TableCard({ table, selected, onSelect, amount, count }: Props) {
  const total = typeof amount === "number" ? amount : table.currentAmount ?? 0;
  const using = table.status === "using";
  const dur = formatDuration(table.startedAt);

  // tick mỗi phút để cập nhật đếm giờ
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const cardBg =
    selected ? "bg-[#0B63E5] text-white" :
    using    ? "bg-[#E6F0FF] text-slate-900" :
               "bg-white text-slate-900";
  const cardBorder = selected ? "border-[#0B63E5]" : "border-slate-200";
  const stroke = selected ? "#FFFFFF" : "#7890A8";

  const textMain = selected ? "text-white" : "text-slate-900";
  const textSub  = selected ? "text-white/90" : "text-slate-700";

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl border p-3 text-left transition hover:shadow ${cardBg} ${cardBorder}`}
    >
      <div className={`relative h-28 rounded-xl ${selected ? "bg-[#0B63E5]/10" : "bg-slate-50"} flex items-center justify-center`}>
        <svg viewBox="0 0 200 120" className="h-full w-auto" aria-hidden>
          <rect x="18" y="18" rx="16" ry="16" width="164" height="84" fill="none" stroke={stroke} strokeWidth="4" />
          <rect x="12"  y="36" width="4"  height="48" rx="2" fill={stroke} />
          <rect x="184" y="36" width="4"  height="48" rx="2" fill={stroke} />
          <rect x="60"  y="8"   width="36" height="6"  rx="3" fill={stroke} />
          <rect x="104" y="8"   width="36" height="6"  rx="3" fill={stroke} />
          <rect x="60"  y="106" width="36" height="6"  rx="3" fill={stroke} />
          <rect x="104" y="106" width="36" height="6"  rx="3" fill={stroke} />

          <foreignObject x="18" y="18" width="164" height="84">
            <div className="relative w-full h-full">
              {total > 0 && (
                <div className={`absolute left-2 top-1 text-xl font-semibold ${textMain}`}>
                  {currency(total)}
                </div>
              )}
              {!!dur && (
                <div className={`absolute right-2 top-1 text-sm font-semibold ${textMain}`} suppressHydrationWarning>
                  {dur}
                </div>
              )}
              {typeof count === "number" && count > 0 && (
                <div className={`absolute left-2 bottom-1 flex items-center gap-1 text-xl ${textSub}`}>
                  <UtensilsCrossed className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="font-medium">{count}</span>
                </div>
              )}
            </div>
          </foreignObject>
        </svg>
      </div>

      <div className="mt-2 text-center text-sm font-semibold">{table.name}</div>
    </button>
  );
}
