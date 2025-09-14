export type Table = {
id: string;
name: string;
floor: string;
status: "empty" | "using" | "reserved";
startedAt?: string; // ISO
currentAmount?: number;
};


export type MenuItem = {
id: string;
name: string;
price: number;
image?: string;
categoryId: string;
};


export type Category = { id: string; name: string };


export type OrderItem = { id: string; qty: number,note?:string };


export type OrderMap = Record<string, OrderItem[]>; // key = tableId


export type Catalog = {
categories: Category[];
items: MenuItem[];
};




export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  
};


export enum ItemStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY     = 'READY',
  SERVED    = 'SERVED',
  CANCELLED = 'CANCELLED',
}

// Nhà cung cấp ` Supplier`
// types/supplier.ts
export type SupplierStatus = "ACTIVE" | "INACTIVE";

export type SupplierGroup = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: string;
  code: string;
  name: string;
  company?: string | null;
  taxCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  ward?: string | null;
  supplierGroupId?: string | null;
  supplierGroup?: SupplierGroup | null;
  note?: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SuppliersFilter = {
  q: string;
  status?: "" | SupplierStatus;
  supplierGroupId: string;
  city: string;
  withGroup: boolean;
};

export type CreateSupplierBody = {
  name: string;
  code?: string;
  company?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  supplierGroupId?: string | null;
  note?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export type UpdateBody = {
  name?: string;
  code?: string;
  company?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  supplierGroupId?: string | null;
  note?: string;
  status?: "ACTIVE" | "INACTIVE";
};