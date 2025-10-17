"use client";

import { useState, useCallback } from "react";
import api from "@/lib/axios";
import { DateRange } from "react-day-picker";

// Dùng chung type với UI
export type Channel = "DINEIN" | "DELIVERY" | "TAKEAWAY" | "ALL";
export type PaymentMethod = "CASH" | "CARD" | "MOMO" | "BANK" | "ALL";

// (tuỳ bạn) kiểu dữ liệu trả về
export type DailySalesGroup = any[];

export function useDailySales() {
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    return { from, to };
  });

  // ✅ gán type union, không dùng string thường
  const [channel, setChannel] = useState<Channel>("ALL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>("ALL");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailySalesGroup>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (date?.from) params.dateFrom = date.from.toISOString();
      if (date?.to) params.dateTo = date.to.toISOString();
      if (channel && channel !== "ALL") params.channel = channel;
      if (paymentMethod && paymentMethod !== "ALL") params.paymentMethod = paymentMethod;

      const res = await api.get("/report/daily-sales", { params });
      setData(res.data?.groups ?? []);
    } catch (err) {
      console.error("❌ Fetch daily sales failed:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date?.from, date?.to, channel, paymentMethod]);

  return {
    date,
    setDate,                     // Dispatch<SetStateAction<DateRange | undefined>>
    channel,                     // Channel
    setChannel,                  // Dispatch<SetStateAction<Channel>>
    paymentMethod,               // PaymentMethod | undefined
    setPaymentMethod,            // Dispatch<SetStateAction<PaymentMethod | undefined>>
    data,
    fetchReport,
    loading,
  };
}
