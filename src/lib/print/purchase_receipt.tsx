import type { ReceiptDetail, PrintOptions } from "./invoice_purchase";

function money(n?: number, locale = "vi-VN", prefix = "") {
  return prefix + Number(n || 0).toLocaleString(locale);
}
function fmtDiscount(type: "AMOUNT" | "PERCENT", val: number, locale = "vi-VN", prefix = "") {
  return type === "PERCENT" ? `${val}%` : money(val, locale, prefix);
}

function buildStyles() {
  // CSS tối giản cho khổ A4 + in
  return `
  <style>
    @page { size: A4; margin: 16mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    :root {
      --border: #e5e7eb;
      --text: #111827;
      --muted: #6b7280;
      --accent: #111827;
      --bg-head: #f3f4f6;
    }
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: var(--text); }
    .wrap { max-width: 210mm; margin: 0 auto; }
    .hdr { display:flex; align-items:center; gap:16px; margin-bottom: 12px; }
    .logo { width:56px; height:56px; object-fit:contain; }
    .company h1 { margin:0; font-size:18px; }
    .company div { font-size:12px; color: var(--muted); }
    .title { text-align:center; font-size:18px; font-weight:700; margin: 8px 0 6px; letter-spacing: .5px; }
    .meta { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; font-size:12px; margin-bottom: 10px; }
    .meta .label { color: var(--muted); }
    .note { font-size:12px; color: var(--muted); border:1px dashed var(--border); padding:8px; border-radius:6px; background:#fafafa; }
    table { width:100%; border-collapse: collapse; font-size:12px; }
    thead th { background: var(--bg-head); text-align:left; border-bottom:1px solid var(--border); padding:8px; }
    tbody td { border-bottom:1px solid var(--border); padding:8px; vertical-align:top; }
    tfoot td { padding:6px 8px; }
    .right { text-align:right; }
    .muted { color: var(--muted); font-size:11px; }
    .totals td { font-weight:600; }
    .summary { margin-top:8px; border-top:1px solid var(--border); }
    .footer { margin-top:12px; font-size:11px; color:var(--muted); display:flex; justify-content:space-between; }
    .code { font-weight:600; }
    .lot { color:var(--muted); font-size:11px; margin-top:3px; }
    .small { font-size:11px; }
  </style>`;
}

