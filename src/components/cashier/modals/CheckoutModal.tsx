"use client";

import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Catalog, OrderItem, Table as TableType } from "@/types/types";
import { currency } from "@/utils/money";
import { printReceipt } from "@/lib/print";
import QrPanel from "@/components/cashier/modals/QrPanel";
import PaymentSlipPrint from "@/components/cashier/modals/PaymentSlipPrint";
import api from "@/lib/axios";
import { Percent, ReceiptText } from "lucide-react";
import { useCashierStore } from "@/store/cashier";
import PromotionPicker from "./PromotionPicker";
import { useInvoiceSocket } from "@/hooks/cashier/socket/useInvoiceSocket";

type PayMethod = "cash" | "card" | "vnpay" | "vietqr";

type ReceiptLine = {
  id: string; // menuItemId
  name: string;
  qty: number;
  price: number;
  total: number;
  rowId?: string; // optional
  originPrice?: number;
  discountAmount?: number;
  badge?: string | null;
};

export type Receipt = {
  id: string;
  tableId: string;
  tableName: string;
  createdAt: string;
  cashier: string;
  items: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  method: PayMethod;
  customerName?: string;
  guestCount?: number;
};

type PayOSQrState = {
  kind: "payos";
  invoiceId: string;
  imgUrl?: string;
  qrPayload: string;
  checkoutUrl: string;
  amount: number;
  addInfo: string;
};

type VietQrState = {
  kind: "vietqr";
  invoiceId: string;
  pngDataUrl: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
};

type QRState = PayOSQrState | VietQrState;

type Props = {
  open: boolean;
  onClose: () => void;
  table: TableType;
  items: OrderItem[];
  catalog: Catalog;
  onSuccess: (r: Receipt) => void;
  orderId: string | null;
  customer?: { id: string; name: string } | null;
  onClearCustomer?: () => void;
};

