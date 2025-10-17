// src/lib/print/PaymentQrSlip.tsx
"use client";
import { useState, useMemo } from "react";
import QRCode from "react-qr-code";

type Line = { name: string; qty: number; price: number; total: number };

type Common = {
  // — Header
  shopName: string;
  shopAddress: string;

  // — Thông tin hóa đơn/khách/bàn
  invoiceId: string;
  cashier?: string;
  tableName?: string;
  customerName?: string;
  checkInTime?: string;   // "13:44"
  checkOutTime?: string;  // "11:41" hoặc new Date().toLocaleString()

  // — Dòng hàng
  items: Line[];

  // — Tổng hợp tiền
  subtotal: number;
  discount?: number;      // số tiền giảm
  vatRate?: number;       // ví dụ 10 cho 10%
  notes?: string;

  // — Chung
  amount: number;
  addInfo: string;

  onClose?: () => void;
};

type PayOSProps = Common & {
  kind: "payos";
  imgUrl?: string;        // ảnh PNG từ PayOS (nếu có)
  qrPayload: string;      // EMV string (hoặc fallback = checkoutUrl)
  checkoutUrl: string;    // để mở link
};

type VietQRProps = Common & {
  kind: "vietqr";
  pngDataUrl: string;     // data:... hoặc raw base64
  bankName: string;
  accountNo: string;
  accountName: string;
};

export type PaymentQrSlipProps = PayOSProps | VietQRProps;

const vnd = (n: number) => n.toLocaleString("vi-VN");

export default function PaymentQrSlip(props: PaymentQrSlipProps) {
  const [showQR, setShowQR] = useState(true);

  const vatAmount = useMemo(
    () => Math.round(((props.vatRate ?? 0) / 100) * Math.max(0, props.subtotal - (props.discount ?? 0))),
    [props.vatRate, props.subtotal, props.discount]
  );
  const grandTotal = useMemo(
    () => Math.max(0, props.subtotal - (props.discount ?? 0)) + vatAmount,
    [props.subtotal, props.discount, vatAmount]
  );

  const handlePrint = () => window.print();
  const openCheckout = () => {
    if (props.kind === "payos") window.open(props.checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #qr-slip, #qr-slip * { visibility: visible; }
          #qr-slip { position:absolute; left:0; top:0; width:80mm; }
          #qr-actions { display:none !important; }
        }
      `}</style>

      <div id="qr-slip" className="w-[80mm] max-w-[80mm] mx-auto bg-white text-[12px] p-3 rounded-md border shadow-sm">
        {/* Title */}
        <div className="text-center font-semibold tracking-wide">PHIẾU TẠM TÍNH</div>

        {/* Shop + meta */}
        <div className="mt-2">
          <div className="font-medium">{props.shopName}</div>
          <div className="text-slate-600">{props.shopAddress}</div>

          <div className="grid grid-cols-2 gap-x-2 mt-1 text-slate-700">
            <div>Mã HĐ: <span className="break-all">{props.invoiceId}</span></div>
            {props.cashier && <div>TN: {props.cashier}</div>}
            {props.tableName && <div>Bàn: {props.tableName}</div>}
            {props.customerName && <div>KH: {props.customerName}</div>}
            {props.checkInTime && <div>Giờ vào: {props.checkInTime}</div>}
            {props.checkOutTime && <div>Giờ ra: {props.checkOutTime}</div>}
          </div>
        </div>

        {/* Items */}
        <div className="mt-2 border-y">
          <div className="grid grid-cols-12 py-1 font-medium">
            <div className="col-span-7">Tên món</div>
            <div className="col-span-2 text-center">SL</div>
            <div className="col-span-3 text-right">Thành tiền</div>
          </div>

          {props.items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 py-1">
              <div className="col-span-7 pr-2">{it.name}</div>
              <div className="col-span-2 text-center">x{it.qty}</div>
              <div className="col-span-3 text-right">{vnd(it.total)}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Thành tiền:</span>
            <b>{vnd(props.subtotal)} đ</b>
          </div>
          {!!props.discount && props.discount > 0 && (
            <div className="flex justify-between">
              <span>Giảm giá:</span>
              <b>-{vnd(props.discount)} đ</b>
            </div>
          )}
          {!!props.vatRate && props.vatRate > 0 && (
            <div className="flex justify-between">
              <span>Thuế (VAT: {props.vatRate}%):</span>
              <b>{vnd(vatAmount)} đ</b>
            </div>
          )}
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">Tổng tiền:</span>
            <b className="text-[13px]">{vnd(grandTotal)} đ</b>
          </div>
        </div>

        {/* QR title */}
        <div className="mt-2 text-center font-medium">
          {props.kind === "payos" ? "PayOS QR đa năng" : "VietQR chuyển khoản"}
          <div className="text-slate-600 text-[11px]">Thanh toán qua mọi ứng dụng</div>
        </div>

        {/* QR (ẩn/hiện) */}
        {showQR && (
          <div className="mt-2 flex justify-center">
            {props.kind === "payos" ? (
              <div className="w-[224px] h-[224px] flex items-center justify-center border rounded bg-white">
                {props.imgUrl ? (
                  <img
                    src={props.imgUrl}
                    alt="PayOS QR"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <QRCode value={props.qrPayload} size={210} style={{ width: 210, height: 210 }} />
                )}
              </div>
            ) : (
              <img
                src={props.pngDataUrl.startsWith("data:")
                  ? props.pngDataUrl
                  : `data:image/png;base64,${props.pngDataUrl}`}
                alt="VietQR"
                className="w-[224px] h-[224px] object-contain border rounded bg-white"
              />
            )}
          </div>
        )}

        {/* Payment info under QR */}
        <div className="mt-2 text-[12px]">
          <div className="flex justify-between">
            <span>Số tiền</span><b>{vnd(props.amount)} đ</b>
          </div>
          <div className="flex justify-between">
            <span>Nội dung</span><b className="break-all">{props.addInfo}</b>
          </div>
          {props.kind === "vietqr" && (
            <div className="mt-1 text-slate-600">
              NH: <b>{(props as any).bankName}</b> • STK: <b>{(props as any).accountNo}</b> • Tên: <b>{(props as any).accountName}</b>
            </div>
          )}
          {props.kind === "payos" && (
            <div className="mt-1">
              Hoặc mở link:&nbsp;
              <a className="underline" target="_blank" rel="noreferrer" href={(props as any).checkoutUrl}>
                PayOS Checkout
              </a>
            </div>
          )}
          <div className="mt-2 text-center text-[11px] text-slate-600">
            Vui lòng quét mã bằng ứng dụng ngân hàng. Mã có hiệu lực trong vài phút.
          </div>
          {props.notes && <div className="mt-1 text-[11px] text-slate-600">{props.notes}</div>}
        </div>

        {/* ACTIONS (ẩn khi in) */}
        <div id="qr-actions" className="mt-3 flex items-center justify-center gap-2">
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50"
                  onClick={() => setShowQR(v => !v)}>
            {showQR ? "Ẩn QR" : "Hiện QR"}
          </button>
          {props.kind === "payos" && (
            <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50" onClick={openCheckout}>
              Mở link PayOS
            </button>
          )}
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50" onClick={handlePrint}>
            In phiếu
          </button>
          {props.onClose && (
            <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50" onClick={props.onClose}>
              Đóng
            </button>
          )}
        </div>
      </div>
    </>
  );
}
