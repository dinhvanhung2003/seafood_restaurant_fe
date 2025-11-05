// Định nghĩa các kiểu dữ liệu dùng chung trong ứng dụng
// Type cho bàn (Table)
export type Table = {
  id: string;
  name: string;
  floor: string;
  status: "empty" | "using";
  startedAt?: string;
  currentAmount?: number;
};







// Các type ở chỗ thu ngân và quản lý đơn hàng
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  // optional promotion fields (populated by cashier hooks when present)
  priceAfterDiscount?: number;
  discountAmount?: number;
  badge?: string | null;
  categoryId: string;
};


export type Category = { id: string; name: string };


export type OrderItem = { id: string; qty: number, note?: string };


export type OrderMap = Record<string, OrderItem[]>; // key = tableId


export type Catalog = {
  categories: Category[];
  items: MenuItem[];
};

export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  // optional promotion fields
  priceAfterDiscount?: number;
  discountAmount?: number;
  badge?: string | null;

};


//Type cho orderitem trong order

export enum ItemStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

// Nhà cung cấp (Supplier)
export type SupplierStatus = "ACTIVE" | "INACTIVE";

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
  q?: string;
  status?: "" | "ACTIVE" | "INACTIVE";
  city?: string;
  supplierGroupId?: string | null; // <- thêm field này
  withGroup?: boolean;
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

// Nhóm nhà cung cấp (Supplier Group)
export type SupplierGroupStatus = "ACTIVE" | "INACTIVE";

export interface SupplierGroup {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  status: SupplierGroupStatus;
  createdAt?: string;
  updatedAt?: string;
}


//Type dành cho nhân viên 
export type Role = "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN";
export const ROLES: Role[] = ["MANAGER", "CASHIER", "WAITER", "KITCHEN"];

/** Item trả về từ GET /users */
export type UserItem = {
  id: string;
  email: string;
  phoneNumber: string | null;
  username: string | null;
  password?: string;           // có nhưng không hiển thị
  role: Role;
  profile?: { fullName?: string | null } | null;
};

/** Payload tạo user vẫn như trước */
export type CreateUserPayload = {
  email: string;
  phoneNumber?: string | null;
  username?: string | null;
  password: string;
  role: Role;
  profile: { fullName: string; dob?: string | null; address?: string | null };
};

/** Row hiển thị bảng (phẳng) */
export type EmployeeRow = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
};



/** type chỗ giao diện nhập hàng */
export type NumMaybeEmpty = number | "";
export type DiscountType = "AMOUNT" | "PERCENT";

export type Line = {
  tmpId: string;
  itemId: string;
  itemName: string;
  quantity: NumMaybeEmpty;
  unitPrice: NumMaybeEmpty;
  discountType: DiscountType;
  discountValue: NumMaybeEmpty;
  /** Mã đơn vị nhận theo BE (VD: "KG", "BOX", ...) */
  receivedUomCode: string;
  lotNumber?: string;
  expiryDate?: string;
  note?: string;
};

// Type cho phiếu nhập hàng (Purchase Receipt)
export enum ReceiptStatus {
  DRAFT = "DRAFT",
  POSTED = "POSTED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  OWING = "OWING",
}
// Label tiếng Việt
export const ReceiptStatusLabel: Record<ReceiptStatus, string> = {
  [ReceiptStatus.DRAFT]: "Nháp",
  [ReceiptStatus.POSTED]: "Đã ghi sổ",
  [ReceiptStatus.PAID]: "Đã thanh toán",
  [ReceiptStatus.CANCELLED]: "Đã hủy",
  [ReceiptStatus.OWING]: "Còn nợ",
};

// (Optional) Nếu muốn hiển thị màu
export const ReceiptStatusColor: Record<ReceiptStatus, string> = {
  [ReceiptStatus.DRAFT]: "bg-gray-100 text-gray-700",
  [ReceiptStatus.POSTED]: "bg-blue-100 text-blue-700",
  [ReceiptStatus.PAID]: "bg-green-100 text-green-700",
  [ReceiptStatus.CANCELLED]: "bg-red-100 text-red-700",
  [ReceiptStatus.OWING]: "bg-yellow-100 text-yellow-700",
};


//Phần Admin - Quản lý thực đơn