function buildHTML(data: ReceiptDetail, opt: PrintOptions = {}) {
  const {
    company,
    title = "PHIẾU NHẬP HÀNG",
    currencyLocale = "vi-VN",
    currencyPrefix = "",
    footerText = "Cảm ơn Quý đối tác!",
  } = opt;

  const globalDiscountAmount =
    data.globalDiscountType === "PERCENT"
      ? Math.round((data.subTotal * data.globalDiscountValue) / 100)
      : data.globalDiscountValue;

  const supplierName = data.supplier?.name || "—";
  const supplierPhone = data.supplier?.phone ? ` | ĐT: ${data.supplier.phone}` : "";
  const supplierAddress = data.supplier?.address ? ` | Đ/c: ${data.supplier.address}` : "";

  const logoImg = company?.logoUrl
    ? `<img class="logo" src="${company.logoUrl}" alt="logo" />`
    : "";

  const companyBlock = company
    ? `
      <div class="company">
        <h1>${company.name}</h1>
        <div>
          ${company.address ? `Đ/c: ${company.address}` : ""}
          ${company.phone ? (company.address ? " | " : "") + `ĐT: ${company.phone}` : ""}
          ${company.taxCode ? (company.address || company.phone ? " | " : "") + `MST: ${company.taxCode}` : ""}
        </div>
      </div>`
    : `<div class="company"><h1>Đơn vị</h1></div>`;

  const itemsRows = data.items.map((it, idx) => {
    const unit = it.receivedUnit || it.receivedUomCode || "";
    const lotHS = [it.lotNumber ? `Lô: ${it.lotNumber}` : "", it.expiryDate ? `HSD: ${it.expiryDate}` : ""]
      .filter(Boolean)
      .join(" • ");
    return `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div><strong>${it.itemName}</strong></div>
        ${lotHS ? `<div class="lot">${lotHS}</div>` : ""}
      </td>
      <td class="right">${money(it.quantity, currencyLocale)}</td>
      <td class="right">${money(it.unitPrice, currencyLocale, currencyPrefix)}</td>
      <td class="right">${it.discountType === "PERCENT" ? `${it.discountValue}%` : money(it.discountValue, currencyLocale, currencyPrefix)}</td>
      <td class="right">${unit || "—"}</td>
      <td class="right">${money(it.lineTotal, currencyLocale, currencyPrefix)}</td>
    </tr>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title} ${data.code ? `- ${data.code}` : ""}</title>
  ${buildStyles()}
</head>
<body>
  <div class="wrap page">
    <div class="hdr">
      ${logoImg}
      ${companyBlock}
    </div>

    <div class="title">${title}</div>

    <div class="meta">
      <div><span class="label">Mã phiếu:</span> <span class="code">${data.code}</span></div>
      <div><span class="label">Ngày nhập:</span> <strong>${data.receiptDate}</strong></div>
      <div><span class="label">Trạng thái:</span> ${data.status}</div>

      <div style="grid-column: 1 / -1">
        <span class="label">Nhà cung cấp:</span> <strong>${supplierName}</strong>
        <span class="muted small">${supplierPhone}${supplierAddress}</span>
      </div>
      ${data.note ? `<div style="grid-column: 1 / -1" class="note">Ghi chú: ${data.note}</div>` : ""}
    </div>

    <table>
      <colgroup>
        <col style="width: 5%" />
        <col style="width: 35%" />
        <col style="width: 10%" />
        <col style="width: 13%" />
        <col style="width: 10%" />
        <col style="width: 8%" />
        <col style="width: 19%" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>Tên hàng</th>
          <th class="right">SL</th>
          <th class="right">Đơn giá</th>
          <th class="right">CK</th>
          <th class="right">ĐVT</th>
          <th class="right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <table class="summary" style="width:100%">
      <tbody>
        <tr>
          <td class="right">Tạm tính</td>
          <td class="right" style="width:160px"><strong>${money(data.subTotal, currencyLocale, currencyPrefix)}</strong></td>
        </tr>
        <tr>
          <td class="right">Chiết khấu chung (${fmtDiscount(data.globalDiscountType, data.globalDiscountValue, currencyLocale, currencyPrefix)})</td>
          <td class="right">-${money(globalDiscountAmount, currencyLocale, currencyPrefix)}</td>
        </tr>
        <tr>
          <td class="right">Phí vận chuyển</td>
          <td class="right">${money(data.shippingFee, currencyLocale, currencyPrefix)}</td>
        </tr>
        <tr class="totals">
          <td class="right">Tổng thanh toán</td>
          <td class="right"><strong>${money(data.grandTotal, currencyLocale, currencyPrefix)}</strong></td>
        </tr>
        <tr>
          <td class="right">Đã thanh toán</td>
          <td class="right">${money(data.amountPaid, currencyLocale, currencyPrefix)}</td>
        </tr>
        <tr>
          <td class="right">Còn phải trả</td>
          <td class="right"><strong>${money(data.grandTotal - data.amountPaid, currencyLocale, currencyPrefix)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="muted">Người lập phiếu ____________________</div>
      <div class="muted">${footerText}</div>
    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top:16px;">
    <button onclick="window.print()" style="padding:8px 12px;">In</button>
  </div>
</body>
</html>
  `;
  return html;
}

/** In bằng cách mở tab mới (hoặc iframe ẩn), render HTML và gọi print */
export function printPurchaseReceipt(data: ReceiptDetail, options?: PrintOptions) {
  const html = buildHTML(data, options);

  if (options?.openInNewTab) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    // gọi print sau khi load
    win.onload = () => win.print();
    return;
  }

  // In bằng iframe ẩn (không rời tab hiện tại)
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Optionally remove iframe after print (tránh kẹt DOM)
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };
}

/** Nếu bạn muốn chỉ xây HTML để server side PDF hoặc lưu file */
export function buildPurchaseReceiptHTML(data: ReceiptDetail, options?: PrintOptions) {
  return buildHTML(data, options);
}
