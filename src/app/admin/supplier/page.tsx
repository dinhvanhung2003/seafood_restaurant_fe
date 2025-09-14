// app/(admin)/suppliers/page.tsx
import SuppliersClient from "./supplier-client";
import type { SupplierStatus } from "@/types/types";

export const revalidate = 30;
export const dynamic = "force-dynamic";

// ✅ helper ép kiểu an toàn
const toSupplierStatus = (v?: string): "" | SupplierStatus => {
  return v === "ACTIVE" || v === "INACTIVE" ? (v as SupplierStatus) : "";
};

type Search = {
  page?: string;
  q?: string;
  status?: string;
  supplierGroupId?: string;
  city?: string;
  withGroup?: string;
};

export default async function SuppliersPage({ searchParams }: { searchParams: Search }) {
  const page = Number(searchParams.page ?? 1);
  const limit = 20;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(searchParams.q ? { q: searchParams.q } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.supplierGroupId ? { supplierGroupId: searchParams.supplierGroupId } : {}),
    ...(searchParams.city ? { city: searchParams.city } : {}),
    ...(searchParams.withGroup ? { withGroup: searchParams.withGroup } : {}),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/supplier/get-list-suppliers?${params.toString()}`,
    { next: { revalidate: 30 } }
  );
  const initial = await res.json();

  return (
    <SuppliersClient
      initial={initial}
      page={page}
      limit={limit}
      defaultFilters={{
        q: searchParams.q ?? "",
        status: toSupplierStatus(searchParams.status), // ✅ dùng helper
        supplierGroupId: searchParams.supplierGroupId ?? "",
        city: searchParams.city ?? "",
        withGroup: searchParams.withGroup === "true",
      }}
    />
  );
}
