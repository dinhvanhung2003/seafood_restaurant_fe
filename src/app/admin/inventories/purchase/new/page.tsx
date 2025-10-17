// ✅ Ngăn prerender tĩnh nếu bạn đang export/build nhạy cảm với động
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import PurchaseUpsertClient from "./PurchaseUpsertClient";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const idParam = searchParams.id;
  const editingId = Array.isArray(idParam) ? idParam[0] : idParam;

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PurchaseUpsertClient editingId={editingId} />
    </Suspense>
  );
}
