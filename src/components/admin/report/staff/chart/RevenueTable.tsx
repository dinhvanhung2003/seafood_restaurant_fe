"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { currency } from "@/utils/money";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DayRow = { date: string; revenue: number; netRevenue: number };
type StaffRow = {
  userId: string;
  fullName: string;
  revenue: number;
  returnValue?: number;
  netRevenue: number;
  days?: DayRow[];
};

export function RevenueTable({
  rows,
  summary,
}: {
  rows: StaffRow[];
  summary?: any;
}) {
  const totalNet =
    Number(summary?.netRevenue || 0) ||
    rows.reduce((s, r) => s + Number(r.netRevenue || 0), 0);
  // Dialog state for detail view to avoid layout shift when opening
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<StaffRow | undefined>(
    undefined
  );
  const openDetail = (row: StaffRow) => {
    setSelected(row);
    setOpen(true);
  };

  // sorting for dialog detail
  const [sortKey, setSortKey] = React.useState<
    "date" | "revenue" | "return" | "net" | "share"
  >("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const sortedDays = React.useMemo(() => {
    if (!selected?.days) return [] as DayRow[];
    const arr = [...selected.days];
    return arr.sort((a, b) => {
      const retA = Math.max(
        0,
        Number(a.revenue || 0) - Number(a.netRevenue || 0)
      );
      const retB = Math.max(
        0,
        Number(b.revenue || 0) - Number(b.netRevenue || 0)
      );
      let va = 0,
        vb = 0;
      if (sortKey === "date") {
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
      }
      if (sortKey === "revenue") {
        va = Number(a.revenue || 0);
        vb = Number(b.revenue || 0);
      }
      if (sortKey === "return") {
        va = retA;
        vb = retB;
      }
      if (sortKey === "net") {
        va = Number(a.netRevenue || 0);
        vb = Number(b.netRevenue || 0);
      }
      if (sortKey === "share") {
        const total = Number(selected?.netRevenue || 0) || 1;
        va = Number(a.netRevenue || 0) / total;
        vb = Number(b.netRevenue || 0) / total;
      }
      const cmp = va === vb ? 0 : va > vb ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [selected?.days, selected?.netRevenue, sortKey, sortDir]);

  const onSort = (k: typeof sortKey) => {
    setSortKey((prev) => (prev === k ? prev : k));
    setSortDir((d) =>
      sortKey === k ? (d === "asc" ? "desc" : "asc") : "desc"
    );
  };

  const exportCsv = () => {
    if (!selected) return;
    const header = ["Ngay", "Doanh thu", "Hoan", "Rong", "%"].join(",");
    const total = Number(selected.netRevenue || 0) || 1;
    const lines = (selected.days || []).map((d) => {
      const ret = Math.max(
        0,
        Number(d.revenue || 0) - Number(d.netRevenue || 0)
      );
      const share = (Number(d.netRevenue || 0) / total) * 100;
      return [
        d.date,
        Number(d.revenue || 0),
        ret,
        Number(d.netRevenue || 0),
        share.toFixed(0),
      ].join(",");
    });
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.fullName}-chi-tiet.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Make table responsive and easy to scan on small screens */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[720px] md:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28px]" />
              <TableHead>Nhân viên</TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Doanh thu
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Hoàn trả
              </TableHead>
              <TableHead className="text-right">Doanh thu ròng</TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Số ngày
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                TB/ngày
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, idx) => {
              const ret = Number(
                r.returnValue ??
                  Math.max(
                    0,
                    Number(r.revenue || 0) - Number(r.netRevenue || 0)
                  )
              );
              const days = r.days?.length || 0;
              const avg = days ? Number(r.netRevenue || 0) / days : 0;
              const share = totalNet ? Number(r.netRevenue || 0) / totalNet : 0;
              return (
                <TableRow
                  key={r.userId}
                  className={`${
                    idx % 2 ? "bg-slate-50" : ""
                  } hover:bg-indigo-50/40 transition-colors`}
                >
                  <TableCell className="p-0 pl-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Xem chi tiết theo ngày"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => openDetail(r)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem chi tiết theo ngày</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {currency(Number(r.revenue || 0))}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 hidden md:table-cell">
                    {currency(ret)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {currency(Number(r.netRevenue || 0))}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {days}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {currency(avg)}
                  </TableCell>
                </TableRow>
              );
            })}
            {summary && (
              <TableRow className="font-semibold bg-muted/40">
                <TableCell />
                <TableCell>Tổng cộng</TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  {currency(Number(summary?.revenue || 0))}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  {currency(Number(summary?.returnValue || 0))}
                </TableCell>
                <TableCell className="text-right">
                  {currency(Number(summary?.netRevenue || 0))}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  -
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  -
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[min(96vw,1100px)]">
          <DialogHeader>
            <DialogTitle>
              {selected ? selected.fullName : "Chi tiết"}
            </DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded border p-2">
                  <div className="text-slate-500">Doanh thu</div>
                  <div className="font-semibold">
                    {currency(Number(selected.revenue || 0))}
                  </div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-slate-500">Hoàn trả</div>
                  <div className="font-semibold text-rose-600">
                    {currency(
                      Math.max(
                        0,
                        Number(selected.revenue || 0) -
                          Number(selected.netRevenue || 0)
                      )
                    )}
                  </div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-slate-500">Doanh thu ròng</div>
                  <div className="font-semibold">
                    {currency(Number(selected.netRevenue || 0))}
                  </div>
                </div>
                <div className="rounded border p-2 hidden md:block">
                  <div className="text-slate-500">Ngày cao nhất</div>
                  <div className="font-semibold">
                    {(() => {
                      const b = (selected.days || []).reduce<{
                        d?: string;
                        v: number;
                      }>(
                        (m, d) => {
                          const v = Number(d.netRevenue || 0);
                          return v > m.v ? { d: d.date, v } : m;
                        },
                        { v: 0 }
                      );
                      return b.d ? `${b.d} • ${currency(b.v)}` : "-";
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Sắp xếp: click vào tiêu đề cột
                </div>
                <Button size="sm" variant="secondary" onClick={exportCsv}>
                  Xuất CSV
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-xs text-slate-600">
                      <th
                        className="px-3 py-2 text-left w-[120px] cursor-pointer"
                        onClick={() => onSort("date")}
                      >
                        Ngày
                      </th>
                      <th
                        className="px-3 py-2 text-right cursor-pointer"
                        onClick={() => onSort("revenue")}
                      >
                        Doanh thu
                      </th>
                      <th
                        className="px-3 py-2 text-right cursor-pointer"
                        onClick={() => onSort("return")}
                      >
                        Hoàn
                      </th>
                      <th
                        className="px-3 py-2 text-right hidden md:table-cell cursor-pointer"
                        onClick={() => onSort("net")}
                      >
                        Ròng
                      </th>
                      <th
                        className="px-3 py-2 text-right hidden md:table-cell cursor-pointer"
                        onClick={() => onSort("share")}
                      >
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDays.map((d, i) => {
                      const retD = Math.max(
                        0,
                        Number(d.revenue || 0) - Number(d.netRevenue || 0)
                      );
                      const share = Number(selected.netRevenue || 0)
                        ? Number(d.netRevenue || 0) /
                          Number(selected.netRevenue || 0)
                        : 0;
                      return (
                        <tr
                          key={d.date}
                          className={i % 2 ? "bg-slate-50" : "bg-white"}
                        >
                          <td className="px-3 py-2 font-medium text-slate-700">
                            {d.date}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {currency(Number(d.revenue || 0))}
                          </td>
                          <td className="px-3 py-2 text-right text-rose-600">
                            {currency(retD)}
                          </td>
                          <td className="px-3 py-2 text-right hidden md:table-cell">
                            {currency(Number(d.netRevenue || 0))}
                          </td>
                          <td className="px-3 py-2 text-right hidden md:table-cell">
                            {(share * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RevenueTable;
