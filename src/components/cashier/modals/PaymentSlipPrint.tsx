// src/components/payments/PaymentSlipPrint.tsx
"use client";

type Line = { name: string; qty: number; total: number };
export type PaymentSlipPrintProps = {
  shopName: string;
  shopAddress: string;
  invoiceId: string;
  tableName?: string;
  cashier?: string;
  customerName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  items: Line[];
  subtotal: number;
  discount?: number;
  vatRate?: number;
  amount: number;
  addInfo: string;
  // QR hiển thị trên phiếu (giống panel)
  imgUrl?: string;
  qrPayload: string;
};

const vnd = (n: number) => n.toLocaleString("vi-VN");

export default function PaymentSlipPrint(p: PaymentSlipPrintProps) {
  const vatAmt = Math.round(((p.vatRate ?? 0) / 100) * Math.max(0, p.subtotal - (p.discount ?? 0)));
  const grandTotal = Math.max(0, p.subtotal - (p.discount ?? 0)) + vatAmt;

  return (
    <>
      <style>{`
        .print-only { display: none; }
        @media print {
          .print-only { display: block !important; }
          .screen-only { display: none !important; }
          #qr-slip { width: 80mm; }
          body { background: white !important; }
        }
      `}</style>

      <div id="qr-slip" className="print-only mx-auto bg-white text-[12px] p-3 rounded-md">
        <div className="text-center font-semibold tracking-wide">PHIẾU TẠM TÍNH</div>
        <div className="mt-2">
          <div className="font-medium">{p.shopName}</div>
          <div className="text-slate-600">{p.shopAddress}</div>
          <div className="grid grid-cols-2 gap-x-2 mt-1 text-slate-700">
            <div>Mã HĐ: <span className="break-all">{p.invoiceId}</span></div>
            {p.cashier && <div>TN: {p.cashier}</div>}
            {p.tableName && <div>Bàn: {p.tableName}</div>}
            {p.customerName && <div>KH: {p.customerName}</div>}
            {p.checkInTime && <div>Giờ vào: {p.checkInTime}</div>}
            {p.checkOutTime && <div>Giờ ra: {p.checkOutTime}</div>}
          </div>
        </div>

        <div className="mt-2 border-y">
          <div className="grid grid-cols-12 py-1 font-medium">
            <div className="col-span-7">Tên món</div>
            <div className="col-span-2 text-center">SL</div>
            <div className="col-span-3 text-right">Thành tiền</div>
          </div>
          {p.items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 py-1">
              <div className="col-span-7 pr-2">{it.name}</div>
              <div className="col-span-2 text-center">x{it.qty}</div>
              <div className="col-span-3 text-right">{vnd(it.total)}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between"><span>Thành tiền:</span><b>{vnd(p.subtotal)} đ</b></div>
          {!!p.discount && <div className="flex justify-between"><span>Giảm giá:</span><b>-{vnd(p.discount)} đ</b></div>}
          {!!p.vatRate && <div className="flex justify-between"><span>Thuế (VAT: {p.vatRate}%):</span><b>{vnd(vatAmt)} đ</b></div>}
          <div className="flex justify-between border-t pt-1"><span className="font-medium">Tổng tiền:</span><b>{vnd(grandTotal)} đ</b></div>
        </div>

        <div className="mt-2 text-center font-medium">QR thanh toán</div>
        <div className="mt-1 flex justify-center">
          {p.imgUrl ? (
            <img src={p.imgUrl} alt="QR" className="w-[224px] h-[224px] object-contain border rounded bg-white" />
          ) : (
            // ảnh QR fallback: nếu muốn bắt buộc render bằng react-qr-code, import và dùng tương tự Panel
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=224x224&data=${encodeURIComponent(p.qrPayload)}`} className="w-[224px] h-[224px]" />
          )}
        </div>

        <div className="mt-2 text-[12px]">
          <div className="flex justify-between"><span>Số tiền</span><b>{vnd(p.amount)} đ</b></div>
          <div className="flex justify-between"><span>Nội dung</span><b className="break-all">{p.addInfo}</b></div>
        </div>
      </div>
    </>
  );
}
