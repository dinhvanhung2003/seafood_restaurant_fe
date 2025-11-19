// app/admin/invoices/page.tsx
"use client";

import { useMemo, useState } from "react";
import type { DiningTableDTO } from "@/types/admin/table/table";
import {
  useInvoices,
  useInvoiceDetail,
  type InvoiceStatus,
} from "@/hooks/admin/useInvoice";
// removed search Input per request
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceDetailDialog from "@/components/admin/transaction/invoice/modal/InvoiceDetailModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign } from "lucide-react";
import DatePicker from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useTablesQuery } from "@/hooks/admin/useTable";

const STATUS_OPTIONS: (InvoiceStatus | "ALL")[] = ["ALL", "UNPAID", "PAID"];
const currency = (n: number | string) => Number(n ?? 0).toLocaleString("vi-VN");

// NOTE: `useState` must be used inside the component. `areaId` is declared
// inside `InvoiceListPage` below.

// search/highlight removed

export default function InvoiceListPage() {
  // 'ALL' means show all statuses
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  // Draft vs applied date range: draft updates inside picker, appliedDateRange is sent to backend only when user clicks Apply
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(
    () => {
      const to = new Date();
      const from = new Date();
      return { from, to };
    }
  );
  const [appliedDateRange, setAppliedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [paymentMethod, setPaymentMethod] = useState<"ALL" | "CASH" | "VIETQR">(
    "ALL"
  );
  const [tableId, setTableId] = useState<string | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const limit = 10;
  const [areaId, setAreaId] = useState<string | "ALL">("ALL");

  const { data, isLoading, isFetching } = useInvoices({
    status: status === "ALL" ? undefined : status,
    page,
    limit,
    fromDate: appliedDateRange?.from?.toISOString(),
    toDate: appliedDateRange?.to?.toISOString(),
    paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
    tableId: tableId === "ALL" ? undefined : tableId,
    areaId: areaId === "ALL" ? undefined : areaId,
  });
  const detail = useInvoiceDetail(selectedId);

  // load tables once for table filter select
  const { data: tableResp } = useTablesQuery({ page: 1, limit: 200 });
  const tables = (tableResp?.data ?? []) as DiningTableDTO[];

  // distinct list khu vực
  const areas = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const t of tables) {
      if (t.area) {
        map.set(t.area.id, t.area);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi")
    );
  }, [tables]);

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? data?.raw?.meta?.total ?? undefined;
  const pages = total ? Math.max(1, Math.ceil(total / limit)) : undefined;

  // Render row cells as an array to avoid introducing whitespace text nodes
  // as children of <tr> (which causes Next.js hydration errors).
  const renderRowCells = (inv: any) => [
    <Td key="invoice" className="font-medium">
      {inv.invoiceNumber}
    </Td>,
    <Td key="time">{new Date(inv.createdAt).toLocaleString("vi-VN")}</Td>,
    <Td key="table">{inv.table?.name ?? "-"}</Td>,
    <Td key="area">{inv.area?.name ?? inv.table?.area?.name ?? "-"}</Td>,
    <Td key="customer">{inv.customer?.name ?? "Khách lẻ"}</Td>,
    <Td key="status">
      {inv.status === "UNPAID" ? (
        <Badge variant="destructive">Chưa thanh toán</Badge>
      ) : (
        <Badge variant="default">Đã thanh toán</Badge>
      )}
    </Td>,
    <Td key="method">
      {inv.paidBank > 0 && inv.paidCash > 0 ? (
        <Badge className="flex items-center gap-1" variant="outline">
          <DollarSign className="size-3" />
          Tiền mặt + Chuyển khoản
        </Badge>
      ) : inv.paidBank > 0 ? (
        <Badge className="flex items-center gap-1" variant="outline">
          <CreditCard className="size-3" />
          Chuyển khoản
        </Badge>
      ) : inv.paidCash > 0 ? (
        <Badge className="flex items-center gap-1" variant="outline">
          <DollarSign className="size-3" />
          Tiền mặt
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </Td>,
    <Td key="total" className="text-right">
      {currency(inv.totalAmount)}
    </Td>,
    <Td key="discount" className="text-right">
      {currency(inv.discountTotal)}
    </Td>,
    <Td key="need" className="text-right font-semibold text-emerald-600">
      {currency(inv.finalAmount)}
    </Td>,
    <Td
      key="remaining"
      className={`text-right ${
        inv.remaining > 0 ? "text-red-600 font-semibold" : ""
      }`}
    >
      {currency(inv.remaining)}
    </Td>,
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Hóa đơn</h1>

      <div className="rounded-lg bg-white p-4 shadow-sm border">
        {/* Hàng filter chính */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.3fr)_auto] md:items-end">
          {/* Trạng thái */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as InvoiceStatus | "ALL")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={String(s)} value={String(s)}>
                  {s === "ALL"
                    ? "Tất cả"
                    : s === "UNPAID"
                    ? "Chưa thanh toán"
                    : "Đã thanh toán"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ngày */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {appliedDateRange?.from && appliedDateRange?.to
                  ? `${format(appliedDateRange.from, "dd/MM/yyyy")} → ${format(
                      appliedDateRange.to,
                      "dd/MM/yyyy"
                    )}`
                  : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <DatePicker value={draftDateRange} onChange={setDraftDateRange} />
              <div className="mt-3 flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraftDateRange(undefined);
                  }}
                >
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setAppliedDateRange(draftDateRange);
                    setPage(1);
                  }}
                >
                  Áp dụng
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Phương thức thanh toán */}
          <Select
            value={paymentMethod}
            onValueChange={(v) =>
              setPaymentMethod(v as "ALL" | "CASH" | "VIETQR")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phương thức</SelectItem>
              <SelectItem value="CASH">Tiền mặt</SelectItem>
              <SelectItem value="VIETQR">Chuyển khoản</SelectItem>
            </SelectContent>
          </Select>

          {/* Nút xóa lọc */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatus("ALL");
                setPaymentMethod("ALL");
                setTableId("ALL");
                setAreaId("ALL");
                setDraftDateRange(undefined);
                setAppliedDateRange(undefined);
                setPage(1);
              }}
            >
              Xóa lọc
            </Button>
          </div>
        </div>

        {/* Hàng filter khu vực + bàn */}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {/* Khu vực */}
          <Select
            value={areaId}
            onValueChange={(v: string) => {
              setAreaId(v);
              setTableId("ALL"); // đổi khu vực thì reset bàn
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả khu vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"ALL"}>Tất cả khu vực</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bàn – lọc theo khu vực nếu được chọn */}
          <Select value={tableId} onValueChange={(v: string) => setTableId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả bàn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"ALL"}>Tất cả bàn</SelectItem>
              {(() => {
                const groups: Record<string, any[]> = {};
                for (const t of tables) {
                  // nếu đang lọc khu vực thì chỉ lấy bàn thuộc khu đó
                  if (areaId !== "ALL" && t.area?.id !== areaId) continue;

                  const areaName = (t.area && t.area.name) || "Không phân vùng";
                  if (!groups[areaName]) groups[areaName] = [];
                  groups[areaName].push(t);
                }

                return Object.keys(groups)
                  .sort((a, b) => a.localeCompare(b, "vi"))
                  .map((areaName) => (
                    <SelectGroup key={areaName}>
                      <SelectLabel>{areaName}</SelectLabel>
                      {groups[areaName].map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ));
              })()}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[1040px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Mã HĐ</Th>
              <Th>Thời gian</Th>
              <Th>Bàn</Th>
              <Th>Khu vực</Th>
              <Th>Khách</Th>
              <Th>Trạng thái</Th>
              <Th>Phương thức</Th>
              <Th className="text-right">Tổng niêm yết</Th>
              <Th className="text-right">Giảm</Th>
              <Th className="text-right">Cần thu</Th>
              <Th className="text-right">Còn lại</Th>
            </tr>
          </thead>
          <tbody className={isFetching ? "opacity-70" : ""}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <Td>
                    <Skeleton className="h-4 w-32" />
                  </Td>
                  <Td>
                    <Skeleton className="h-4 w-40" />
                  </Td>
                  <Td>
                    <Skeleton className="h-4 w-20" />
                  </Td>
                  <Td>
                    <Skeleton className="h-4 w-40" />
                  </Td>
                  <Td>
                    <Skeleton className="h-4 w-28" />
                  </Td>
                  <Td>
                    <Skeleton className="h-4 w-28" />
                  </Td>
                  <Td className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </Td>
                  <Td className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </Td>
                  <Td className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </Td>
                  <Td className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </Td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <Td colSpan={10} className="py-8 text-center text-slate-500">
                  Không có dữ liệu
                </Td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedId(inv.id)}
                >
                  {renderRowCells(inv)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink className="mx-2" aria-current>
                Trang {page}
                {pages ? ` / ${pages}` : ""}
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage((p) => (pages ? Math.min(pages, p + 1) : p + 1))
                }
                aria-disabled={pages ? page >= pages : false}
                className={
                  pages && page >= pages ? "opacity-50 pointer-events-none" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <InvoiceDetailDialog
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(undefined)}
        invoiceId={selectedId}
      />
    </div>
  );
}

function Th({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={["px-3 py-2 text-left font-medium", className].join(" ")}>
      {children}
    </th>
  );
}
function Td({
  children,
  className,
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={["px-3 py-2", className].join(" ")} colSpan={colSpan}>
      {children}
    </td>
  );
}
