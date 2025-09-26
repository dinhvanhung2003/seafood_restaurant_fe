// Các kiểu dùng chung cho in hóa đơn
export type DiscountType = "AMOUNT" | "PERCENT";

export type ReceiptItem = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  // Server có thể trả receivedUnit hoặc receivedUomCode => in ưu tiên unit nếu có
  receivedUnit?: string;
  receivedUomCode?: string;
  lotNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  lineTotal: number;
};

export type ReceiptDetail = {
  id: string;
  code: string;
  status: string;
  supplier?: { id: string; name: string; phone?: string; address?: string };
  receiptDate: string; // YYYY-MM-DD
  shippingFee: number;
  amountPaid: number;
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  note?: string;
  subTotal: number;
  grandTotal: number;
  items: ReceiptItem[];
};

export type CompanyInfo = {
  name: string;
  address?: string;
  phone?: string;
  taxCode?: string;
  logoUrl?: string; // có thể là URL hoặc dataURL base64
};

export type PrintOptions = {
  company?: CompanyInfo;
  title?: string;            // mặc định: "PHIẾU NHẬP HÀNG"
  currencyLocale?: string;   // "vi-VN" mặc định
  currencyPrefix?: string;   // ví dụ: "₫ " hoặc ""  (mặc định: "")
  openInNewTab?: boolean;    // mở tab mới để in (true) hay dùng iframe ẩn (false, mặc định)
  footerText?: string;       // text cuối trang
};
