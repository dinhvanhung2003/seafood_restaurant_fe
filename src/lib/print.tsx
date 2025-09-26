import type { Receipt } from "@/components/cashier/modals/CheckoutModal";
import { currency } from "@/utils/money";

export function printReceipt(r: Receipt) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;

  const rows = r.items
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.name)}</td>
        <td style="text-align:center;">${l.qty}</td>
        <td style="text-align:right;">${currency(l.price)}</td>
        <td style="text-align:right;">${currency(l.total)}</td>
      </tr>`
    )
    .join("");

  const html = `
  <html>
  <head>
    <meta charSet="utf-8" />
    <title>${r.id}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      .wrap { width: 720px; margin: 0 auto; padding: 16px 24px; }
      h1 { font-size: 18px; margin: 0; text-align:center; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 6px 4px; border-bottom: 1px dashed #ddd; }
      .sum td { border: 0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
        <div>
          <div><b>Chi nhánh trung tâm</b> - Thu ngân</div>
         <div>Khách: ${escapeHtml(r.customerName || 'Khách lẻ')}</div>
         <div>SL: ${r.guestCount}</div>
          <div>Bàn: ${escapeHtml(r.tableName)}</div>
        </div>
        <div style="text-align:right;">
          <div>Mã: ${r.id}</div>
          <div>Ngày bán: ${r.createdAt}</div>
          <div>NV: ${escapeHtml(r.cashier)}</div>
        </div>
      </div>

      <h1>HÓA ĐƠN BÁN HÀNG</h1>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Tên hàng</th>
            <th style="width:70px;">SL</th>
            <th style="width:120px; text-align:right;">Đơn giá</th>
            <th style="width:120px; text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table class="sum" style="margin-top:12px; font-size:14px;">
        <tr><td>Tổng tiền hàng</td><td style="text-align:right;">${currency(r.subtotal)}</td></tr>
        <tr><td>Chiết khấu</td><td style="text-align:right;">${currency(r.discount)}</td></tr>
        <tr><td><b>Khách cần trả</b></td><td style="text-align:right;"><b>${currency(r.total)}</b></td></tr>
        <tr><td>Khách thanh toán (${r.method})</td><td style="text-align:right;">${currency(r.paid)}</td></tr>
        <tr><td>Tiền thừa</td><td style="text-align:right;">${currency(r.change)}</td></tr>
      </table>
    </div>
    <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
  </body>
  </html>`;

  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]!));
}
