"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { printPurchaseReceipt } from "@/lib/print/purchase_receipt";
import { useRouter } from "next/navigation";
import { usePRPayReceipt } from "@/hooks/admin/usePurchase";  
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
type ReceiptItem = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  receivedUomCode?: string;
  receivedUomName?: string;
  conversionToBase?: number;
  lotNumber?: string;
  expiryDate?: string;
  lineTotal: number;
};

type ReceiptDetail = {
  id: string;
  code: string;
  status: string;
  supplier?: { id: string; name: string };
  receiptDate: string; // YYYY-MM-DD
  shippingFee: number;
  amountPaid: number;
  globalDiscountType: "AMOUNT" | "PERCENT";
  globalDiscountValue: number;
  note?: string;
  subTotal: number;
  grandTotal: number;
  items: ReceiptItem[];
};

function money(n?: number) {
  return Number(n || 0).toLocaleString();
}
function fmtDiscount(type: "AMOUNT" | "PERCENT", val: number) {
  return type === "PERCENT" ? `${val}%` : money(val);
}

export default function PurchaseReceiptDetailModal({
  open,
  onOpenChange,
  id,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id?: string | null;
}) {
  const [data, setData] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");

  const { mutate: payReceipt, isPending: paying } = usePRPayReceipt();
  const router = useRouter();

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    api
      .get<ReceiptDetail>(`/purchasereceipt/getId/${id}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [open, id]);

  // === handler nhảy sang trang SỬA ===
  const handleEdit = () => {
    if (!data?.id) return;
    onOpenChange(false);
    // đổi sang mở trang tạo với query id
    router.push(`/admin/inventories/purchase/new?id=${data.id}`);
  };
 const remaining = data
    ? Math.max(0, data.grandTotal - data.amountPaid)
    : 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* rộng theo viewport, không tràn */}
      <DialogContent className="w-[94vw] sm:max-w-5xl">
        <div className="p-4 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle>
              Chi tiết phiếu nhập {data?.code ? `— ${data.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          {loading && <div className="text-sm text-slate-500">Đang tải…</div>}
          {!loading && !data && (
            <div className="text-sm text-slate-500">Không tìm thấy phiếu.</div>
          )}

          {!!data && (
            <>
              {/* Header info */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-slate-500 text-sm">Ngày</div>
                  <div className="font-medium">{data.receiptDate}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Nhà cung cấp</div>
                  <div className="font-medium">
                    {data.supplier?.name || "—"}
                  </div>
                </div>
                <div>
                  {/* <div className="text-slate-500 text-sm">Trạng thái</div>
                  <div className="font-medium">{data.status}</div> */}
                </div>
                <div className="sm:col-span-3">
                  <div className="text-slate-500 text-sm">Ghi chú</div>
                  <div className="font-medium">{data.note || "—"}</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên hàng</th>
                      <th className="px-3 py-2 text-right">SL</th>
                      <th className="px-3 py-2 text-right">Đơn giá</th>
                      <th className="px-3 py-2 text-right">CK</th>
                      <th className="px-3 py-2 text-right">ĐVT</th>
                      <th className="px-3 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{it.itemName}</div>
                          <div className="text-xs text-slate-500">
                            {it.lotNumber ? `Lô: ${it.lotNumber}` : ""}
                            {it.expiryDate ? ` • HSD: ${it.expiryDate}` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {fmtDiscount(it.discountType, it.discountValue)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {it.receivedUomName ?? it.receivedUomCode ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Tạm tính
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {money(data.subTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Chiết khấu chung
                        {` (${fmtDiscount(
                          data.globalDiscountType,
                          data.globalDiscountValue
                        )})`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        -
                        {money(
                          data.globalDiscountType === "PERCENT"
                            ? Math.round(
                                (data.subTotal * data.globalDiscountValue) / 100
                              )
                            : data.globalDiscountValue
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Phí vận chuyển
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {money(data.shippingFee)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td
                        colSpan={5}
                        className="px-3 py-2 text-right font-semibold"
                      >
                        Tổng thanh toán
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {money(data.grandTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Đã thanh toán
                      </td>
                      <td className="px-3 py-2 text-right">
                        {money(data.amountPaid)}
                      </td>
                    </tr>
                   <tr>
  <td colSpan={5} className="px-3 py-2 text-right">
    Còn phải trả
  </td>
  <td className="px-3 py-2 text-right font-bold text-red-500 text-lg">
    {money(remaining)}
  </td>
</tr>

                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-2">
  {/* Hiện nút SỬA khi là nháp */}
  {data.status === "DRAFT" && (
    <Button variant="secondary" onClick={handleEdit}>
      Sửa
    </Button>
  )}

  {/* Nút thanh toán NCC nếu còn nợ */}
  {remaining > 0 && (
    <Button
      variant="default"
      onClick={() => {
        setPayAmount(String(remaining)); // mặc định trả hết
        setPayOpen(true);
      }}
    >
      Thanh toán NCC
    </Button>
  )}

  <Button
    variant="outline"
    onClick={() => {
      if (!data) return;
      printPurchaseReceipt(data, {
        openInNewTab: false,
        currencyLocale: "vi-VN",
        currencyPrefix: "",
        title: "PHIẾU NHẬP HÀNG",
        company: {
          name: "Nhà hàng Hải Sản",
          address: "Nguyễn Văn Bảo, Gò Vấp, TP.HCM",
          phone: "0909 000 000",
          taxCode: "0123456789",
        },
        footerText: "Phiếu in từ hệ thống",
      });
    }}
  >
    In/PDF
  </Button>
  <Button onClick={() => onOpenChange(false)}>Đóng</Button>
</div>

            </>
          )}
          
        </div>
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Thanh toán NCC</DialogTitle>
    </DialogHeader>

    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        Phiếu: <span className="font-semibold">{data?.code}</span>
      </div>
      <div className="text-sm">
        Tổng hóa đơn: <span className="font-semibold">{money(data?.grandTotal)}</span>
      </div>
      <div className="text-sm">
        Đã thanh toán:{" "}
        <span className="font-semibold">{money(data?.amountPaid)}</span>
      </div>
      <div className="text-sm">
        Còn phải trả:{" "}
        <span className="font-semibold text-red-500">{money(remaining)}</span>
      </div>

      <div className="space-y-1">
        <div className="text-sm text-slate-600">Số tiền thanh toán thêm</div>
        <Input
          type="number"
          min={0}
          max={remaining}
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
        />
        <div className="text-xs text-slate-500">
          Không được vượt quá số còn phải trả.
        </div>
      </div>
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="outline"
        onClick={() => setPayOpen(false)}
        disabled={paying}
      >
        Hủy
      </Button>
      <Button
        onClick={() => {
          if (!data) return;
          const amount = Number(payAmount || 0);
          if (!amount || amount <= 0) {
            toast.error("Vui lòng nhập số tiền hợp lệ");
            return;
          }
          if (amount > remaining) {
            toast.error("Số tiền không được lớn hơn số còn phải trả");
            return;
          }

          payReceipt(
            { id: data.id, addAmountPaid: amount },
            {
              onSuccess: (res) => {
                // Cập nhật lại state local để không cần reload
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        amountPaid: res.amountPaid,
                        // nếu BE trả về remaining, có thể dùng cho hiển thị
                        // grandTotal: res.grandTotal, // nếu muốn sync theo BE
                        status: res.status,
                      }
                    : prev
                );
                toast.success("Thanh toán thành công");
                setPayOpen(false);
              },
              onError: (err: any) => {
                console.error(err);
                toast.error("Thanh toán thất bại");
              },
            }
          );
        }}
        disabled={paying}
      >
        {paying ? "Đang lưu..." : "Xác nhận thanh toán"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

      </DialogContent>

    </Dialog>
  );
}
