"use client";

import { minsSince, currency } from "@/utils/money";
import type { Table } from "@/types/types";

type Props = {
  table: Table;
  selected?: boolean;
  onSelect: () => void;
  amount?: number; // tổng tiền truyền từ trên (nếu có)
  count?: number;  // số khách/số món hiển thị cạnh icon
};

function formatDuration(startedAt?: string) {
  if (!startedAt) return "";
  const m = minsSince(startedAt);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}g${mm}p`;
}

export function TableCard({ table, selected, onSelect, amount, count }: Props) {
  const total = typeof amount === "number" ? amount : (table.currentAmount ?? 0);
  const using = table.status === "using";
  const dur = formatDuration(table.startedAt);

  // màu theo trạng thái
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
      {/* Khung bàn (tăng size để “bàn to” hơn) */}
      <div className={`relative h-28 rounded-xl ${selected ? "bg-[#0B63E5]/10" : "bg-slate-50"} flex items-center justify-center`}>
        {/* SVG chiếc bàn */}
        <svg viewBox="0 0 200 120" className="h-full w-auto" aria-hidden>
          {/* mặt bàn 164x84 tại (18,18) */}
          <rect x="18" y="18" rx="16" ry="16" width="164" height="84" fill="none" stroke={stroke} strokeWidth="4" />
          {/* cạnh trái/phải */}
          <rect x="12"  y="36" width="4"  height="48" rx="2" fill={stroke} />
          <rect x="184" y="36" width="4"  height="48" rx="2" fill={stroke} />
          {/* thanh top/bottom */}
          <rect x="60"  y="8"   width="36" height="6"  rx="3" fill={stroke} />
          <rect x="104" y="8"   width="36" height="6"  rx="3" fill={stroke} />
          <rect x="60"  y="106" width="36" height="6"  rx="3" fill={stroke} />
          <rect x="104" y="106" width="36" height="6"  rx="3" fill={stroke} />

          {/* Overlay NẰM TRONG MẶT BÀN: foreignObject bọc đúng vùng 164x84 ⇒ không bao giờ tràn */}
          <foreignObject x="18" y="18" width="164" height="84">
            <div className="relative w-full h-full">
              {/* tiền: góc trái trên */}
              {total > 0 && (
                <div className={`absolute left-2 top-1 text-xl font-semibold ${textMain}`}>
                  {currency(total)}
                </div>
              )}

              {/* thời lượng: góc phải trên */}
              {!!dur && (
                <div className={`absolute right-2 top-1 text-xl font-semibold ${textMain}`} suppressHydrationWarning>
                  {dur}
                </div>
              )}

              {/* icon muỗng–nĩa + số: góc trái dưới */}
              {typeof count === "number" && count > 0 && (
                <div className={`absolute left-2 bottom-1 flex items-center gap-1 text-xl ${textSub}`}>
                  {/* icon inline để ăn theo màu currentColor */}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 3v7a2 2 0 0 0 2 2h1V3M11 3v9M18 3l-3 6h6l-3 6" />
                  </svg>
                  <span className="font-medium">{count}</span>
                </div>
              )}
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* tên bàn */}
      <div className="mt-2 text-center text-sm font-semibold">{table.name}</div>
    </button>
  );
}
