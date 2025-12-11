import { ColumnDef } from "@tanstack/react-table";

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

export const customerColumns: ColumnDef<CustomerRow>[] = [
  {
    id: "select",
    header: () => <input type="checkbox" aria-label="Select all" />,
    cell: () => <input type="checkbox" aria-label="Select row" />,
    enableHiding: false,         // luôn hiển thị
    size: 40,
  },
  { accessorKey: "code", header: "Mã khách hàng" },
  { accessorKey: "name", header: "Tên khách hàng" },
  { accessorKey: "phone", header: "Điện thoại" },
  { accessorKey: "gender", header: "Giới tính" },
  { accessorKey: "address", header: "Địa chỉ" },
  { accessorKey: "note", header: "Ghi chú" },
  { accessorKey: "company", header: "Công ty" },
  { accessorKey: "taxCode", header: "Mã số thuế" },
  // { accessorKey: "totalSales", header: "Tổng bán" },
  // { accessorKey: "totalPoints", header: "Tổng điểm" },
  // { accessorKey: "status", header: "Trạng thái" },
];
