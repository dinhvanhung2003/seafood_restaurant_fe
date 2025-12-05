"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ArrowUp, ArrowDown, DollarSign, Edit3 } from "lucide-react";

type KPI = { revenue: number; ordersDone: number; inService: number };

function pctChange(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export default function SalesKPI() {
  const [today, setToday] = useState<KPI | null>(null);
  const [yesterday, setYesterday] = useState<KPI | null>(null);

  useEffect(() => {
    api
      .get("/report/dashboard/summary", { params: { range: "today" } })
      .then((r) => setToday(r.data));
    api
      .get("/report/dashboard/summary", { params: { range: "yesterday" } })
      .then((r) => setYesterday(r.data));
  }, []);

  if (!today || !yesterday) return <>Loading...</>;

  const items = [
    {
      key: "done" as const,
      title: "Đơn đã xong",
      icon: <DollarSign className="text-blue-500" size={32} />,
      today: today.ordersDone,
      yesterday: yesterday.ordersDone,
      showCompare: true,
      note: "So với hôm qua",
    },
    {
      key: "inService" as const,
      title: "Đơn đang phục vụ",
      icon: <Edit3 className="text-green-500" size={32} />,
      today: today.inService,
      yesterday: yesterday.inService,
      showCompare: false,
      note: "Đơn đang mở trên bàn hiện tại",
    },
  ];

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
      <div className="text-sm sm:text-base font-semibold mb-4 sm:mb-6 text-center sm:text-left">
        KẾT QUẢ BÁN HÀNG HÔM NAY
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
        {items.map((i, idx) => {
          const pct = i.showCompare ? pctChange(i.today, i.yesterday) : 0;
          const Up = pct >= 0;

          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 py-4 px-2 sm:px-4 text-center"
            >
              <div className="mb-1">{i.icon}</div>
              <div className="font-semibold text-sm sm:text-base">
                {i.title}
              </div>

              <div className="text-xl sm:text-2xl font-bold">{i.today}</div>

              {i.showCompare ? (
                <>
                  <div
                    className={`flex items-center gap-1 text-xs sm:text-sm ${
                      Up ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {Up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {pct}%
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500">
                    Hôm qua {i.yesterday}
                  </div>
                </>
              ) : (
                <div className="text-[11px] sm:text-xs text-gray-500">
                  {i.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
