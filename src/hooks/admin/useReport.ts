'use client';

import { useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { DateRange } from "react-day-picker";

export function useReport() {
  const [mode, setMode] = useState<"revenue" | "items">("revenue");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; pages: number } | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [channel, setChannel] = useState("DINEIN");
  const [summary, setSummary] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Request sequencing to avoid race conditions (ignore stale responses)
  const seq = useRef(0);

  // Core fetch that can accept an explicit page number (prevents stale page from closure)
  const fetchCore = useCallback(async (pageArg?: number) => {
    const usePage = pageArg ?? page;
    const mySeq = ++seq.current;
    console.log("📡 Fetching report...", { from: date?.from, to: date?.to, channel, mode, page: usePage, limit });
    setLoading(true);
    try {
      if (mode === 'revenue') {
        const params: any = {
          dateFrom: date?.from?.toISOString(),
          dateTo: date?.to?.toISOString(),
          page: usePage,
          limit,
        };
        if (channel && channel !== "ALL") params.channel = channel;
        const res = await api.get("/report/sales-by-staff", { params });
        if (seq.current !== mySeq) return; // stale
        const body = res.data?.data ?? res.data;
        setRows(body.rows ?? []);
        setSummary(body.header ?? {});
        setMeta(res.data?.meta ? {
          total: res.data.meta.total,
          page: res.data.meta.page,
          limit: res.data.meta.limit,
          pages: res.data.meta.pages,
        } : undefined);
      } else {
        const params: any = {
          dateFrom: date?.from?.toISOString(),
          dateTo: date?.to?.toISOString(),
          page: usePage,
          limit,
        };
        if (channel && channel !== "ALL") params.channel = channel;
        const res = await api.get("/report/sales-by-staff/items", { params });
        if (seq.current !== mySeq) return; // stale
        const body = res.data?.data ?? res.data;
        setGroups(body.groups ?? []);
        setSummary(body.header ?? {});
        setMeta(res.data?.meta ? {
          total: res.data.meta.total,
          page: res.data.meta.page,
          limit: res.data.meta.limit,
          pages: res.data.meta.pages,
        } : undefined);
      }
      console.log("✅ Staff report fetched", { mode, page: usePage });
    } catch (error) {
      const err = error as any;
      const msg = err?.response?.data?.message || err?.message || "Lỗi máy chủ";
      console.error("❌ Lỗi khi gọi API báo cáo:", msg, err?.response?.data);
    } finally {
      // only hide loading if this is the latest request
      if (seq.current === mySeq) setLoading(false);
    }
  }, [date?.from, date?.to, channel, mode, page, limit]);

  // Public fetch: nếu page bị thay đổi thủ công (phân trang) thì chỉ gọi _fetch
  const fetchReport = useCallback(() => {
    // reset filters shouldn't be used here; consumers call resetAndFetch
    fetchCore();
  }, [fetchCore]);

  // Khi thay đổi bộ lọc/mode -> reset page về 1 rồi fetch
  const resetAndFetch = useCallback(() => {
    setPage(1);
    fetchCore(1);
  }, [fetchCore]);

  // Public helpers for pagination to ensure fetch uses the new page immediately
  const goPage = useCallback((p: number) => {
    const next = Math.max(1, p);
    setPage(next);
    fetchCore(next);
  }, [fetchCore]);

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
    fetchReport: resetAndFetch,
    page,
    setPage,
    limit,
    setLimit,
    meta,
    refetchPage: fetchReport,
    goPage,
  };
}
