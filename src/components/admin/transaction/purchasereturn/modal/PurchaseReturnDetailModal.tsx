"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  FileText,
  Package,
  User,
  Receipt,
  X,
  Pencil,
  Truck,
  Info,
  Clock,
  Tag,
} from "lucide-react";
import { usePurchaseReturnDetail } from "@/hooks/admin/usePurchaseReturns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { usePurchaseReturnPay } from "@/hooks/admin/usePurchaseReturns";
import { useEffect, useState } from "react";

// Helper format
const currency = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const dmy = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

// --- Component phụ cho Card thông tin ---
const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 mt-0.5">
        {value}
      </span>
    </div>
  </div>
);

export default function PurchaseReturnDetailModal({
  id,
  open,
  onOpenChange,
  onEdit,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: (id: string) => void;
}) {
  const { data, isFetching, isError } = usePurchaseReturnDetail(id, open);

  const payMu = usePurchaseReturnPay();
  const [payOpen, setPayOpen] = useState(false);
  const [payValue, setPayValue] = useState<string>("");

  useEffect(() => {
  if (open) {
    setPayValue(""); // mặc định rỗng
  }
}, [open]);


  const isDraft = data?.status === "DRAFT";
  const debt =
    data && data.refundAmount != null && data.paidAmount != null
      ? Math.max(0, data.refundAmount - data.paidAmount)
      : 0;

  const statusBadge = (s?: string) => {
    switch (s) {
      case "POSTED":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 border-transparent shadow-none">
            Đã ghi nhận
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 border-transparent shadow-none">
            Đã hoàn tiền
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="destructive"
            className="border-transparent shadow-none"
          >
            Đã hủy
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Bản nháp
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* bỏ bg-slate-50/30, dùng nền trắng + viền cho liền khối */}
      <DialogContent className="!max-w-5xl !w-[95vw] p-0 gap-0 overflow-hidden bg-white border shadow-lg">
        {/* HEADER */}
        <DialogHeader className="px-5 py-3 bg-slate-50 border-b flex-shrink-0 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Phiếu trả hàng #{data?.code ?? "..."}
              </DialogTitle>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <CalendarDays className="w-3 h-3" />
                {isFetching ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  <span>{dmy(data?.createdAt)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFetching && data && statusBadge(data.status)}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* BODY */}
        <ScrollArea className="max-h-[80vh]">
          {/* nền xám nhạt liền mạch, không opacity */}
          <div className="p-4 space-y-4 bg-slate-50">
            {/* Loading/Error */}
            {isFetching && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            )}

            {isError && !isFetching && (
              <div className="flex flex-col items-center justify-center py-8 text-red-500 bg-red-50 rounded-lg border border-red-100">
                <Info className="w-7 h-7 mb-2" />
                <p className="text-sm">
                  Không thể tải thông tin chi tiết phiếu này.
                </p>
              </div>
            )}

            {/* Success Content */}
            {!isFetching && !isError && data && (
              <>
                {/* 1. INFO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General Info Card */}
                  <div className="bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wide border-b pb-2 border-slate-100 mb-3">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Thông tin chung
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                      <InfoItem
                        icon={User}
                        label="Người tạo"
                        value={data.creatorName || "Admin"}
                      />
                      <InfoItem
                        icon={Clock}
                        label="Cập nhật"
                        value={<span className="text-slate-700">{dmy(data.updatedAt)}</span>}
                      />
                      <InfoItem
                        icon={FileText}
                        label="Ghi chú"
                        value={
                          <span
                            className="italic text-slate-700 text-sm line-clamp-1"
                            title={data.note}
                          >
                            {data.note || "—"}
                          </span>
                        }
                        className="col-span-2"
                      />
                    </div>
                  </div>

                  {/* Supplier Info Card */}
                  <div className="bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wide border-b pb-2 border-slate-100 mb-3">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      Thông tin nhà cung cấp
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <InfoItem
                        icon={Truck}
                        label="Tên nhà cung cấp"
                        value={
                          <div className="text-lg font-bold text-slate-900">
                            {data.supplierName}
                          </div>
                        }
                      />
                      <InfoItem
                        icon={Tag}
                        label="ID NCC"
                        value={
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs text-slate-600">
                            {data.supplierId || "N/A"}
                          </span>
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 2. MAIN CONTENT (Table & Totals) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TABLE DETAILS */}
                  <div className="bg-white rounded-lg border shadow-sm overflow-hidden md:col-span-2">
                    <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                        <Package className="w-4 h-4 text-slate-500" />
                        Chi tiết hàng hóa
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white text-slate-600 font-normal text-xs"
                      >
                        {data.logs?.length || 0} mặt hàng
                      </Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white hover:bg-white">
                            <TableHead className="w-[40px] text-center h-9 text-xs font-bold uppercase text-slate-500 py-2">
                              #
                            </TableHead>
                            <TableHead className="min-w-[100px] h-9 text-xs font-bold uppercase text-slate-500 py-2">
                              Mã hàng
                            </TableHead>
                            <TableHead className="min-w-[150px] h-9 text-xs font-bold uppercase text-slate-500 py-2">
                              Tên hàng
                            </TableHead>
                            <TableHead className="text-right h-9 text-xs font-bold uppercase text-slate-500 w-[60px] py-2">
                              SL
                            </TableHead>
                            <TableHead className="text-center h-9 text-xs font-bold uppercase text-slate-500 w-[60px] py-2">
                              ĐVT
                            </TableHead>
                            <TableHead className="text-right h-9 text-xs font-bold uppercase text-slate-500 w-[100px] py-2">
                              Đơn giá
                            </TableHead>
                            <TableHead className="text-right h-9 text-xs font-bold uppercase text-slate-500 w-[80px] py-2">
                              Giảm
                            </TableHead>
                            <TableHead className="text-right h-9 text-xs font-bold uppercase text-slate-500 w-[120px] py-2">
                              Thành tiền
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data.logs ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-6 text-slate-500 italic text-sm"
                              >
                                Không có dữ liệu chi tiết
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.logs.map((l, idx) => (
                              <TableRow
                                key={l.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <TableCell className="text-center text-slate-500 text-xs py-2 h-auto">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-600 py-2 h-auto">
                                  {l.itemCode}
                                </TableCell>
                                <TableCell className="font-medium text-slate-900 text-sm py-2 h-auto">
                                  {l.itemName}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-slate-700 py-2 h-auto">
                                  {l.quantity}
                                </TableCell>
                                <TableCell className="text-center py-2 h-auto">
                                  <Badge
                                    variant="secondary"
                                    className="font-normal text-[10px] px-1 h-4 bg-slate-100 text-slate-600"
                                  >
                                    {((l as any).uomName ??
                                      (l as any).unit ??
                                      (l as any).receivedUomCode ??
                                      (l as any).unitCode) || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-slate-600 text-sm py-2 h-auto">
                                  {currency(l.unitPrice)}
                                </TableCell>
                                <TableCell className="text-right text-slate-500 text-sm py-2 h-auto">
                                  {l.discount > 0
                                    ? `-${currency(l.discount)}`
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-900 text-sm py-2 h-auto">
                                  {currency(l.total)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* TOTALS SECTION */}
                  <div className="flex justify-end">
                    <div className="w-full md:w-[360px] bg-white rounded-xl border shadow-sm p-5 space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tổng tiền hàng</span>
                          <span className="font-medium text-slate-900">
                            {currency(data.totalGoods)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Giảm giá phiếu</span>
                          <span className="font-medium text-green-600">
                            {data.discount > 0 ? "-" : ""}
                            {currency(data.discount)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-dashed border-slate-200">
                          <span className="text-slate-500">Sau giảm trừ</span>
                          <span className="font-medium text-slate-900">
                            {currency(data.totalAfterDiscount)}
                          </span>
                        </div>
                      </div>

                      <Separator className="my-2" />

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700 uppercase text-xs tracking-wide">
                          Tổng hoàn trả
                        </span>
                        <span className="font-bold text-lg text-slate-900">
                          {currency(data.refundAmount)}
                        </span>
                      </div>

                      <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500 font-medium">
                            NCC Đã trả
                          </span>
                          <span className="font-bold text-blue-600">
                            {currency(data.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                          <span className="text-sm font-bold text-red-600 uppercase">
                           NCC còn nợ
                          </span>
                          <span className="font-bold text-xl text-red-600">
                            {currency(debt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <DialogFooter className="p-3 bg-white border-t flex flex-row items-center justify-between w-full">
          <div className="text-xs text-slate-400 italic hidden sm:block">
            {data ? (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> ID: {data.id}
              </span>
            ) : null}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-300 text-slate-700 h-9"
            >
              Đóng
            </Button>

           
{data?.status === "POSTED" && debt > 0 && (
  <Button
    variant="outline"
    className="h-9"
    onClick={() => setPayOpen(true)}
  >
    Cập nhật tiền NCC đã trả
  </Button>
)}


            {isDraft && onEdit && data && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit(data.id);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-100 h-9"
              >
                <Pencil className="w-4 h-4" /> Chỉnh sửa phiếu
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Dialog cập nhật tiền NCC đã trả */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cập nhật tiền NCC đã trả</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Tổng cần hoàn cho NCC:{" "}
              <span className="font-semibold">
                {currency(data?.refundAmount ?? 0)}
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-700">
                Tổng tiền NCC đã trả (sau cập nhật)
              </label>
              <Input
                type="number"
                value={payValue}
                onChange={(e) => setPayValue(e.target.value)}
                min={0}
              />
              <p className="text-xs text-slate-500">
                Nhập tổng tiền NCC đã thực tế hoàn trả cho phiếu này.
                Hệ thống sẽ tự tạo bút toán phần chênh lệch.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setPayOpen(false)}
              disabled={payMu.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
              if (!data) return;

const addPaid = Number(payValue || 0);
if (Number.isNaN(addPaid) || addPaid < 0) {
  return toast.error("Số tiền không hợp lệ");
}

const totalPaid = (data.paidAmount ?? 0) + addPaid;

if (totalPaid > (data.refundAmount ?? 0)) {
  return toast.error("Tổng tiền sau cập nhật không được lớn hơn số cần hoàn");
} 

// Nếu không trả thêm gì thì thôi
if (addPaid === 0) {
  return toast.info("Không có số tiền nào được thêm");
}

// Gửi TỔNG MỚI cho BE
payMu.mutate(
  { id: data.id, paidAmount: totalPaid },
  {
    onSuccess: () => {
      toast.success("Đã cập nhật tiền NCC trả");
      setPayOpen(false);
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Cập nhật thất bại";
      toast.error(msg);
    },
  }
);


              }}
              disabled={payMu.isPending}
            >
              {payMu.isPending ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
