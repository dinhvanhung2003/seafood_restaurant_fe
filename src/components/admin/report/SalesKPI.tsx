"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ArrowUp, ArrowDown, DollarSign, Edit3, Users } from "lucide-react";

type KPI = { revenue: number; ordersDone: number; inService: number; customers: number };

function pctChange(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export default function SalesKPI() {
  const [today, setToday] = useState<KPI | null>(null);
  const [yesterday, setYesterday] = useState<KPI | null>(null);

  useEffect(() => {
    api.get("/report/dashboard/summary", { params: { range: "today" } }).then((r) => setToday(r.data));
    api.get("/report/dashboard/summary", { params: { range: "yesterday" } }).then((r) => setYesterday(r.data));
  }, []);

  if (!today || !yesterday) return <>Loading...</>;

  const items = [
    {
      title: "Đơn đã xong",
      icon: <DollarSign className="text-blue-500" size={32} />,
      today: today.ordersDone,
      yesterday: yesterday.ordersDone,
    },
    {
      title: "Đơn đang phục vụ",
      icon: <Edit3 className="text-green-500" size={32} />,
      today: today.inService,
      yesterday: yesterday.inService,
    },
    {
      title: "Khách hàng",
      icon: <Users className="text-cyan-500" size={32} />,
      today: today.customers,
      yesterday: yesterday.customers,
    },
  ];

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
      <div className="text-sm sm:text-base font-semibold mb-4 sm:mb-6 text-center sm:text-left">
        KẾT QUẢ BÁN HÀNG HÔM NAY
      </div>

      {/* mobile: 1 cột, >=sm: 3 cột, có line ngăn cách */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
        {items.map((i, idx) => {
          const pct = pctChange(i.today, i.yesterday);
          const Up = pct >= 0;

          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 py-4 px-2 sm:px-4 text-center"
            >
              <div className="mb-1">{i.icon}</div>
              <div className="font-semibold text-sm sm:text-base">{i.title}</div>

              <div className="text-xl sm:text-2xl font-bold">{i.today}</div>

              <div
                className={`flex items-center gap-1 text-xs sm:text-sm ${
                  Up ? "text-green-600" : "text-red-600"
                }`}
              >
                {Up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {pct}%
              </div>

              <div className="text-[11px] sm:text-xs text-gray-500">Hôm qua {i.yesterday}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
