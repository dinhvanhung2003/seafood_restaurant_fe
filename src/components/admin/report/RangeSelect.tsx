
"use client";
import { useState } from 'react';

export type RangeKey = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';

const LABELS: Record<RangeKey, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  last7: '7 ngày qua',
  thisMonth: 'Tháng này',
  lastMonth: 'Tháng trước',
};

export function RangeSelect({
  value,
  onChange,
}: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="px-3 py-1.5 rounded-md border text-sm" onClick={() => setOpen(o => !o)}>
        {LABELS[value]}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border bg-white shadow">
          {(Object.keys(LABELS) as RangeKey[]).map(k => (
            <button
              key={k}
              className="block w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
              onClick={() => { onChange(k); setOpen(false); }}
            >
              {LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
