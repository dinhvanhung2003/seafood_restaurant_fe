// src/types/admin/cashbook.ts
export type CashType = {
  id: string;
  name: string;
  description: string | null;
  isIncomeType: boolean;
  isActive: boolean;
};

export type PartyBase = { id: string; name?: string | null } & Record<string, any>;

export type CashbookItem = {
  id: string;
  type: "RECEIPT" | "PAYMENT";
  code: string;
  date: string;
  cashType: CashType;
  amount: string;
  isPostedToBusinessResult: boolean;
  counterpartyGroup: "CUSTOMER" | "SUPPLIER" | "OTHER" | string;
  customer?: PartyBase | null;
  supplier?: PartyBase | null;
  cashOtherParty?: PartyBase | null;
  invoice?: Record<string, any> | null;
  purchaseReceipt?: Record<string, any> | null;
  sourceCode?: string | null;
  createdAt: string;
};

export type CashbookResponse = {
  code: number;
  success: boolean;
  message: string;
  data: CashbookItem[];
  meta: { total: number; page: number; limit: number; pages: number };
};

// chi tiết
export type CashbookDetailResponse = {
  code: number;
  success: boolean;
  message: string;
  data: CashbookItem;
};

// (tuỳ chọn) nếu BE trả kèm summary trong list
export type CashbookSummary = {
  openingBalance: number;
  totalReceipt: number;
  totalPayment: number;
  closingBalance: number;
};