export default function CheckoutModal({
  open,
  onClose,
  table,
  items,
  catalog,
  onSuccess,
  orderId,
}: Props) {
  // ====== Store/selectors ======
  const selectedCus = useCashierStore((s) => s.selectedCustomer);
  const clearSelectedCus = useCashierStore((s) => s.clearSelectedCustomer);
  const guestCount = useCashierStore((s) => s.guestCount);
  const resetGuest = useCashierStore((s) => s.resetGuestCount);
  const [invoice, setInvoice] = useState<any | null>(null);
  // const ips = (invoice?.invoicePromotions ?? []) as any[];
  const ips = (invoice?.invoicePromotions ?? []) as any[];
  // const orderIps = ips.filter((ip) => ip?.applyWith === "ORDER");
  const autoIps = ips.filter((ip) => ip?.applyWith !== "ORDER");
  const orderIps = ips.filter((ip) => ip?.applyWith === "ORDER");
  // const hasOrderPromotion =
  //   orderIps.length > 0 || Number(invoice?.discountTotal ?? 0) > 0;

  const autoNames = autoIps
    .map((ip) => ip?.promotion?.name)
    .filter(Boolean)
    .join(", ");
  const orderNames = orderIps
    .map((ip) => ip?.promotion?.name)
    .filter(Boolean)
    .join(", ");

  // TIỀN GIẢM

  const autoAmount = autoIps.reduce(
    (s, ip) => s + Number(ip?.discountAmount ?? 0),
    0
  );
  const orderAmount = orderIps.reduce(
    (s, ip) => s + Number(ip?.discountAmount ?? 0),
    0
  );

  const promoTitle = [
    autoNames && `${autoNames} (áp tự động)`,
    orderNames && `${orderNames}`,
  ]
    .filter(Boolean)
    .join(" + ");

  const totalDiscountShown = autoAmount + orderAmount; // để hiện trong Ô bên phải

  // Chuỗi hiển thị “25k + 30k = 55k”
  const promoBreakdown =
    totalDiscountShown > 0
      ? `${orderAmount > 0 ? currency(orderAmount) : ""} `
      : "";

  const lines: ReceiptLine[] = useMemo(() => {
    // Nếu đã có invoice từ BE => render theo invoice.order.items
 
    const invItems = invoice?.order?.items ?? [];
if (invItems.length) {
  return invItems.map((it: any) => {
    const menuId = it.menuItem?.id ?? it.id;
    const catalogItem = catalog.items.find((x) => x.id === menuId);

    const origin = Number(catalogItem?.price ?? it.menuItem?.price ?? it.price ?? 0);
    const price  = Number(it.price ?? (catalogItem as any)?.priceAfterDiscount ?? origin);
    const qty    = Number(it.quantity ?? 0);
    const discountAmount = Math.max(0, origin - price);

    return {
      rowId: it.id,              // ← thêm dòng này (duy nhất theo order item)
      id: menuId,                // menuItemId (có thể trùng giữa các dòng)
      name: it.menuItem?.name ?? catalogItem?.name ?? it.name ?? "Món",
      qty,
      price,
      total: price * qty,
      originPrice: origin,
      discountAmount,
      badge: discountAmount > 0 ? `-${discountAmount.toLocaleString()}đ` : null,
    } as ReceiptLine;
  });
}


    // Chưa có invoice => fallback về dữ liệu cũ (catalog + items)
    const map = new Map<string, ReceiptLine>();
    for (const it of items) {
      const m = catalog.items.find((x) => x.id === it.id);
      if (!m) continue;

      const origin = Number(m.price ?? 0);
      const price = (m as any).priceAfterDiscount ?? origin;
      const discountAmount = Number((m as any).discountAmount ?? 0);
      const badge = (m as any).badge ?? null;

      const cur =
        map.get(it.id) ??
        ({
           rowId: `agg-${it.id}`, 
          id: it.id,
          name: m.name,
          qty: 0,
          price,
          total: 0,
          originPrice: origin,
          discountAmount,
          badge,
        } as ReceiptLine);

      cur.qty += it.qty;
      cur.price = price;
      cur.originPrice = origin;
      cur.discountAmount = discountAmount;
      cur.badge = badge;
      cur.total = cur.qty * cur.price;
      map.set(it.id, cur);
    }
    return Array.from(map.values());
  }, [items, catalog.items, invoice]);

  // ====== UI states ======
  const [qr, setQr] = useState<QRState | null>(null);
  const [method, setMethod] = useState<PayMethod>("cash");
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.total, 0),
    [lines]
  );












  
  // Discount hiển thị phía FE; sẽ sync từ BE nếu BE có
  const [discount, setDiscount] = useState(0);

  // Tạo invoice 1 lần rồi giữ lại; khi apply khuyến mãi sẽ refresh
  // const [hasAppliedPromotion, setHasAppliedPromotion] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  // paid và change hiển thị phía FE (paid mặc định = total)
  const [paid, setPaid] = useState(0);

  // chờ thanh toán VietQR (websocket)
  const [waiting, setWaiting] = useState(false);
  const [readyToFinish, setReadyToFinish] = useState<{
    invoiceId: string;
    paidAmount: number;
  } | null>(null);

  // // ====== LẤY TỔNG PHẢI TRẢ TỪ BE (điểm sửa #1)
  // const beTotal = invoice
  //   ? Number(invoice.finalAmount ?? invoice.totalAmount ?? 0)
  //   : null;
  const beTotal = invoice
    ? Number(invoice.finalAmount ?? invoice.totalAmount ?? 0)
    : null;
  const totalUI =
    beTotal != null ? beTotal : Math.max(0, subtotal - (discount || 0));

  // đồng bộ paid theo total UI khi total đổi
  useEffect(() => setPaid(totalUI), [totalUI]);
  // chỉ lo chuyện đồng bộ / reset khi đổi orderId
useEffect(() => {
  if (!open || !orderId) return;

  // Nếu đã có invoice nhưng KHÁC order hiện tại -> reset (trường hợp vừa chuyển bàn / ghép đơn)
  if (invoice && invoice.order?.id !== orderId) {
    setInvoice(null);
    setDiscount(0);
    setPaid(0);
    setQr(null);
    setWaiting(false);
    setReadyToFinish(null);
  }

  // Gọi đảm bảo invoice, nhưng nếu state đã có invoice đúng orderId thì chỉ return, không POST thêm
  ensureInvoice().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, orderId, table.id]);


  const canConfirm = totalUI > 0 && paid >= totalUI;

  // ====== Helpers ======
  const pollPaymentUntilDone = async (
    txnRef: string,
    timeoutMs = 5 * 60 * 1000
  ) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const s = await api
        .get(`/payments/vnpay/status`, { params: { txnRef } })
        .then((r) => r.data);
      if (["PAID", "FAILED", "EXPIRED"].includes(s.status)) return s;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return { status: "TIMEOUT" };
  };
