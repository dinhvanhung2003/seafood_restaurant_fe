// types/admin/table.ts
export type TableStatus = "ACTIVE" | "INACTIVE";

export interface DiningTableDTO {
  id: string;
  name: string;
  seats: number;
  note?: string | null;
  status: TableStatus;
  // BE trả sortOrder, không phải order
  sortOrder?: number | null;
  // các field đang có trong response
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
  area: { id: string; name: string };
}

export interface AreaDTO {
  id: string;
  name: string;
  note?: string | null;
}

export interface CreateAreaInput {
  name: string;
  note?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
}

export interface CreateTableInput {
  name: string;
  seats: number;
  note?: string;
  areaId: string;
  status: TableStatus;
}

export type PageMeta = { total: number; page: number; limit: number; pages: number };

export type TablesListResp = { data: DiningTableDTO[]; meta: PageMeta };

export type TablesQuery = {
  page?: number;
  limit?: number;
  area?: string;
  search?: string;
  status?: TableStatus | "ALL";
};

export type TxUser = { id: string | null; name: string | null };

export type TableTransactionRow = {
  invoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: string;
  status: "UNPAID" | "PAID" | "VOID" | string;
  cashier: TxUser;
  orderedBy: TxUser;
};

export type TableTransactionsResp = {
  items: TableTransactionRow[];
  meta: PageMeta;
};
