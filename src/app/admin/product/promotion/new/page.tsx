// app/admin/product/promotion/new/page.tsx  (SERVER)
import { Suspense } from "react";
import PromotionUpsertClient from "./PromotionUpsertClient";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const idParam = searchParams.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PromotionUpsertClient id={id} />
    </Suspense>
  );
}
