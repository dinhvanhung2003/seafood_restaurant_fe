"use client";
import React, { type Dispatch, type SetStateAction } from "react";
import { currency } from "@/utils/money";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

export interface ClosingRow {
  orderId: string;
  createdAt: string;
  tableName?: string;
  itemCount: number;
  revenue: number;
  serviceFee?: number;
  tax?: number;
  returnFee?: number;
  paidAmount?: number;
  payMethod?: string;
  invoiceDiscount: number;
}

type Mode = "sales" | "cashbook" | "cancel";

type SalesSummary = {
  goodsAmount: number;
  invoiceDiscount: number;
  revenue: number;
  otherIncome: number;
  tax: number;
  returnFee: number;
};

function payMethodLabel(code?: string) {
  switch (String(code || "").toUpperCase()) {
    case "CASH":
      return "Tiền mặt";
    case "VIETQR":
      return "Chuyển khoản";
    case "BANK":
      return "Chuyển khoản";
    default:
      return "Khác";
  }
}

// Format currency on axis ticks and labels
function axisCurrency(value: number) {
  try {
    return currency(Number(value));
  } catch {
    return String(value);
  }
}

interface CancelSummary {
  cancelQty: number;
  cancelValue: number;
  totalCount: number;
}
interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
interface CashbookSummary {
  openingBalance?: number;
  totalReceipt?: number; // BE field
  totalPayment?: number; // BE field
  closingBalance?: number;
  // legacy fallback fields
  receipt?: number;
  payment?: number;
  totalCount?: number;
}