console.log("POST body", {
  customerId: selectedCus?.id ?? null,
  guestCount,
});
 const ensureInvoice = async () => {
  if (!orderId) {
    toast.error(
      "Chưa có Order cho bàn này. Vui lòng 'Gửi bếp' trước khi thanh toán."
    );
    throw new Error("NO_ORDER");
  }

  // Nếu invoice hiện tại đã đúng order + đúng customer + đúng guestCount
  // thì khỏi gọi lại BE
  if (
    invoice &&
    invoice.order?.id === orderId &&
    (invoice.customer?.id ?? null) === (selectedCus?.id ?? null) &&
    (invoice.guestCount ?? null) === (guestCount ?? null)
  ) {
    return invoice;
  }

  const invRes = await api.post(`/invoices/from-order/${orderId}`, {
    customerId: selectedCus?.id ?? null,
    guestCount: guestCount ?? null,   // 👈 GỬI LÊN Ở ĐÂY
  });

  const inv = invRes.data;
  const mergedInv = { ...inv } as any;

  if (mergedInv?.order?.items && Array.isArray(mergedInv.order.items)) {
    mergedInv.order = { ...mergedInv.order };
    mergedInv.order.items = mergedInv.order.items.map((it: any) => {
      const menuId = it.menuItem?.id ?? it.id;
      const catalogItem = catalog.items.find((x) => x.id === menuId);

      const origin = Number(
        catalogItem?.price ?? it.menuItem?.price ?? it.price ?? 0
      );
      const price = Number((catalogItem as any)?.priceAfterDiscount ?? origin);

      return {
        ...it,
        price,
        menuItem: { ...(it.menuItem ?? {}), price: origin },
      };
    });
  }

  setInvoice(mergedInv);
  setDiscount(Number(mergedInv.discountTotal ?? 0));
  setPaid(Number(mergedInv.finalAmount ?? mergedInv.totalAmount ?? 0));
  return mergedInv;
};


  // const openPromotion = async () => {
  //   try {
  //     const inv = await ensureInvoice();
  //     const hasOrder =
  //       (inv?.invoicePromotions ?? []).some(
  //         (ip: any) => ip?.applyWith === "ORDER"
  //       ) || Number(inv?.discountTotal ?? 0) > 0;

  //     if (hasOrder) {
  //       toast.error(
  //         "Hoá đơn đã có khuyến mãi HÓA ĐƠN. Xoá khuyến mãi hiện tại trước khi thêm mã khác."
  //       );
  //       return;
  //     }
  //     setShowPromo(true);
  //   } catch {
  //     toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
  //   }
  // };
  const openPromotion = async () => {
    try {
      await ensureInvoice();
    } catch {}
    setShowPromo(true);
  };




