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
