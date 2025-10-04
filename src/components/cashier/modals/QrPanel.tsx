// src/components/payments/QrPanel.tsx
"use client";
import QRCode from "react-qr-code";

export type QrPanelProps = {
  provider: "payos" | "vietqr";
  imgUrl?: string;        // ảnh PNG từ PayOS (có thể không có)
  qrPayload: string;      // chuỗi EMV / checkoutUrl (fallback)
  checkoutUrl?: string;   // chỉ PayOS mới có
  amount: number;
  addInfo: string;
  onToggle?: () => void;  // Ẩn QR (đóng panel)
  onPrint?: () => void;   // Bấm in phiếu
};

const vnd = (n: number) => n.toLocaleString("vi-VN");

export default function QrPanel({
  provider, imgUrl, qrPayload, checkoutUrl, amount, addInfo, onToggle, onPrint,
}: QrPanelProps) {
  return (
    <div className="rounded-lg border p-3 text-center space-y-2 bg-white">
      <div className="text-sm font-medium">
        {provider === "payos" ? "Mã PayOS thanh toán" : "Mã VietQR thanh toán"}
      </div>

      <div className="mx-auto w-56 h-56 flex items-center justify-center">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt="QR"
            className="max-w-full max-h-full object-contain border rounded bg-white"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <QRCode value={qrPayload} size={224} style={{ height: 224, width: 224 }} />
        )}
      </div>

      <div className="text-xs text-slate-600">
        Số tiền: <b>{vnd(amount)} đ</b> • Nội dung: <b>{addInfo}</b>
      </div>

      <div className="flex gap-2 justify-center">
        {provider === "payos" && checkoutUrl && (
          <a
            className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50"
            href={checkoutUrl} target="_blank" rel="noreferrer"
          >
            Mở link PayOS
          </a>
        )}
        <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50" onClick={onPrint}>
          In phiếu
        </button>
        <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50" onClick={onToggle}>
          Ẩn QR
        </button>
      </div>
    </div>
  );
}
