import api from "@/lib/axios";

export type CustomerRow = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  note?: string | null;
  company?: string | null;
  taxCode?: string | null;
  totalSales?: number;
  totalPoints?: number;
  status?: "active" | "inactive";
};

export type CustomersResp = {
  data: CustomerRow[];
  total: number;
  page: number;
  limit: number;
};

export const fetchCustomers = async (page: number, limit: number) => {
  const res = await api.get<CustomersResp>("/customers", { params: { page, limit } });
  return res.data;
};

export const createCustomer = async (payload: any) => {
  const res = await api.post("/customers", payload);
  return res.data;
};