// xóa effect
useEffect(() => {
  if (!open) return;

  // reset toàn bộ state phụ thuộc order
  setInvoice(null);
  setDiscount(0);
  setPaid(0);
  setQr(null);
  setWaiting(false);
  setReadyToFinish(null);

  // lấy invoice mới theo orderId mới
  ensureInvoice().catch(() => {});
}, [orderId, table.id, open, selectedCus?.id, guestCount]);









  const applyPromotion = async ({ promotionId }: { promotionId: string }) => {
    if (!invoice) return;
    try {
      const resp = await api.post(`/invoices/${invoice.id}/apply-promotions`, {
        promotionId,
      });
      const refreshed =
        resp?.data?.invoice ?? resp?.data?.data?.invoice ?? resp?.data;
      setInvoice(refreshed);
      setDiscount(Number(refreshed?.discountTotal ?? 0));
      setPaid(Number(refreshed?.finalAmount ?? refreshed?.totalAmount ?? 0));
      toast.success("Đã áp dụng khuyến mãi");
      setShowPromo(false);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      toast.error(
        m === "PROMOTION_ALREADY_APPLIED"
          ? "Khuyến mãi này đã áp trên hoá đơn"
          : m === "PROMOTION_NOT_APPLICABLE"
          ? "Khuyến mãi không áp dụng cho hoá đơn này"
          : "Áp dụng khuyến mãi thất bại"
      );
    }
  };

  const removePromotionFlow = async () => {
    if (!invoice) return;

    const orderLevelIps = (invoice?.invoicePromotions ?? []).filter(
      (ip: any) => ip?.applyWith === "ORDER"
    );
    if (!orderLevelIps.length) {
      toast.error("Hoá đơn không có khuyến mãi HÓA ĐƠN để xoá.");
      return;
    }

    try {
      let latest = invoice;
      for (const ip of orderLevelIps) {
        const resp = await api.patch(
          `/invoices/${invoice.id}/promotions/${ip.id}/remove`
        );
        const body = resp?.data ?? resp;
        latest = body?.invoice ?? body?.data?.invoice ?? latest;
      }

      setInvoice(latest);
      // setHasAppliedPromotion(
      //   (latest?.invoicePromotions ?? []).some(
      //     (ip: any) => ip?.applyWith === "ORDER"
      //   ) || Number(latest?.discountTotal ?? 0) > 0
      // );
      setDiscount(Number(latest.discountTotal ?? 0));
      setPaid(Number(latest.finalAmount ?? latest.totalAmount ?? 0));

      toast.success("Đã xoá khuyến mãi");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(
        msg === "CANNOT_REMOVE_PROMOTION_FROM_PAID_INVOICE"
          ? "Không thể xoá khuyến mãi với hoá đơn đã trả"
          : "Xoá khuyến mãi thất bại"
      );
    }
  };

  const handleConfirm = async () => {
    try {
      // 1) đảm bảo đã có invoice (đã chứa KM nếu người dùng chọn)
      const inv = await ensureInvoice();

      // 2) THANH TOÁN PHẢI DÙNG finalAmount
      // const amountToPay =
      //   hasBeDiscount || hasBePromotionFlag
      //     ? Number(inv?.finalAmount ?? inv?.totalAmount ?? 0)
      //     : Math.max(0, subtotal - (discount || 0));
      const amountToPay = totalUI;
      if (!amountToPay) {
        toast.error("Invoice không có tổng tiền hợp lệ.");
        return;
      }

      // ===== CASH =====
      if (method === "cash") {
        await api.post(`/invoices/${inv.id}/payments`, {
          amount: amountToPay,
          method: "CASH",
        });

        const receipt: Receipt = {
          id: inv.id,
          tableId: table.id,
          customerName: selectedCus?.name ?? inv?.customer?.name ?? "Khách lẻ",
          tableName: `${table.name} / ${table.floor}`,
          createdAt: new Date().toLocaleString(),
          cashier: "Thu ngân",
          items: lines,
          subtotal,
          discount,
          total: totalUI,
          paid: amountToPay,
          change: Math.max(0, paid - totalUI),
          method: "cash",
          guestCount,
        };

        printReceipt(receipt);
        onSuccess(receipt);
        clearSelectedCus();
        resetGuest();
        setInvoice(null);
        onClose();
        toast.success("Thanh toán tiền mặt thành công");
        return;
      }

      // ===== VIETQR (PayOS) =====
      if (method === "vietqr") {
        // Request link using the UI-visible total so the QR matches what the
        // cashier sees (totalUI). Backend may compute a different invoice
        // finalAmount later, but for payment link generation use the UI value.
        const requestedLinkAmount = Math.max(0, Math.round(totalUI));

        const link = await api
          .post("/payments/payos/create-link", {
            invoiceId: inv.id,
            amount: requestedLinkAmount,
            buyerName: table.name,
          })
          .then((r) => r.data);

        const isImg =
          typeof link.qrCode === "string" &&
          /^(https?:|data:)/i.test(link.qrCode);

        // If provider returns an explicit amount, prefer it for display;
        // otherwise use the amount we requested based on UI.
        const providerAmount =
          link &&
          (link.amount || link.total || link.payAmount || link.amountPaid)
            ? Number(
                link.amount ?? link.total ?? link.payAmount ?? link.amountPaid
              )
            : null;
        const displayAmount = Number(providerAmount ?? requestedLinkAmount);

        setQr({
          kind: "payos",
          invoiceId: inv.id,
          imgUrl: isImg ? link.qrCode : undefined,
          qrPayload: isImg ? link.checkoutUrl : link.qrCode,
          checkoutUrl: link.checkoutUrl,
          amount: displayAmount,
          addInfo: `INV:${inv.id.slice(0, 12)}`,
        });

        setWaiting(true);
        setReadyToFinish(null);

        try {
          const { waitUntilPaid } = await import("@/lib/paysocket");
          const r = await waitUntilPaid(inv.id, 10 * 60 * 1000);
          setReadyToFinish({ invoiceId: inv.id, paidAmount: r.paidAmount });
          toast.success("Đã nhận tiền qua VietQR");
        } catch (e: any) {
          toast.error(
            e?.message === "TIMEOUT"
              ? "Quá thời gian chờ thanh toán"
              : "Lỗi khi chờ thanh toán"
          );
        } finally {
          setWaiting(false);
        }
        return;
      }

      // ===== VNPAY =====
      if (method === "vnpay") {
        const { data } = await api.post(`/payments/vnpay/create`, {
          invoiceId: inv.id,
          amount: amountToPay,
        });

        if (!data?.payUrl || !data?.vnp_TxnRef) {
          toast.error("Không tạo được URL VNPay");
          return;
        }

        window.open(data.payUrl, "_blank");
        const result = await pollPaymentUntilDone(
          data.vnp_TxnRef,
          15 * 60 * 1000
        );

        if (result.status === "PAID") {
          const receipt: Receipt = {
            id: inv.id,
            tableId: table.id,
            tableName: `${table.name} / ${table.floor}`,
            createdAt: new Date().toLocaleString(),
            cashier: "Thu ngân",
            items: lines,
            subtotal,
            discount,
            total: totalUI,
            paid: amountToPay,
            change: 0,
            method: "vnpay",
          };
          printReceipt(receipt);
          onSuccess(receipt);
          clearSelectedCus();
          resetGuest();
          setInvoice(null);
          onClose();
          toast.success("Thanh toán VNPay thành công");
        } else if (result.status === "FAILED") {
          toast.error("Thanh toán VNPay thất bại");
        } else if (result.status === "EXPIRED") {
          toast.error("Mã thanh toán đã hết hạn");
        } else {
          toast.error("Không nhận được kết quả thanh toán (timeout)");
        }
        return;
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || "Lỗi thanh toán";
      toast.error("Thanh toán thất bại", { description: msg });
    }
  };

  const finalize = () => {
    if (!readyToFinish) return;
    const paidAmount = readyToFinish.paidAmount;

    const receipt: Receipt = {
      id: readyToFinish.invoiceId,
      tableId: table.id,
      tableName: `${table.name} / ${table.floor}`,
      createdAt: new Date().toLocaleString(),
      cashier: "Thu ngân",
      items: lines,
      subtotal,
      discount,
      total: totalUI,
      paid: paidAmount,
      change: 0,
      method: "vietqr",
      customerName: selectedCus?.name ?? "Khách lẻ",
      guestCount,
    };

    printReceipt(receipt);
    onSuccess(receipt);
    clearSelectedCus();
    resetGuest();
    setInvoice(null);
    onClose();
  };

  const gridCols = qr
    ? "lg:grid-cols-[2fr_1fr_380px]"
    : "lg:grid-cols-[2fr_1fr]";

  const promotionName =
    invoice?.promotionName ||
    orderIps
      .map((ip: any) => ip?.promotion?.name)
      .filter(Boolean)
      .join(", ") ||
    (discount > 0 ? "Giảm thủ công" : null);





const invoiceId = invoice?.id ?? null;

// 2) Lắng nghe socket: PAID / PARTIAL
useInvoiceSocket(invoiceId, {
  extraInvalidate: [
    { key: ["order.detail.byTable", table.id] },
    { key: ["kitchen-progress-by-order"] },
  ],
  onPaid: ({ amount, method }) => {
    // Nếu là thanh toán tiền mặt thì bỏ qua, vì đã xử lý/in ở handleConfirm
    if (method === "CASH" || method === "cash") return;

    toast.success("Đã thanh toán thành công", {
      description: `${(amount ?? 0).toLocaleString("vi-VN")} đ · ${method || "BANK"}`,
    });
    onClose();
  },
  onPartial: ({ amount, remaining }) => {
    toast.info("Đã nhận thanh toán một phần", {
      description: `Nhận: ${(amount ?? 0).toLocaleString("vi-VN")} đ, còn lại: ${(remaining ?? 0).toLocaleString("vi-VN")} đ`,
    });
  },
});











  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          z-[100]
          !w-[90vw] !max-w-[90vw] !h-[90vh] !max-h-[90vh]
          p-0 overflow-visible rounded-2xl
        "
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-slate-700" />
              Phiếu thanh toán 
              <span className="ml-2 text-sm font-normal text-slate-500">
                {table.name} / {table.floor}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="flex-1 overflow-hidden px-4 pb-4">
            <div className={`grid h-full gap-6 ${gridCols}`}>
              {/* Cột trái: danh sách món */}
              <div className="rounded-xl border flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="font-medium">Khác</div>
                  <Badge variant="secondary">{lines.length} món</Badge>
                </div>
                <Separator />
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {lines.map((l,i) => {
                    
                    const hasPromo =
                      Number(l.discountAmount ?? 0) > 0 ||
                      (typeof l.originPrice === "number" &&
                        l.price < (l.originPrice ?? 0));
                    return (
                      <div
                         key={l.rowId ?? `${l.id}-${i}`}
                        className={`grid grid-cols-12 items-center text-sm ${
                          hasPromo ? "rounded-md bg-emerald-50/40 p-2" : ""
                        }`}
                      >
                        <div className="col-span-6 truncate font-medium flex items-center gap-2">
                          <span>{l.name}</span>
                          {hasPromo && (
                            <span className="inline-flex items-center ml-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-xs font-semibold">
                              KM{" "}
                              {l.badge ??
                                `-${Number(
                                  l.discountAmount ??
                                    (l.originPrice ?? 0) - l.price
                                ).toLocaleString()}đ`}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-center">x{l.qty}</div>
                        <div className="col-span-2 text-right">
                          {hasPromo ? (
                            <div>
                              <div className="text-xs text-slate-400 line-through">
                                {currency(l.originPrice ?? l.price)}
                              </div>
                              <div className="text-sm font-bold text-emerald-700">
                                {currency(l.price)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">{currency(l.price)}</div>
                          )}
                        </div>
                        <div className="col-span-2 text-right font-semibold">
                          {currency(l.total)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cột phải: khu tính tiền */}
              <div className="rounded-xl border p-4 overflow-auto min-h-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng tiền hàng</span>
                    <span className="font-semibold">{currency(subtotal)}</span>
                  </div>

                  {/* Discount hiển thị ở ngay hàng % giảm giá (nổi bật khi có KM) */}
                  <div
                    className={`flex items-center justify-between ${
                      Number(invoice?.discountTotal ?? 0) > 0 || discount > 0
                        ? "bg-emerald-50 border-l-4 border-emerald-200 p-2 rounded-md"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <Label className="flex items-center gap-2 text-slate-600">
                        <Percent className="h-4 w-4" /> Giảm hóa đơn
                        {orderIps.length > 0 && (
                          <span className="ml-2 text-sm font-medium text-emerald-700">
                            {orderIps
                              .map((ip) => ip?.promotion?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </Label>

                      <div className="text-xs text-slate-500">
                        {promoBreakdown}
                      </div>
                    </div>
                    <Input
                      value={orderAmount}
                      className="w-40 text-right"
                      type="number"
                      disabled
                    />
                    {/* <Input
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-40 text-right"
                      type="number"
                      min={0}
                      max={subtotal}
                      disabled={!!invoice}
                    /> */}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Khách cần trả</span>
                    <span className="text-lg font-bold text-[#0B63E5]">
                      {currency(totalUI)}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={openPromotion}>
                      Chọn khuyến mãi
                    </Button>
                    {/* Hiện nút Xóa khuyến mãi rõ ràng (nổi bật) nếu FE/BE nhận biết có promotionName */}
                    {promotionName ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          const ok = window.confirm(
                            "Bạn có chắc muốn xoá khuyến mãi đã áp trên hoá đơn không?"
                          );
                          if (!ok) return;
                          removePromotionFlow();
                        }}
                      >
                        Xóa khuyến mãi
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-500">Khách thanh toán</Label>
                    <RadioGroup
                      value={method}
                      onValueChange={(v) => setMethod(v as PayMethod)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m1" value="cash" />
                        <Label htmlFor="m1" className="flex items-center gap-1">
                          Tiền mặt
                        </Label>
                      </div>
                      {/* <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m4" value="vnpay" />
                        <Label htmlFor="m4" className="flex items-center gap-1">
                          VNPay
                        </Label>
                      </div> */}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m2" value="vietqr" />
                        <Label htmlFor="m2" className="flex items-center gap-1">
                          VietQR
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="text-right"
                        value={paid}
                        min={0}
                        onChange={(e) => setPaid(Number(e.target.value) || 0)}
                      />
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {[90000, 100000, 200000, 500000].map((v) => (
                        <Button
                          key={v}
                          variant="secondary"
                          size="sm"
                          onClick={() => setPaid(v)}
                        >
                          {currency(v)}
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        Tiền thừa trả khách
                      </span>
                      <span className="font-semibold">
                        {currency(Math.max(0, paid - totalUI))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 3: QR */}
              {qr && qr.kind === "payos" && (
                <div className="rounded-xl border p-3 bg-white overflow-auto hidden lg:block">
                  <QrPanel
                    provider="payos"
                    imgUrl={qr.imgUrl}
                    qrPayload={qr.qrPayload}
                    checkoutUrl={qr.checkoutUrl}
                    amount={qr.amount}
                    addInfo={qr.addInfo}
                    onToggle={() => setQr(null)}
                    onPrint={() => window.print()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* PRINT-ONLY */}
          {qr && qr.kind === "payos" && (
            <div id="print-slip" className="print-only">
              <PaymentSlipPrint
                shopName="SEAFOOD RESTAURANT"
                shopAddress="123 Lê Lợi, Q.1, TP.HCM"
                invoiceId={qr.invoiceId}
                cashier="Thu ngân"
                tableName={`${table.name} / ${table.floor}`}
                customerName={selectedCus?.name ?? "Khách lẻ"}
                checkInTime={new Date().toLocaleString("vi-VN")}
                checkOutTime={new Date().toLocaleString("vi-VN")}
                items={lines.map((l) => ({
                  name: l.name,
                  qty: l.qty,
                  total: l.total,
                }))}
                subtotal={lines.reduce((s, l) => s + l.total, 0)}
                discount={discount}
                vatRate={10}
                amount={qr.amount}
                addInfo={qr.addInfo}
                imgUrl={qr.imgUrl}
                qrPayload={qr.qrPayload ?? qr.checkoutUrl ?? ""}
              />
            </div>
          )}

          {/* FOOTER */}
          <DialogFooter className="p-4 border-t bg-background">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>

            {method === "vietqr" ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={readyToFinish ? finalize : handleConfirm}
                disabled={waiting || (!!qr && !readyToFinish)}
              >
                {waiting && !readyToFinish
                  ? "Đang chờ thanh toán…"
                  : readyToFinish
                  ? "Hoàn tất & in hoá đơn"
                  : "Tạo QR & chờ thanh toán"}
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                Thanh toán
              </Button>
            )}
          </DialogFooter>
        </div>

        {/* PromotionPicker */}
        <PromotionPicker
          open={showPromo}
          onClose={() => setShowPromo(false)}
          invoiceId={invoice?.id ?? ""}
          onApply={applyPromotion}
          invoiceHasPromotion={orderIps.length > 0}
          // invoiceHasPromotion={hasOrderPromotion}
        />
      </DialogContent>
    </Dialog>
  );
}


