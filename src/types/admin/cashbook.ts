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
export type CashbookDetailResponse = {
  code: number;
  success: boolean;
  message: string;
  data: CashbookItem;
};


export type OtherParty = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  note?: string;
};

export type CreateEntryBody = {
  type: "RECEIPT" | "PAYMENT";
  date: string;                  // ISO hoặc YYYY-MM-DD
  cashTypeId: string;
  amount: string;                // << GIỮ LÀ STRING
  isPostedToBusinessResult?: boolean;

  // enum đúng theo BE:
  counterpartyGroup: "CUSTOMER" | "SUPPLIER" | "STAFF" | "DELIVERY_PARTNER" | "OTHER";

  // id theo nhóm
  customerId?: string;
  supplierId?: string;
  staffId?: string;              // << đổi từ employeeId -> staffId
  deliveryPartnerId?: string;    // << thêm mới

  // cho nhóm OTHER
  cashOtherPartyId?: string;
  counterpartyName?: string;

  invoiceId?: string;
  purchaseReceiptId?: string;
  sourceCode?: string;
};





/* =================== Query Keys ==================== */
export const CASHBOOK_KEYS = {
  list: (params?: Record<string, any>) => ["cashbook", "list", params] as const,
  detail: (id?: string) => ["cashbook", "detail", id] as const,
  types: () => ["cashbook", "types"] as const,
  otherParties: () => ["cashbook", "other-parties"] as const,
  createEntry: () => ["cashbook", "create-entry"] as const,
  createType: () => ["cashbook", "create-type"] as const,
  createOtherParty: () => ["cashbook", "create-other-party"] as const,
};