export default function ClosingTable({
  salesSummary,
  cancelSummary,
  cashbookSummary,
  meta,
  mode,
  rows,
  page,
  setPage,
  limit,
  setLimit,
}: {
  mode: Mode;
  rows: any[];
  salesSummary?: SalesSummary;
  cancelSummary?: CancelSummary;
  cashbookSummary?: CashbookSummary;
  meta?: Meta;
  page?: number;
  setPage?: Dispatch<SetStateAction<number>>;
  setLimit?: Dispatch<SetStateAction<number>>;
  limit?: number;
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border p-6 text-center text-slate-500">
        Không có dữ liệu
      </div>
    );
  }

  if (mode === "sales") {
    // Use server-side pagination
    const list = rows as ClosingRow[];
    const sum = salesSummary;
    const currentPage = page || meta?.page || 1;
    const pages = meta?.pages || 1;
    const perPage = limit || meta?.limit || list.length;
    // rows are already paginated from server; don't slice if meta is present
    const start = (currentPage - 1) * perPage;
    const pageRows = meta ? list : list.slice(start, start + perPage);

    const goPrev = () => setPage?.((p) => Math.max(1, (p ?? currentPage) - 1));
    const goNext = () =>
      setPage?.((p) => Math.min(pages, (p ?? currentPage) + 1));

    // payment method distribution by revenue
    const pmAgg = list.reduce<Record<string, number>>((acc, r) => {
      const key = payMethodLabel(r.payMethod || "-");
      acc[key] = (acc[key] || 0) + Number(r.revenue || 0);
      return acc;
    }, {});
    const pmData = Object.entries(pmAgg).map(([name, value]) => ({
      name,
      value,
    }));
    const pmColors = [
      "#22c55e",
      "#06b6d4",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#64748b",
    ];

    return (
      <div className="rounded-xl border overflow-auto">
        {sum && (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Giá trị hàng</div>
              <div className="mt-1 text-lg font-semibold">
                {currency(sum.goodsAmount)}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Giảm hóa đơn</div>
              <div className="mt-1 text-lg font-semibold">
                {currency(sum.invoiceDiscount)}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Doanh thu</div>
              <div className="mt-1 text-lg font-semibold">
                {currency(sum.revenue)}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Hóa đơn</div>
              <div className="mt-1 text-lg font-semibold">
                {meta?.total ?? list.length}
              </div>
            </div>
            <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Giá trị hàng", value: sum.goodsAmount },
                        { name: "Giảm HĐ", value: sum.invoiceDiscount },
                        { name: "Doanh thu", value: sum.revenue },
                      ]}
                      margin={{ top: 8, right: 8, bottom: 0, left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={96}
                        tickMargin={8}
                        tickFormatter={axisCurrency as any}
                      />
                      <RTooltip formatter={(v: any) => currency(Number(v))} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="#60a5fa" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#06b6d4" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={pmData}
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        labelLine
                        label={(p: any) => `${currency(Number(p.value))}`}
                      >
                        {pmData.map((_, i) => (
                          <Cell
                            key={`pm-${i}`}
                            fill={pmColors[i % pmColors.length]}
                          />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                      />
                      <RTooltip formatter={(v: any) => currency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Mã chứng từ</th>
              <th className="px-3 py-2 text-left">Thời gian</th>
              <th className="px-3 py-2 text-left">Phòng/Bàn</th>
              <th className="px-3 py-2 text-right">SLSP</th>
              <th className="px-3 py-2 text-right">Doanh thu</th>
              <th className="px-3 text-right">Giảm Giá</th>
              <th className="px-3 py-2 text-right">PT thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r: any, idx: number) => {
              const idText =
                String(
                  r?.orderId ?? r?.docCode ?? r?.code ?? r?.id ?? ""
                ).slice(0, 8) || "-";
              const iso = r?.createdAt ?? r?.occurredAt ?? null;
              const timeText = iso
                ? format(new Date(iso), "dd/MM/yyyy HH:mm")
                : r?.time ?? "-";
              const tbl = r?.tableName ?? r?.place ?? "-";
              const count = Number(
                r?.itemCount ?? r?.itemsCount ?? r?.qty ?? 0
              );
              const revenue = Number(r?.revenue ?? 0);
              const discount = Number(r?.invoiceDiscount ?? 0);
              const pm = payMethodLabel(r?.payMethod);
              return (
                <tr key={`${idText}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{idText}</td>
                  <td className="px-3 py-2">{timeText}</td>
                  <td className="px-3 py-2">{tbl}</td>
                  <td className="px-3 py-2 text-right">{count}</td>
                  <td className="px-3 py-2 text-right">{currency(revenue)}</td>
                  <td className="px-3 py-2 text-right">{currency(discount)}</td>
                  <td className="px-3 py-2 text-right">{pm}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination className="px-3 py-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goPrev();
                }}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {currentPage} / {pages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                className={
                  currentPage >= pages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  if (mode === "cashbook") {
    // server-side pagination aware
    const currentPage = page || meta?.page || 1;
    const pages = meta?.pages || 1;
    const perPage = limit || meta?.limit || rows.length;
    const start = (currentPage - 1) * perPage;
    // rows from server are already paginated; don't slice if meta is present
    const pageRows = meta ? rows : rows.slice(start, start + perPage);

    const goPrev = () => setPage?.((p) => Math.max(1, (p ?? currentPage) - 1));
    const goNext = () =>
      setPage?.((p) => Math.min(pages, (p ?? currentPage) + 1));

    // Prefer server summary fields if present
    const receiptValue = (cashbookSummary?.totalReceipt ??
      cashbookSummary?.receipt ??
      0) as number;
    const paymentValue = (cashbookSummary?.totalPayment ??
      cashbookSummary?.payment ??
      0) as number;
    const net = receiptValue - paymentValue;
    const chartData = [
      { name: "Thu", value: receiptValue },
      { name: "Chi", value: paymentValue },
    ];

    return (
      <div className="rounded-xl border">
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-5">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Tổng thu</div>
            <div className="mt-1 text-lg font-semibold text-emerald-600">
              {currency(receiptValue)}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Tổng chi</div>
            <div className="mt-1 text-lg font-semibold text-rose-600">
              {currency(paymentValue)}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Chênh lệch</div>
            <div
              className={`mt-1 text-lg font-semibold ${
                net >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {currency(net)}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Số phiếu</div>
            <div className="mt-1 text-lg font-semibold">
              {meta?.total ?? cashbookSummary?.totalCount ?? rows.length}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-2 shadow-sm">
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={96}
                    tickMargin={8}
                    tickFormatter={axisCurrency as any}
                  />
                  <RTooltip formatter={(v: any) => currency(Number(v))} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={d.name === "Thu" ? "#059669" : "#e11d48"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Mã phiếu</th>
                <th className="px-3 py-2 text-left">Thời gian</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-left">Bàn</th>
                <th className="px-3 py-2 text-left">Khu vực</th>
                <th className="px-3 py-2 text-left">Đối tượng</th>
                <th className="px-3 py-2 text-right">Thu</th>
                <th className="px-3 py-2 text-right">Chi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r: any, i: number) => {
                const iso = r.occurredAt ?? r.createdAt ?? null;
                const timeText = iso
                  ? format(new Date(iso), "dd/MM/yyyy HH:mm")
                  : r.time ?? "-";
                const partner = r.counterparty ?? "Khách lẻ";
                const receipt =
                  r.receipt != null ? parseFloat(String(r.receipt)) : 0;
                const payment =
                  r.payment != null ? parseFloat(String(r.payment)) : 0;
                return (
                  <tr
                    key={r.id ?? r.code ?? start + i}
                    className={`border-t ${
                      i % 2 === 1 ? "bg-slate-50/40" : ""
                    } hover:bg-slate-100/60 transition-colors`}
                  >
                    <td className="px-3 py-2">
                      {String(r.code ?? r.id ?? start + i).slice(0, 20)}
                    </td>
                    <td className="px-3 py-2">{timeText}</td>
                    <td className="px-3 py-2">{r.cashType ?? "-"}</td>
                    <td className="px-3 py-2">{r.tableName ?? "-"}</td>
                    <td className="px-3 py-2">{r.areaName ?? "-"}</td>
                    <td className="px-3 py-2">{partner}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">
                      {receipt ? currency(receipt) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-600">
                      {payment ? currency(payment) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination className="px-3 py-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goPrev();
                }}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {currentPage} / {pages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                className={
                  currentPage >= pages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  // cancel (server-side pagination & analytics)
  const isCancel = mode === "cancel";
  if (isCancel) {
    const currentPage = page || meta?.page || 1;
    const pages = meta?.pages || 1;
    const perPage = limit || meta?.limit || rows.length;
    const total = meta?.total || rows.length;

    // Chart distribution by cancel value (top items)
    const chartSource = rows.slice(0, 8).map((r: any) => ({
      name: r.itemName || r.name || "N/A",
      value: Number(r.cancelValue || r.amount || r.total || 0),
    }));
    const totalCancelValue = chartSource.reduce((a, c) => a + c.value, 0);

    return (
      <div className="rounded-xl border">
        {cancelSummary && (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Tổng số món huỷ</div>
              <div className="mt-1 text-lg font-semibold">
                {cancelSummary.totalCount}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Tổng SL huỷ</div>
              <div className="mt-1 text-lg font-semibold">
                {cancelSummary.cancelQty}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Tổng giá trị huỷ</div>
              <div className="mt-1 text-lg font-semibold text-rose-600">
                {currency(cancelSummary.cancelValue)}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Giá trị TB / món</div>
              <div className="mt-1 text-lg font-semibold">
                {cancelSummary.totalCount
                  ? currency(
                      cancelSummary.cancelValue / cancelSummary.totalCount
                    )
                  : currency(0)}
              </div>
            </div>
            <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartSource}
                      margin={{ top: 8, right: 8, bottom: 0, left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        hide={chartSource.length > 5}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={96}
                        tickMargin={8}
                        tickFormatter={axisCurrency as any}
                      />
                      <RTooltip formatter={(v: any) => currency(Number(v))} />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        fill="#ef4444"
                        label={{
                          position: "top",
                          formatter: (v: any) => currency(Number(v)),
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={chartSource}
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        labelLine
                        label={(p: any) => `${currency(Number(p.value))}`}
                      >
                        {chartSource.map((d, i) => (
                          <Cell
                            key={`c-${i}`}
                            fill={
                              [
                                "#fb7185",
                                "#f43f5e",
                                "#e11d48",
                                "#be123c",
                                "#9f1239",
                                "#881337",
                              ][i % 6]
                            }
                          />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                      />
                      <RTooltip formatter={(v: any) => currency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Thời gian</th>
                <th className="px-3 py-2 text-left">Mặt hàng</th>
                <th className="px-3 py-2 text-right">SL huỷ</th>
                <th className="px-3 py-2 text-right">Giá trị huỷ</th>
                <th className="px-3 py-2 text-left">Khu vực</th>
                <th className="px-3 py-2 text-left">Bàn</th>
                <th className="px-3 py-2 text-left">Lý do</th>
                <th className="px-3 py-2 text-right">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => {
                const value = Number(r.cancelValue || r.amount || r.total || 0);
                const qty = Number(r.cancelQty || r.quantity || r.qty || 0);
                const percent = totalCancelValue
                  ? (value / totalCancelValue) * 100
                  : 0;
                const iso = r.occurredAt || r.createdAt || r.time;
                const timeText = iso
                  ? format(new Date(iso), "dd/MM/yyyy HH:mm")
                  : "-";
                return (
                  <tr
                    key={r.itemCode ?? r.id ?? i}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{timeText}</td>
                    <td className="px-3 py-2">{r.itemName || r.name || "-"}</td>
                    <td className="px-3 py-2 text-right">{qty}</td>
                    <td className="px-3 py-2 text-right text-rose-600">
                      {currency(value)}
                    </td>
                    <td className="px-3 py-2">{r.areaName || "-"}</td>
                    <td className="px-3 py-2">{r.tableName || "-"}</td>
                    <td className="px-3 py-2">{r.cancelReason || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {percent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 gap-4 flex-wrap">
          <div className="text-xs text-slate-600">Tổng: {total} món huỷ</div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage?.((p) => Math.max(1, (p ?? currentPage) - 1));
                  }}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {currentPage} / {pages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage?.((p) => Math.min(pages, (p ?? currentPage) + 1));
                  }}
                  className={
                    currentPage >= pages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    );
  }
  return null;
}
