// ✅ Ngăn prerender tĩnh nếu bạn đang export/build nhạy cảm với động
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import PurchaseUpsertClient from "./PurchaseUpsertClient";

export default async function Page({
  searchParams,
}: {
  // Next.js 15 dynamic searchParams must be awaited
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const idParam = sp.id;
  const editingId = Array.isArray(idParam) ? idParam[0] : idParam;

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PurchaseUpsertClient editingId={editingId} />
    </Suspense>
  );
}
