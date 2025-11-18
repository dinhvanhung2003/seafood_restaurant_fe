"use client";

import React from "react";
import { useAreas } from "@/hooks/cashier/useAreas";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// export type Channel = "ALL" | "DINEIN" | "DELIVERY" | "TAKEAWAY";
export type PaymentMethod = "ALL" | "CASH" | "TRANSFER";

export function ClosingFilter({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  mode,
  setMode,
  //   channel,
  //   setChannel,
  paymentMethod,
  setPaymentMethod,
  areaId,
  setAreaId,
  tableId,
  setTableId,
  fetchReport,
  loading,
}: {
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  mode: "sales" | "cashbook" | "cancel";
  setMode: (m: "sales" | "cashbook" | "cancel") => void;
  //   channel: Channel;
  //   setChannel: (v: Channel) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  areaId?: string;
  setAreaId: (v: string | undefined) => void;
  tableId?: string;
  setTableId: (v: string | undefined) => void;
  fetchReport: () => void | Promise<void>;
  loading: boolean;
}) {
  // Auto-run report whenever filters change (debounced)
  // React.useEffect(() => {
  //   const t = setTimeout(() => {
  //     fetchReport();
  //   }, 300);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [dateFrom, dateTo, mode, paymentMethod, areaId, tableId]);

  // Fetch areas (with tables) for cascading selects
  const { data: areas = [], isLoading: loadingAreas } = useAreas();
  const tables = React.useMemo(() => {
    const a = areas.find((a) => a.id === areaId);
    return a?.tables ?? [];
  }, [areas, areaId]);

  function handleSelectArea(v: string) {
    if (v === "ALL") {
      setAreaId(undefined);
      setTableId(undefined);
    } else {
      setAreaId(v);
      setTableId(undefined); // reset table when area changes
    }
  }

  function handleSelectTable(v: string) {
    if (v === "ALL") setTableId(undefined);
    else setTableId(v);
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-lg bg-black/70 text-white px-5 py-3 shadow-lg ring-1 ring-white/20">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-semibold tracking-wide">
                Đang tải báo cáo...
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_220px_minmax(260px,1fr)_180px_180px_200px] items-end">
        <div>
          <label className="text-sm text-slate-600">Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Mối quan tâm</label>
          <RadioGroup
            className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-3"
            value={mode}
            onValueChange={(v) => setMode(v as any)}
          >
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="sales" id="m-sales" />
              <span>Bán hàng</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="cashbook" id="m-cash" />
              <span>Thu chi</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="cancel" id="m-cancel" />
              <span>Hủy món</span>
            </label>
          </RadioGroup>
        </div>

        {mode === "sales" && (
          <div>
            <label className="text-sm text-slate-600">PT thanh toán</label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="CASH">Tiền mặt</SelectItem>
                <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {mode !== "cashbook" && (
          <>
            {/* Area filter */}
            <div>
              <label className="text-sm text-slate-600">Khu vực</label>
              <Select value={areaId ?? "ALL"} onValueChange={handleSelectArea}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue
                    placeholder={loadingAreas ? "Đang tải..." : "Tất cả"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table filter (depends on area) */}
            <div>
              <label className="text-sm text-slate-600">Bàn</label>
              <Select
                value={tableId ?? "ALL"}
                onValueChange={handleSelectTable}
                disabled={!areaId || tables.length === 0}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue
                    placeholder={
                      !areaId
                        ? "Chọn khu vực trước"
                        : tables.length === 0
                        ? "Không có bàn"
                        : "Tất cả"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </>
  );
}
