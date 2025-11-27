"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CashbookItem } from "@/types/admin/cashbook";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Trash2, Pencil, Lock } from "lucide-react";

export type CashbookTableProps = {
  rows: CashbookItem[];
  onOpenDetail: (id: string) => void;
  onDelete?: (item: CashbookItem) => void;
  onEdit?: (item: CashbookItem) => void;
};

export const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(typeof v === "string" ? parseFloat(v) : v);

export const fmtDateTime = (iso?: string) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "-";

export function CashbookTable({
  rows,
  onOpenDetail,
  onDelete,
  onEdit,
}: CashbookTableProps) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Ngày</TableHead>
          <TableHead className="w-[120px]">Mã phiếu</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Đối tượng</TableHead>
          <TableHead>Nội dung</TableHead>
          <TableHead className="text-right">Số tiền</TableHead>
          <TableHead className="w-[120px]">Hạch toán</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {safeRows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-sm text-muted-foreground py-6"
            >
              Không có dữ liệu
            </TableCell>
          </TableRow>
        ) : (
          safeRows.map((r) => {
            // --- 1. XỬ LÝ TÊN ĐỐI TƯỢNG ---
            let partyName = "-";
            if (r.counterpartyGroup === "CUSTOMER")
              partyName = r.customer?.name || "Khách lẻ";
            else if (r.counterpartyGroup === "SUPPLIER")
              partyName = r.supplier?.name || "-";
            else if (r.counterpartyGroup === "STAFF")
              partyName =
                (r.staff as any)?.profile?.fullName || r.staff?.name || "-";
            else if (r.cashOtherParty)
              partyName = r.cashOtherParty?.name || "-";

            // --- 2. XỬ LÝ NỘI DUNG ---
            const content =
              r.invoice?.invoiceNumber || // Hóa đơn bán hàng
              r.purchaseReceipt?.code || // Phiếu nhập hàng
              r.sourceCode || // Mã nguồn khác
              "-";

            const absAmount = Math.abs(Number(r.amount));

            // --- 3. LOGIC QUYỀN CHỈNH SỬA ---
            // Nếu có 'invoice' (tức là từ Bán hàng) -> KHÔNG CHO SỬA
            // Còn lại (Chi trả NCC, Thu khác...) -> CHO SỬA
            const isSalesInvoice = !!r.invoice;
            const canEdit = !isSalesInvoice;

            return (
              <TableRow
                key={r.id}
                className="group hover:bg-slate-50 transition-colors"
              >
                <TableCell className="whitespace-nowrap text-slate-600 font-mono text-xs">
                  {fmtDateTime(r.date)}
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {r.code}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        r.type === "RECEIPT"
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 shadow-none"
                      }
                      variant="outline"
                    >
                      {r.type === "RECEIPT" ? "Thu" : "Chi"}
                    </Badge>
                    {/* Hiển thị loại quỹ (Tiền mặt/Ngân hàng) */}
                    <span
                      className="text-xs text-muted-foreground truncate max-w-[100px]"
                      title={r.cashType?.name}
                    >
                      {r.cashType?.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span
                      className="font-medium text-sm text-slate-800 leading-tight truncate max-w-[150px]"
                      title={partyName}
                    >
                      {partyName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                      {r.counterpartyGroup === "CUSTOMER"
                        ? "Khách hàng"
                        : r.counterpartyGroup === "SUPPLIER"
                        ? "Nhà cung cấp"
                        : r.counterpartyGroup === "STAFF"
                        ? "Nhân viên"
                        : "Khác"}
                    </span>
                  </div>
                </TableCell>

                <TableCell
                  className="text-sm text-slate-600 truncate max-w-[150px]"
                  title={content}
                >
                  {content}
                </TableCell>

                <TableCell className="text-right font-bold whitespace-nowrap">
                  {r.type === "RECEIPT" ? (
                    <span className="text-green-600">
                      + {fmtCurrency(absAmount)}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      - {fmtCurrency(absAmount)}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {r.isPostedToBusinessResult ? (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-600 border-slate-200 font-normal shadow-none"
                    >
                      Đã HT
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-600 border-orange-200 font-normal hover:bg-orange-100 shadow-none"
                    >
                      Chưa HT
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onOpenDetail(r.id)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4 text-slate-500" /> Xem chi
                        tiết
                      </DropdownMenuItem>

                      {/* NÚT SỬA: Logic hiển thị */}
                      {canEdit ? (
                        <DropdownMenuItem
                          onClick={() => onEdit?.(r)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4 text-blue-600" /> Sửa
                          phiếu
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled
                          className="text-muted-foreground opacity-50 cursor-not-allowed"
                          title="Phiếu thu từ Bán hàng không được sửa"
                        >
                          <Lock className="mr-2 h-4 w-4" /> Sửa phiếu (Khóa)
                        </DropdownMenuItem>
                      )}

                      {/* NÚT XÓA */}
                      {/* Bạn cũng có thể muốn khóa xóa đối với Invoice nếu cần */}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                        onClick={() => onDelete?.(r)}
                        disabled={!canEdit} // Thường thì nếu không cho sửa cũng không cho xóa
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Xóa phiếu
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
