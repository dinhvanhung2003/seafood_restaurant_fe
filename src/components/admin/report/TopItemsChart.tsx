"use client";
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import axios from '@/lib/axios';
import { RangeKey, RangeSelect } from './RangeSelect';

type Row = { name: string; value: number };

export default function TopItemsChart() {
  const [range, setRange] = useState<RangeKey>('last7');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    axios.get('/report/dashboard/top-items', { params: { range, by: 'qty', limit: 10 } })
      .then(res => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [range]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">TOP 10 HÀNG HÓA BÁN CHẠY</div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 80, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={200} tickLine={false} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="value">
             <LabelList
  dataKey="value"
  position="right"
  formatter={(label: React.ReactNode) => {
    // ép về số nếu được, còn không thì trả nguyên label
    const n = Number(label as any);
    return Number.isFinite(n) ? n.toLocaleString() : (label ?? '') as any;
  }}
/>

            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
