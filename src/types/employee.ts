// Giữ enum role khớp BE
export type Role = "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN";

// Chỉ giữ đúng fields BE + id/code local
export type Employee = {
  id: string;        // local
  code: string;      // local (NV000001...)
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  role: Role;
  profile: {
    fullName: string;
    dob?: string;     // "YYYY-MM-DD"
    address?: string;
  };
};

export const ROLES: Role[] = ["MANAGER", "CASHIER", "WAITER", "KITCHEN"];
// Filter mẫu (có thể giữ/loại). Không ảnh hưởng BE.
export const BRANCHES = ["Chi nhánh trung tâm", "Chi nhánh 1", "Chi nhánh 2"];
export const DEPARTMENTS = ["Phục vụ", "Thu ngân", "Bếp", "Quản lý"];
export const TITLES = ["Nhân viên", "Ca trưởng", "Quản lý ca", "Giám sát"];
