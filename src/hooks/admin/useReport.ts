'use client';

import { useState } from "react";
import api from "@/lib/axios";
import { DateRange } from "react-day-picker";

export function useReport() {
  const [mode, setMode] = useState<"revenue" | "items">("revenue");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [channel, setChannel] = useState("DINEIN");
  const [summary, setSummary] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const fetchReport = async () => {
    console.log("📡 Fetching report...", { from: date?.from, to: date?.to, channel });
    setLoading(true);
    try {
      const [sales, items] = await Promise.all([
        api.get("/report/sales-by-staff", {
          params: {
            dateFrom: date?.from?.toISOString(),
            dateTo: date?.to?.toISOString(),
            channel,
          },
        }),
        api.get("/report/sales-by-staff/items", {
          params: {
            dateFrom: date?.from?.toISOString(),
            dateTo: date?.to?.toISOString(),
            channel,
          },
        }),
      ]);

      setRows(sales.data.rows);
      setGroups(items.data.groups);
      setSummary({
        ...sales.data.header,
        detail: items.data.header,
      });

      console.log("✅ Report fetched:", sales.data, items.data);
    } catch (error) {
      console.error("❌ Lỗi khi gọi API báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    loading,
    date,
    setDate,
    channel,
    setChannel,
    summary,
    rows,
    groups,
    fetchReport,
  };
}
